# Sniplet Android APK build script (Windows)
# Ensures rustup rustc and NDK clang are on PATH before building.

param(
    [ValidateSet("aarch64", "universal", "split")]
    [string]$Target = "aarch64"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
    Write-Host "Loaded environment from .env"
}

$cargoBin = Join-Path $env:USERPROFILE ".cargo\bin"
if (-not (Test-Path $cargoBin)) {
    throw "rustup cargo bin not found at $cargoBin"
}

$sdkRoot = $env:ANDROID_HOME
if (-not $sdkRoot) { $sdkRoot = $env:ANDROID_SDK_ROOT }
if (-not $sdkRoot) {
    $sdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}

if (-not (Test-Path $sdkRoot)) {
    throw "Android SDK not found. Set ANDROID_HOME or install Android SDK."
}

$ndkDir = Get-ChildItem (Join-Path $sdkRoot "ndk") -Directory | Sort-Object Name -Descending | Select-Object -First 1
if (-not $ndkDir) {
    throw "Android NDK not found under $sdkRoot\ndk"
}

$llvmBin = Join-Path $ndkDir.FullName "toolchains\llvm\prebuilt\windows-x86_64\bin"
if (-not (Test-Path $llvmBin)) {
    throw "NDK LLVM bin not found at $llvmBin"
}

$env:PATH = "$cargoBin;$llvmBin;" + $env:PATH
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:NDK_HOME = $ndkDir.FullName

Write-Host "Using rustup from: $cargoBin"
Write-Host "Using NDK: $($ndkDir.FullName)"

switch ($Target) {
    "aarch64" { npm run tauri android build -- --apk --target aarch64 }
    "universal" { npm run tauri android build -- --apk }
    "split" { npm run tauri android build -- --apk --split-per-abi }
}

$apkCandidates = switch ($Target) {
    "aarch64" {
        @(
            "src-tauri\gen\android\app\build\outputs\apk\arm64\release\app-arm64-release.apk",
            "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk"
        )
    }
    "universal" { @("src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk") }
    "split" { @() }
}

foreach ($candidate in $apkCandidates) {
    if (-not (Test-Path $candidate)) { continue }
    $buildTools = Get-ChildItem (Join-Path $sdkRoot "build-tools") -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending |
        Select-Object -First 1
    if ($buildTools) {
        $apksigner = Join-Path $buildTools.FullName "apksigner.bat"
        if (Test-Path $apksigner) {
            Write-Host "Verifying APK: $candidate"
            & $apksigner verify --verbose $candidate
            if ($LASTEXITCODE -ne 0) {
                throw "apksigner verify failed for $candidate"
            }
        }
    }
    break
}

Write-Host ""
Write-Host "APK output directory:"
Write-Host "  src-tauri\gen\android\app\build\outputs\apk\"
