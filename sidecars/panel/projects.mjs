import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';

let cacheEntry = null;
const CACHE_TTL_MS = 15000; // 15s cache
const HEX_64 = /^[a-f0-9]{64}$/;

const sha256Hex = value => createHash('sha256').update(value).digest('hex');

function createDateFormatter(timeZone) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return ms => {
    const parts = fmt.formatToParts(ms);
    const get = type => parts.find(p => p.type === type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  };
}

/**
 * Scan conversation SQLite DBs to map conversation IDs (and their lowercase sha256 hashes)
 * to workspace project names and paths.
 */
function scanConversationProjects(cDir) {
  const convToProject = new Map();
  const hashToProject = new Map();
  let mostRecentCid = null;
  let mostRecentMtime = 0;

  if (!existsSync(cDir)) {
    return { convToProject, hashToProject, mostRecentCid };
  }

  try {
    const files = readdirSync(cDir).filter(f => f.endsWith('.db'));
    for (const f of files) {
      const cid = f.slice(0, -3);
      const cidLower = cid.toLowerCase();
      const fullPath = join(cDir, f);
      let db = null;
      try {
        const st = statSync(fullPath);
        if (st.mtimeMs > mostRecentMtime) {
          mostRecentMtime = st.mtimeMs;
          mostRecentCid = cid;
        }

        db = new DatabaseSync(fullPath, { readOnly: true });
        const row = db.prepare("SELECT data FROM trajectory_metadata_blob WHERE id='main' LIMIT 1").get();
        if (row?.data) {
          const str = typeof row.data === 'string' ? row.data : Buffer.from(row.data).toString('utf8');
          const m = str.match(/file:\/\/\/([^\x00-\x1f\x7f-\xff]+)/);
          if (m) {
            const decoded = decodeURIComponent(m[1]).replace(/\\/g, '/');
            const cleanPath = decoded.replace(/\/+$/, '');
            const projName = cleanPath.split('/').filter(Boolean).pop() || 'Default';
            const info = { cid, project: projName, path: cleanPath };
            convToProject.set(cidLower, info);
            hashToProject.set(sha256Hex(cidLower), info);
          }
        }
      } catch {
        // Skip unreadable or corrupted DB
      } finally {
        if (db) {
          try { db.close(); } catch {}
        }
      }
    }
  } catch {}

  return { convToProject, hashToProject, mostRecentCid };
}

function readRecordsFromUsageFile(filePath, isSqlite) {
  if (!isSqlite) {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed?.records) ? parsed.records : [];
  }
  const db = new DatabaseSync(filePath, { readOnly: true });
  try {
    return db.prepare('SELECT j FROM records').all().map(row => JSON.parse(row.j));
  } finally {
    db.close();
  }
}

/**
 * Collect deduplicated per-request records from `usage-v1` scoped to `accountKey` when given.
 */
function readUsageLedgerProjects(uBase, accountKey, hashToProject, formatDate) {
  const accDirs = [];
  if (accountKey && existsSync(join(uBase, accountKey))) {
    accDirs.push(accountKey);
  } else {
    try {
      for (const acc of readdirSync(uBase)) {
        try {
          if (statSync(join(uBase, acc)).isDirectory()) accDirs.push(acc);
        } catch {}
      }
    } catch {}
  }

  const seen = new Map(); // requestId -> deduplicated record with project attribution
  for (const acc of accDirs) {
    const accPath = join(uBase, acc);
    let names = [];
    try {
      names = readdirSync(accPath).filter(n => /^[a-f0-9]{64}\.(json|sqlite)$/.test(n));
    } catch {
      continue;
    }

    const sqliteHashes = new Set(names.filter(n => n.endsWith('.sqlite')).map(n => n.slice(0, -7)));
    for (const name of names) {
      const isSqlite = name.endsWith('.sqlite');
      const fileHash = isSqlite ? name.slice(0, -7) : name.slice(0, -5);
      if (!HEX_64.test(fileHash)) continue;
      if (!isSqlite && sqliteHashes.has(fileHash)) continue; // sqlite supersedes json for same conversation

      const pInfo = hashToProject.get(fileHash) || { cid: fileHash, project: 'Other / Global', path: '—' };
      const projKey = pInfo.path !== '—' ? pInfo.path : pInfo.project;

      try {
        const recs = readRecordsFromUsageFile(join(accPath, name), isSqlite);
        for (const r of recs) {
          if (!r || typeof r.id !== 'string' || !r.id) continue;
          const uncached = Number(r.uncached) || 0;
          const cache = (Number(r.cacheRead) || 0) + (Number(r.cacheWrite) || 0);
          const output = Number(r.output) || 0;
          const tot = uncached + cache + output;

          const prev = seen.get(r.id);
          if (!prev || tot > prev.tot) {
            seen.set(r.id, {
              r,
              uncached,
              cache,
              output,
              tot,
              projKey,
              projName: pInfo.project,
              projPath: pInfo.path,
              convId: pInfo.cid || fileHash
            });
          }
        }
      } catch {}
    }
  }

  const projectMap = new Map();
  let totalAllTokens = 0;
  let totalAllRequests = 0;
  const globalConvIds = new Set();

  for (const item of seen.values()) {
    const { r, uncached, cache, output, tot, projKey, projName, projPath, convId } = item;
    totalAllTokens += tot;
    totalAllRequests += 1;
    globalConvIds.add(convId);

    if (!projectMap.has(projKey)) {
      projectMap.set(projKey, {
        key: projKey,
        name: projName,
        path: projPath,
        totalTokens: 0,
        uncached: 0,
        cache: 0,
        output: 0,
        requests: 0,
        convSet: new Set(),
        dayMap: new Map(),
        convMap: new Map()
      });
    }

    const pEntry = projectMap.get(projKey);
    pEntry.totalTokens += tot;
    pEntry.uncached += uncached;
    pEntry.cache += cache;
    pEntry.output += output;
    pEntry.requests += 1;
    pEntry.convSet.add(convId);

    const hasValidAt = r.at !== null && r.at !== undefined && Number.isFinite(r.at);
    const date = hasValidAt ? formatDate(r.at) : null;

    if (date) {
      if (!pEntry.dayMap.has(date)) {
        pEntry.dayMap.set(date, {
          date,
          totalTokens: 0,
          uncached: 0,
          cache: 0,
          output: 0,
          requests: 0,
          convSet: new Set()
        });
      }
      const dEntry = pEntry.dayMap.get(date);
      dEntry.totalTokens += tot;
      dEntry.uncached += uncached;
      dEntry.cache += cache;
      dEntry.output += output;
      dEntry.requests += 1;
      dEntry.convSet.add(convId);
    }

    if (!pEntry.convMap.has(convId)) {
      pEntry.convMap.set(convId, {
        id: convId,
        shortId: convId.slice(0, 8),
        date: date || '',
        totalTokens: 0,
        uncached: 0,
        cache: 0,
        output: 0,
        requests: 0
      });
    }
    const cEntry = pEntry.convMap.get(convId);
    cEntry.totalTokens += tot;
    cEntry.uncached += uncached;
    cEntry.cache += cache;
    cEntry.output += output;
    cEntry.requests += 1;
    if (date && (!cEntry.date || date > cEntry.date)) {
      cEntry.date = date;
    }
  }

  return finalizeProjects(projectMap, totalAllTokens, totalAllRequests, globalConvIds.size);
}

/**
 * Fallback scanner for `history-v1` (e.g. legacy test directories or before `usage-v1` exists).
 * Deduplicates by conversation ID across account subdirectories so totals are not multiplied.
 */
function readHistoryProjects(hBase, convToProject) {
  const seenConvs = new Map();
  if (existsSync(hBase)) {
    try {
      const accDirs = readdirSync(hBase);
      for (const acc of accDirs) {
        const accPath = join(hBase, acc);
        try {
          if (!statSync(accPath).isDirectory()) continue;
          const jsonFiles = readdirSync(accPath).filter(f => f.endsWith('.json') && f.length === 41);
          for (const jf of jsonFiles) {
            const cid = jf.slice(0, -5);
            const cidLower = cid.toLowerCase();
            try {
              const d = JSON.parse(readFileSync(join(accPath, jf), 'utf8'));
              const m = d.metrics || {};
              const c = m.cache || {};
              const counts = m.counts || {};

              const uncached = Number(c.uncachedTokens ?? counts.input ?? 0) || 0;
              const cacheRead = Number(c.cachedTokens ?? counts.cacheRead ?? 0) || 0;
              const cacheWrite = Number(counts.cacheWrite ?? 0) || 0;
              const output = Number(c.outputTokens ?? counts.output ?? 0) || 0;
              const total = Number(c.totalTokens ?? (uncached + cacheRead + cacheWrite + output)) || (uncached + cacheRead + cacheWrite + output);
              const requests = Number(m.requests ?? 0) || 0;
              const dateStr = typeof d.savedAt === 'string' && d.savedAt ? d.savedAt.slice(0, 10) : '';

              const prev = seenConvs.get(cidLower);
              if (!prev || total > prev.total) {
                seenConvs.set(cidLower, { cid, cidLower, uncached, cache: cacheRead + cacheWrite, output, total, requests, dateStr });
              }
            } catch {}
          }
        } catch {}
      }
    } catch {}
  }

  const projectMap = new Map();
  let totalAllTokens = 0;
  let totalAllRequests = 0;

  for (const item of seenConvs.values()) {
    const pInfo = convToProject.get(item.cidLower) || { project: 'Other / Global', path: '—' };
    const projKey = pInfo.path !== '—' ? pInfo.path : pInfo.project;

    totalAllTokens += item.total;
    totalAllRequests += item.requests;

    if (!projectMap.has(projKey)) {
      projectMap.set(projKey, {
        key: projKey,
        name: pInfo.project,
        path: pInfo.path,
        totalTokens: 0,
        uncached: 0,
        cache: 0,
        output: 0,
        requests: 0,
        convSet: new Set(),
        dayMap: new Map(),
        convMap: new Map()
      });
    }

    const pEntry = projectMap.get(projKey);
    pEntry.totalTokens += item.total;
    pEntry.uncached += item.uncached;
    pEntry.cache += item.cache;
    pEntry.output += item.output;
    pEntry.requests += item.requests;
    pEntry.convSet.add(item.cid);

    if (item.dateStr) {
      if (!pEntry.dayMap.has(item.dateStr)) {
        pEntry.dayMap.set(item.dateStr, {
          date: item.dateStr,
          totalTokens: 0,
          uncached: 0,
          cache: 0,
          output: 0,
          requests: 0,
          convSet: new Set()
        });
      }
      const dEntry = pEntry.dayMap.get(item.dateStr);
      dEntry.totalTokens += item.total;
      dEntry.uncached += item.uncached;
      dEntry.cache += item.cache;
      dEntry.output += item.output;
      dEntry.requests += item.requests;
      dEntry.convSet.add(item.cid);
    }

    pEntry.convMap.set(item.cid, {
      id: item.cid,
      shortId: item.cid.slice(0, 8),
      date: item.dateStr,
      totalTokens: item.total,
      uncached: item.uncached,
      cache: item.cache,
      output: item.output,
      requests: item.requests
    });
  }

  return finalizeProjects(projectMap, totalAllTokens, totalAllRequests, seenConvs.size);
}

function finalizeProjects(projectMap, totalAllTokens, totalAllRequests, totalAllConversations) {
  const finalized = [];
  for (const raw of projectMap.values()) {
    const dailyList = Array.from(raw.dayMap.values())
      .map(d => ({
        date: d.date,
        totalTokens: d.totalTokens,
        uncached: d.uncached,
        cache: d.cache,
        output: d.output,
        requests: d.requests,
        chats: d.convSet.size
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const conversationList = Array.from(raw.convMap.values())
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const inTotal = raw.cache + raw.uncached;
    finalized.push({
      key: raw.key,
      name: raw.name,
      path: raw.path,
      totalTokens: raw.totalTokens,
      uncached: raw.uncached,
      cache: raw.cache,
      output: raw.output,
      requests: raw.requests,
      conversations: raw.convSet.size,
      hitRate: inTotal > 0 ? ((raw.cache / inTotal) * 100).toFixed(1) : '0.0',
      firstDate: dailyList.length ? dailyList[dailyList.length - 1].date : null,
      lastDate: dailyList.length ? dailyList[0].date : null,
      activeDays: dailyList.length,
      dailyList,
      conversationList
    });
  }

  const sorted = finalized.sort((a, b) => b.totalTokens - a.totalTokens);
  sorted.forEach((p, idx) => {
    p.rank = idx + 1;
    p.share = totalAllTokens > 0 ? ((p.totalTokens / totalAllTokens) * 100).toFixed(1) : '0.0';
  });

  return { sorted, totalAllTokens, totalAllRequests, totalAllConversations };
}

export function getProjectSummary({
  currentConversationId = null,
  accountKey = null,
  timeZone = 'Asia/Shanghai',
  convDir = null,
  usageBase = null,
  historyBase = null,
  force = false
} = {}) {
  const now = performance.now();
  const home = homedir();
  const cDir = convDir || join(home, '.gemini', 'antigravity', 'conversations');
  const uBase = usageBase || join(home, '.gemini', 'antigravity', 'sidecar_data', 'antigravity-pulse', 'panel', 'data', 'usage-v1');
  const hBase = historyBase || join(home, '.gemini', 'antigravity', 'sidecar_data', 'antigravity-pulse', 'panel', 'data', 'history-v1');
  const cacheKey = `${accountKey || '*'}|${timeZone}|${cDir}|${uBase}|${historyBase || ''}`;

  if (!force && cacheEntry && cacheEntry.cacheKey === cacheKey && (now - cacheEntry.at < CACHE_TTL_MS)) {
    return formatResult(cacheEntry.data, currentConversationId);
  }

  const { convToProject, hashToProject, mostRecentCid } = scanConversationProjects(cDir);
  const useUsageLedger = Boolean(usageBase) || (!historyBase && existsSync(uBase));
  const formatDate = createDateFormatter(timeZone);

  const aggregated = useUsageLedger
    ? readUsageLedgerProjects(uBase, accountKey, hashToProject, formatDate)
    : readHistoryProjects(hBase, convToProject);

  const data = {
    convToProject,
    mostRecentCid,
    ...aggregated
  };
  cacheEntry = { cacheKey, at: now, data };

  return formatResult(data, currentConversationId);
}

function formatResult(cachedData, currentConversationId) {
  const { convToProject, mostRecentCid, sorted, totalAllTokens, totalAllRequests, totalAllConversations } = cachedData;
  const activeCid = (currentConversationId || mostRecentCid || '').toLowerCase();
  let activeProjKey = null;

  if (activeCid && convToProject.has(activeCid)) {
    const pInfo = convToProject.get(activeCid);
    activeProjKey = pInfo.path !== '—' ? pInfo.path : pInfo.project;
  }

  const allProjects = sorted.map(p => ({
    ...p,
    isCurrent: Boolean(activeProjKey ? p.key === activeProjKey : p.rank === 1)
  }));

  const currentProject = allProjects.find(p => p.isCurrent) || allProjects[0] || null;

  return {
    totalTokens: totalAllTokens,
    totalRequests: totalAllRequests,
    totalConversations: totalAllConversations,
    totalProjects: allProjects.length,
    currentProject,
    allProjects
  };
}
