param(
    [string]$SourceDirectory = ""
)

$ErrorActionPreference = "Stop"
$Project = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SourceRoot = if ([string]::IsNullOrWhiteSpace($SourceDirectory)) {
    Join-Path $Project "media\i2v-agent-workflow-paired-sources"
}
else {
    (Resolve-Path -LiteralPath $SourceDirectory).Path
}
$AssetRoot = Join-Path $Project "demo\assets"
$WorkRoot = Join-Path $Project "media\work\i2v-paired-final"
$VoiceoverPath = Join-Path $Project "media\i2v-agent-workflow-voiceover.m4a"
$SrtPath = Join-Path $Project "media\i2v-agent-workflow.srt"
$AssPath = Join-Path $Project "media\i2v-agent-workflow.ass"
$VideoOnlyPath = Join-Path $WorkRoot "i2v-agent-workflow-30s-video-only.mp4"
$FinalPath = Join-Path $AssetRoot "i2v-agent-workflow-30s-final.mp4"
$PosterPath = Join-Path $AssetRoot "i2v-agent-workflow-30s-poster.jpg"
$MetadataPath = Join-Path $AssetRoot "i2v-agent-workflow-30s-build.json"
$AudioMetadataPath = Join-Path $AssetRoot "i2v-agent-workflow-audio-build.json"
$ConcatPath = Join-Path $WorkRoot "segments.txt"
$Utf8 = New-Object System.Text.UTF8Encoding($false)

function Invoke-Ffmpeg {
    param([string[]]$Arguments)
    & ffmpeg -hide_banner -loglevel error @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "ffmpeg failed with exit code $LASTEXITCODE"
    }
}

function Get-ProbeValue {
    param(
        [string]$Path,
        [string]$Entries
    )
    $value = & ffprobe -v error -show_entries $Entries -of default=nw=1:nk=1 $Path
    if ($LASTEXITCODE -ne 0) {
        throw "ffprobe failed for $Path"
    }
    return $value
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    throw "ffmpeg is required but was not found in PATH"
}
if (-not (Get-Command ffprobe -ErrorAction SilentlyContinue)) {
    throw "ffprobe is required but was not found in PATH"
}
if (-not (Test-Path -LiteralPath $VoiceoverPath -PathType Leaf)) {
    throw "Missing 30-second MiniMax voiceover: $VoiceoverPath"
}
if (-not (Test-Path -LiteralPath $SrtPath -PathType Leaf)) {
    throw "Missing five-cue SRT: $SrtPath"
}
if (-not (Test-Path -LiteralPath $AssPath -PathType Leaf)) {
    throw "Missing two-line burn-in ASS: $AssPath"
}

New-Item -ItemType Directory -Force -Path $AssetRoot, $WorkRoot | Out-Null
$normalized = New-Object System.Collections.Generic.List[string]
$sourceRecords = New-Object System.Collections.Generic.List[object]

foreach ($number in 1..5) {
    $id = $number.ToString("00")
    $name = "i2v-agent-workflow-shot-$id.mp4"
    $source = Join-Path $SourceRoot $name
    $target = Join-Path $AssetRoot $name
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
        throw "Missing paired-frame source video: $source"
    }

    Invoke-Ffmpeg @(
        "-y", "-i", $source,
        "-t", "6.000", "-an",
        "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=#F8F6EF,setsar=1,fps=24,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-movflags", "+faststart", $target
    )
    $normalized.Add($target)
    $sourceRecords.Add([ordered]@{
        shot = $id
        archived_source = "media/i2v-agent-workflow-paired-sources/$name"
        source_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $source).Hash.ToLowerInvariant()
        source_duration_seconds = [math]::Round([double](Get-ProbeValue -Path $source -Entries "format=duration"), 3)
        source_dimensions = (Get-ProbeValue -Path $source -Entries "stream=width,height" | Select-Object -First 2) -join "x"
        normalized_asset = "assets/$name"
        normalized_duration_seconds = [math]::Round([double](Get-ProbeValue -Path $target -Entries "format=duration"), 3)
    })
    Write-Host "normalized shot $id -> $target"
}

$concatLines = $normalized | ForEach-Object { "file '$($_.Replace("\", "/"))'" }
[IO.File]::WriteAllLines($ConcatPath, $concatLines, $Utf8)
Invoke-Ffmpeg @(
    "-y", "-f", "concat", "-safe", "0", "-i", $ConcatPath,
    "-an", "-c:v", "copy", "-movflags", "+faststart", $VideoOnlyPath
)

Push-Location $Project
try {
    $assRelative = (Resolve-Path -Relative $AssPath).TrimStart(".\").Replace("\", "/")
    $subtitleFilter = "subtitles=filename='$assRelative',format=yuv420p"
    Invoke-Ffmpeg @(
        "-y", "-i", $VideoOnlyPath, "-i", $VoiceoverPath,
        "-filter_complex", "[0:v]$subtitleFilter[vout]",
        "-map", "[vout]", "-map", "1:a:0",
        "-t", "30.000", "-r", "24",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "1",
        "-movflags", "+faststart", $FinalPath
    )
}
finally {
    Pop-Location
}

Invoke-Ffmpeg @(
    "-y", "-ss", "12.0", "-i", $FinalPath,
    "-frames:v", "1", "-q:v", "2", $PosterPath
)

$audioMetadata = if (Test-Path -LiteralPath $AudioMetadataPath -PathType Leaf) {
    Get-Content -Raw -Encoding UTF8 -LiteralPath $AudioMetadataPath | ConvertFrom-Json
}
else {
    $null
}
$metadata = [ordered]@{
    built_at = (Get-Date).ToString("o")
    delivery = "five paired-frame I2V shots assembled with deterministic local post-production"
    video_model_used_for_shots = $true
    external_platform_model = "unknown / supplied files"
    local_post_production = "FFmpeg trim, normalize, concatenate, MiniMax voiceover, hard subtitles"
    historical_single_image_video_excluded = $true
    shot_count = 5
    shot_duration_seconds = 6
    duration_seconds = [math]::Round([double](Get-ProbeValue -Path $FinalPath -Entries "format=duration"), 3)
    dimensions = "1080x1920"
    frame_rate = "24fps"
    video_codec = "H.264 / yuv420p"
    audio = "MiniMax voiceover / AAC mono 48kHz"
    audio_model = if ($null -ne $audioMetadata) { [string]$audioMetadata.model } else { "unknown" }
    audio_voice_id = if ($null -ne $audioMetadata) { [string]$audioMetadata.voice_id } else { "unknown" }
    audio_speed = if ($null -ne $audioMetadata) { [double]$audioMetadata.configured_speed } else { $null }
    audio_emotion = if ($null -ne $audioMetadata) { [string]$audioMetadata.emotion } else { $null }
    subtitles = "five-cue SRT delivery file; two-line ASS burned into final video"
    source_audio_policy = "archived with source files; excluded from normalized shots and final mix"
    sources = $sourceRecords
}
[IO.File]::WriteAllText($MetadataPath, ($metadata | ConvertTo-Json -Depth 6), $Utf8)

Write-Host "final: $FinalPath"
Write-Host "poster: $PosterPath"
Write-Host "metadata: $MetadataPath"
