# Changelog

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
