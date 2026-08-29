param(
  [Parameter(Mandatory = $true)]
  [int]$X,
  [Parameter(Mandatory = $true)]
  [int]$Y
)

Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class LlmWikiNativeInput {
  [DllImport("user32.dll")]
  public static extern bool SetCursorPos(int x, int y);

  [DllImport("user32.dll")]
  public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extraInfo);
}
'@

[LlmWikiNativeInput]::SetCursorPos($X, $Y) | Out-Null
[LlmWikiNativeInput]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
[LlmWikiNativeInput]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 300
