// Shared local usage views. Values and model labels are inserted as text.
module.exports = function createUsageDashboard({root,language,setMarkup,hostLabel='Antigravity',guideDismissed=false,onDismissGuide,onLanguage,onRefresh}) {
  const dialog=document.createElement('dialog');dialog.id='usage-dashboard';dialog.setAttribute('popover','manual');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',language.language==='zh-TW'?'用量統計':language.language==='zh-CN'?'用量统计':'Token usage');
  dialog.style.cssText='width:min(1040px,calc(100vw - 40px));max-width:none;height:min(720px,calc(100dvh - 40px));max-height:none;box-sizing:border-box;overflow:hidden;visibility:visible;pointer-events:auto;padding:0;border:1px solid var(--pulse-border);border-radius:18px;background:var(--pulse-background);color:var(--pulse-foreground);box-shadow:0 24px 100px #0006';
  const shell=document.createElement('div'),view=shell.attachShadow({mode:'open'});shell.style.cssText='height:100%;display:flex;flex-direction:column;overflow:hidden;';dialog.append(shell);root.append(dialog);
  const backdrop=document.createElement('style');backdrop.textContent='#usage-dashboard{position:fixed;inset:0;margin:auto}#usage-dashboard::backdrop{background:#0006;backdrop-filter:blur(3px);pointer-events:auto}';root.append(backdrop);
  const css=document.createElement('style');css.textContent=`
    :host{display:block;color:var(--pulse-foreground);font:13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;font-variant-numeric:tabular-nums}
    *{box-sizing:border-box}button,select{font:inherit;color:inherit}button{cursor:pointer}button,select{border:1px solid var(--pulse-border);background:transparent;border-radius:7px}button{transition:background 140ms ease,transform 120ms cubic-bezier(.23,1,.32,1)}button:active{transform:scale(.97)}button:focus-visible,select:focus-visible{outline:2px solid var(--pulse-accent);outline-offset:3px}button[disabled]{opacity:.35;cursor:default}
    .page{padding:16px 22px 14px;max-height:min(860px,calc(100dvh - 40px));overflow-y:auto;background:var(--pulse-background);box-sizing:border-box}.top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.eyebrow{font-size:10px;color:var(--pulse-muted);letter-spacing:1.5px;margin-bottom:4px}h1{font-size:20px;letter-spacing:-.5px;line-height:1.2;margin:0 0 4px;font-weight:600}.sub{font-size:12px;color:var(--pulse-muted)}.actions{display:flex;gap:8px;align-items:center}.actions button{display:grid;place-items:center;flex:0 0 32px;width:32px;height:32px;padding:0;line-height:1;border-radius:8px;color:var(--pulse-muted)}.actions button:hover{background:var(--pulse-hover);color:var(--pulse-foreground)}.actions svg{display:block;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.locale-label{display:block;min-width:16px;height:16px;line-height:16px;text-align:center;font-size:11px}.live-dot{display:inline-block;width:5px;height:5px;background:var(--pulse-success);border-radius:50%;margin-right:6px}
    .tabs{display:flex;gap:20px;border-bottom:1px solid var(--pulse-separator);margin:14px 0 14px}.tabs button{border:0;border-radius:0;background:transparent;color:var(--pulse-muted);padding:0 2px 11px;position:relative}.tabs button[aria-selected=true]{color:var(--pulse-foreground);font-weight:600}.tabs button[aria-selected=true]:after{content:'';position:absolute;height:2px;background:var(--pulse-accent);bottom:-1px;left:0;right:0}
    .totals{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--pulse-border);border-radius:12px;padding:12px 0 10px;margin-bottom:14px;row-gap:10px}.totals .row-divider{grid-column:1 / -1;height:1px;background:var(--pulse-separator);margin:2px 14px}.totals .metric.row-start{border-left:0}.metric.metric-period{transition:background 140ms ease,outline 140ms ease;border-radius:8px;padding:4px 16px}.metric.metric-period:hover{background:var(--pulse-hover)}.metric.metric-period.selected-scope{background:var(--pulse-hover);outline:1px solid color-mix(in srgb,var(--pulse-accent) 45%,transparent)}.metric{padding:0 20px}.metric+.metric{border-left:1px solid var(--pulse-separator)}.metric label{color:var(--pulse-muted);font-size:11px}.value{font-size:21px;letter-spacing:-.6px;margin:2px 0 0;font-weight:550}.unit{font-size:11px;color:var(--pulse-muted);margin-left:5px;font-weight:400;letter-spacing:0}
    section[hidden],#overview[hidden],#details[hidden],#project[hidden],#ranking[hidden]{display:none !important}.section-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:0 0 10px}h2{font-size:14px;font-weight:600;letter-spacing:-.2px;margin:0}.muted{font-size:11px;color:var(--pulse-muted)}.seg{display:flex;padding:3px;background:var(--pulse-hover);border-radius:8px;gap:2px}.seg button{border:0;padding:4px 12px;border-radius:5px;font-size:11px;color:var(--pulse-muted)}.seg button[aria-pressed=true]{background:var(--pulse-control);color:var(--pulse-foreground);box-shadow:0 1px 3px #0001}select{padding:4px 8px;font-size:11px;background:var(--pulse-background)}
    .heat-wrap{overflow-x:auto;padding:3px 3px 7px}.calendar{min-width:680px}.months{display:grid;margin-left:31px;font-size:10px;color:var(--pulse-muted);margin-bottom:7px}.heat-row{display:flex;gap:9px}.weekdays{display:grid;grid-template-rows:repeat(7,1fr);width:22px;flex:none;font-size:9px;color:var(--pulse-muted)}.heat{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,1fr);gap:3px;width:100%}.heat button{border:0;border-radius:3px;padding:0;min-width:0;aspect-ratio:1;background:var(--pulse-hover);outline-offset:1px}.heat button[data-level="1"],.swatch[data-level="1"]{background:color-mix(in srgb,var(--pulse-accent) 22%,var(--pulse-hover))}.heat button[data-level="2"],.swatch[data-level="2"]{background:color-mix(in srgb,var(--pulse-accent) 45%,var(--pulse-hover))}.heat button[data-level="3"],.swatch[data-level="3"]{background:color-mix(in srgb,var(--pulse-accent) 68%,var(--pulse-hover))}.heat button[data-level="4"],.swatch[data-level="4"]{background:var(--pulse-accent)}.heat button.future{opacity:.25;cursor:default}.heat.week{grid-template-columns:repeat(26,minmax(0,1fr))!important;grid-template-rows:repeat(2,1fr);grid-auto-flow:row}.week button{max-height:28px;aspect-ratio:1}.heat-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:8px 0 14px;
    .currency-menu{position:fixed;inset:auto;margin:0;padding:6px;width:160px;max-height:280px;overflow-y:auto;border:1px solid var(--pulse-border);border-radius:9px;background:var(--pulse-card);box-shadow:0 8px 24px var(--pulse-shadow);z-index:2147483002;color:var(--pulse-foreground);font-size:12px}
    .currency-menu[hidden]{display:none}
    .currency-menu button{display:flex;align-items:center;justify-content:space-between;width:100%;padding:6px 8px;border:0;border-radius:6px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background 120ms ease}
    .currency-menu button:hover{background:var(--pulse-hover)}
    .currency-menu button[aria-selected="true"]{background:var(--pulse-hover);font-weight:600;color:var(--pulse-accent)}
    .currency-menu .c-sym{font-weight:600;width:24px;flex:none}
    .currency-menu .c-name{flex:1;font-size:11px;margin-left:4px}
    .currency-menu .c-check{font-size:11px;color:var(--pulse-accent)}
    .sub-breakdown{display:flex;align-items:center;justify-content:flex-start;gap:4px;margin-top:3px;font-size:9.5px;color:var(--pulse-muted);font-variant-numeric:tabular-nums;line-height:1.3;white-space:nowrap}
    .sb-item{cursor:default;transition:color 120ms ease}
    .sb-item:hover{color:var(--pulse-foreground)}
    .sb-lbl{opacity:0.75;font-size:9px}
    .sb-sep{opacity:0.35;font-size:8px}font-size:10px;color:var(--pulse-muted)}.scale{display:flex;align-items:center;gap:4px}.swatch{width:11px;height:11px;border-radius:3px;background:var(--pulse-hover)}.selected{padding:16px 18px;border:1px solid var(--pulse-border);border-radius:10px;display:flex;justify-content:space-between;gap:16px;align-items:center}.selected button{border:0;color:var(--pulse-accent);font-size:12px;padding:5px}.selected .title{font-weight:500;margin-bottom:3px}.selected strong{font-weight:550}
    .chart-controls{display:flex;gap:10px;align-items:center}.range{display:flex;align-items:center;gap:10px}.range button{height:26px;width:26px;border:0}.range strong{font-size:12px;font-weight:500;min-width:106px;text-align:center}.legend{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 10px}.legend button{display:flex;align-items:center;gap:5px;padding:3px 8px;border-radius:5px;font-size:10.5px;border-color:transparent;background:var(--pulse-hover)}.legend button[aria-pressed=false]{opacity:.35}.dot{width:8px;height:8px;border-radius:2px;display:inline-block;flex:none;background:var(--model-color)}
    .chart-wrap{flex:none;overflow-x:auto;overflow-y:hidden;border-bottom:1px solid var(--pulse-separator);padding-bottom:6px;margin-bottom:8px}.chart{height:156px;display:flex;gap:10px;min-width:650px}.axis{width:42px;flex:none;position:relative;font-size:9px;color:var(--pulse-muted)}.axis span{position:absolute;right:0;transform:translateY(50%)}.plot{position:relative;flex:1;display:flex;align-items:stretch;gap:6px;padding:0 1px}.grid-line{position:absolute;left:0;right:0;border-top:1px solid var(--pulse-separator);pointer-events:none}.bar-column{position:relative;flex:1;min-width:0;display:flex;align-items:flex-end;border:0;border-radius:4px;background:transparent;padding:0;margin-bottom:18px}.bar-column:hover{background:var(--pulse-hover)}.stack{display:flex;flex-direction:column-reverse;width:100%;gap:1px;pointer-events:none;border-radius:3px 3px 0 0;overflow:hidden}.bar-segment{width:100%;background:var(--model-color);min-height:1px}.x-label{position:absolute;top:calc(100% + 4px);left:50%;transform:translateX(-50%);font-size:9px;color:var(--pulse-muted);white-space:nowrap}.empty-bar{height:2px;width:100%;background:var(--pulse-track);border-radius:2px}.chart-empty{position:absolute;left:0;right:0;top:40%;text-align:center;color:var(--pulse-muted);font-size:12px;pointer-events:none}.table-wrap{flex:1 1 auto;min-height:0;overflow:auto}.table{width:100%;border-collapse:collapse;text-align:right;font-size:11px;white-space:nowrap}.table th{font-weight:400;color:var(--pulse-muted);padding:6px 10px;border-bottom:1px solid var(--pulse-separator)}.table td{padding:7px 10px;border-bottom:1px solid var(--pulse-separator)}.table th:first-child,.table td:first-child{text-align:left;padding-left:0}.table td:first-child span{margin-right:7px}.table tr:last-child td{border-bottom:0}.tip{position:fixed;z-index:20;max-width:280px;padding:12px 14px;border:1px solid var(--pulse-border);border-radius:9px;background:var(--pulse-menu);box-shadow:0 8px 30px var(--pulse-shadow);color:var(--pulse-foreground);font-size:11px;pointer-events:none}.tip[hidden]{display:none}.tip .tip-title{font-size:10px;color:var(--pulse-muted);margin-bottom:5px}.tip strong{font-size:16px;font-weight:550}.tip-model{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:5px}.tip-model .dot{margin-right:6px}
    @media(max-width:650px){.page{padding:20px 18px}.totals{grid-template-columns:repeat(2,minmax(0,1fr));gap:15px 0}.metric:nth-child(3){border-left:0}.value{font-size:23px}.section-head{align-items:flex-start;flex-wrap:wrap}.chart-controls{width:100%;justify-content:space-between}.selected{align-items:flex-start}.chart{gap:8px}}@media(prefers-reduced-motion:reduce){button{transition:none}button:active{transform:none}}
  `;view.append(css);
  css.textContent+=' .months span{white-space:nowrap}.chart-wrap{padding-top:9px}';
  css.textContent+=`
    :host{height:100%}.page{height:100%;max-height:none;display:flex;flex-direction:column;scrollbar-gutter:stable}.page>*{flex:none}
    .year-picker{position:relative;flex:none}.year-trigger{display:flex;align-items:center;justify-content:space-between;gap:14px;min-width:76px;height:30px;padding:0 10px;background:var(--pulse-control);color:var(--pulse-foreground);font-size:11px;border-radius:8px}.year-trigger:hover,.year-trigger[aria-expanded=true]{background:var(--pulse-hover)}.year-chevron{width:12px;height:12px;fill:none;stroke:var(--pulse-muted);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;transition:transform 160ms cubic-bezier(.23,1,.32,1)}.year-trigger[aria-expanded=true] .year-chevron{transform:rotate(180deg)}
    .year-menu{position:fixed;inset:auto;margin:0;padding:5px;width:112px;max-height:232px;overflow-y:auto;border:1px solid var(--pulse-border);border-radius:10px;background:var(--pulse-menu);color:var(--pulse-foreground);box-shadow:0 8px 26px var(--pulse-shadow);transform-origin:top right;opacity:1;transform:scale(1);transition:opacity 140ms ease,transform 160ms cubic-bezier(.23,1,.32,1)}.year-menu::backdrop{background:transparent;pointer-events:none}.year-option{width:100%;border:0;border-radius:6px;padding:7px 9px;display:flex;align-items:center;justify-content:space-between;gap:18px;font-size:12px;text-align:left;background:transparent;color:var(--pulse-foreground);font-variant-numeric:tabular-nums}.year-option:hover,.year-option:focus-visible{background:var(--pulse-hover)}.year-option[aria-selected=true]{background:color-mix(in srgb,var(--pulse-accent) 12%,var(--pulse-menu))}.year-check{color:var(--pulse-accent);width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;opacity:0}.year-option[aria-selected=true] .year-check{opacity:1}
    @starting-style{.year-menu:popover-open{opacity:0;transform:scale(.97)}}@media(prefers-reduced-motion:reduce){.year-menu,.year-chevron{transition:none}}
  `;
  css.textContent+=`
    .bar-column:hover{background:transparent}.bar-column:active{transform:none}.stack{width:62%;max-width:30px;margin-inline:auto;gap:0;border-radius:4px 4px 0 0;overflow:hidden}.bar-segment{display:block;flex:none;min-height:0;border-radius:0;pointer-events:auto;background:var(--model-color);transition:opacity 140ms ease}.plot[data-highlight] .bar-segment:not([data-highlight=true]){opacity:.24}.empty-bar{height:1px;opacity:.35}.grid-line{border-top-style:solid;opacity:.45}.grid-line:first-child{opacity:.85}.legend{flex:none;gap:4px 14px;margin-bottom:10px}.legend button{background:transparent;padding:3px 0;border:0;border-radius:3px;color:var(--pulse-muted);gap:7px}.legend button:hover,.legend button[aria-pressed=true]{color:var(--pulse-foreground)}.legend button[aria-pressed=false]{opacity:.4;text-decoration:line-through}.legend .dot{width:7px;height:7px;border-radius:50%}.chart{gap:16px}.plot{gap:5px}.axis,.x-label{font-size:10px}.chart-summary{font-size:11px;color:var(--pulse-muted);margin-top:5px}.chart-summary strong{color:var(--pulse-foreground);font-weight:500}.chart-wrap{padding-top:6px}.table .dot{border-radius:50%}
    
    .proj-hero{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;padding:15px 18px;margin-top:12px;border:1px solid var(--pulse-border);border-radius:10px;background:linear-gradient(135deg,rgba(255,255,255,0.035) 0%,rgba(255,255,255,0.008) 100%)}
    .proj-hero-badge-wrap{display:flex;align-items:center;gap:8px;margin-bottom:5px}
    .proj-hero-tag{display:inline-flex;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;background:var(--pulse-accent,#388bfd);color:#fff}
    .proj-hero-rank{font-size:11px;color:var(--pulse-muted)}
    .proj-hero-title{font-size:18px;font-weight:600;margin:0;color:var(--pulse-foreground)}
    .proj-hero-path{font-size:10.5px;color:var(--pulse-muted);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;margin-top:4px;cursor:pointer;word-break:break-all;transition:color 120ms ease}
    .proj-hero-path:hover{color:var(--pulse-foreground);text-decoration:underline}
    .proj-hero-stat{text-align:right}
    .proj-hero-stat-label{font-size:11px;color:var(--pulse-muted)}
    .proj-hero-stat-val{font-size:20px;font-weight:600;color:var(--pulse-foreground);margin-top:2px}
    .proj-hero-unit{font-size:11px;font-weight:normal;color:var(--pulse-muted);margin-left:2px}
    .proj-hero-stat-cost{font-size:11px;color:var(--pulse-muted);margin-top:2px;font-variant-numeric:tabular-nums}
    .proj-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:11px}
    @media(max-width:720px){.proj-metrics{grid-template-columns:repeat(2,1fr)}}
    .proj-metric-card{padding:11px 13px;border:1px solid var(--pulse-border);border-radius:8px;background:var(--pulse-control,rgba(255,255,255,0.015));display:flex;flex-direction:column;justify-content:space-between}
    .proj-metric-label{font-size:11px;color:var(--pulse-muted)}
    .proj-metric-val{font-size:16px;font-weight:600;color:var(--pulse-foreground);margin:3px 0 2px}
    .proj-metric-sub{font-size:10px;color:var(--pulse-muted)}
    .proj-section-card{margin-top:12px;border:1px solid var(--pulse-border);border-radius:9px;background:var(--pulse-control,rgba(255,255,255,0.01));overflow:hidden}
    .proj-card-header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--pulse-border)}
    .proj-card-title{font-size:12.5px;font-weight:600;margin:0;color:var(--pulse-foreground)}
    .proj-count-badge{font-size:10.5px;color:var(--pulse-muted);padding:2px 7px;border-radius:10px;border:1px solid var(--pulse-border)}
    .proj-table-wrap{max-height:240px;overflow-y:auto;overflow-x:auto}
    .proj-ranking-table tbody tr{cursor:pointer;transition:background 100ms ease}
    .proj-ranking-table tbody tr:hover{background:var(--pulse-hover)}
    .proj-ranking-table tbody tr.active-proj-row{background:var(--pulse-selected,rgba(56,139,253,0.14));font-weight:550}
    .proj-share-bar-wrap{display:flex;align-items:center;gap:7px}
    .proj-share-bar{flex:1;height:5px;background:var(--pulse-border);border-radius:3px;overflow:hidden;min-width:36px}
    .proj-share-fill{height:100%;background:var(--pulse-accent,#388bfd);border-radius:3px}
    .proj-share-text{font-size:10.5px;min-width:38px;text-align:right}
    .proj-badge-current{display:inline-block;padding:1px 5px;font-size:9.5px;border-radius:3px;background:rgba(56,139,253,0.22);color:var(--pulse-accent,#388bfd);margin-left:6px;vertical-align:middle;font-weight:600}
    .proj-table th,.proj-table td{padding:6px 10px;font-size:11px}
    .proj-table td.num{text-align:right;font-variant-numeric:tabular-nums}
    .proj-table td.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:10.5px}
    .proj-table td.path-cell{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}

    
    #overview,#details,#project,#ranking{flex:1 1 auto;min-height:0;margin-top:4px}
    #overview{overflow-y:auto}
    #details{display:flex;flex-direction:column;overflow:hidden}#details>.section-head{flex:none}
    #project,#ranking{display:flex;flex-direction:column;gap:10px}
    #project[hidden],#ranking[hidden],#overview[hidden],#details[hidden],section[hidden]{display:none !important}
    .proj-card{border:1px solid var(--pulse-border);border-radius:10px;background:var(--pulse-control,rgba(255,255,255,0.015));overflow:hidden;flex:1 1 auto;min-height:0;display:flex;flex-direction:column}
    .proj-card-header{flex:none;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--pulse-border)}
    .proj-card-title{font-size:13px;font-weight:600;margin:0;color:var(--pulse-foreground)}
    .proj-active-days-list{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:8px;padding:12px 16px;overflow-y:auto}
    .proj-day-item{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding:10px 14px;border:1px solid var(--pulse-border);border-radius:8px;background:var(--pulse-hover,rgba(255,255,255,0.02));transition:background 120ms ease}
    .proj-day-item:hover{background:var(--pulse-selected,rgba(255,255,255,0.05))}
    .proj-day-left{display:flex;align-items:center;gap:12px}
    .proj-day-date{font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--pulse-foreground);display:flex;align-items:center;gap:6px}
    .proj-day-dot{width:6px;height:6px;border-radius:50%;background:var(--pulse-accent,#388bfd)}
    .proj-day-dot.today{background:var(--pulse-success,#2ea043)}
    .proj-day-badge{font-size:10px;padding:1px 6px;border-radius:3px;background:var(--pulse-border);color:var(--pulse-muted)}
    .proj-day-badge.today{background:rgba(46,160,67,0.2);color:var(--pulse-success,#2ea043);font-weight:600}
    .proj-day-badge.started{background:rgba(56,139,253,0.2);color:var(--pulse-accent,#388bfd)}
    .proj-day-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;font-size:10.5px;color:var(--pulse-muted)}
    .proj-day-chip{padding:2px 7px;border-radius:4px;background:var(--pulse-control,rgba(0,0,0,0.2));border:1px solid var(--pulse-border)}
    .proj-day-right{text-align:right}
    .proj-day-toks{font-size:15px;font-weight:600;color:var(--pulse-foreground);font-variant-numeric:tabular-nums}
    .proj-day-cost{font-size:11px;color:var(--pulse-muted);margin-top:2px;font-variant-numeric:tabular-nums}
    .proj-ranking-list{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:6px;padding:12px 16px;overflow-y:auto}
    .proj-rank-row{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding:10px 14px;border:1px solid var(--pulse-border);border-radius:8px;background:var(--pulse-hover,rgba(255,255,255,0.015));cursor:pointer;transition:background 120ms ease,border-color 120ms ease}
    .proj-rank-row:hover{background:var(--pulse-selected,rgba(255,255,255,0.05));border-color:var(--pulse-accent,#388bfd)}
    .proj-rank-row.active-proj{background:rgba(56,139,253,0.12);border-color:var(--pulse-accent,#388bfd)}
    .proj-rank-left{display:flex;align-items:center;gap:12px;min-width:0;flex:1}
    .proj-rank-num{font-size:12px;font-weight:600;color:var(--pulse-muted);width:26px}
    .proj-rank-meta{min-width:0}
    .proj-rank-name{font-size:13px;font-weight:600;color:var(--pulse-foreground);display:flex;align-items:center;gap:6px}
    .proj-rank-timeline{font-size:10.5px;color:var(--pulse-muted);margin-top:3px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
    .proj-rank-right{display:flex;align-items:center;gap:18px;text-align:right}
    .proj-rank-toks{font-size:14px;font-weight:600;color:var(--pulse-foreground);font-variant-numeric:tabular-nums}
    .proj-rank-cost{font-size:10.5px;color:var(--pulse-muted);font-variant-numeric:tabular-nums}
    .proj-rank-share-wrap{width:75px;display:flex;align-items:center;gap:6px}
    .proj-rank-bar{flex:1;height:5px;background:var(--pulse-border);border-radius:3px;overflow:hidden}
    .proj-rank-fill{height:100%;background:var(--pulse-accent,#388bfd);border-radius:3px}
    .proj-rank-share-text{font-size:10px;color:var(--pulse-muted);min-width:32px;text-align:right}

    .tip-model{padding:3px 0}.tip-model.dimmed{opacity:.5}.tip-model.active{font-weight:600}.model-share{font-size:10px;color:var(--pulse-muted);margin-left:9px}.usage-waiting{display:grid;place-items:center;min-height:260px;color:var(--pulse-muted);font-size:12px}.usage-waiting[hidden]{display:none}
  `;
  const page=document.createElement('div');page.className='page';
  setMarkup(page,`<header class="top"><div><div class="eyebrow">ANTIGRAVITY USAGE</div><h1 id="title"></h1><div class="sub"><span class="live-dot"></span><span id="subtitle"></span></div></div><div class="actions"><button id="locale" type="button" aria-label="Language"><span id="locale-label" class="locale-label">EN</span></button><button id="currency-btn" type="button" aria-label="Currency" title="Select Currency"><span id="currency-symbol" style="font-weight:600">RM</span><span id="currency-code" style="font-size:10px;margin-left:2px;opacity:0.85">MYR</span></button><button id="export-btn" type="button" aria-label="Export Usage" title="Export usage data (JSON)"><svg viewBox="0 0 16 16" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round"><path d="M2.5 10.5v3a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M8 2v9m-3.5-3.5L8 11l3.5-3.5"/></svg></button><button id="refresh" type="button" aria-label="Refresh"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 7a5 5 0 1 0-1.3 4.4M13 3v4H9"/></svg></button><button id="close" type="button" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg></button></div></header><nav class="tabs" role="tablist"><button id="overview-tab" role="tab" aria-controls="overview"></button><button id="details-tab" role="tab" aria-controls="details"></button><button id="project-tab" role="tab" aria-controls="project"></button><button id="ranking-tab" role="tab" aria-controls="ranking"></button></nav><div class="totals" id="totals"></div><section id="usage-waiting" class="usage-waiting" role="status" hidden></section><section id="overview" role="tabpanel"><div class="section-head"><div><h2 id="activity-title"></h2><div class="muted" id="heat-sub"></div></div><div class="chart-controls"><div class="seg" id="heat-controls"><button data-heat="day"></button><button data-heat="week"></button></div><div class="year-picker"><button id="year" type="button" class="year-trigger" aria-label="Year" aria-haspopup="listbox" aria-controls="year-menu" aria-expanded="false"><span id="year-label"></span><svg class="year-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div id="year-menu" class="year-menu" role="listbox" aria-label="Year" popover="manual"></div></div></div></div><div class="heat-wrap"><div class="calendar"><div class="months" id="months"></div><div class="heat-row"><div class="weekdays" id="weekdays"></div><div class="heat" id="heat"></div></div></div></div><div class="heat-footer"><span id="heat-summary"></span><div class="scale"><span id="less"></span><i class="swatch"></i><i class="swatch" data-level="1"></i><i class="swatch" data-level="2"></i><i class="swatch" data-level="3"></i><i class="swatch" data-level="4"></i><span id="more"></span></div></div><div class="selected"><div><div class="title" id="selection-title"></div><span class="muted" id="selection-value"></span></div><button id="selection-details"></button></div></section><section id="details" role="tabpanel" hidden><div class="section-head"><h2 id="detail-title"></h2><div class="chart-controls"><div class="range"><button id="previous" aria-label="Previous">‹</button><strong id="range-label"></strong><button id="next" aria-label="Next">›</button></div><div class="seg" id="period-controls"><button data-period="day"></button><button data-period="week"></button><button data-period="month"></button></div></div></div><div class="legend" id="legend"></div><div class="chart-wrap"><div class="chart"><div class="axis" id="axis"></div><div class="plot" id="plot"></div></div></div><div class="table-wrap"><table class="table"><thead><tr id="table-head"></tr></thead><tbody id="table-body"></tbody></table></div></section><section id="project" role="tabpanel" hidden>
  <div class="proj-hero">
    <div class="proj-hero-main">
      <div class="proj-hero-badge-wrap">
        <span class="proj-hero-tag" id="proj-hero-tag">THIS PROJECT</span>
        <span class="proj-hero-rank" id="proj-hero-rank"></span>
      </div>
      <h2 class="proj-hero-title" id="proj-hero-title"></h2>
      <div class="proj-hero-path" id="proj-hero-path"></div>
    </div>
    <div class="proj-hero-stat">
      <div class="proj-hero-stat-item">
        <span class="proj-hero-stat-label" id="proj-hero-total-label">全机用量占比</span>
        <div class="proj-hero-stat-val" id="proj-hero-total-val"></div>
        <div class="proj-hero-stat-cost" id="proj-hero-total-cost"></div>
      </div>
    </div>
  </div>

  <!-- Project Active Dates & History -->
  <div class="proj-card">
    <div class="proj-card-header">
      <div>
        <h3 class="proj-card-title" id="proj-timeline-title">项目活跃日期与历史记录</h3>
        <div class="muted" id="proj-timeline-sub"></div>
      </div>
      <div class="proj-count-badge" id="proj-timeline-badge"></div>
    </div>
    <div class="proj-active-days-list" id="proj-active-days-list"></div>
  </div>
</section><section id="ranking" role="tabpanel" hidden>
  <div class="proj-card">
    <div class="proj-card-header">
      <div>
        <h3 class="proj-card-title" id="proj-all-title">全部项目用量排行榜</h3>
        <div class="muted" id="proj-all-sub">点击任意项目可直接切换查看其专属明细与历史</div>
      </div>
      <div class="proj-count-badge" id="proj-count-badge"></div>
    </div>
    <div class="proj-ranking-list" id="proj-ranking-list"></div>
  </div>
</section><div class="tip" id="tip" role="status" hidden></div>`);view.append(page);
  const intro=document.createElement('section');intro.id='usage-intro';intro.className='usage-intro';intro.hidden=true;intro.setAttribute('aria-labelledby','usage-intro-title');
  setMarkup(intro,'<div class="intro-heading"><span class="intro-mark" aria-hidden="true"><svg viewBox="0 0 16 16"><ellipse cx="8" cy="4" rx="5" ry="2"/><path d="M3 4v8c0 2 10 2 10 0V4M3 8c0 2 10 2 10 0"/></svg></span><h2 id="usage-intro-title"></h2></div><div class="intro-copy"><p id="usage-intro-history"></p><p id="usage-intro-scope"></p><p id="usage-intro-storage"></p></div><div class="intro-bottom"><span id="usage-intro-error" role="status"></span><button id="usage-intro-done" type="button"></button></div>');
  page.querySelector('.top').after(intro);
  css.textContent+=`
    .usage-intro{margin:18px 0 0;padding:17px 20px 14px;border:1px solid var(--pulse-border);border-radius:12px;background:var(--pulse-control)}.usage-intro[hidden]{display:none}
    .intro-heading{display:flex;align-items:center;gap:9px;margin-bottom:9px}.intro-heading h2{font-size:13px;font-weight:550;margin:0}.intro-mark{display:flex;color:var(--pulse-accent)}.intro-mark svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}
    .intro-copy{display:grid;gap:5px;color:var(--pulse-muted);font-size:11px;line-height:1.65}.intro-copy p{margin:0}.intro-bottom{display:flex;justify-content:flex-end;align-items:center;gap:14px;margin-top:11px}.intro-bottom span{margin-right:auto;color:var(--pulse-warning);font-size:11px}
    #usage-intro-done{padding:6px 13px;min-height:30px;border:1px solid var(--pulse-border);border-radius:7px;background:var(--pulse-hover);color:var(--pulse-foreground);font:inherit;font-size:11px;cursor:pointer;transition:background-color 140ms ease,transform 120ms ease}#usage-intro-done:hover{background:var(--pulse-selected)}#usage-intro-done:active{transform:scale(.98)}#usage-intro-done:disabled{opacity:.55;cursor:wait}
    @media(max-width:520px){.usage-intro{padding:14px}.intro-bottom{align-items:flex-start}.intro-bottom span{line-height:1.5}}
  `;
  const $=id=>view.getElementById(id)||view.querySelector('#'+id),text=(id,value)=>{const el=$(id);if(el&&el.textContent!==value)el.textContent=value;};
  let value=null,tab='overview',heatMode='day',period='day',year=null,anchor=null,selected=null,activeTotalScope='today',activeCustomBucket=null,disabledModels=new Set(),lastKey='',busy=false,opener=null;
  let disposed=false,refreshMotion=null,refreshDelay=null,finishRefresh=null,accountKey=null,tipTarget=null,tipModel=null;
  const zh=()=>language.language==='zh-CN'||language.language==='zh-TW',tw=()=>language.language==='zh-TW',w=(cn,en,twText)=>(tw()&&twText!==undefined)?twText:(zh()?cn:en);
  let guideSaving=false,guideError=false,guideSignature=null;
  const replayGuide=window.__agPulseUsageGuidePreview===true;
  function renderGuide(){
    const signature=language.language+'|'+themeSignature();
    if(replayGuide&&signature!==guideSignature){guideDismissed=false;guideError=false;}
    guideSignature=signature;intro.hidden=guideDismissed;
    text('usage-intro-title',w('先了解你的用量统计','About your token usage','先了解您的用量統計'));
    text('usage-intro-history',w('自动汇总当前账号可读取的本地历史对话，再持续记录新请求；已删除或缺失的历史可能无法补齐。','Available local conversations for this account are imported automatically, then new requests are recorded. Deleted or missing history may leave gaps.','自動彙總目前帳號可讀取的本機歷史對話，並持續記錄新請求；已刪除或缺失的記錄可能無法補齊。'));
    text('usage-intro-scope',w('统计仅代表本机已记录的 Token 用量，不是账户账单；天、周、月均按 UTC+8 划分。','Totals cover usage recorded on this device, not account billing. Days, weeks and months use UTC+8.','統計僅代表本機已記錄的 Token 用量，非帳號帳單；日、週、月均按 UTC+8 劃分。'));
    text('usage-intro-storage',w('只在本地保存时间、模型和用量，不保存对话正文。删除对话不会扣除已记录的用量。','Only times, models and usage counters are saved locally, never conversation text. Deleting a chat does not subtract usage already recorded.','僅於本機儲存時間、模型與用量，不儲存對話內文。刪除對話不會扣減已記錄的用量。'));
    text('usage-intro-done',guideSaving?w('保存中…','Saving…','儲存中…'):w('知道了','Got it','我知道了'));
    text('usage-intro-error',guideError?w('未能保存，请再试一次。','Could not save. Please try again.','未能儲存，請再試一次。'):'' );
    $('usage-intro-done').disabled=guideSaving;$('usage-intro-done').setAttribute('aria-busy',String(guideSaving));
  }
  function dismissGuide(){
    if(disposed)return;const focused=view.activeElement===$('usage-intro-done');guideDismissed=true;renderGuide();
    if(focused&&dialog.open)$('overview-tab').focus({preventScroll:true});
  }
  $('usage-intro-done').addEventListener('click',async()=>{
    if(guideSaving||disposed)return;guideSaving=true;guideError=false;renderGuide();
    try{await onDismissGuide();dismissGuide();}catch{if(!disposed)guideError=true;}
    finally{guideSaving=false;if(!disposed)renderGuide();}
  });
  const full=n=>Number(n||0).toLocaleString(language.language==='en'?'en-US':language.language);
  const compact=n=>{n=Number(n||0);const limits=[[1e9,'B'],[1e6,'M'],[1e3,'K']];for(const [base,suffix]of limits)if(n>=base)return (n/base).toFixed(1).replace(/\.0$/,'')+suffix;return full(n);};
  const add=(date,days)=>{const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
  const week=date=>{const d=new Date(date+'T00:00:00Z');return add(date,-((d.getUTCDay()+6)%7));};
  const month=(date,shift)=>{const d=new Date(date.slice(0,7)+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+shift);return d.toISOString().slice(0,10);};
  const modelName=model=>model.replace(/-n$/,'').replace(/^gemini-/i,'Gemini ').replace(/^claude-/i,'Claude ').replace(/^gpt-/i,'GPT ').replace(/-/g,' ');
  const themeSignature=()=>{const s=getComputedStyle(root.host||dialog);return [s.getPropertyValue('--pulse-accent'),s.getPropertyValue('--pulse-background'),root.host?.dataset.pulseTheme].join('|');};
  let paletteKey='',modelColors=new Map();
  const colorCanvas=document.createElement('canvas');colorCanvas.width=colorCanvas.height=1;
  const colorContext=colorCanvas.getContext('2d',{willReadFrequently:true});
  const rgb=css=>{colorContext.clearRect(0,0,1,1);colorContext.fillStyle='#000';colorContext.fillStyle=css;colorContext.fillRect(0,0,1,1);return [...colorContext.getImageData(0,0,1,1).data].slice(0,3);};
  const luminance=a=>a.reduce((sum,v,i)=>{v/=255;return sum+(v<=.04045?v/12.92:((v+.055)/1.055)**2.4)*[.2126,.7152,.0722][i];},0);
  const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
  const hsl=a=>{const [r,g,b]=a.map(v=>v/255),hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo,l=(hi+lo)/2;return [d?((hi===r?(g-b)/d+(g<b?6:0):hi===g?(b-r)/d+2:(r-g)/d+4)*60):0,d?d/(1-Math.abs(2*l-1)):0,l];};
  const fromHsl=(h,s,l)=>{const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))));};return [f(0),f(8),f(4)];};
  function syncPalette(){
    const models=[...(value?.models||[])].sort(),key=themeSignature()+'|'+models.join('|');if(key===paletteKey)return;paletteKey=key;modelColors.clear();
    const style=getComputedStyle(root.host||dialog),base=rgb(style.getPropertyValue('--pulse-accent').trim()||'#85a8ff'),background=rgb(style.getPropertyValue('--pulse-background').trim()||'#1c1d1f'),[h,s]=hsl(base);
    // An analogous scale stays harmonious as the host accent changes. Tonal
    // variation distinguishes adjacent series without provider brand colors.
    const dark=luminance(background)<.35,offsets=[0,-18,18,-36,36,-9,9,-27,27],tones=dark?[.64,.52,.73,.59,.68]:[.43,.33,.51,.38,.47];
    const end=contrast([255,255,255],background)>contrast([0,0,0],background)?1:0;
    models.forEach((model,i)=>{const hue=(h+offsets[i%offsets.length]+360)%360,saturation=s<.08?.07:Math.max(.28,Math.min(.55,s*.72));let lightness=tones[i%tones.length],c=fromHsl(hue,saturation,lightness);
      // Chart marks (including small legend dots) need contrast on the actual
      // custom background, rather than relying solely on dark/light labels.
      for(let step=0;contrast(c,background)<3&&step<100;step++){lightness+=end? .005:-.005;lightness=Math.max(0,Math.min(1,lightness));c=fromHsl(hue,saturation,lightness);}
      modelColors.set(model,'rgb('+c.join(' ')+')');
    });
  }
  const color=model=>modelColors.get(model)||'var(--pulse-accent)';
  const totals=(from,to,filter=false)=>{
    const models={};for(const day of value?.days||[])if(day.date>=from&&day.date<=to)for(const [model,r]of Object.entries(day.models)){
      if(filter&&disabledModels.has(model))continue;
      models[model]||={total:0,requests:0,uncached:0,cacheRead:0,cacheWrite:0,output:0};for(const key of Object.keys(models[model]))models[model][key]+=r[key]||0;
    }
    return {from,to,models,total:Object.values(models).reduce((n,r)=>n+r.total,0),requests:Object.values(models).reduce((n,r)=>n+r.requests,0)};
  };
  const node=(tag,className,content)=>{const n=document.createElement(tag);if(className)n.className=className;if(content!==undefined)n.textContent=content;return n;};
  function tooltip(bucket,target,activeModel=null){
    if(!$('tip').hidden&&tipTarget===target&&tipModel===activeModel)return;tipTarget=target;tipModel=activeModel;
    highlightModel(activeModel);
    const tip=$('tip');tip.replaceChildren(node('div','tip-title',bucket.from===bucket.to?bucket.from:bucket.from+' – '+bucket.to),node('strong','',full(bucket.total)+' Token'),node('div','muted',w(`${bucket.requests} 次请求`,`${bucket.requests} requests`,`${bucket.requests} 次請求`)));
    for(const [model,r]of Object.entries(bucket.models).sort((a,b)=>b[1].total-a[1].total)){
      const row=node('div','tip-model'+(activeModel?(activeModel===model?' active':' dimmed'):'')),label=node('span',''),dot=node('i','dot'),amount=node('span','',compact(r.total));dot.style.setProperty('--model-color',color(model));label.append(dot,document.createTextNode(modelName(model)));amount.append(node('span','model-share',bucket.total?(r.total/bucket.total*100).toFixed(1)+'%':'0%'));row.append(label,amount);tip.append(row);
    }
    tip.hidden=false;const rect=target.getBoundingClientRect(),bounds=dialog.getBoundingClientRect(),r=tip.getBoundingClientRect();
    tip.style.left=Math.min(bounds.right-r.width-12,Math.max(bounds.left+12,rect.left+rect.width/2-r.width/2))+'px';
    tip.style.top=Math.max(bounds.top+12,rect.top-r.height-10)+'px';
  }
  const bindBucket=(button,bucket)=>{
    button.setAttribute('aria-label',(bucket.from===bucket.to?bucket.from:bucket.from+' – '+bucket.to)+': '+full(bucket.total)+' Token');
    button.addEventListener('pointerenter',()=>tooltip(bucket,button));button.addEventListener('pointerleave',()=>{$('tip').hidden=true;highlightModel(null);});button.addEventListener('focus',()=>tooltip(bucket,button));button.addEventListener('blur',()=>{$('tip').hidden=true;highlightModel(null);});
    button.addEventListener('pointermove',event=>{const model=event.target.closest?.('.bar-segment')?.dataset.model||null;tooltip(bucket,button,model);});
    button.addEventListener('click',()=>{selected=bucket;anchor=bucket.from;activeCustomBucket=bucket;activeTotalScope=(bucket.from===bucket.to?(bucket.from===value.today?'today':'custom'):'custom');renderTotals();showSelection();});
  };
  function showSelection(){const bucket=selected||totals(value.today,value.today);text('selection-title',bucket.from===bucket.to?bucket.from:bucket.from+' – '+bucket.to);text('selection-value',full(bucket.total)+' Token · '+w(`${bucket.requests} 次请求`,`${bucket.requests} requests`,`${bucket.requests} 次請求`));}
  function renderHeat(){
    if(!value)return;
    const start=week(year+'-01-01'),end=year+'-12-31',weeks=Math.floor((Date.parse(end)-Date.parse(start))/604800000)+1;
    $('heat').replaceChildren();$('months').replaceChildren();$('weekdays').replaceChildren();$('heat').className='heat'+(heatMode==='week'?' week':'');
    $('heat').style.gridTemplateColumns=`repeat(${weeks},minmax(0,1fr))`;
    if(heatMode==='week')$('heat').style.setProperty('grid-template-columns',`repeat(${Math.ceil(weeks/2)},minmax(0,1fr))`,'important');
    const buckets=[];for(let i=0;i<(heatMode==='day'?weeks*7:weeks);i++){
      const date=add(start,heatMode==='day'?i:i*7),to=heatMode==='day'?date:add(date,6);
      buckets.push(heatMode==='day'?totals(date,date):totals(date<year+'-01-01'?year+'-01-01':date,to>end?end:to));
    }
    const max=Math.max(1,...buckets.map(b=>b.total));
    for(const bucket of buckets){
      const button=node('button','');button.type='button';const future=bucket.from>value.today||bucket.to<year+'-01-01'||bucket.from>year+'-12-31';
      button.dataset.level=bucket.total===0?'0':String(Math.min(4,Math.ceil(bucket.total/max*4)));if(future){button.className='future';button.disabled=true;}
      if(!future)bindBucket(button,bucket);button.tabIndex=-1;$('heat').append(button);
    }
    const usable=[...$('heat').children].filter(b=>!b.disabled),lastActive=[...$('heat').children].reverse().find(b=>!b.disabled&&b.dataset.level!=='0');
    if(usable.length)(lastActive||usable.at(-1)).tabIndex=0;
    if(heatMode==='day'){
      $('months').style.gridTemplateColumns=`repeat(${weeks},minmax(0,1fr))`;
      for(let m=1;m<=12;m++){const date=`${year}-${String(m).padStart(2,'0')}-01`,col=Math.floor((Date.parse(date)-Date.parse(start))/604800000)+1;
        const label=node('span','',zh()?m+'月':['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]);label.style.gridColumn=col;label.style.gridRow=1;$('months').append(label);}
      for(let i=0;i<7;i++)$('weekdays').append(node('span','',i%2===0?(zh()?['一','','三','','五','','日'][i]:['M','','W','','F','','S'][i]):''));
    }
    text('heat-sub',heatMode==='day'?w('每格代表一天','Each square is one day','每格代表一天'):w('每格代表一周 · 周一开始','Each square is one week · starts Monday','每格代表一週 · 週一開始'));
    const annual=totals(year+'-01-01',year+'-12-31');text('heat-summary',w(`${year} 年 · ${full(annual.total)} Token`,`${year} · ${full(annual.total)} tokens`,`${year} 年 · ${full(annual.total)} Token`));
    for(const b of view.querySelectorAll('[data-heat]'))b.setAttribute('aria-pressed',String(b.dataset.heat===heatMode));showSelection();
  }
  function highlightModel(model){
    if(model)$('plot').dataset.highlight=model;else delete $('plot').dataset.highlight;
    for(const bar of $('plot').querySelectorAll('.bar-segment')){if(model&&bar.dataset.model===model)bar.dataset.highlight='true';else delete bar.dataset.highlight;}
  }
  const chartSummary=node('div','chart-summary');$('detail-title').after(chartSummary);
  const chartHeading=node('div','');$('detail-title').before(chartHeading);chartHeading.append($('detail-title'),chartSummary);
  function renderChart(){
    if(!value)return;syncPalette();$('tip').hidden=true;highlightModel(null);
    const buckets=[];
    if(period==='day'){const start=month(anchor,0),end=add(month(anchor,1),-1);for(let date=start;date<=end;date=add(date,1))buckets.push(totals(date,date,true));text('range-label',start.slice(0,7));}
    else if(period==='week'){const start=add(week(anchor),-11*7);for(let i=0;i<12;i++){const from=add(start,i*7);buckets.push(totals(from,add(from,6),true));}text('range-label',start.slice(5)+' – '+add(week(anchor),6).slice(5));}
    else{for(let i=-11;i<=0;i++){const from=month(anchor,i);buckets.push(totals(from,add(month(from,1),-1),true));}text('range-label',buckets[0].from.slice(0,7)+' – '+month(anchor,0).slice(0,7));}
    $('next').disabled=period==='week'?week(anchor)>=week(value.today):anchor.slice(0,7)>=value.today.slice(0,7);$('legend').replaceChildren();
    for(const model of value.models){const button=node('button',''),dot=node('i','dot');dot.style.setProperty('--model-color',color(model));button.append(dot,document.createTextNode(modelName(model)));button.type='button';button.setAttribute('aria-pressed',String(!disabledModels.has(model)));button.addEventListener('click',()=>{if(disabledModels.has(model))disabledModels.delete(model);else disabledModels.add(model);renderChart();});button.addEventListener('pointerenter',()=>highlightModel(disabledModels.has(model)?null:model));button.addEventListener('pointerleave',()=>highlightModel(null));$('legend').append(button);}
    const max=Math.max(1,...buckets.map(b=>b.total)),ceiling=max>1?Math.ceil(max/(10**Math.floor(Math.log10(max))))*10**Math.floor(Math.log10(max)):1;
    $('axis').replaceChildren();$('plot').replaceChildren();
    for(let i=0;i<=4;i++){const label=node('span','',compact(ceiling*i/4));label.style.bottom=(18+(148-18)*i/4)+'px';$('axis').append(label);const line=node('i','grid-line');line.style.bottom=(18+(148-18)*i/4)+'px';$('plot').append(line);}
    for(const [i,bucket]of buckets.entries()){
      const button=node('button','bar-column');button.type='button';const stack=node('div','stack');
      const segments=value.models.filter(model=>bucket.models[model]?.total>0);
      // Continuous stack: rounding clips only its outer top corners. Internal
      // separators are inset, so small values and total heights remain exact.
      for(const [j,model]of segments.entries()){const r=bucket.models[model],bar=node('i','bar-segment'),height=r.total/ceiling*130;bar.dataset.model=model;bar.setAttribute('aria-hidden','true');bar.style.setProperty('--model-color',color(model));bar.style.height=height+'px';if(j&&height>=3)bar.style.boxShadow='inset 0 -1px 0 color-mix(in srgb,var(--pulse-background) 48%,transparent)';stack.append(bar);}
      if(!bucket.total)stack.append(node('i','empty-bar'));button.append(stack);
      if(period!=='day'||i%3===0||i===buckets.length-1)button.append(node('span','x-label',period==='day'?String(i+1):period==='week'?bucket.from.slice(5):bucket.from.slice(0,7)));
      bindBucket(button,bucket);$('plot').append(button);
    }
    if(!buckets.some(b=>b.total))$('plot').append(node('div','chart-empty',w('所选时段暂无用量记录','No usage recorded in this period','所選時段尚無用量記錄')));
    $('table-head').replaceChildren(...[w('模型','Model','模型'),w('总 Token','Total tokens','總 Token'),w('未缓存输入','Uncached input','未快取輸入'),w('缓存读取','Cache read','快取讀取'),w('缓存写入','Cache write','快取寫入'),w('输出','Output','輸出')].map(label=>node('th','',label)));
    $('table-body').replaceChildren();const rangeTotals=totals(buckets[0].from,buckets.at(-1).to,true);
    chartSummary.replaceChildren(node('strong','',compact(rangeTotals.total)+' Token'),document.createTextNode(' · '+w(`${full(rangeTotals.requests)} 次请求`,`${full(rangeTotals.requests)} requests`,`${full(rangeTotals.requests)} 次請求`)));
    for(const [model,r]of Object.entries(rangeTotals.models).sort((a,b)=>b[1].total-a[1].total)){
      const row=node('tr',''),label=node('td',''),dot=node('span','dot');dot.style.setProperty('--model-color',color(model));label.append(dot,document.createTextNode(modelName(model)));row.append(label,...[r.total,r.uncached,r.cacheRead,r.cacheWrite,r.output].map(n=>node('td','',full(n))));$('table-body').append(row);
    }
    for(const b of view.querySelectorAll('[data-period]'))b.setAttribute('aria-pressed',String(b.dataset.period===period));
  }
  function render(){
    renderGuide();
    if(!value){
      closeYear(false);$('tip').hidden=true;$('overview').hidden=true;$('details').hidden=true;$('project').hidden=true;$('ranking').hidden=true;$('overview').style.display='none';$('details').style.display='none';$('project').style.display='none';$('ranking').style.display='none';$('usage-waiting').hidden=false;
      text('usage-waiting',w('正在重新连接统计…','Reconnecting usage…','正在重新連線統計資料…'));text('subtitle',w('正在重新连接本机统计','Reconnecting local usage','正在重新連線本機統計'));
      for(const metric of $('totals').children){metric.title='';metric.querySelector('.value')?.replaceChildren(node('span','','—'));}
      return;
    }
    $('usage-waiting').hidden=true;
    syncPalette();
    text('title',w('用量统计','Token usage','用量統計'));dialog.setAttribute('aria-label',w('用量统计','Token usage','用量統計'));text('subtitle',w(`本机 ${hostLabel} · 当前账号`,`Local ${hostLabel} · current account`,`本機 ${hostLabel} · 目前帳號`));
    text('overview-tab',w('活动概览','Activity','活動總覽'));text('details-tab',w('用量详情','Usage details','用量詳細資料'));text('project-tab',w('当前项目','This project','目前專案'));text('ranking-tab',w('全部项目','All projects','全部專案'));text('activity-title',w('Token 活动','Token activity','Token 活動'));text('detail-title',w('按模型统计','Usage by model','依模型統計'));
    languagePicker.update();currencyPicker?.update();for(const [id,label]of [['locale',language.t('language')],['export-btn',w('导出用量数据 (JSON)','Export usage data (JSON)','匯出用量資料 (JSON)')],['refresh',w('刷新用量','Refresh usage','重新整理用量')],['close',w('关闭','Close','關閉')]]){$(id).setAttribute('aria-label',label);$(id).title=label;}text('less',w('少','Less','少'));text('more',w('多','More','多'));text('selection-details',w('查看这段用量 →','View usage →','檢視此時段用量 →'));
    for(const b of view.querySelectorAll('[data-heat]'))b.textContent=b.dataset.heat==='day'?w('每天','Daily','每日'):w('每周','Weekly','每週');
    for(const b of view.querySelectorAll('[data-period]'))b.textContent=({day:w('天','Day','日'),week:w('周','Week','週'),month:w('月','Month','月')})[b.dataset.period];
    $('overview-tab').setAttribute('aria-selected',String(tab==='overview'));$('details-tab').setAttribute('aria-selected',String(tab==='details'));$('project-tab').setAttribute('aria-selected',String(tab==='project'));$('ranking-tab').setAttribute('aria-selected',String(tab==='ranking'));$('overview').hidden=tab!=='overview';$('details').hidden=tab!=='details';$('project').hidden=tab!=='project';$('ranking').hidden=tab!=='ranking';$('overview').style.display=tab==='overview'?'':'none';$('details').style.display=tab==='details'?'':'none';$('project').style.display=tab==='project'?'flex':'none';$('ranking').style.display=tab==='ranking'?'flex':'none';
    const getBreakdown=fn=>{let uncached=0,cacheRead=0,cacheWrite=0,output=0;for(const day of(value?.days||[])){if(fn(day.date)){for(const r of Object.values(day.models||{})){uncached+=r.uncached||0;cacheRead+=r.cacheRead||0;cacheWrite+=r.cacheWrite||0;output+=r.output||0;}}}return{uncached,cache:cacheRead+cacheWrite,output,total:uncached+cacheRead+cacheWrite+output};};
    const renderTotals=()=>{if(!value)return;
      if(tab==='project'&&value.projects&&value.projects.allProjects&&value.projects.allProjects.length>0){
        const pData=value.projects;
        const activeProj=(selectedProjectKey?pData.allProjects.find(p=>p.key===selectedProjectKey):null)||pData.currentProject||pData.allProjects[0];
        if(activeProj){
          const projSource=(Array.isArray(activeProj.dailyList)&&activeProj.dailyList.length>0)?activeProj.dailyList:(activeProj.conversationList||[]);
          const getProjStats=fn=>{
            let uncached=0,cache=0,output=0,requests=0,total=0,chats=0;
            for(const item of projSource){
              if(item.date&&fn(item.date)){uncached+=item.uncached||0;cache+=item.cache||0;output+=item.output||0;requests+=item.requests||0;total+=item.totalTokens||0;chats+=Number(item.chats??1);}
            }
            return {uncached,cache,output,requests,total,chats};
          };
          const pToday=getProjStats(d=>d===value.today);
          const pWeek=getProjStats(d=>d>=week(value.today)&&d<=value.today);
          const pMonth=getProjStats(d=>d.slice(0,7)===value.today.slice(0,7)&&d<=value.today);
          const pAll={uncached:activeProj.uncached,cache:activeProj.cache,output:activeProj.output,requests:activeProj.requests,total:activeProj.totalTokens,chats:activeProj.conversations};
          
          let cStats,cLabel,cTotal,cReqs,cChats;
          if(activeTotalScope==='today'){cStats=pToday;cLabel=w('今日','Today','今日');cTotal=pToday.total;cReqs=pToday.requests;cChats=pToday.chats;}
          else if(activeTotalScope==='week'){cStats=pWeek;cLabel=w('本周','This week','本週');cTotal=pWeek.total;cReqs=pWeek.requests;cChats=pWeek.chats;}
          else if(activeTotalScope==='month'){cStats=pMonth;cLabel=w('本月','This month','本月');cTotal=pMonth.total;cReqs=pMonth.requests;cChats=pMonth.chats;}
          else if(activeTotalScope==='custom'&&activeCustomBucket){
            const b=activeCustomBucket;
            cStats={
              uncached:Object.values(b.models||{}).reduce((n,r)=>n+(r.uncached||0),0),
              cache:Object.values(b.models||{}).reduce((n,r)=>n+(r.cacheRead||0)+(r.cacheWrite||0),0),
              output:Object.values(b.models||{}).reduce((n,r)=>n+(r.output||0),0)
            };
            cLabel=b.from===b.to?b.from:`${b.from} – ${b.to}`;
            cTotal=b.total;
            cReqs=b.requests||0;
            cChats=b.chats||1;
          }
          else{cStats=pAll;cLabel=w('累计','All time','累積');cTotal=pAll.total;cReqs=pAll.requests;cChats=pAll.chats;}
          
          const currentTotal=Math.max(1,cTotal);
          const hitRate=(cStats.uncached+cStats.cache>0)?((cStats.cache/(cStats.uncached+cStats.cache))*100).toFixed(1)+'%':'—';
          $('totals').replaceChildren();
          
          const isWeekSame = pToday.total > 0 && pToday.total === pWeek.total;
          const isMonthSame = pToday.total > 0 && pToday.total === pMonth.total;
          const scopeCards=[
            {key:'today',label:w('项目今日','Today (Proj)','專案今日'),total:pToday.total,hint:pToday.total===0?w('今日无活跃','No activity today','今日無活躍'):null},
            {key:'week',label:w('项目本周','This week (Proj)','專案本週'),total:pWeek.total,hint:isWeekSame?w('本周仅今日活跃','Only today this week','本週僅今日活躍'):null},
            {key:'month',label:w('项目本月','This month (Proj)','專案本月'),total:pMonth.total,hint:isMonthSame?w('本月仅今日活跃','Only today this month','本月僅今日活躍'):null},
            {key:'total',label:w('项目总计','Project Total','專案總計'),total:pAll.total,hint:w(`占比 ${activeProj.share}%`,`Share ${activeProj.share}%`,`佔比 ${activeProj.share}%`)}
          ];
          for(const item of scopeCards){
            const isSel=(activeTotalScope||'total')===item.key;
            const metric=node('div','metric metric-period'+(isSel?' selected-scope':''));
            metric.style.cursor='pointer';
            const n=node('div','value',compact(item.total));
            n.append(node('span','unit','Token'));
            metric.append(node('label','',item.label),n);
            const est=costEst(item.total);
            const subText=[est,item.hint].filter(Boolean).join(' · ');
            if(subText){
              const costEl=node('div','est-cost',subText);
              costEl.style.cssText='font-size:10.5px;color:var(--pulse-muted);margin-top:2px;font-variant-numeric:tabular-nums;opacity:0.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
              metric.append(costEl);
            }
            metric.title=`【${activeProj.name}】${item.label}: ${full(item.total)} Token${est?' ('+est+')':''}${item.hint?' · '+item.hint:''}`;
            metric.addEventListener('click',()=>{activeTotalScope=item.key;activeCustomBucket=null;renderTotals();});
            $('totals').append(metric);
          }
          const divider=node('div','row-divider');$('totals').append(divider);
          const row2Data=[
            {label:w('未缓存输入','Uncached input','未快取輸入'),val:compact(cStats.uncached),unit:'Token',sub:`${cLabel}: ${compact(cStats.uncached)} · ${w('占比','Share','佔比')} ${((cStats.uncached/currentTotal)*100).toFixed(1)}%`,tip:`【${activeProj.name}】${cLabel} ${w('未缓存输入','Uncached Input','未快取輸入')}: ${full(cStats.uncached)} Token`},
            {label:w('缓存读取','Cache read','快取讀取'),val:compact(cStats.cache),unit:'Token',sub:`${cLabel}: ${compact(cStats.cache)} · ${w('命中率','Hit rate','命中率')} ${hitRate}`,tip:`【${activeProj.name}】${cLabel} ${w('缓存读取','Cache Read','快取讀取')}: ${full(cStats.cache)} Token`},
            {label:w('模型输出','Output tokens','模型輸出'),val:compact(cStats.output),unit:'Token',sub:`${cLabel}: ${compact(cStats.output)} · ${w('占比','Share','佔比')} ${((cStats.output/currentTotal)*100).toFixed(1)}%`,tip:`【${activeProj.name}】${cLabel} ${w('模型输出','Output Tokens','模型輸出')}: ${full(cStats.output)} Token`},
            {label:w('请求与会话','Reqs & Chats','請求與會話'),val:cReqs.toLocaleString('en-US'),unit:w('次','reqs','次'),sub:`${cChats} ${w('个对话','chats','個對話')} · ${w('均','Avg','均')} ${compact(Math.round(currentTotal/Math.max(1,cReqs)))}/${w('次','req','次')}`,tip:`【${activeProj.name}】${cLabel}: ${cReqs} ${w('次请求','requests','次請求')} · ${cChats} ${w('个对话','chats','個對話')}`}
          ];
          for(let i=0;i<row2Data.length;i++){
            const item=row2Data[i];const metric=node('div','metric metric-detail'+(i===0?' row-start':''));const n=node('div','value',item.val);
            if(item.unit)n.append(node('span','unit',item.unit));metric.append(node('label','',item.label),n);
            const subEl=node('div','detail-sub',item.sub);subEl.style.cssText='font-size:10.5px;color:var(--pulse-muted);margin-top:2px;font-variant-numeric:tabular-nums;opacity:0.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
            metric.append(subEl);metric.title=item.tip;$('totals').append(metric);
          }
          return;
        }
      }
      const tStats=getBreakdown(d=>d===value.today),wStats=getBreakdown(d=>d>=week(value.today)&&d<=value.today),mStats=getBreakdown(d=>d.slice(0,7)===value.today.slice(0,7)&&d<=value.today),allStats=getBreakdown(()=>true);
      let cStats,cLabel,cTotal,cReqs;
      if(activeTotalScope==='today'){cStats=tStats;cLabel=w('今日','Today','今日');cTotal=value.todayTokens||tStats.total;const td=(value.days||[]).find(d=>d.date===value.today);cReqs=td?Object.values(td.models||{}).reduce((s,r)=>s+(r.requests||0),0):0;}
      else if(activeTotalScope==='week'){cStats=wStats;cLabel=w('本周','This week','本週');cTotal=value.weekTokens||wStats.total;cReqs=(value.days||[]).filter(d=>d.date>=week(value.today)&&d<=value.today).reduce((s,d)=>s+Object.values(d.models||{}).reduce((rSum,r)=>rSum+(r.requests||0),0),0);}
      else if(activeTotalScope==='month'){cStats=mStats;cLabel=w('本月','This month','本月');cTotal=value.monthTokens||mStats.total;cReqs=(value.days||[]).filter(d=>d.date.slice(0,7)===value.today.slice(0,7)&&d<=value.today).reduce((s,d)=>s+Object.values(d.models||{}).reduce((rSum,r)=>rSum+(r.requests||0),0),0);}
      else if(activeTotalScope==='custom'&&activeCustomBucket){const b=activeCustomBucket;const bStats={uncached:Object.values(b.models||{}).reduce((n,r)=>n+(r.uncached||0),0),cache:Object.values(b.models||{}).reduce((n,r)=>n+(r.cacheRead||0)+(r.cacheWrite||0),0),output:Object.values(b.models||{}).reduce((n,r)=>n+(r.output||0),0)};bStats.total=b.total;cStats=bStats;cLabel=b.from===b.to?b.from:`${b.from} – ${b.to}`;cTotal=b.total;cReqs=b.requests||0;}
      else{cStats=allStats;cLabel=w('累计','All time','累積');cTotal=value.totalTokens||allStats.total;cReqs=value.requests||0;}
      const currentTotal=Math.max(1,cTotal);
      const hitRate=(cStats.uncached+cStats.cache>0)?((cStats.cache/(cStats.uncached+cStats.cache))*100).toFixed(1)+'%':'—';
      $('totals').replaceChildren();
      for(const item of [{key:'today',label:w('今日用量','Today','今日用量'),total:value.todayTokens},{key:'week',label:w('本周用量','This week','本週用量'),total:value.weekTokens},{key:'month',label:w('本月用量','This month','本月用量'),total:value.monthTokens},{key:'total',label:w('累计用量','All time','累積用量'),total:value.totalTokens}]){
        const isSel=activeTotalScope===item.key;const metric=node('div','metric metric-period'+(isSel?' selected-scope':''));
        metric.style.cursor='pointer';const n=node('div','value',compact(item.total));n.append(node('span','unit','Token'));metric.append(node('label','',item.label),n);
        const est=costEst(item.total);if(est){const costEl=node('div','est-cost',est);costEl.style.cssText='font-size:11px;color:var(--pulse-muted);margin-top:2px;font-variant-numeric:tabular-nums;opacity:0.85;';metric.append(costEl);}
        metric.title=`${full(item.total)} Token${est?' ('+est+')':''} · ${w('点击查看该时段细节','Click to view details','點擊查看該時段細節')}`;
        metric.addEventListener('click',()=>{activeTotalScope=item.key;activeCustomBucket=null;renderTotals();});
        $('totals').append(metric);
      }
      const divider=node('div','row-divider');$('totals').append(divider);
      const row2Data=[
        {label:w('未缓存输入','Uncached input','未快取輸入'),val:compact(cStats.uncached),unit:'Token',sub:`${cLabel}: ${compact(cStats.uncached)} · ${w('占比','Share','佔比')} ${((cStats.uncached/currentTotal)*100).toFixed(1)}%`,tip:`${w('未缓存输入','Uncached Input','未快取輸入')}\n[${cLabel}]: ${full(cStats.uncached)} Token`},
        {label:w('缓存读取','Cache read','快取讀取'),val:compact(cStats.cache),unit:'Token',sub:`${cLabel}: ${compact(cStats.cache)} · ${w('命中率','Hit rate','命中率')} ${hitRate}`,tip:`${w('缓存读取','Cache Read','快取讀取')}\n[${cLabel}]: ${full(cStats.cache)} Token`},
        {label:w('模型输出','Output tokens','模型輸出'),val:compact(cStats.output),unit:'Token',sub:`${cLabel}: ${compact(cStats.output)} · ${w('占比','Share','佔比')} ${((cStats.output/currentTotal)*100).toFixed(1)}%`,tip:`${w('模型输出','Output Tokens','模型輸出')}\n[${cLabel}]: ${full(cStats.output)} Token`},
        {label:w('请求次数','Requests','請求次數'),val:cReqs.toLocaleString('en-US'),unit:w('次','reqs','次'),sub:`${w('命中率','Hit rate','命中率')}: ${hitRate} · ${w('均','Avg','均')} ${compact(Math.round(currentTotal/Math.max(1,cReqs)))}/${w('次','req','次')}`,tip:`${w('请求次数','Requests','請求次數')}: ${full(cReqs)} ${w('次','requests','次')}\n${w('缓存命中率','Cache Hit Rate','快取命中率')}: ${hitRate}`}
      ];
      for(let i=0;i<row2Data.length;i++){
        const item=row2Data[i];const metric=node('div','metric metric-detail'+(i===0?' row-start':''));const n=node('div','value',item.val);
        if(item.unit)n.append(node('span','unit',item.unit));metric.append(node('label','',item.label),n);
        const subEl=node('div','detail-sub',item.sub);subEl.style.cssText='font-size:10.5px;color:var(--pulse-muted);margin-top:2px;font-variant-numeric:tabular-nums;opacity:0.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        metric.append(subEl);metric.title=item.tip;$('totals').append(metric);
      }
    };
    window.__lastUsageExportData=value;
    renderTotals();
    const years=[];const first=Number(value.firstDate?.slice(0,4)||value.today.slice(0,4)),currentYear=Number(value.today.slice(0,4)),minimum=Math.max(first,currentYear-10);for(let y=currentYear;y>=minimum;y--)years.push(y);
    if($('year').dataset.years!==years.join(',')){
      $('year-menu').replaceChildren(...years.map(y=>{const option=node('button','year-option');option.type='button';option.dataset.year=String(y);option.setAttribute('role','option');option.tabIndex=-1;
        setMarkup(option,'<span></span><svg class="year-check" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>');option.firstElementChild.textContent=String(y);
        option.addEventListener('click',()=>{year=String(y);syncYear();closeYear();renderHeat();});return option;}));$('year').dataset.years=years.join(',');
    }
    syncYear();
    if(tab==='overview')renderHeat();else if(tab==='details')renderChart();else if(tab==='project')renderProjects();else if(tab==='ranking')renderRanking();
  }
  function changeTab(next){closeYear(false);tab=next;$('tip').hidden=true;if(tab==='project'){activeTotalScope='total';}else{activeTotalScope='today';}render();}
  $('overview-tab').addEventListener('click',()=>changeTab('overview'));$('details-tab').addEventListener('click',()=>changeTab('details'));$('project-tab').addEventListener('click',()=>changeTab('project'));$('ranking-tab').addEventListener('click',()=>changeTab('ranking'));
  for(const b of view.querySelectorAll('[data-heat]'))b.addEventListener('click',()=>{heatMode=b.dataset.heat;activeTotalScope=b.dataset.heat==='day'?'today':'week';activeCustomBucket=null;renderHeat();renderTotals();});
  for(const b of view.querySelectorAll('[data-period]'))b.addEventListener('click',()=>{period=b.dataset.period;activeTotalScope=period==='day'?'today':period==='week'?'week':'month';activeCustomBucket=null;renderChart();renderTotals();});
  function syncYear(){
    text('year-label',String(year));$('year').setAttribute('aria-label',w('选择年份','Select year','選取年份')+' · '+year);$('year-menu').setAttribute('aria-label',w('年份','Year','年份'));
    for(const option of $('year-menu').children)option.setAttribute('aria-selected',String(option.dataset.year===String(year)));
  }
  function closeYear(restore=true){if(!$('year-menu').matches(':popover-open'))return;$('year-menu').hidePopover();$('year').setAttribute('aria-expanded','false');if(restore)$('year').focus({preventScroll:true});}
  function positionYear(){
    if(!$('year-menu').matches(':popover-open'))return;const menu=$('year-menu'),r=$('year').getBoundingClientRect(),bounds=dialog.getBoundingClientRect(),width=menu.offsetWidth,height=menu.offsetHeight;
    menu.style.left=Math.max(bounds.left+12,Math.min(r.right-width,bounds.right-width-12))+'px';const below=r.bottom+7;
    menu.style.top=(below+height<=bounds.bottom-12?below:Math.max(bounds.top+12,r.top-height-7))+'px';
  }
  function openYear(){
    $('tip').hidden=true;$('year-menu').showPopover();$('year').setAttribute('aria-expanded','true');positionYear();
    ($('year-menu').querySelector('[aria-selected=true]')||$('year-menu').firstElementChild)?.focus({preventScroll:true});
  }
  $('year').addEventListener('click',()=>{$('year-menu').matches(':popover-open')?closeYear():openYear();});
  $('year').addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();openYear();if(event.key==='Home')$('year-menu').firstElementChild?.focus();if(event.key==='End')$('year-menu').lastElementChild?.focus();}});
  $('year-menu').addEventListener('keydown',event=>{
    const options=[...$('year-menu').children],current=options.indexOf(view.activeElement);let next=null;
    if(event.key==='ArrowDown')next=Math.min(options.length-1,current+1);else if(event.key==='ArrowUp')next=Math.max(0,current-1);else if(event.key==='Home')next=0;else if(event.key==='End')next=options.length-1;
    if(next!==null){event.preventDefault();options[next]?.focus({preventScroll:true});}else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeYear();}else if(event.key==='Tab')closeYear();
  });
  view.addEventListener('pointerdown',event=>{const path=event.composedPath();if(!path.includes($('year'))&&!path.includes($('year-menu')))closeYear(false);});
  page.addEventListener('scroll',closeYearOnScroll,{passive:true});function closeYearOnScroll(){closeYear(false);}
  window.addEventListener('resize',positionYear);
  $('heat').addEventListener('keydown',event=>{
    const buttons=[...$('heat').children],index=buttons.indexOf(event.target);if(index<0)return;
    const delta=heatMode==='day'?{ArrowLeft:-7,ArrowRight:7,ArrowUp:-1,ArrowDown:1}:{ArrowLeft:-1,ArrowRight:1,ArrowUp:-Math.ceil(buttons.length/2),ArrowDown:Math.ceil(buttons.length/2)};
    let next=event.key==='Home'?buttons.findIndex(b=>!b.disabled):event.key==='End'?buttons.findLastIndex(b=>!b.disabled):index+(delta[event.key]??NaN);
    if(!Number.isFinite(next)||next<0||next>=buttons.length||buttons[next].disabled)return;event.preventDefault();event.target.tabIndex=-1;buttons[next].tabIndex=0;buttons[next].focus();
  });
  $('selection-details').addEventListener('click',()=>{anchor=(selected?.from||value.today);period=heatMode;changeTab('details');});
  for(const [id,step]of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{anchor=period==='day'?month(anchor,step):period==='week'?add(anchor,step*84):month(anchor,step*12);renderChart();});
  const languagePicker=language.mountLanguagePicker({button:$('locale'),label:$('locale-label'),parent:dialog,choose:onLanguage});
  $('refresh').addEventListener('click',async()=>{
    if(busy||disposed)return;busy=true;const button=$('refresh'),turn=600,started=performance.now();button.disabled=true;button.setAttribute('aria-busy','true');
    refreshMotion=button.querySelector('svg').animate([{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:turn,iterations:Infinity});
    try{await onRefresh();}
    catch{if(!disposed)console.warn('[Antigravity Usage] Refresh unavailable');}
    finally{
      // Fast requests still paint one whole turn. Slow requests finish their
      // current turn, so cancel never snaps a half-rotated icon back to zero.
      if(!disposed){const elapsed=performance.now()-started,remaining=Math.max(turn,Math.ceil(elapsed/turn)*turn)-elapsed;
        await new Promise(resolve=>{finishRefresh=resolve;refreshDelay=setTimeout(resolve,Math.max(0,remaining));});}
      clearTimeout(refreshDelay);refreshDelay=null;finishRefresh=null;refreshMotion?.cancel();refreshMotion=null;busy=false;
      if(!disposed){button.disabled=false;button.setAttribute('aria-busy','false');}
    }
  });
  // Native showModal()/close() changes inertness across the complete host DOM.
  // In long chats this alone can block Chromium for seconds. A top-layer
  // popover keeps the same backdrop without touching every background node.
  // Contain pointer, focus, Tab, Escape and scrolling explicitly instead.
  function present(){
    if(dialog.matches(':popover-open'))return;
    dialog.removeAttribute('open');dialog.showPopover();dialog.setAttribute('open','');
    $('locale').focus({preventScroll:true});
  }
  function conceal(){
    if(dialog.matches(':popover-open'))dialog.hidePopover();dialog.removeAttribute('open');
  }
  function close(){currencyPicker?.close?.(false);languagePicker.close(false);closeYear(false);conceal();$('tip').hidden=true;opener?.focus({preventScroll:true});}
  $('close').addEventListener('click',close);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
  const contentKey=data=>JSON.stringify([{...data,updatedAt:undefined},language.language,themeSignature()]);
  const within=event=>event.composedPath().includes(dialog);
  function containFocus(event){if(!disposed&&dialog.open&&!within(event)){$('locale').focus({preventScroll:true});}}
  function containKeys(event){
    if(disposed||!dialog.open)return;
    if(event.key==='Escape'){
      event.preventDefault();event.stopImmediatePropagation();
      if($('year-menu').matches(':popover-open'))closeYear();else close();return;
    }
    if(event.key!=='Tab')return;
    // The year menu retains its own Tab dismissal; focus stays in the dialog.
    if($('year-menu').matches(':popover-open'))closeYear(false);
    const controls=[...view.querySelectorAll('button,input,select,a[href],[tabindex]')].filter(n=>n.tabIndex>=0&&!n.disabled&&n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');
    if(!controls.length){event.preventDefault();return;}
    const index=controls.indexOf(view.activeElement);
    if(index<0||event.shiftKey&&index===0||!event.shiftKey&&index===controls.length-1){
      event.preventDefault();event.stopImmediatePropagation();(event.shiftKey?controls.at(-1):controls[0]).focus({preventScroll:true});
    }
  }
  function containScroll(event){if(!disposed&&dialog.open&&!within(event))event.preventDefault();}
  function containPointer(event){
    if(disposed||!dialog.open)return;
    const r=dialog.getBoundingClientRect();
    const backdropHit=event.composedPath()[0]===dialog;
    if(!within(event)||backdropHit&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)){event.preventDefault();event.stopImmediatePropagation();if(event.type==='click')close();}
  }
  document.addEventListener('focusin',containFocus,true);document.addEventListener('keydown',containKeys,true);
  document.addEventListener('wheel',containScroll,{capture:true,passive:false});document.addEventListener('touchmove',containScroll,{capture:true,passive:false});
  for(const type of ['pointerdown','mousedown','click'])document.addEventListener(type,containPointer,true);
  // CSS surfaces update immediately; JS model colors must follow in the same
  // theme change, rather than waiting for the next metrics poll.
  const themeObserver=new MutationObserver(()=>{if(!disposed&&value&&dialog.open){const key=contentKey(value);if(key!==lastKey){lastKey=key;render();}}});
  if(root.host)themeObserver.observe(root.host,{attributes:true,attributeFilter:['data-pulse-theme','style']});
  
  const CURRENCY_LIST=[['MYR','RM',4.45,'马币 (MYR)','Malaysian Ringgit (MYR)','馬幣 (MYR)'],['USD','$',1.0,'美元 (USD)','US Dollar (USD)','美元 (USD)'],['CNY','¥',7.25,'人民币 (CNY)','Chinese Yuan (CNY)','人民幣 (CNY)'],['EUR','€',0.95,'欧元 (EUR)','Euro (EUR)','歐元 (EUR)'],['HKD','HK$',7.78,'港币 (HKD)','Hong Kong Dollar (HKD)','港幣 (HKD)'],['TWD','NT$',32.5,'新台币 (TWD)','New Taiwan Dollar (TWD)','新台幣 (TWD)'],['JPY','JP¥',155.0,'日元 (JPY)','Japanese Yen (JPY)','日圓 (JPY)'],['GBP','£',0.79,'英镑 (GBP)','British Pound (GBP)','英鎊 (GBP)']];
  function mountCurrencyPicker({button,symbol,label,parent=dialog,onChange}){
    const doc=button.ownerDocument,menu=doc.createElement('div');
    menu.setAttribute('popover','manual');menu.setAttribute('role','menu');menu.dataset.currencyMenu='';
    menu.style.cssText='position:fixed;inset:auto;margin:0;padding:5px;min-width:190px;box-sizing:border-box;border:1px solid var(--pulse-border);border-radius:9px;background:var(--pulse-card,var(--pulse-background));color:var(--pulse-foreground);box-shadow:0 8px 24px var(--pulse-shadow);font:12px system-ui;z-index:2147483647';
    let current='MYR';try{const saved=localStorage.getItem('ag-pulse-currency');if(saved&&CURRENCY_LIST.some(([c])=>c===saved))current=saved;}catch{}
    const options=CURRENCY_LIST.map(([code,sym,rate,cnName,enName,twName])=>{
      const item=doc.createElement('button');item.type='button';item.dataset.currency=code;item.setAttribute('role','menuitemradio');
      item.style.cssText='display:flex;align-items:center;justify-content:space-between;width:100%;min-height:30px;padding:6px 10px;border:0;border-radius:5px;text-align:left;font:inherit;color:inherit;background:transparent;cursor:pointer;box-sizing:border-box';
      const left=doc.createElement('span');left.style.cssText='display:flex;align-items:center;gap:6px';
      const s=doc.createElement('strong');s.textContent=sym;s.style.cssText='min-width:26px;display:inline-block';
      const n=doc.createElement('span');n.textContent=w(cnName,enName,twName);left.append(s,n);
      const check=doc.createElement('span');check.textContent='✓';check.className='cur-check';check.style.cssText='color:var(--pulse-accent);font-weight:bold;margin-left:8px';
      item.append(left,check);item._nameEl=n;item._names=[cnName,enName,twName];
      item.addEventListener('click',()=>{current=code;try{localStorage.setItem('ag-pulse-currency',code);}catch{}close();update();onChange?.(code,sym,rate);});
      item.addEventListener('focus',()=>item.style.background='var(--pulse-hover)');item.addEventListener('blur',()=>update());
      item.addEventListener('mouseenter',()=>item.style.background='var(--pulse-hover)');item.addEventListener('mouseleave',()=>{item.style.background=item.dataset.currency===current?'var(--pulse-selected,var(--pulse-hover))':'transparent';});
      menu.append(item);return item;
    });
    parent.append(menu);button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');
    const isOpen=()=>menu.matches(':popover-open');
    function close(restore=true){if(isOpen())menu.hidePopover();button.setAttribute('aria-expanded','false');if(restore)button.focus({preventScroll:true});}
    function position(){if(!isOpen())return;const r=button.getBoundingClientRect(),m=menu.getBoundingClientRect(),win=doc.defaultView;menu.style.left=Math.max(6,Math.min(r.right-m.width,win.innerWidth-m.width-6))+'px';menu.style.top=(r.bottom+m.height+6<win.innerHeight?r.bottom+5:Math.max(6,r.top-m.height-5))+'px';}
    function update(){
      const cur=CURRENCY_LIST.find(([c])=>c===current)||CURRENCY_LIST[0];const curName=w(cur[3],cur[4],cur[5]);if(symbol)symbol.textContent=cur[1];if(label)label.textContent=cur[0];
      button.setAttribute('aria-label',`${w('货币','Currency','貨幣')}: ${cur[0]}`);button.title=`${w('货币','Currency','貨幣')}: ${curName} (${w('点击切换货币','Click to switch currency','點擊切換貨幣')})`;
      for(const item of options){if(item._nameEl&&item._names)item._nameEl.textContent=w(item._names[0],item._names[1],item._names[2]);const selected=item.dataset.currency===current;item.setAttribute('aria-checked',String(selected));item.style.background=selected?'var(--pulse-selected,var(--pulse-hover))':'transparent';const chk=item.querySelector('.cur-check');if(chk)chk.style.visibility=selected?'visible':'hidden';}
      position();
    }
    function open(){languagePicker?.close?.(false);update();menu.showPopover();button.setAttribute('aria-expanded','true');position();options.find(item=>item.dataset.currency===current)?.focus({preventScroll:true});}
    button.addEventListener('click',event=>{event.stopPropagation();isOpen()?close():open();});
    doc.addEventListener('pointerdown',event=>{if(!isOpen())return;const path=event.composedPath();if(!path.includes(button)&&!path.includes(menu))close(false);});
    doc.defaultView?.addEventListener('resize',position);
    update();
    return{get current(){return current;},get info(){return CURRENCY_LIST.find(([c])=>c===current)||CURRENCY_LIST[0];},update,close,isOpen};
  }
  const currencyPicker=mountCurrencyPicker({button:$('currency-btn'),symbol:$('currency-symbol'),label:$('currency-code'),parent:dialog,onChange:()=>{if(value)render();}});
  function costEst(toks){if(!Number.isFinite(toks)||toks<=0)return null;const usd=(toks/1000000)*0.15;const [code,sym,rate]=currencyPicker?currencyPicker.info:['MYR','RM',4.45];const val=usd*rate;const str=val<0.01?(val<0.001?'<0.01':val.toFixed(3)):val.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});return `≈ ${sym}${str}`;}
  const exportBtnEl = view.querySelector('#export-btn');
  if (exportBtnEl) {
    exportBtnEl.addEventListener('click', () => {
      const data = window.__lastUsageExportData;
      if (!data) return;
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `antigravity-usage-${data.today || 'export'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  } // export-btn-bound


  let selectedProjectKey = null;
  function renderProjects() {
    try {
      const pData = value?.projects;
      const projContainer = $('project');
      if (!projContainer) return;

      if (!pData || !pData.allProjects || pData.allProjects.length === 0) {
        const hero = projContainer.querySelector('.proj-hero');
        if (hero) hero.hidden = true;
        for (const card of projContainer.querySelectorAll('.proj-card')) card.hidden = true;
        let waitEl = projContainer.querySelector('.proj-waiting');
        if (!waitEl) {
          waitEl = node('div', 'usage-waiting proj-waiting', w('正在读取项目数据…', 'Loading project data…', '正在讀取專案資料…'));
          projContainer.append(waitEl);
        }
        waitEl.hidden = false;
        return;
      }

      const waitEl = projContainer.querySelector('.proj-waiting');
      if (waitEl) waitEl.hidden = true;
      const hero = projContainer.querySelector('.proj-hero');
      if (hero) hero.hidden = false;
      for (const card of projContainer.querySelectorAll('.proj-card')) card.hidden = false;

      const activeProj = (selectedProjectKey ? pData.allProjects.find(p => p.key === selectedProjectKey) : null) || pData.currentProject || pData.allProjects[0];
      if (!activeProj) return;

      // 1. Hero banner
      const isCurrent = Boolean(activeProj.isCurrent);
      text('proj-hero-tag', isCurrent ? w('当前项目', 'This Project', '目前專案') : w('已选项目', 'Selected Project', '已選專案'));
      text('proj-hero-rank', `#${activeProj.rank} / ${pData.totalProjects} ${w('项目', 'projects', '專案')}`);
      text('proj-hero-title', activeProj.name);
      const pathEl = $('proj-hero-path') || projContainer.querySelector('#proj-hero-path');
      if (pathEl) {
        pathEl.textContent = activeProj.path;
        pathEl.title = `${w('点击复制路径', 'Click to copy path', '點擊複製路徑')}: ${activeProj.path}`;
        pathEl.onclick = () => {
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(activeProj.path).catch(()=>{});
            const prev = pathEl.textContent;
            pathEl.textContent = w('✓ 路径已复制到剪贴板', '✓ Path copied to clipboard', '✓ 路徑已複製到剪貼簿');
            setTimeout(() => { pathEl.textContent = prev; }, 1400);
          }
        };
      }

      text('proj-hero-total-label', w('全机总用量占比', 'Share of Total', '全機總用量佔比'));
      const totalValEl = $('proj-hero-total-val') || projContainer.querySelector('#proj-hero-total-val');
      if (totalValEl) totalValEl.textContent = activeProj.share + '%';
      const cost = costEst(activeProj.totalTokens);
      text('proj-hero-total-cost', `${w('项目总计', 'Project Total', '專案總計')} ${compact(activeProj.totalTokens)} Token${cost ? ' · ' + cost : ''}`);

      // 2. Aggregate active days
      let activeDays = [];
      if (Array.isArray(activeProj.dailyList) && activeProj.dailyList.length > 0) {
        activeDays = [...activeProj.dailyList].sort((a, b) => b.date.localeCompare(a.date));
      } else {
        const dayMap = new Map();
        for (const c of (activeProj.conversationList || [])) {
          const d = c.date || 'Unknown';
          if (!dayMap.has(d)) {
            dayMap.set(d, {
              date: d,
              totalTokens: 0,
              uncached: 0,
              cache: 0,
              output: 0,
              requests: 0,
              chats: 0,
              conversations: []
            });
          }
          const entry = dayMap.get(d);
          entry.totalTokens += c.totalTokens || 0;
          entry.uncached += c.uncached || 0;
          entry.cache += c.cache || 0;
          entry.output += c.output || 0;
          entry.requests += c.requests || 0;
          entry.chats += 1;
          entry.conversations.push(c);
        }
        activeDays = Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date));
      }
      const startDate = activeProj.firstDate || (activeDays.length > 0 ? activeDays[activeDays.length - 1].date : '—');
      const latestDate = activeProj.lastDate || (activeDays.length > 0 ? activeDays[0].date : '—');

      text('proj-timeline-title', w(`【${activeProj.name}】活跃日期与历史记录`, `Active Dates & History for [${activeProj.name}]`, `【${activeProj.name}】活躍日期與歷史記錄`));
      text('proj-timeline-sub', w(`始于 ${startDate} · 最近活跃 ${latestDate} · 共 ${activeDays.length} 天活跃 · ${activeProj.conversations} 个会话`, `Started ${startDate} · Last active ${latestDate} · ${activeDays.length} active days · ${activeProj.conversations} chats`, `始於 ${startDate} · 最近活躍 ${latestDate} · 共 ${activeDays.length} 天活躍 · ${activeProj.conversations} 個對話`));
      text('proj-timeline-badge', `${activeDays.length} ${w('天活跃', 'active days', '天活躍')}`);

      const daysList = $('proj-active-days-list') || projContainer.querySelector('#proj-active-days-list') || projContainer.querySelector('.proj-active-days-list');
      if (daysList) {
        daysList.replaceChildren();
        if (activeDays.length === 0) {
          daysList.append(node('div', 'muted', w('暂无活跃日期记录', 'No active date records', '暫無活躍日期記錄')));
        } else {
          for (const day of activeDays) {
            const item = node('div', 'proj-day-item');
            const left = node('div', 'proj-day-left');
            const isToday = day.date === value.today;
            const isStarted = day.date === startDate;

            const dateEl = node('div', 'proj-day-date');
            const dot = node('i', 'proj-day-dot' + (isToday ? ' today' : ''));
            dateEl.append(dot, node('span', '', day.date));
            if (isToday) {
              const badge = node('span', 'proj-day-badge today', w('今日活跃', 'Today', '今日活躍'));
              dateEl.append(badge);
            } else if (isStarted) {
              const badge = node('span', 'proj-day-badge started', w('项目创建 / 首次活跃', 'Project Started', '專案建立 / 首次活躍'));
              dateEl.append(badge);
            }

            const chips = node('div', 'proj-day-chips');
            const hitRate = (day.cache + day.uncached > 0) ? ((day.cache / (day.cache + day.uncached)) * 100).toFixed(1) + '%' : '0%';
            chips.append(
              node('span', 'proj-day-chip', `${w('未缓存输入', 'Input', '未快取輸入')} ${compact(day.uncached)}`),
              node('span', 'proj-day-chip', `${w('缓存读取', 'Cache', '快取讀取')} ${compact(day.cache)} (${hitRate})`),
              node('span', 'proj-day-chip', `${w('输出', 'Output', '輸出')} ${compact(day.output)}`),
              node('span', 'proj-day-chip', `${day.requests.toLocaleString('en-US')} ${w('次请求', 'reqs', '次請求')}`),
              node('span', 'proj-day-chip', `${day.chats} ${w('个会话', 'chats', '個對話')}`)
            );

            const leftWrap = node('div', '');
            leftWrap.append(dateEl, chips);
            left.append(leftWrap);

            const right = node('div', 'proj-day-right');
            const toksEl = node('div', 'proj-day-toks', compact(day.totalTokens) + ' ');
            toksEl.append(node('span', 'unit', 'Token'));
            const dayCost = costEst(day.totalTokens);
            const shareOfDay = activeProj.totalTokens ? ((day.totalTokens / activeProj.totalTokens) * 100).toFixed(1) + '%' : '0%';
            const costEl = node('div', 'proj-day-cost', `${dayCost ? dayCost + ' · ' : ''}${w('占项目', 'Share', '佔專案')} ${shareOfDay}`);
            right.append(toksEl, costEl);

            item.style.cursor = 'pointer';
            item.title = w(`点击查看【${day.date}】的未缓存/缓存/输出明细`, `Click to view breakdown for [${day.date}]`, `點擊查看【${day.date}】的未快取/快取/輸出細節`);
            item.onclick = () => {
              activeTotalScope = 'custom';
              activeCustomBucket = {
                from: day.date,
                to: day.date,
                total: day.totalTokens,
                requests: day.requests,
                chats: day.chats,
                models: {
                  day: {
                    uncached: day.uncached,
                    cacheRead: day.cache,
                    cacheWrite: 0,
                    output: day.output
                  }
                }
              };
              renderTotals();
            };

            item.append(left, right);
            daysList.append(item);
          }
        }
      }

    } catch (err) {
      console.error('[Antigravity Usage] Error in renderProjects:', err);
    }
  }

  function renderRanking() {
    if (!value || !value.projects) return;
    const pData = value.projects;
    const activeProj = (selectedProjectKey ? pData.allProjects.find(p => p.key === selectedProjectKey) : null) || pData.currentProject || pData.allProjects[0];
    try {
      text('proj-all-title', w('全部项目用量排行榜', 'All Projects Token Ranking', '全部專案用量排行榜'));
      text('proj-all-sub', w('点击任意项目可直接切换查看其专属明细与历史', 'Click any project to switch and view its details & history', '點擊任意專案可直接切換查看其專屬明細與歷程'));
      text('proj-count-badge', `${pData.totalProjects} ${w('个项目', 'projects', '個專案')} · ${compact(pData.totalTokens)} Token`);

      const rankingList = $('proj-ranking-list');
      if (rankingList) {
        rankingList.replaceChildren();
        for (const p of pData.allProjects) {
          const isSelected = activeProj && p.key === activeProj.key;
          const row = node('div', 'proj-rank-row' + (isSelected ? ' active-proj' : ''));
          row.title = w(`点击切换查看【${p.name}】的明细与历史`, `Click to switch to [${p.name}] details & history`, `點擊切換查看【${p.name}】的明細與歷程`);
          row.onclick = () => {
            selectedProjectKey = p.key;
            changeTab('project');
          };

          const left = node('div', 'proj-rank-left');
          const num = node('div', 'proj-rank-num', `#${p.rank}`);
          const meta = node('div', 'proj-rank-meta');
          const nameEl = node('div', 'proj-rank-name', p.name);
          if (p.isCurrent) {
            const curBadge = node('span', 'proj-badge-current', w('当前', 'Current', '目前'));
            nameEl.append(curBadge);
          }

          // Compute start, latest, and active days count for project p
          const pFallbackDates = (p.dailyList && p.dailyList.length > 0 ? p.dailyList : (p.conversationList || [])).map(c => c.date).filter(Boolean).sort();
          const pStart = p.firstDate || (pFallbackDates.length > 0 ? pFallbackDates[0] : '—');
          const pLatest = p.lastDate || (pFallbackDates.length > 0 ? pFallbackDates[pFallbackDates.length - 1] : '—');
          const uniqueDays = Number.isFinite(p.activeDays) && p.activeDays > 0 ? p.activeDays : new Set(pFallbackDates).size;
          const timelineText = node('div', 'proj-rank-timeline', `${w('始于', 'Started', '始於')} ${pStart} · ${w('最近', 'Latest', '最近')} ${pLatest} · ${uniqueDays} ${w('天活跃', 'active days', '天活躍')} · ${p.conversations} ${w('个会话', 'chats', '個對話')}`);
          meta.append(nameEl, timelineText);
          left.append(num, meta);

          const right = node('div', 'proj-rank-right');
          const shareWrap = node('div', 'proj-rank-share-wrap');
          const bar = node('div', 'proj-rank-bar');
          const fill = node('div', 'proj-rank-fill');
          fill.style.width = Math.max(1, Math.min(100, Number(p.share))) + '%';
          bar.append(fill);
          const shareText = node('span', 'proj-rank-share-text', p.share + '%');
          shareWrap.append(bar, shareText);

          const toksWrap = node('div', '');
          const toks = node('div', 'proj-rank-toks', compact(p.totalTokens) + ' ');
          toks.append(node('span', 'unit', 'Token'));
          const pCost = costEst(p.totalTokens);
          const costEl = node('div', 'proj-rank-cost', pCost || '—');
          toksWrap.append(toks, costEl);

          right.append(shareWrap, toksWrap);
          row.append(left, right);
          rankingList.append(row);
        }
      }
    } catch (err) {
      console.error('[Antigravity Usage] Error in renderRanking:', err);
    }
  }

  return {open(data,trigger){if(!data||disposed)return;accountKey=data.accountKey;value=data;opener=trigger;year||=data.today.slice(0,4);anchor||=data.today;lastKey=contentKey(data);render();present();},
    update(data){if(disposed)return;if(!data){if(!value)return;value=null;lastKey='';if(dialog.open)render();return;}if(accountKey&&accountKey!==data.accountKey){selected=null;disabledModels.clear();year=data.today.slice(0,4);anchor=data.today;}accountKey=data.accountKey;value=data;if(!dialog.open)return;const key=contentKey(data);if(key===lastKey)return;lastKey=key;render();},
    restoreModal(){if(!disposed&&dialog.open&&dialog.isConnected&&!dialog.matches(':popover-open')){closeYear(false);present();}},
    close,syncGuideDismissed(){if(!replayGuide)dismissGuide();},dispose(){disposed=true;languagePicker.dispose();themeObserver.disconnect();clearTimeout(refreshDelay);finishRefresh?.();refreshMotion?.cancel();closeYear(false);window.removeEventListener('resize',positionYear);document.removeEventListener('focusin',containFocus,true);document.removeEventListener('keydown',containKeys,true);document.removeEventListener('wheel',containScroll,true);document.removeEventListener('touchmove',containScroll,true);for(const type of ['pointerdown','mousedown','click'])document.removeEventListener(type,containPointer,true);conceal();dialog.remove();backdrop.remove();},get isOpen(){return dialog.open;}};
};
