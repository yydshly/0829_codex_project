param(
    [ValidateSet("Sapi", "MiniMax")]
    [string]$TtsProvider = "Sapi",
    [int]$VoiceRate = 5,
    [string]$VoiceNamePattern = "*Huihui*",
    [string]$MiniMaxApiHost = "https://api.minimaxi.com",
    [string]$MiniMaxModel = "speech-2.8-hd",
    [string]$MiniMaxVoiceId = "Chinese (Mandarin)_News_Anchor",
    [double]$MiniMaxSpeed = 1.08,
    [switch]$ReuseMiniMaxAudio
)

$ErrorActionPreference = "Stop"
$Project = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$DataPath = Join-Path $Project "data\demo-case.json"
$MediaRoot = Join-Path $Project "media"
$WorkRoot = Join-Path $MediaRoot "work"
$VoiceRoot = Join-Path $WorkRoot "voice"
$ShotRoot = Join-Path $WorkRoot "shots"
$CaptionRoot = Join-Path $WorkRoot "captions"
$FinalPath = Join-Path $Project "demo\assets\news-case-final.mp4"
$PosterPath = Join-Path $Project "demo\assets\news-case-poster.jpg"
$AudioPath = Join-Path $MediaRoot "news-case-voiceover.m4a"
$SrtPath = Join-Path $MediaRoot "news-case.srt"
$BuildMetadataPath = Join-Path $Project "demo\assets\news-case-build.json"
$Utf8 = New-Object System.Text.UTF8Encoding($false)

function Invoke-Ffmpeg {
    param([string[]]$Arguments)
    & ffmpeg -hide_banner -loglevel error @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "ffmpeg failed with exit code $LASTEXITCODE"
    }
}

function Get-MediaDuration {
    param([string]$Path)
    $value = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $Path
    if ($LASTEXITCODE -ne 0) {
        throw "ffprobe failed for $Path"
    }
    return [double]::Parse($value, [Globalization.CultureInfo]::InvariantCulture)
}

function ConvertTo-AssTime {
    param([double]$Seconds)
    $hours = [math]::Floor($Seconds / 3600)
    $minutes = [math]::Floor(($Seconds % 3600) / 60)
    $wholeSeconds = [math]::Floor($Seconds % 60)
    $centiseconds = [math]::Floor(($Seconds - [math]::Floor($Seconds)) * 100)
    return "{0}:{1:00}:{2:00}.{3:00}" -f $hours, $minutes, $wholeSeconds, $centiseconds
}

function ConvertTo-SrtTime {
    param([double]$Seconds)
    $hours = [math]::Floor($Seconds / 3600)
    $minutes = [math]::Floor(($Seconds % 3600) / 60)
    $wholeSeconds = [math]::Floor($Seconds % 60)
    $milliseconds = [math]::Floor(($Seconds - [math]::Floor($Seconds)) * 1000)
    return "{0:00}:{1:00}:{2:00},{3:000}" -f $hours, $minutes, $wholeSeconds, $milliseconds
}

function Escape-AssText {
    param([string]$Text)
    return $Text.Replace("\", "\\").Replace("{", "\{").Replace("}", "\}")
}

function Format-AssNarration {
    param([string]$Text, [int]$MaxChars = 19)
    $chunks = New-Object System.Collections.Generic.List[string]
    $remaining = $Text.Trim()
    while ($remaining.Length -gt $MaxChars) {
        $breakLength = $MaxChars
        for ($index = $MaxChars - 1; $index -ge 11; $index--) {
            if ("，。；、：！？".Contains([string]$remaining[$index])) {
                $breakLength = $index + 1
                break
            }
        }
        $chunks.Add((Escape-AssText $remaining.Substring(0, $breakLength).Trim()))
        $remaining = $remaining.Substring($breakLength).Trim()
    }
    if ($remaining.Length -gt 0) {
        $chunks.Add((Escape-AssText $remaining))
    }
    return ($chunks -join "\N")
}

function New-PaperSlideExpression {
    param(
        [double]$Start,
        [ValidateSet("left", "right")]
        [string]$Direction
    )
    $startText = $Start.ToString("0.00", [Globalization.CultureInfo]::InvariantCulture)
    $travelEnd = ($Start + 0.36).ToString("0.00", [Globalization.CultureInfo]::InvariantCulture)
    $settleEnd = ($Start + 0.50).ToString("0.00", [Globalization.CultureInfo]::InvariantCulture)
    if ($Direction -eq "left") {
        return "if(lt(t\,$startText)\,-1080\,if(lt(t\,$travelEnd)\,-1080+(t-$startText)/0.36*1110\,if(lt(t\,$settleEnd)\,30-(t-$travelEnd)/0.14*30\,0)))"
    }
    return "if(lt(t\,$startText)\,1080\,if(lt(t\,$travelEnd)\,1080-(t-$startText)/0.36*1110\,if(lt(t\,$settleEnd)\,-30+(t-$travelEnd)/0.14*30\,0)))"
}

function New-ShotAss {
    param(
        [object]$Shot,
        [double]$Duration,
        [string]$Path
    )
    $end = ConvertTo-AssTime $Duration
    $title = Escape-AssText ([string]$Shot.keyword)
    $narration = Format-AssNarration ([string]$Shot.narration)
    $shotLabel = "来源：中国科学院 / 新华社 · SHOT {0}" -f $Shot.id
    $content = @"
[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Microsoft YaHei,72,&H00181914,&H00181914,&H00EFF6F8,&H00EFF6F8,-1,0,0,0,100,100,2,0,1,3,0,7,72,60,78,1
Style: Narration,Microsoft YaHei,44,&H00181914,&H00181914,&H00EFF6F8,&H40EFF6F8,-1,0,0,0,100,100,0,0,3,14,0,2,74,74,78,1
Style: Meta,Microsoft YaHei,24,&H00CB611B,&H00CB611B,&H00EFF6F8,&H00EFF6F8,-1,0,0,0,100,100,0,0,1,2,0,9,60,58,55,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.35,$end,Title,,0,0,0,,{\fad(120,0)}$title
Dialogue: 0,0:00:00.10,$end,Narration,,0,0,0,,$narration
Dialogue: 0,0:00:00.00,$end,Meta,,0,0,0,,$shotLabel
"@
    [IO.File]::WriteAllText($Path, $content, $Utf8)
}

function New-TtsWave {
    param(
        [string]$Text,
        [string]$Path,
        [int]$Rate,
        [string]$NamePattern
    )
    $voice = New-Object -ComObject SAPI.SpVoice
    $stream = New-Object -ComObject SAPI.SpFileStream
    try {
        $selected = $voice.GetVoices() | Where-Object { $_.GetDescription() -like $NamePattern } | Select-Object -First 1
        if ($null -eq $selected) {
            throw "No SAPI voice matches $NamePattern"
        }
        $voice.Voice = $selected
        $voice.Rate = $Rate
        $voice.Volume = 100
        $stream.Open($Path, 3, $false)
        $voice.AudioOutputStream = $stream
        [void]$voice.Speak($Text)
        $stream.Close()
    }
    finally {
        if ($null -ne $stream) {
            [void][Runtime.InteropServices.Marshal]::ReleaseComObject($stream)
        }
        if ($null -ne $voice) {
            [void][Runtime.InteropServices.Marshal]::ReleaseComObject($voice)
        }
    }
}

function New-MiniMaxAudio {
    param(
        [string]$Text,
        [string]$Path,
        [string]$ApiKey,
        [string]$ApiHost,
        [string]$Model,
        [string]$VoiceId,
        [double]$Speed
    )
    if ([string]::IsNullOrWhiteSpace($ApiKey)) {
        throw "MiniMax TTS requires the MINIMAX_API_KEY environment variable"
    }
    $helper = Join-Path $PSScriptRoot "minimax_tts.py"
    & python $helper `
        --text $Text `
        --output $Path `
        --api-host $ApiHost `
        --model $Model `
        --voice-id $VoiceId `
        --speed ([string]$Speed)
    if ($LASTEXITCODE -ne 0) {
        throw "MiniMax TTS helper failed with exit code $LASTEXITCODE"
    }
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    throw "ffmpeg is required but was not found in PATH"
}
if (-not (Get-Command ffprobe -ErrorAction SilentlyContinue)) {
    throw "ffprobe is required but was not found in PATH"
}

New-Item -ItemType Directory -Force -Path $MediaRoot, $WorkRoot, $VoiceRoot, $ShotRoot, $CaptionRoot | Out-Null
$data = Get-Content -Raw -Encoding UTF8 $DataPath | ConvertFrom-Json
$MiniMaxApiKey = $env:MINIMAX_API_KEY
if ($TtsProvider -eq "MiniMax" -and [string]::IsNullOrWhiteSpace($MiniMaxApiKey)) {
    throw "MiniMax TTS requires MINIMAX_API_KEY. Set it in this PowerShell session, then rerun with -TtsProvider MiniMax."
}
$segmentPaths = New-Object System.Collections.Generic.List[string]
$srtBlocks = New-Object System.Collections.Generic.List[string]
$timeline = 0.0

Push-Location $Project
try {
    foreach ($shot in $data.shots) {
        $id = [string]$shot.id
        $duration = [double]$shot.duration_seconds
        $imagePath = Join-Path $Project ("demo\" + ([string]$shot.generated_asset).Replace("/", "\"))
        if (-not (Test-Path -LiteralPath $imagePath)) {
            throw "Missing generated image for shot ${id}: $imagePath"
        }

        $rawExtension = if ($TtsProvider -eq "MiniMax") { "mp3" } else { "wav" }
        $rawVoice = Join-Path $VoiceRoot ("shot-{0}-raw.{1}" -f $id, $rawExtension)
        $voicePath = Join-Path $VoiceRoot ("shot-{0}.wav" -f $id)
        $assPath = Join-Path $CaptionRoot ("shot-{0}.ass" -f $id)
        $segmentPath = Join-Path $ShotRoot ("shot-{0}.mp4" -f $id)

        if ($TtsProvider -eq "MiniMax" -and $ReuseMiniMaxAudio -and (Test-Path -LiteralPath $rawVoice -PathType Leaf)) {
            Write-Host ("shot {0}: reusing validated MiniMax source audio" -f $id)
        }
        elseif ($TtsProvider -eq "MiniMax") {
            New-MiniMaxAudio `
                -Text ([string]$shot.narration) `
                -Path $rawVoice `
                -ApiKey $MiniMaxApiKey `
                -ApiHost $MiniMaxApiHost `
                -Model $MiniMaxModel `
                -VoiceId $MiniMaxVoiceId `
                -Speed $MiniMaxSpeed
        }
        else {
            New-TtsWave -Text ([string]$shot.narration) -Path $rawVoice -Rate $VoiceRate -NamePattern $VoiceNamePattern
        }
        $rawDuration = Get-MediaDuration $rawVoice
        $audioFilters = New-Object System.Collections.Generic.List[string]
        $safeDuration = $duration - 0.12
        if ($rawDuration -gt $safeDuration) {
            $tempo = $rawDuration / $safeDuration
            if ($tempo -gt 2.0) {
                throw "Shot $id narration needs more than 2x time compression to fit its ${duration}s slot"
            }
            $tempoText = $tempo.ToString("0.0000", [Globalization.CultureInfo]::InvariantCulture)
            $audioFilters.Add("atempo=$tempoText")
        }
        $audioFilters.Add("loudnorm=I=-18:TP=-2:LRA=7")
        $audioFilters.Add("apad=pad_dur=$duration")
        Invoke-Ffmpeg @(
            "-y", "-i", $rawVoice,
            "-af", ($audioFilters -join ","),
            "-t", ([string]$duration), "-ar", "48000", "-ac", "1", $voicePath
        )
        New-ShotAss -Shot $shot -Duration $duration -Path $assPath

        $assRelative = (Resolve-Path -Relative $assPath).TrimStart(".\").Replace("\", "/")
        $cuts = @($shot.motion_cuts | ForEach-Object { [int]$_ })
        if ($cuts.Count -eq 0) {
            $cuts = @(640, 1280)
        }
        $bounds = New-Object System.Collections.Generic.List[int]
        $bounds.Add(0)
        foreach ($cut in $cuts) {
            if ($cut -le $bounds[$bounds.Count - 1] -or $cut -ge 1920) {
                throw "Shot $id has invalid motion_cuts; values must be increasing and between 0 and 1920"
            }
            $bounds.Add($cut)
        }
        $bounds.Add(1920)
        $layerCount = $bounds.Count - 1
        $splitLabels = ((0..($layerCount - 1)) | ForEach-Object { "[v$_]" }) -join ""
        $filterParts = New-Object System.Collections.Generic.List[string]
        $filterParts.Add("[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=#F8F6EF,setsar=1,split=$layerCount$splitLabels")
        $filterParts.Add("color=c=#F8F6EF:s=1080x1920:r=20:d=$duration[bg]")
        for ($layerIndex = 0; $layerIndex -lt $layerCount; $layerIndex++) {
            $layerY = $bounds[$layerIndex]
            $layerHeight = $bounds[$layerIndex + 1] - $layerY
            $filterParts.Add("[v$layerIndex]crop=1080:${layerHeight}:0:${layerY}[layer$layerIndex]")
        }
        for ($layerIndex = 0; $layerIndex -lt $layerCount; $layerIndex++) {
            $layerY = $bounds[$layerIndex]
            $direction = if ($layerIndex % 2 -eq 0) { "left" } else { "right" }
            $start = 0.25 + ($layerIndex * 1.0)
            $slide = New-PaperSlideExpression -Start $start -Direction $direction
            $inputLabel = if ($layerIndex -eq 0) { "[bg]" } else { "[s$layerIndex]" }
            $outputLabel = if ($layerIndex -eq $layerCount - 1) { "[assembled]" } else { "[s$($layerIndex + 1)]" }
            $filterParts.Add("${inputLabel}[layer$layerIndex]overlay=x='$slide':y=${layerY}:shortest=1${outputLabel}")
        }
        $filterParts.Add("[assembled]subtitles=filename='$assRelative',fps=10,fps=20,format=yuv420p[vout]")
        $filter = $filterParts -join ";"

        Invoke-Ffmpeg @(
            "-y", "-loop", "1", "-framerate", "20", "-t", ([string]$duration), "-i", $imagePath,
            "-i", $voicePath,
            "-filter_complex", $filter,
            "-map", "[vout]", "-map", "1:a:0",
            "-t", ([string]$duration), "-r", "20",
            "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-movflags", "+faststart", $segmentPath
        )
        $segmentPaths.Add($segmentPath)

        $srtStart = ConvertTo-SrtTime $timeline
        $timeline += $duration
        $srtEnd = ConvertTo-SrtTime $timeline
        $srtBlocks.Add("$([int]$segmentPaths.Count)`r`n$srtStart --> $srtEnd`r`n$([string]$shot.narration)`r`n")
        Write-Host ("shot {0}: {1} + {2:N2}s narration -> {3:N0}s segment" -f $id, $TtsProvider, $rawDuration, $duration)
    }

    [IO.File]::WriteAllText($SrtPath, ($srtBlocks -join "`r`n"), $Utf8)
    $concatPath = Join-Path $WorkRoot "segments.txt"
    $concatLines = $segmentPaths | ForEach-Object { "file '$($_.Replace("\", "/"))'" }
    [IO.File]::WriteAllLines($concatPath, $concatLines, $Utf8)

    Invoke-Ffmpeg @("-y", "-f", "concat", "-safe", "0", "-i", $concatPath, "-c", "copy", "-movflags", "+faststart", $FinalPath)
    Invoke-Ffmpeg @("-y", "-i", $FinalPath, "-vn", "-c:a", "copy", $AudioPath)
    Invoke-Ffmpeg @("-y", "-ss", "4.2", "-i", $FinalPath, "-frames:v", "1", "-q:v", "2", $PosterPath)

    $finalDuration = Get-MediaDuration $FinalPath
    $ttsLabel = if ($TtsProvider -eq "MiniMax") { "MiniMax Speech 2.8 HD" } else { "Microsoft Huihui Desktop" }
    $buildMetadata = @{
        built_at = (Get-Date).ToString("o")
        tts_provider = $TtsProvider
        tts_label = $ttsLabel
        voice = if ($TtsProvider -eq "MiniMax") { $MiniMaxVoiceId } else { $VoiceNamePattern }
        model = if ($TtsProvider -eq "MiniMax") { $MiniMaxModel } else { "Windows SAPI" }
        duration_seconds = [math]::Round($finalDuration, 3)
        video_motion = "FFmpeg semantic-region paper assembly with restrained settle"
        motion_profile = "semantic_region_reveal"
        semantic_region_layers = $true
        semantic_object_layers = $false
        video_model_used = $false
    }
    [IO.File]::WriteAllText(
        $BuildMetadataPath,
        ($buildMetadata | ConvertTo-Json -Depth 4),
        $Utf8
    )
    Write-Host "final: $FinalPath"
    Write-Host ("duration: {0:N2}s" -f $finalDuration)
    Write-Host "subtitles: $SrtPath"
    Write-Host "voiceover: $AudioPath"
    Write-Host "build metadata: $BuildMetadataPath"
}
finally {
    Pop-Location
}
