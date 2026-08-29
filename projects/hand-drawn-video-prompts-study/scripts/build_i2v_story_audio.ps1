param(
    [string]$ConfigPath = "",
    [string]$VoiceIdOverride = "",
    [Nullable[double]]$SpeedOverride = $null,
    [string]$Emotion = "",
    [switch]$ForceTts
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
    $ConfigPath = Join-Path $projectRoot "config\minimax.local.json"
}
if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
    throw "MiniMax config not found: $ConfigPath"
}

$config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$apiKey = [string]$config.api_key
if ([string]::IsNullOrWhiteSpace($apiKey) -or $apiKey -eq "replace-with-your-minimax-api-key") {
    throw "Set api_key in $ConfigPath before building."
}

$apiHost = if ([string]::IsNullOrWhiteSpace([string]$config.api_host)) { "https://api.minimaxi.com" } else { [string]$config.api_host }
$model = if ([string]::IsNullOrWhiteSpace([string]$config.model)) { "speech-2.8-hd" } else { [string]$config.model }
$voiceId = if (-not [string]::IsNullOrWhiteSpace($VoiceIdOverride)) {
    $VoiceIdOverride
}
elseif ([string]::IsNullOrWhiteSpace([string]$config.voice_id)) {
    "Chinese (Mandarin)_News_Anchor"
}
else {
    [string]$config.voice_id
}
$speed = if ($null -ne $SpeedOverride) {
    [double]$SpeedOverride
}
elseif ($null -eq $config.speed) {
    1.08
}
else {
    [double]$config.speed
}
if ($speed -lt 0.5 -or $speed -gt 2.0) {
    throw "MiniMax speed must be between 0.5 and 2.0."
}
$selectedEmotion = if (-not [string]::IsNullOrWhiteSpace($Emotion)) {
    $Emotion
}
elseif (-not [string]::IsNullOrWhiteSpace([string]$config.emotion)) {
    [string]$config.emotion
}
else {
    ""
}

$storyboardPath = Join-Path $projectRoot "data\i2v-agent-workflow-storyboard.json"
$storyboard = Get-Content -LiteralPath $storyboardPath -Raw -Encoding UTF8 | ConvertFrom-Json
$segmentRoot = Join-Path $projectRoot "media\i2v-agent-workflow-segments"
$voiceoverPath = Join-Path $projectRoot "media\i2v-agent-workflow-voiceover.m4a"
$demoVoiceoverPath = Join-Path $projectRoot "demo\assets\i2v-agent-workflow-voiceover.m4a"
$subtitlePath = Join-Path $projectRoot "media\i2v-agent-workflow.srt"
$demoSubtitlePath = Join-Path $projectRoot "demo\assets\i2v-agent-workflow.srt"
$metadataPath = Join-Path $projectRoot "demo\assets\i2v-agent-workflow-audio-build.json"
New-Item -ItemType Directory -Path $segmentRoot -Force | Out-Null

function Get-AudioDuration {
    param([Parameter(Mandatory = $true)][string]$Path)
    $value = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $Path
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($value)) {
        throw "Could not inspect audio duration: $Path"
    }
    return [double]::Parse($value.Trim(), [Globalization.CultureInfo]::InvariantCulture)
}

$segmentPaths = @()
$buildShots = @()
try {
    $env:MINIMAX_API_KEY = $apiKey
    foreach ($shot in $storyboard.shots) {
        $id = [string]$shot.id
        $rawPath = Join-Path $segmentRoot ("shot-{0}-raw.mp3" -f $id)
        $segmentPath = Join-Path $segmentRoot ("shot-{0}.m4a" -f $id)
        if ($ForceTts -or -not (Test-Path -LiteralPath $rawPath -PathType Leaf)) {
            Write-Host ("shot {0}: requesting MiniMax TTS" -f $id)
            $ttsArguments = @(
                (Join-Path $PSScriptRoot "minimax_tts.py"),
                "--text", ([string]$shot.narration),
                "--output", $rawPath,
                "--api-host", $apiHost,
                "--model", $model,
                "--voice-id", $voiceId,
                "--speed", ([string]$speed)
            )
            if (-not [string]::IsNullOrWhiteSpace($selectedEmotion)) {
                $ttsArguments += @("--emotion", $selectedEmotion)
            }
            & python @ttsArguments
            if ($LASTEXITCODE -ne 0) {
                throw "MiniMax TTS failed for shot $id"
            }
        }
        else {
            Write-Host ("shot {0}: reusing validated MiniMax source audio" -f $id)
        }

        $rawDuration = Get-AudioDuration -Path $rawPath
        $targetDuration = 6.0
        if ($rawDuration -gt $targetDuration) {
            $tempo = $rawDuration / $targetDuration
            if ($tempo -gt 2.0) {
                throw "Shot $id voiceover is too long to fit naturally ($rawDuration seconds)."
            }
            $filter = "atempo=$($tempo.ToString('0.000000', [Globalization.CultureInfo]::InvariantCulture)),apad,atrim=duration=6"
        }
        elseif ($rawDuration -ge 5.1) {
            $tempo = $rawDuration / $targetDuration
            $filter = "atempo=$($tempo.ToString('0.000000', [Globalization.CultureInfo]::InvariantCulture)),apad,atrim=duration=6"
        }
        else {
            $tempo = 1.0
            $filter = "apad,atrim=duration=6"
        }

        & ffmpeg -y -v error -i $rawPath -af $filter -ar 32000 -ac 1 -c:a aac -b:a 128k $segmentPath
        if ($LASTEXITCODE -ne 0) {
            throw "Could not normalize shot $id audio"
        }
        $fittedDuration = Get-AudioDuration -Path $segmentPath
        $segmentPaths += $segmentPath
        $buildShots += [ordered]@{
            id = $id
            raw_duration_seconds = [Math]::Round($rawDuration, 3)
            fitted_duration_seconds = [Math]::Round($fittedDuration, 3)
            tempo = [Math]::Round($tempo, 6)
            narration = [string]$shot.narration
        }
    }

    $ffmpegInputs = @()
    for ($index = 0; $index -lt $segmentPaths.Count; $index++) {
        $ffmpegInputs += @("-i", $segmentPaths[$index])
    }
    $labels = (0..($segmentPaths.Count - 1) | ForEach-Object { "[$($_):a]" }) -join ""
    # A simple gain increase would clip the MiniMax peaks. Dynamic loudness
    # normalization keeps delivery near online-video loudness while protecting
    # true peak. A -15 LUFS filter target measures near -16 LUFS after AAC.
    $filterComplex = "${labels}concat=n=$($segmentPaths.Count):v=0:a=1,atrim=duration=30,loudnorm=I=-15:TP=-1.5:LRA=11[outa]"
    & ffmpeg -y -v error @ffmpegInputs -filter_complex $filterComplex -map "[outa]" -ar 32000 -ac 1 -c:a aac -b:a 128k $voiceoverPath
    if ($LASTEXITCODE -ne 0) {
        throw "Could not concatenate the 30-second voiceover"
    }

    Copy-Item -LiteralPath $voiceoverPath -Destination $demoVoiceoverPath -Force
    Copy-Item -LiteralPath $subtitlePath -Destination $demoSubtitlePath -Force
    $finalDuration = Get-AudioDuration -Path $voiceoverPath
    $metadata = [ordered]@{
        generated_at = (Get-Date).ToString("yyyy-MM-dd")
        provider = "MiniMax"
        model = $model
        voice_id = $voiceId
        configured_speed = $speed
        emotion = if ([string]::IsNullOrWhiteSpace($selectedEmotion)) { $null } else { $selectedEmotion }
        loudness_filter_target_lufs = -15
        true_peak_target_dbtp = -1.5
        duration_seconds = [Math]::Round($finalDuration, 3)
        shots = $buildShots
    }
    [IO.File]::WriteAllText(
        $metadataPath,
        (($metadata | ConvertTo-Json -Depth 6) + [Environment]::NewLine),
        [Text.UTF8Encoding]::new($false)
    )
    Write-Host ("Ready: {0}" -f $voiceoverPath)
    Write-Host ("Duration: {0:N3}s" -f $finalDuration)
}
finally {
    Remove-Item Env:\MINIMAX_API_KEY -ErrorAction SilentlyContinue
    $apiKey = $null
    $config = $null
}
