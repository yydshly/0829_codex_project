param(
  [Parameter(Mandatory = $true)]
  [string]$OutputPath,
  [string]$ProcessName = "llm-wiki"
)

Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class LlmWikiWindowCapture {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }

  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);
}
'@

$appProcess = Get-Process $ProcessName | Select-Object -First 1
if (-not $appProcess -or $appProcess.MainWindowHandle -eq 0) {
  throw "No visible $ProcessName window was found."
}

$windowHandle = [IntPtr]$appProcess.MainWindowHandle
[LlmWikiWindowCapture]::SetForegroundWindow($windowHandle) | Out-Null
Start-Sleep -Milliseconds 500

$bounds = New-Object LlmWikiWindowCapture+RECT
[LlmWikiWindowCapture]::GetWindowRect($windowHandle, [ref]$bounds) | Out-Null
$width = $bounds.Right - $bounds.Left
$height = $bounds.Bottom - $bounds.Top

$image = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($image)
$graphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $image.Size)
$image.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$image.Dispose()

Write-Output "PATH=$OutputPath"
Write-Output "BOUNDS=$($bounds.Left),$($bounds.Top),$width,$height"
