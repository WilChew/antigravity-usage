# Antigravity Usage - Custom-Painted Windows Floating Status Capsule & Vector Logo
# Zero external dependencies: anti-aliased .NET WinForms + GDI+ custom rendering.
$createdNew = $false
$script:singleMutex = New-Object System.Threading.Mutex($true, "Local\AntigravityUsageFloatingBar", [ref]$createdNew)
if (-not $createdNew) { exit 0 }

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

Add-Type -ReferencedAssemblies @("System.Windows.Forms", "System.Drawing") -TypeDefinition @"
using System;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows.Forms;
public class AgPulseWin32 {
    [DllImport("kernel32.dll")]
    public static extern IntPtr GetConsoleWindow();
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT { public int x; public int y; }
    [StructLayout(LayoutKind.Sequential)]
    public struct SIZE { public int cx; public int cy; }
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct BLENDFUNCTION {
        public byte BlendOp;
        public byte BlendFlags;
        public byte SourceConstantAlpha;
        public byte AlphaFormat;
    }

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr GetDC(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);
    [DllImport("gdi32.dll", SetLastError = true)]
    public static extern IntPtr CreateCompatibleDC(IntPtr hDC);
    [DllImport("gdi32.dll")]
    public static extern bool DeleteDC(IntPtr hdc);
    [DllImport("gdi32.dll")]
    public static extern IntPtr SelectObject(IntPtr hDC, IntPtr hObject);
    [DllImport("gdi32.dll")]
    public static extern bool DeleteObject(IntPtr hObject);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool UpdateLayeredWindow(
        IntPtr hwnd, IntPtr hdcDst, ref POINT pptDst, ref SIZE psize,
        IntPtr hdcSrc, ref POINT pptSrc, int crKey, ref BLENDFUNCTION pblend, int dwFlags);
}
public class AgCapsuleForm : Form {
    protected override CreateParams CreateParams {
        get {
            CreateParams cp = base.CreateParams;
            cp.ExStyle |= 0x80000; // WS_EX_LAYERED
            cp.ExStyle |= 0x80;    // WS_EX_TOOLWINDOW
            return cp;
        }
    }
    public AgCapsuleForm() {
        this.DoubleBuffered = true;
        this.AutoScaleMode = AutoScaleMode.None;
    }
    public void SetBitmap(Bitmap bitmap, byte opacity) {
        if (!this.IsHandleCreated || bitmap == null) return;
        IntPtr screenDc = AgPulseWin32.GetDC(IntPtr.Zero);
        IntPtr memDc = AgPulseWin32.CreateCompatibleDC(screenDc);
        IntPtr hBitmap = IntPtr.Zero;
        IntPtr oldBitmap = IntPtr.Zero;
        try {
            hBitmap = bitmap.GetHbitmap(Color.FromArgb(0));
            oldBitmap = AgPulseWin32.SelectObject(memDc, hBitmap);
            var size = new AgPulseWin32.SIZE { cx = bitmap.Width, cy = bitmap.Height };
            var src = new AgPulseWin32.POINT { x = 0, y = 0 };
            var dst = new AgPulseWin32.POINT { x = this.Left, y = this.Top };
            var blend = new AgPulseWin32.BLENDFUNCTION {
                BlendOp = 0, // AC_SRC_OVER
                BlendFlags = 0,
                SourceConstantAlpha = opacity,
                AlphaFormat = 1 // AC_SRC_ALPHA
            };
            AgPulseWin32.UpdateLayeredWindow(this.Handle, screenDc, ref dst, ref size, memDc, ref src, 0, ref blend, 2);
        } finally {
            AgPulseWin32.ReleaseDC(IntPtr.Zero, screenDc);
            if (hBitmap != IntPtr.Zero) {
                AgPulseWin32.SelectObject(memDc, oldBitmap);
                AgPulseWin32.DeleteObject(hBitmap);
            }
            AgPulseWin32.DeleteDC(memDc);
        }
    }
}
"@
$consolePtr = [AgPulseWin32]::GetConsoleWindow()
if ($consolePtr -ne [IntPtr]::Zero) { [AgPulseWin32]::ShowWindow($consolePtr, 0) | Out-Null }

$StatusFile  = Join-Path $env:USERPROFILE ".gemini\antigravity\sidecar_data\antigravity-pulse\panel\data\live-status.json"
$SidecarFile = Join-Path $env:USERPROFILE ".gemini\antigravity\sidecar_data\antigravity-pulse\panel\data\active-sidecar.json"
$ConfigFile  = Join-Path $env:USERPROFILE ".gemini\antigravity\sidecar_data\antigravity-pulse\panel\data\floating-bar-config.json"
$StartupReg = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$StartupName = "AntigravityUsageFloatingBar"

function Format-Compact([double]$n) {
    if ($n -ge 1e9) { return "{0:0.#}B" -f ($n / 1e9) }
    if ($n -ge 1e6) { return "{0:0.#}M" -f ($n / 1e6) }
    if ($n -ge 1e3) { return "{0:0.#}K" -f ($n / 1e3) }
    return [string][math]::Round($n)
}

function Format-CostMYR([double]$tokens) {
    if ($tokens -le 0) { return "RM0.00" }
    $rm = ($tokens / 1000000.0) * 0.15 * 4.45
    if ($rm -lt 0.01) { return "RM<0.01" }
    return "RM{0:N2}" -f $rm
}

function Format-Elapsed($sec) {
    if ($null -eq $sec -or $sec -le 0) { return "" }
    $s = [int][math]::Floor($sec)
    if ($s -lt 60) { return "${s}s" }
    $m = [int][math]::Floor($s / 60)
    $r = $s % 60
    return "${m}m${r}s"
}

$cfg = @{ X = -1; Y = -1; TopMost = $true }
if (Test-Path $ConfigFile) {
    try {
        $loaded = Get-Content $ConfigFile -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($null -ne $loaded.X) { $cfg.X = [int]$loaded.X }
        if ($null -ne $loaded.Y) { $cfg.Y = [int]$loaded.Y }
        if ($null -ne $loaded.TopMost) { $cfg.TopMost = [bool]$loaded.TopMost }
    } catch {}
}

function Save-Config {
    try {
        $dir = Split-Path $ConfigFile -Parent
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        $cfg | ConvertTo-Json | Set-Content -Path $ConfigFile -Encoding UTF8
    } catch {}
}

# Draw custom Antigravity Orbital-Spark vector logo onto any Graphics surface
function Draw-AntigravityLogo($g, [float]$cx, [float]$cy, [float]$size, [System.Drawing.Color]$accentColor, [float]$glowAlpha = 0.0, $ringOverride = $null) {
    $half = $size / 2.0

    # Soft status / quota halo around logo
    if ($null -ne $ringOverride) {
        $qCol = $ringOverride
        $qGlow = if ($glowAlpha -gt 0.01) { 0.75 + 0.25 * $glowAlpha } else { 1.0 }
        $aOuter = [int][math]::Min(255, 85 * $qGlow)
        $aInner = [int][math]::Min(255, 165 * $qGlow)
        $qHalo1 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($aOuter, $qCol.R, $qCol.G, $qCol.B))
        $qHalo2 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($aInner, $qCol.R, $qCol.G, $qCol.B))
        $g.FillEllipse($qHalo1, $cx - $half - 5.5, $cy - $half - 5.5, $size + 11, $size + 11)
        $g.FillEllipse($qHalo2, $cx - $half - 2.2, $cy - $half - 2.2, $size + 4.4, $size + 4.4)
        $qHalo1.Dispose(); $qHalo2.Dispose()
    } elseif ($glowAlpha -gt 0.01) {
        $a1 = [int][math]::Min(255, [math]::Max(0, 70 * $glowAlpha))
        $a2 = [int][math]::Min(255, [math]::Max(0, 28 * $glowAlpha))
        $halo1 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($a2, $accentColor.R, $accentColor.G, $accentColor.B))
        $halo2 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($a1, $accentColor.R, $accentColor.G, $accentColor.B))
        $g.FillEllipse($halo1, $cx - $half - 4, $cy - $half - 4, $size + 8, $size + 8)
        $g.FillEllipse($halo2, $cx - $half - 1.5, $cy - $half - 1.5, $size + 3, $size + 3)
        $halo1.Dispose(); $halo2.Dispose()
    }

    # Badge base
    $badgeRect = New-Object System.Drawing.RectangleF(($cx - $half), ($cy - $half), $size, $size)
    $badgeBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $badgeRect,
        [System.Drawing.Color]::FromArgb(255, 36, 44, 66),
        [System.Drawing.Color]::FromArgb(255, 18, 22, 34),
        45.0
    )
    $g.FillEllipse($badgeBrush, $badgeRect)
    $badgeBrush.Dispose()

    $outerRingColor = if ($null -ne $ringOverride) { $ringOverride } else { [System.Drawing.Color]::FromArgb(140, 129, 140, 248) }
    $outerRingWidth = if ($null -ne $ringOverride) { [math]::Max(2.0, $size * 0.10) } else { [math]::Max(1.0, $size * 0.06) }
    $ringPen = New-Object System.Drawing.Pen $outerRingColor, $outerRingWidth
    $g.DrawEllipse($ringPen, $badgeRect)
    $ringPen.Dispose()

    # Tilted orbital ellipse
    $state = $g.Save()
    $g.TranslateTransform($cx, $cy)
    $g.RotateTransform(-24.0)
    $orbitPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(215, 96, 165, 250)), ([math]::Max(1.1, $size * 0.08))
    $ow = $size * 0.78
    $oh = $size * 0.34
    $g.DrawEllipse($orbitPen, -$ow / 2.0, -$oh / 2.0, $ow, $oh)
    $orbitPen.Dispose()
    $g.Restore($state)

    # Rising anti-gravity delta / spark
    $p1 = New-Object System.Drawing.PointF($cx, ($cy - $size * 0.28))
    $p2 = New-Object System.Drawing.PointF(($cx + $size * 0.21), ($cy + $size * 0.22))
    $p3 = New-Object System.Drawing.PointF($cx, ($cy + $size * 0.09))
    $p4 = New-Object System.Drawing.PointF(($cx - $size * 0.21), ($cy + $size * 0.22))
    $deltaPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $deltaPath.AddPolygon([System.Drawing.PointF[]]@($p1, $p2, $p3, $p4))
    $deltaBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF($cx, ($cy - $size * 0.3))),
        (New-Object System.Drawing.PointF($cx, ($cy + $size * 0.25))),
        [System.Drawing.Color]::FromArgb(255, 240, 246, 255),
        [System.Drawing.Color]::FromArgb(255, 147, 197, 253)
    )
    $g.FillPath($deltaBrush, $deltaPath)
    $deltaBrush.Dispose()
    $deltaPath.Dispose()

    # Live status core dot on bottom-right orbit
    $dotR = [math]::Max(2.5, $size * 0.16)
    $dx = $cx + $size * 0.30
    $dy = $cy + $size * 0.26
    $dotBack = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 19, 28))
    $dotFill = New-Object System.Drawing.SolidBrush $accentColor
    $g.FillEllipse($dotBack, $dx - $dotR - 1, $dy - $dotR - 1, ($dotR + 1) * 2, ($dotR + 1) * 2)
    $g.FillEllipse($dotFill, $dx - $dotR, $dy - $dotR, $dotR * 2, $dotR * 2)
    $dotBack.Dispose(); $dotFill.Dispose()
}

function New-TrayLogoIcon([System.Drawing.Color]$accentColor) {
    $bmp = New-Object System.Drawing.Bitmap 32, 32
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)
    Draw-AntigravityLogo $g 15.5 15.5 27.0 $accentColor 0.0
    $g.Dispose()
    $hIcon = $bmp.GetHicon()
    return [System.Drawing.Icon]::FromHandle($hIcon)
}

$ColorRunning = [System.Drawing.Color]::FromArgb(255, 52, 211, 153)  # Emerald #34D399
$ColorIdle    = [System.Drawing.Color]::FromArgb(255, 96, 165, 250)  # Sky Blue #60A5FA
$ColorOffline = [System.Drawing.Color]::FromArgb(255, 148, 163, 184) # Slate #94A3B8

$IconRunning = New-TrayLogoIcon $ColorRunning
$IconIdle    = New-TrayLogoIcon $ColorIdle
$IconOffline = New-TrayLogoIcon $ColorOffline

# UI State
$script:statusState = "offline"
$script:statusText  = "Connecting..."
$script:accentColor = $ColorOffline
$script:quotaRingColor = $null
$script:quotaWarning   = $false
$script:pulsePhase  = 0.0

$form = New-Object AgCapsuleForm
$form.Text = "Antigravity Usage"
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$form.TopMost = $cfg.TopMost
$form.ShowInTaskbar = $false
$form.Height = 36
$form.Width = 148

$screen = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$edgeMargin = 16
if ($cfg.X -lt $screen.Left -or ($cfg.X + $form.Width) -gt $screen.Right) {
    $cfg.X = [int]($screen.Right - $form.Width - $edgeMargin)
}
if ($cfg.Y -lt $screen.Top -or ($cfg.Y + $form.Height) -gt $screen.Bottom) {
    $cfg.Y = [int]($screen.Bottom - $form.Height - $edgeMargin)
}
$form.Location = New-Object System.Drawing.Point($cfg.X, $cfg.Y)

function Clamp-ToWorkingArea() {
    $wa = [System.Windows.Forms.Screen]::FromControl($form).WorkingArea
    $pad = 8
    $minX = $wa.Left + $pad
    $maxX = [math]::Max($minX, $wa.Right - $form.Width - $pad)
    $minY = $wa.Top + $pad
    $maxY = [math]::Max($minY, $wa.Bottom - $form.Height - $pad)
    $nx = [math]::Min($maxX, [math]::Max($minX, $form.Left))
    $ny = [math]::Min($maxY, [math]::Max($minY, $form.Top))
    if ($nx -ne $form.Left -or $ny -ne $form.Top) {
        $form.Location = New-Object System.Drawing.Point([int]$nx, [int]$ny)
    }
}
Clamp-ToWorkingArea

$fontStatus = New-Object System.Drawing.Font("Segoe UI Semibold", 9.5, [System.Drawing.FontStyle]::Regular)
$fontTask   = New-Object System.Drawing.Font("Segoe UI Semibold", 8.5, [System.Drawing.FontStyle]::Regular)
[string[]]$script:statusLines = @("Free")

function Update-CapsuleWidth() {
    [string[]]$lines = @($script:statusLines)
    if ($lines.Count -eq 0) { [string[]]$lines = @([string]$script:statusText) }
    $isMulti = $lines.Count -ge 2
    $fontUse = if ($isMulti) { $fontTask } else { $fontStatus }

    $tmpBmp = New-Object System.Drawing.Bitmap(16, 16, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($tmpBmp)
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $sfM = New-Object System.Drawing.StringFormat
    $sfM.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap -bor [System.Drawing.StringFormatFlags]::NoClip
    $maxW = 0.0
    foreach ($ln in $lines) {
        $sz = $g.MeasureString($ln, $fontUse, 1000, $sfM)
        if ($sz.Width -gt $maxW) { $maxW = $sz.Width }
    }
    $sfM.Dispose()
    $g.Dispose()
    $tmpBmp.Dispose()

    $desiredW = [int][math]::Max(96, [math]::Min(220, [math]::Ceiling($maxW) + 58))
    $desiredH = if ($isMulti) { 48 } else { 36 }
    $sizeChanged = ([math]::Abs($form.Width - $desiredW) -gt 2) -or ($form.Height -ne $desiredH)
    if ($sizeChanged) {
        $oldW = $form.Width
        $oldH = $form.Height
        $wa = [System.Windows.Forms.Screen]::FromControl($form).WorkingArea
        $nearRight  = ($form.Left + ($oldW / 2)) -gt ($wa.Left + ($wa.Width / 2))
        $nearBottom = ($form.Top + ($oldH / 2)) -gt ($wa.Top + ($wa.Height / 2))
        $newX = if ($nearRight)  { $form.Left + ($oldW - $desiredW) } else { $form.Left }
        $newY = if ($nearBottom) { $form.Top  + ($oldH - $desiredH) } else { $form.Top }
        $form.SetBounds([int]$newX, [int]$newY, $desiredW, $desiredH)
        Clamp-ToWorkingArea
    }
    Render-Capsule
}

function Render-Capsule() {
    if (-not $form.IsHandleCreated) { return }
    $w = $form.Width
    $h = $form.Height
    if ($w -le 0 -or $h -le 0) { return }

    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Smooth anti-aliased pill path inset by 1px for crisp edges with zero white fringe
    $pillPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = [float]($h - 2)
    $pillPath.AddArc(1.0, 1.0, $d, $d, 180.0, 90.0)
    $pillPath.AddArc(([float]$w - $d - 1.0), 1.0, $d, $d, 270.0, 90.0)
    $pillPath.AddArc(([float]$w - $d - 1.0), ([float]$h - $d - 1.0), $d, $d, 0.0, 90.0)
    $pillPath.AddArc(1.0, ([float]$h - $d - 1.0), $d, $d, 90.0, 90.0)
    $pillPath.CloseFigure()

    # Rich dark gradient surface
    $bgRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $bgRect,
        [System.Drawing.Color]::FromArgb(245, 29, 34, 48),
        [System.Drawing.Color]::FromArgb(245, 16, 19, 28),
        90.0
    )
    $g.FillPath($bgBrush, $pillPath)
    $bgBrush.Dispose()

    # Subtle status / quota tint on left edge (logo side)
    $leftTintCol = if ($null -ne $script:quotaRingColor -and $script:quotaWarning) {
        $script:quotaRingColor
    } elseif ($script:statusState -eq "running") {
        [System.Drawing.Color]::FromArgb(255, 52, 211, 153)
    } else {
        $null
    }
    if ($null -ne $leftTintCol) {
        $g.SetClip($pillPath)
        $tintBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            (New-Object System.Drawing.Rectangle(0, 0, 100, $h)),
            [System.Drawing.Color]::FromArgb(46, $leftTintCol.R, $leftTintCol.G, $leftTintCol.B),
            [System.Drawing.Color]::FromArgb(0, $leftTintCol.R, $leftTintCol.G, $leftTintCol.B),
            0.0
        )
        $tintBrush.WrapMode = [System.Drawing.Drawing2D.WrapMode]::TileFlipXY
        $g.FillRectangle($tintBrush, 0, 0, 100, $h)
        $tintBrush.Dispose()
        $g.ResetClip()
    }

    # Subtle outer pill border
    $rimColor = if ($script:statusState -eq "running") {
        [System.Drawing.Color]::FromArgb(135, 52, 211, 153)
    } else {
        [System.Drawing.Color]::FromArgb(140, 71, 85, 105)
    }
    $rimPen = New-Object System.Drawing.Pen $rimColor, 1.0
    $g.DrawPath($rimPen, $pillPath)
    $rimPen.Dispose()
    $pillPath.Dispose()

    # Draw custom Antigravity Orbital-Spark logo on the left
    $glow = if ($script:statusState -eq "running") { 0.55 + 0.45 * [math]::Sin($script:pulsePhase) } else { 0.0 }
    Draw-AntigravityLogo $g 20.0 ($h / 2.0) 22.0 $script:accentColor $glow $script:quotaRingColor

    # Draw crisp status text
    $textColor = if ($script:statusState -eq "running") {
        [System.Drawing.Color]::FromArgb(255, 220, 252, 231)
    } elseif ($script:statusState -eq "idle") {
        [System.Drawing.Color]::FromArgb(255, 235, 241, 248)
    } else {
        [System.Drawing.Color]::FromArgb(255, 148, 163, 184)
    }
    $textBrush = New-Object System.Drawing.SolidBrush $textColor
    $sf = New-Object System.Drawing.StringFormat
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $sf.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap -bor [System.Drawing.StringFormatFlags]::NoClip
    $sf.Trimming = [System.Drawing.StringTrimming]::None
    [string[]]$lines = @($script:statusLines)
    if ($lines.Count -eq 0) { [string[]]$lines = @([string]$script:statusText) }
    if ($lines.Count -ge 2) {
        $topRect = New-Object System.Drawing.RectangleF(37, 5, ($w - 48), 19)
        $botRect = New-Object System.Drawing.RectangleF(37, 24, ($w - 48), 19)
        $g.DrawString($lines[0], $fontTask, $textBrush, $topRect, $sf)
        $g.DrawString($lines[1], $fontTask, $textBrush, $botRect, $sf)
    } else {
        $textRect = New-Object System.Drawing.RectangleF(37, 0, ($w - 48), $h)
        $g.DrawString($lines[0], $fontStatus, $textBrush, $textRect, $sf)
    }
    $textBrush.Dispose()
    $sf.Dispose()

    $form.SetBitmap($bmp, 248)
    $g.Dispose()
    $bmp.Dispose()
}

# Mouse interactions: drag to move, right-click for menu
$script:dragging = $false
$script:dragStart = New-Object System.Drawing.Point(0, 0)
$form.Cursor = [System.Windows.Forms.Cursors]::SizeAll

$form.Add_MouseDown({
    param($s, $e)
    if ($e.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $script:dragging = $true
        $script:dragStart = $e.Location
    } elseif ($e.Button -eq [System.Windows.Forms.MouseButtons]::Right) {
        $menu.Show([System.Windows.Forms.Cursor]::Position)
    }
})

$form.Add_MouseMove({
    param($s, $e)
    if ($script:dragging) {
        $form.Left += ($e.X - $script:dragStart.X)
        $form.Top  += ($e.Y - $script:dragStart.Y)
        Clamp-ToWorkingArea
    }
})

$form.Add_MouseUp({
    param($s, $e)
    if ($script:dragging) {
        $script:dragging = $false
        Clamp-ToWorkingArea
        $cfg.X = $form.Left
        $cfg.Y = $form.Top
        Save-Config
    }
})

# System Tray Icon & Context Menu
$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = $IconOffline
$tray.Text = "Antigravity Usage"
$tray.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip

$miToggle = $menu.Items.Add("Show / Hide Floating Bar")
$miToggle.Add_Click({
    if ($form.Visible) { $form.Hide() } else { $form.Show(); $form.BringToFront() }
})

$miTop = New-Object System.Windows.Forms.ToolStripMenuItem("Always on Top")
$miTop.CheckOnClick = $true
$miTop.Checked = $cfg.TopMost
$miTop.Add_Click({
    $form.TopMost = $miTop.Checked
    $cfg.TopMost = $miTop.Checked
    Save-Config
})
$menu.Items.Add($miTop) | Out-Null

$menu.Items.Add("-") | Out-Null

function Exit-FloatingBar() {
    if ($timer) { $timer.Stop() }
    if ($pulseTimer) { $pulseTimer.Stop() }
    if ($tray) {
        $tray.Visible = $false
        $tray.Dispose()
    }
    if ($script:singleMutex) {
        try { $script:singleMutex.ReleaseMutex() } catch {}
        try { $script:singleMutex.Dispose() } catch {}
    }
    $form.Close()
}

$miExit = $menu.Items.Add("Exit")
$miExit.Add_Click({ Exit-FloatingBar })

$tray.ContextMenuStrip = $menu
$tray.Add_MouseClick({
    param($s, $e)
    if ($e.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        if ($form.Visible) { $form.Hide() } else { $form.Show(); $form.BringToFront() }
    }
})

# Smooth breathing glow animation while running
$pulseTimer = New-Object System.Windows.Forms.Timer
$pulseTimer.Interval = 90
$pulseTimer.Add_Tick({
    if ($script:statusState -eq "running" -and $form.Visible) {
        $script:pulsePhase += 0.25
        if ($script:pulsePhase -gt 6.283) { $script:pulsePhase -= 6.283 }
        Render-Capsule
    }
})
$pulseTimer.Start()

# Live status polling timer (1s)
$script:wasRunning = $false
$script:sidecarMissingCount = 0
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 1000
$timer.Add_Tick({
    try {
        # Follow Antigravity lifecycle: exit automatically when Antigravity closes or plugin sidecar stops
        $agProcs = Get-Process -Name "Antigravity" -ErrorAction SilentlyContinue
        if (-not $agProcs) {
            Exit-FloatingBar
            return
        }
        if (Test-Path $SidecarFile) {
            try {
                $sc = Get-Content $SidecarFile -Raw -Encoding UTF8 | ConvertFrom-Json
                if ($null -ne $sc.pid -and [int]$sc.pid -gt 0) {
                    $scProc = Get-Process -Id ([int]$sc.pid) -ErrorAction SilentlyContinue
                    if ($scProc) {
                        $script:sidecarMissingCount = 0
                    } else {
                        $script:sidecarMissingCount++
                        if ($script:sidecarMissingCount -ge 6) {
                            Exit-FloatingBar
                            return
                        }
                    }
                }
            } catch {}
        }

        if (-not (Test-Path $StatusFile)) {
            $script:statusState = "offline"
            $script:statusText  = "Waiting..."
            [string[]]$script:statusLines = @("Waiting...")
            $script:accentColor = $ColorOffline
            $tray.Icon = $IconOffline
            Update-CapsuleWidth
            return
        }
        $raw = Get-Content $StatusFile -Raw -Encoding UTF8
        $data = $raw | ConvertFrom-Json
        $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $ageMs = $nowMs - [long]$data.updatedAt
        $isOffline = ($data.connection -ne 'live') -or ($ageMs -gt 30000)
        $runningCount = 0
        if ($null -ne $data.runningCount) { $runningCount = [int]$data.runningCount }
        elseif ([bool]$data.running) { $runningCount = 1 }
        $isRunning = (-not $isOffline) -and ($runningCount -gt 0)

        # 5-hour quota ring color around logo (>=70% green, <70% yellow, <50% orange, <20% red)
        $script:quotaRingColor = $null
$script:quotaWarning   = $false
        $script:quotaWarning = $false
        if ($null -ne $data.quota5hPercent) {
            $qPct = [double]$data.quota5hPercent
            if ($qPct -lt 20) {
                $script:quotaRingColor = [System.Drawing.Color]::FromArgb(255, 239, 68, 68)   # Red
                $script:quotaWarning = $true
            } elseif ($qPct -lt 50) {
                $script:quotaRingColor = [System.Drawing.Color]::FromArgb(255, 251, 146, 60)  # Orange
                $script:quotaWarning = $true
            } elseif ($qPct -lt 70) {
                $script:quotaRingColor = [System.Drawing.Color]::FromArgb(255, 250, 204, 21)  # Yellow
                $script:quotaWarning = $true
            } else {
                $script:quotaRingColor = [System.Drawing.Color]::FromArgb(255, 52, 211, 153)  # Green
            }
        }

        if ($isOffline) {
            $script:statusState = "offline"
            $script:accentColor = $ColorOffline
            $tray.Icon = $IconOffline
            $statusLabel = "Offline"
            [string[]]$script:statusLines = @("Offline")
        } elseif ($isRunning) {
            $script:statusState = "running"
            $script:accentColor = $ColorRunning
            $tray.Icon = $IconRunning
            $tasks = @()
            if ($null -ne $data.runningTasks) {
                $tasks = @($data.runningTasks)
            }
            if ($tasks.Count -ge 2) {
                $t1Sec = $tasks[0].elapsedSeconds
                if ($null -ne $tasks[0].startedAt -and [long]$tasks[0].startedAt -gt 0) {
                    $t1Sec = [math]::Max(0, [math]::Floor(($nowMs - [long]$tasks[0].startedAt) / 1000.0))
                }
                $t2Sec = $tasks[1].elapsedSeconds
                if ($null -ne $tasks[1].startedAt -and [long]$tasks[1].startedAt -gt 0) {
                    $t2Sec = [math]::Max(0, [math]::Floor(($nowMs - [long]$tasks[1].startedAt) / 1000.0))
                }
                $el1 = Format-Elapsed $t1Sec; if (-not $el1) { $el1 = "0s" }
                $el2 = Format-Elapsed $t2Sec; if (-not $el2) { $el2 = "0s" }
                $extra = if ($tasks.Count -gt 2) { " (+$($tasks.Count - 2))" } else { "" }
                $script:statusLines = @("Task 1  $el1", "Task 2  $el2$extra")
                $statusLabel = "$($tasks.Count) Running ($el1 / $el2)"
            } else {
                $elapsedSec = $data.elapsedSeconds
                if ($null -ne $data.runningStartedAt -and [long]$data.runningStartedAt -gt 0) {
                    $elapsedSec = [math]::Max(0, [math]::Floor(($nowMs - [long]$data.runningStartedAt) / 1000.0))
                }
                $el = Format-Elapsed $elapsedSec
                if (-not $el) { $el = "0s" }
                if ($runningCount -gt 1) {
                    $statusLabel = "$runningCount Running $el"
                } else {
                    $statusLabel = "Running $el"
                }
                [string[]]$script:statusLines = @($statusLabel)
            }
        } else {
            $script:statusState = "idle"
            $script:accentColor = $ColorIdle
            $tray.Icon = $IconIdle
            $statusLabel = "Free"
            [string[]]$script:statusLines = @("Free")
        }

        $script:statusText = $statusLabel
        Update-CapsuleWidth

        $tip = "Antigravity: $statusLabel"
        if ($data.project -and $data.project.name) { $tip += " | $($data.project.name)" }
        if ($tip.Length -gt 63) { $tip = $tip.Substring(0, 63) }
        $tray.Text = $tip
    } catch {}
})
$timer.Start()

$form.Add_Shown({
    $form.Visible = $true
    [AgPulseWin32]::ShowWindow($form.Handle, 4) | Out-Null
    [AgPulseWin32]::SetWindowPos($form.Handle, [IntPtr](-1), 0, 0, 0, 0, 0x0043) | Out-Null
    Update-CapsuleWidth
})
$form.Show()
[AgPulseWin32]::ShowWindow($form.Handle, 4) | Out-Null
[AgPulseWin32]::SetWindowPos($form.Handle, [IntPtr](-1), 0, 0, 0, 0, 0x0043) | Out-Null

[System.Windows.Forms.Application]::Run($form)
