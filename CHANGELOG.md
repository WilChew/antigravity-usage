# Changelog

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
