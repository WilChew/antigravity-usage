import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { MetricsStore } from './store.mjs';
import { DesktopUsage } from './usage.mjs';
import { loadSidecarSdk } from './sdk.mjs';
import { RuntimeUi, makeRendererSource } from '../../compat/runtime-ui.mjs';
import { platformPaths } from '../../compat/platform.mjs';
import { PreferencesStore } from '../../compat/preferences.mjs';
import { SidecarOwner } from '../../compat/sidecar-owner.mjs';
import { readHostTheme } from '../../compat/host-theme.mjs';
import { panelAppSource,panelPageSource } from './panel-source.mjs';
import { AppUpdater, releaseRuntimeDirectory } from './updater.mjs';
import { getProjectSummary } from './projects.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// The host starts this sidecar in sidecars/panel. Windows holds the process's
// current directory open; release that handle before an update renames sidecars.
try { releaseRuntimeDirectory(join(HERE,'..','..')); } catch {}
const createTheme=createRequire(import.meta.url)('../../compat/theme.cjs');
const themeCss=()=>createTheme().css(':root');
const paths=platformPaths();
const ownership=process.env.ANTIGRAVITY_SIDECAR_WEB_PORT?new SidecarOwner(paths.data):null;
let settingsCache={},settingsAt=-Infinity;
const owns=()=>(!ownership||ownership.owns())&&settingsCache.enabled!==false;
const store = new MetricsStore(undefined,{owns});
const usage=new DesktopUsage(store,undefined,{host:'app',owns});
store.onTrajectory=async(scope,id,raw,options={})=>{
  const {isCurrent=()=>true}=options;
  if(isCurrent()!==true)return;
  if((!ownership||await ownership.isOwner())&&isCurrent()===true)return usage.ingestLive(scope,id,raw,{...options,isCurrent});
};
store.onBackgroundResult=(scope,id,file,options)=>usage.ingestDisk(scope,id,file,options);
const preferences=new PreferencesStore();
const updater=new AppUpdater({pluginDir:join(HERE,'..','..'),dataDir:paths.data});
const liveStatusFile=join(paths.data,'live-status.json');
const runningSince=new Map();
let lastLiveWrite=0;

function inspectConversationState(id){
  try{
    const dbFile=join(homedir(),'.gemini','antigravity','conversations',`${id}.db`);
    if(!existsSync(dbFile))return null;
    const db=new DatabaseSync(dbFile,{readOnly:true});
    const stmt=db.prepare('SELECT idx, step_type, status FROM steps ORDER BY idx DESC LIMIT 3');
    const rows=stmt.all();
    db.close();
    if(!rows||rows.length===0)return null;
    const statuses=rows.map(r=>Number(r.status));
    // 2: RUNNING, 8: GENERATING (Thinking / model output streaming)
    if(statuses.some(s=>s===2||s===8))return 'running';
    // 9: WAITING (Step is WAITING for user approval / action needed)
    if(statuses.some(s=>s===9))return 'waiting';
    // 3: DONE, 4: INVALID, 5: CLEARED, 6: CANCELED, 7: ERROR, 12: INTERRUPTED
    if(statuses.every(s=>s===3||s===4||s===5||s===6||s===7||s===12))return 'idle';
    return null;
  }catch{
    return null;
  }
}

function writeLiveStatus(base,usageSnap,projects,conversationId=null){
  try{
    const now=Date.now();
    if(now-lastLiveWrite<800)return;
    lastLiveWrite=now;
    const sp=base?.speed||{},ctx=base?.context||{},curProj=projects?.currentProject||null,today=usageSnap?.today||'';
    const projToday=curProj?.dailyList?.find(d=>d.date===today)?.totalTokens??0;
    const summaries=Array.isArray(store.summaries)?store.summaries:[];
    const candidateIds=new Set();
    const summaryStatusById=new Map();
    for(const s of summaries){
      const id=String(s?.id||'').toLowerCase();
      if(!id)continue;
      const st=String(s?.status||'');
      summaryStatusById.set(id,st);
      if(/RUNNING/i.test(st))candidateIds.add(id);
    }
    const speedId=String(sp.conversationId||conversationId||'').toLowerCase();
    const knownSummarySt=speedId?summaryStatusById.get(speedId):undefined;
    if(speedId&&/RUNNING/i.test(String(sp.status||''))&&(knownSummarySt===undefined||/RUNNING/i.test(knownSummarySt))){
      candidateIds.add(speedId);
    }

    const runningTasks=[];
    const waitingTasks=[];
    for(const id of candidateIds){
      let state=inspectConversationState(id);
      if(state===null)state='running';
      if(state==='idle'){
        runningSince.delete(id);
        continue;
      }
      if(!runningSince.has(id))runningSince.set(id,now);
      const startedAt=runningSince.get(id)??now;
      const taskInfo={
        id,
        state,
        startedAt,
        elapsedSeconds:Math.max(0,Math.floor((now-startedAt)/1000))
      };
      if(state==='waiting'){
        waitingTasks.push(taskInfo);
      }else{
        runningTasks.push(taskInfo);
      }
    }
    for(const id of [...runningSince.keys()]){
      if(!candidateIds.has(id))runningSince.delete(id);
    }

    const hasWaiting=waitingTasks.length>0;
    const hasRunning=runningTasks.length>0;
    const activeTasks=[...waitingTasks,...runningTasks].sort((a,b)=>a.startedAt-b.startedAt);
    let runningStartedAt=activeTasks.length>0?Math.min(...activeTasks.map(t=>t.startedAt)):null;
    const liveElapsed=runningStartedAt!==null?Math.max(0,Math.floor((now-runningStartedAt)/1000)):null;

    let quota5hPercent=null;
    const quotaGroups=Array.isArray(base?.groups)?base.groups:(Array.isArray(base?.quota)?base.quota:[]);
    for(const g of quotaGroups){
      const rem=g?.windows?.['5h']?.remaining;
      if(typeof rem==='number'&&Number.isFinite(rem)){
        const pct=Math.round(rem*100);
        if(quota5hPercent===null||pct<quota5hPercent)quota5hPercent=pct;
      }
    }
    const payload={
      updatedAt:now,
      connection:base?.connection||'offline',
      running:hasRunning||hasWaiting,
      actionNeeded:hasWaiting,
      status:base?.connection!=='live'?(base?.connection||'offline'):(hasWaiting?'waiting':(hasRunning?'running':'idle')),
      runningCount:runningTasks.length,
      waitingCount:waitingTasks.length,
      runningStartedAt,
      runningTasks:activeTasks,
      waitingTasks,
      quota5hPercent,
      model:sp.model||'',
      tps:typeof sp.tps==='number'&&Number.isFinite(sp.tps)?sp.tps:null,
      elapsedSeconds:liveElapsed,
      contextPercent:typeof ctx.percent==='number'&&Number.isFinite(ctx.percent)?ctx.percent:null,
      cacheHitRate:typeof sp.cache?.hitRate==='number'&&Number.isFinite(sp.cache.hitRate)?sp.cache.hitRate:null,
      todayTokens:usageSnap?.todayTokens??0,
      monthTokens:usageSnap?.monthTokens??0,
      project:curProj?{name:curProj.name,todayTokens:projToday,totalTokens:curProj.totalTokens}:null
    };
    mkdirSync(paths.data,{recursive:true});
    const tmp=liveStatusFile+'.tmp';
    writeFileSync(tmp,JSON.stringify(payload),'utf8');
    renameSync(tmp,liveStatusFile);
  }catch{}
}
const metrics = async input => {
  if(ownership&&!await ownership.isOwner())throw Error('Sidecar ownership changed');
  runtimeSettings();
  if(Date.now()-store.summariesAt>=2000){
    try{await store.listConversations(true);}catch{}
  }
  const base=await store.snapshot(input);if(input?.usageSync===true)void usage.sync(true);
  const usageSnap=await usage.snapshot({sync:input?.usageSync===true});
  let projects=null;
  try { projects=getProjectSummary({currentConversationId:input?.conversationId,accountKey:usageSnap?.accountKey||null,timeZone:usageSnap?.timeZone||'Asia/Shanghai',force:input?.force===true}); } catch {}
  if(usageSnap&&projects)usageSnap.projects=projects;
  writeLiveStatus(base,usageSnap,projects,input?.conversationId||null);
  return {...base,usage:usageSnap,preferences:await preferences.snapshot(),theme:await readHostTheme(),integration:integration.health};
};
const usageSource=()=>{const s=readFileSync(join(HERE,'..','..','compat','usage-ui.cjs'),'utf8');return `window.__agPulseUsageFactory=(${s.slice(s.indexOf('module.exports = ')+17).trim().replace(/;$/,'')});`;};
const updateSource=()=>{const s=readFileSync(join(HERE,'..','..','compat','update-ui.cjs'),'utf8');return `window.__agPulseUpdateFactory=(${s.slice(s.indexOf('module.exports = ')+17).trim().replace(/;$/,'')});`;};
const staticFiles = { '/': ['index.html', 'text/html'], '/styles.css': ['styles.css', 'text/css'], '/format.mjs': ['format.mjs', 'text/javascript'] };
const inlineSource=()=>{
  const file=readFileSync(join(HERE,'..','..','compat','inline-widget.cjs'),'utf8');
  const i18n=readFileSync(join(HERE,'..','..','compat','i18n.cjs'),'utf8');
  const theme=readFileSync(join(HERE,'..','..','compat','theme.cjs'),'utf8');
  const extract=s=>s.slice(s.indexOf('module.exports = ')+'module.exports = '.length).trim().replace(/;$/,'');
  return updateSource()+usageSource()+`window.__agPulseI18nFactory=(${extract(i18n)});window.__agPulseThemeFactory=(${extract(theme)});(${extract(file)})();`;
};
const i18nModule=()=>{const s=readFileSync(join(HERE,'..','..','compat','i18n.cjs'),'utf8');return 'export const createI18n='+s.slice(s.indexOf('module.exports = ')+'module.exports = '.length);};
const themeModule=()=>{const s=readFileSync(join(HERE,'..','..','compat','theme.cjs'),'utf8');return 'export const createTheme='+s.slice(s.indexOf('module.exports = ')+'module.exports = '.length);};
const runtimeSettings = () => {
  if(Date.now()-settingsAt<1000)return settingsCache;
  let settings = {};
  try { settings = JSON.parse(readFileSync(paths.settings,'utf8').replace(/^\uFEFF/,'')); } catch {}
  try { if (JSON.parse(readFileSync(paths.pluginConfig,'utf8').replace(/^\uFEFF/,'')).plugins?.['antigravity-pulse']?.enabled === false) settings.enabled = false; } catch {}
  settingsCache=settings;settingsAt=Date.now();return settings;
};
const integration = new RuntimeUi({
  // Composer identity is authoritative. Unknown/new inline inputs request quota
  // only; SDK/HTTP panels keep the store's automatic most-recent selection.
  snapshot: input => metrics({...input,selectLatest:false}),
  preferences,
  updater,
  owner:ownership?.token,owns:()=>ownership?ownership.isOwner():true,
  source: makeRendererSource(readFileSync(join(HERE,'..','..','compat','i18n.cjs'),'utf8'),readFileSync(join(HERE,'..','..','compat','inline-widget.cjs'),'utf8'),readFileSync(join(HERE,'..','..','compat','theme.cjs'),'utf8'),ownership?.token,ownership?.startedAt,updateSource()+usageSource()),
  dataDir: paths.data,
  enabled: () => { const s = runtimeSettings(); return s.enabled !== false && s.inline !== false && s.mode !== 'legacy'; },
});

if (process.env.ANTIGRAVITY_SIDECAR_WEB_PORT) {
  const { SidecarApp, Response } = await loadSidecarSdk();
  if(!await ownership.claim())process.exit(0);
  const app = new SidecarApp();
  for (const [path, [file, type]] of Object.entries(staticFiles)) app.api(path, () => new Response(path==='/'?panelPageSource():readFileSync(join(HERE, file), 'utf8'), { contentType: type,headers:{'Cache-Control':'no-store'} }), 'GET');
  app.page('/app.js',()=>new Response(panelAppSource(),{contentType:'application/javascript',headers:{'Cache-Control':'no-store'}}));
  app.page('/i18n.js',i18nModule);
  app.page('/theme.js',themeModule);
  app.api('/theme.css',()=>new Response(themeCss(),{contentType:'text/css'}),'GET');
  app.api('/api/metrics', data => metrics({ conversationId: data.conversationId || null, force: data.force === true || data.force === '1' }), 'GET');
  app.api('/api/integration', () => integration.health, 'GET');
  app.api('/api/preferences',()=>preferences.snapshot(),'GET');
  app.api('/api/preferences',async data=>{try{return await preferences.set(data);}catch{return new Response(JSON.stringify({error:'Language preference could not be saved'}),{status:400,contentType:'application/json'});}},'POST');
  app.run();
  integration.start();
  if (process.platform === 'win32') {
    const floatingVbs = join(HERE, '..', '..', 'windows', 'start-floating-bar.vbs');
    if (existsSync(floatingVbs)) {
      try {
        const child = spawn('wscript.exe', [floatingVbs], { detached: true, windowsHide: true, stdio: 'ignore' });
        child.unref();
      } catch {}
    }
  }
  const liveHeartbeat=setInterval(()=>{if(Date.now()-lastLiveWrite>1800&&owns())void metrics({}).catch(()=>{});},2000);
  liveHeartbeat.unref();
  const shutdown=async()=>{
    clearInterval(liveHeartbeat);
    usage.dispose();store.dispose();
    const exitTimer=setTimeout(()=>process.exit(0),2000);exitTimer.unref();
    await integration.stop();ownership.stop();process.exit(0);
  };
  ownership.watch(shutdown);
  updater.onReload=()=>void shutdown();
  for (const signal of ['SIGTERM','SIGINT']) process.once(signal, () => {
    void shutdown();
  });
} else {
  // A dependency-free local preview uses the same collector and frontend.
  const port = Number(process.env.AG_PULSE_PORT || 17891);
  const server = createServer(async (req, res) => {
    const host = req.headers.host || '';
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) { res.writeHead(403); res.end(); return; }
    const url = new URL(req.url, `http://${host}`);
    if (url.pathname === '/api/preferences') {
      const sameOrigin=req.headers.origin===`http://${host}`;
      if(req.headers.origin&&!sameOrigin){res.writeHead(403);res.end();return;}
      res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
      if(req.method==='GET'){res.end(JSON.stringify(await preferences.snapshot()));return;}
      if(req.method==='POST'&&sameOrigin&&String(req.headers['content-type']).startsWith('application/json')){
        let body='';
        try {for await(const chunk of req){body+=chunk;if(body.length>1024)throw new Error('Preference payload too large');}
          res.end(JSON.stringify(await preferences.set(JSON.parse(body))));
        }catch{res.writeHead(400);res.end(JSON.stringify({error:'Language preference could not be saved'}));}
        return;
      }
      res.writeHead(405);res.end();return;
    }
    if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (url.pathname === '/api/metrics') {
      if (req.headers.origin && req.headers.origin !== `http://${host}`) { res.writeHead(403); res.end(); return; }
      try { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(await metrics({ conversationId: url.searchParams.get('conversationId'), force: url.searchParams.get('force') === '1' }))); }
      catch { res.writeHead(500); res.end('{"error":"数据暂时不可用"}'); }
      return;
    }
    if (url.pathname === '/api/integration') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(integration.health)); return; }
    if (url.pathname === '/preload.js') { res.writeHead(200, { 'Content-Type': 'text/javascript' }); res.end('// Standalone preview: no host bridge.'); return; }
    if(url.pathname==='/i18n.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});res.end(i18nModule());return;}
    if(url.pathname==='/theme.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});res.end(themeModule());return;}
    if(url.pathname==='/theme.css'){res.writeHead(200,{'Content-Type':'text/css; charset=utf-8'});res.end(themeCss());return;}
    if(url.pathname==='/inline-widget.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});res.end(inlineSource());return;}
    if(url.pathname==='/app.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});res.end(panelAppSource());return;}
    if(url.pathname.startsWith('/toolbar-preview')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(readFileSync(join(HERE,'toolbar-preview.html')));return;}
    const file = staticFiles[url.pathname];
    if (!file) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8` }); res.end(url.pathname==='/'?panelPageSource():readFileSync(join(HERE, file[0])));
  });
  server.listen(port, '127.0.0.1', () => console.log(`Antigrative Dashboard: http://127.0.0.1:${port}`));
}
