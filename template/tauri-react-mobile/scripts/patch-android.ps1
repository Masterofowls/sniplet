# Apply Android APK build overlay (signing + jni symlink fix)
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$gradleApp = "src-tauri\gen\android\app\build.gradle.kts"
if (-not (Test-Path $gradleApp)) {
    Write-Host "Android project missing — running tauri android init"
    npm run tauri android init
}

if (-not (Test-Path $gradleApp)) {
    throw "Android project still missing at $gradleApp"
}

$overlay = Join-Path $root "android-overlay\app\build.gradle.kts"
Copy-Item $overlay $gradleApp -Force
Write-Host "Applied overlay: $overlay"

$gradleProps = "src-tauri\gen\android\gradle.properties"
@"
org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.caching=true
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
android.nonTransitiveRClass=true
android.nonFinalResIds=false
android.javaCompile.suppressSourceTargetDeprecationWarning=true
"@ | Set-Content $gradleProps -Encoding ascii

Write-Host "Wrote Gradle properties"
Write-Host ""
Write-Host "Optional signing: see infra/android/SIGNING.md"
Write-Host "  copy android-overlay\keystore.properties.example src-tauri\gen\android\keystore.properties"
