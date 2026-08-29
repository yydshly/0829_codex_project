param(
    [string]$ConfigPath = "",
    [switch]$ReuseMiniMaxAudio
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$workspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
    $ConfigPath = Join-Path $projectRoot "config\minimax.local.json"
}
if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
    throw "MiniMax config not found: $ConfigPath. Copy config/minimax.example.json to config/minimax.local.json and fill in api_key."
}

$resolvedConfigPath = (Resolve-Path -LiteralPath $ConfigPath).Path
$config = Get-Content -LiteralPath $resolvedConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$apiKey = [string]$config.api_key
if ([string]::IsNullOrWhiteSpace($apiKey) -or $apiKey -eq "replace-with-your-minimax-api-key") {
    throw "Set api_key in $resolvedConfigPath before building."
}

$miniMaxApiHost = if ([string]::IsNullOrWhiteSpace([string]$config.api_host)) { "https://api.minimaxi.com" } else { [string]$config.api_host }
$miniMaxModel = if ([string]::IsNullOrWhiteSpace([string]$config.model)) { "speech-2.8-hd" } else { [string]$config.model }
$miniMaxVoiceId = if ([string]::IsNullOrWhiteSpace([string]$config.voice_id)) { "Chinese (Mandarin)_News_Anchor" } else { [string]$config.voice_id }
$miniMaxSpeed = if ($null -eq $config.speed) { 1.08 } else { [double]$config.speed }
if ($miniMaxSpeed -lt 0.5 -or $miniMaxSpeed -gt 2.0) {
    throw "MiniMax speed must be between 0.5 and 2.0."
}

try {
    $env:MINIMAX_API_KEY = $apiKey
    Write-Host "Using MiniMax config: $resolvedConfigPath"
    Write-Host "Model: $miniMaxModel | Voice: $miniMaxVoiceId | Speed: $miniMaxSpeed"
    & (Join-Path $PSScriptRoot "build_final_video.ps1") `
        -TtsProvider MiniMax `
        -MiniMaxApiHost $miniMaxApiHost `
        -MiniMaxModel $miniMaxModel `
        -MiniMaxVoiceId $miniMaxVoiceId `
        -MiniMaxSpeed $miniMaxSpeed `
        -ReuseMiniMaxAudio:$ReuseMiniMaxAudio
    if (-not $?) {
        throw "MiniMax video build failed"
    }

    & python (Join-Path $projectRoot "tests\audit.py")
    if ($LASTEXITCODE -ne 0) {
        throw "Media audit failed after the MiniMax build"
    }
    & python (Join-Path $workspaceRoot "scripts\build_site.py")
    if ($LASTEXITCODE -ne 0) {
        throw "Static site rebuild failed after the MiniMax build"
    }
    Write-Host "MiniMax version is ready. Refresh the browser to play it."
}
finally {
    Remove-Item Env:\MINIMAX_API_KEY -ErrorAction SilentlyContinue
    $apiKey = $null
    $config = $null
}
