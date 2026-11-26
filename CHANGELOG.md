# Changelog

## [v1.2.3] - 2026-11-26

### 🐛 Bug Fixes / 问题修复
- **Fix False "Action Needed" Alert While Thinking (修复模型思考时误触发 Action Needed 提醒)** (`sidecars/panel/main.mjs`):
  - **Status Enum Correction (修正底层步骤状态枚举映射)**: 修正了底层 Protobuf 步骤状态枚举的识别逻辑。Antigravity 中 `status = 8` 为 `CORTEX_STEP_STATUS_GENERATING`（模型正在思考/流式生成中），而 `status = 9` 才是 `CORTEX_STEP_STATUS_WAITING`（等待用户确认/回答）。
  - **No False Alerts (消除误报)**: 修正后，模型在深度思考或输出时保持正常的绿色 `Running` 状态，仅在真正需要用户操作（等待权限批准、回答提问或确认计划）时才会呈现琥珀金 `Action Needed`。

---

## [v1.2.2] - 2026-11-26

### ✨ New Features / 新增功能
- **Action Needed Status & Alert (等待用户操作状态与视觉提醒)** (`sidecars/panel/main.mjs`, `windows/floating-bar.ps1`):
  - **Accurate Waiting State Detection (精准检测任务等待状态)**: 通过只读读取本地 SQLite 对话数据库中的步骤状态（`status = 8` 为 `CORTEX_STEP_STATUS_WAITING`），精准识别智能体正在等待用户输入、确认工具权限、回答提问或确认计划。
  - **Action Needed Visual Style (琥珀金专属提醒视觉)**: 当任务处于等待状态时，胶囊与系统托盘图标即时切换为琥珀金提醒色（`#F59E0B` / `#FEF08A`），文字显示为 `Action Needed`，边缘呼吸光效柔和跳动，提醒用户及时响应。
  - **Auto-Expand on Waiting (贴边收起状态下自动提醒)**: 若悬浮窗处于屏幕边缘收起状态，一旦出现 `Action Needed`，把手小圆点亮起醒目金光；点击展开即可一目了然。
  - **Ghost Running Elimination (彻底消除已结束任务残留 Running 假象)**: 智能过滤已完成对话步骤（`status 3, 4, 7`），彻底解决任务跑完后悬浮窗仍偶现卡在 Running 状态的问题。

---

## [v1.2.1] - 2026-11-26

### 🐛 Bug Fixes / 问题修复
- **Fix In-App Update Checker (修复插件内检查更新报错)** (`sidecars/panel/updater.mjs`, `compat/update-worker.py`):
  - 修复了 `updater.mjs` 在执行更新检查时传参格式不匹配导致 `update-worker.py` 报 `--target` 缺失、UI 提示 `Installation could not be confirmed. Check for updates again.` 的问题。
  - 为 `update-worker.py` 的 CLI 参数解析增加向后容错机制，默认自动推导插件安装根目录，确保检查与更新流程 100% 顺畅。

---

## [v1.2.0] - 2026-11-26

### ✨ New Features / 新增功能
- **Desktop Edge Docking & Auto-Collapse (桌面边缘自动吸附收起与点击唤出)** (`windows/floating-bar.ps1`):
  - **Edge Dock Detection (智能边缘吸附判定)**: 拖拽悬浮窗至屏幕工作区右侧、左侧或顶部边缘（<= 30px）松手时，自动贴边吸附并收起为极窄小把手（仅 22px 宽），不占用屏幕工作视野。
  - **Click to Expand / Retract (点击唤出与再次点击收起)**: 鼠标点击贴边小把手，悬浮窗立即向内平滑展开为完整胶囊；再次点击胶囊可立即重新收缩回边缘。
  - **Edge Tab Status Indicator (贴边把手状态指示)**: 收起状态下把手表面实时保留状态核心点、5 小时额度预警色（绿/黄/橙/红）、运行呼吸动态微光以及展开方向指引箭头（`‹` / `›` / `ˇ`）。
  - **Drag to Free-Float (拖离边缘恢复自由悬浮)**: 按住胶囊往屏幕中间拖拽脱离边缘，自动退出吸附收起模式，自由常驻在桌面任意位置。
  - **Context Menu Quick Dock (右键一键贴边)**: 右键菜单新增 `Dock to Edge / Collapse` 选项，支持一键将悬浮窗快速收起到最近边缘。
  - **Persistent Dock State (贴边状态持久化)**: 自动将 `DockEdge` 和 `IsDocked` 状态保存至配置文件，下次随 Antigravity 启动时自动恢复贴边状态。

---

## [v1.1.0] - 2026-11-25

### ✨ New Features / 新增功能
- **Windows Always-on-Top Floating Status Capsule** (`windows/floating-bar.ps1`):
  - **Custom Orbital-Spark Vector Logo**: Anti-aliased GDI+ logo used in both the floating capsule and the Windows System Tray icon.
  - **Per-Pixel Alpha Layered Window (`WS_EX_LAYERED` + `UpdateLayeredWindow`)**: Smooth, borderless dark-gradient pill with zero jagged edges or white fringe.
  - **5-Hour Quota Warning Ring**: Dynamically colors the halo around the logo based on remaining 5-hour quota (`>= 70%` Green, `< 70%` Yellow, `< 50%` Orange, `< 20%` Red).
  - **Multi-Task Dual-Row Timer**: Automatically expands upward into a 2-row layout (`Task 1  18s` / `Task 2  6s`) when 2+ tasks run concurrently.
  - **Smart Desktop Positioning**: Defaults to the bottom-right corner above the taskbar and strictly clamps within `Screen.WorkingArea` so it never overlaps the taskbar.
  - **Antigravity Lifecycle Sync**: Launches automatically with Antigravity and exits cleanly when Antigravity closes.

### 🐛 Bug Fixes / 问题修复
- Fixed `main.mjs` reading `base.groups` (instead of `base.quota`) so `quota5hPercent` is accurately exported to `live-status.json`.
- Fixed stale `RUNNING` state sticking after a task finishes by prioritizing live `store.summaries` over cached single-session status.
- Fixed PowerShell `Nullable<Color>` unboxing and 1-element array unwrapping issues that caused text truncation and missing quota ring colors.

---

## [v1.0.0] - 2026-11-25

- Initial release of **Antigravity Usage**: real-time session capsule, 4-tab project & usage analytics, multi-currency switcher (MYR default), 128MB memory budget hardening, persistent SQLite ledger, JSON export, and in-app GitHub release updater.
