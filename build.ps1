param(
    [string]$AndroidJar,
    [string]$BuildTools,
    [string]$TrialOrigin,
    [string]$UpdateR2Origin,
    [string]$UpdateTunnelOrigin
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3
$root = $PSScriptRoot
$build = Join-Path $root '.android-build'
$dist = Join-Path $root 'dist'
$sources = Join-Path $root 'android'
New-Item -ItemType Directory -Path $build,$dist -Force | Out-Null

function Get-BuildFile([string]$Package, [string]$Name) {
    $directory = Join-Path $build "sdk/$Package"
    if (!(Test-Path -LiteralPath $directory)) { throw "Use -AndroidJar and -BuildTools to specify the Android SDK files." }
    $result = Get-ChildItem -LiteralPath $directory -Recurse -File -Filter $Name | Select-Object -First 1
    if (!$result) { throw "$Name not found in $directory" }
    return $result.FullName
}
if (!$AndroidJar) { $AndroidJar = Get-BuildFile 'platform' 'android.jar' }
if (!$BuildTools) { $BuildTools = Split-Path -Parent (Get-BuildFile 'build-tools' 'aapt2.exe') }
if (!(Test-Path -LiteralPath (Join-Path $sources 'assets/markdown-it.js'))) { throw 'Missing verified markdown-it.js browser bundle.' }
function Get-HttpsOrigin([string]$Value, [string]$Option) {
    if (!$Value) { return '' }
    $uri = [uri]$Value
    if (!$uri.IsAbsoluteUri -or $uri.Scheme -ne 'https' -or !$uri.Host -or $uri.UserInfo -or $uri.Query -or $uri.Fragment -or $uri.AbsolutePath -ne '/') {
        throw "Specify an HTTPS origin with no path in -$Option."
    }
    return $uri.GetLeftPart([System.UriPartial]::Authority)
}
$TrialOrigin = Get-HttpsOrigin $TrialOrigin 'TrialOrigin'
$UpdateR2Origin = Get-HttpsOrigin $UpdateR2Origin 'UpdateR2Origin'
$UpdateTunnelOrigin = Get-HttpsOrigin $UpdateTunnelOrigin 'UpdateTunnelOrigin'
$manifestPath = Join-Path $sources 'AndroidManifest.xml'
$manifest = ([xml](Get-Content -Raw -Encoding utf8 -LiteralPath $manifestPath)).DocumentElement
$versionName = $manifest.GetAttribute('versionName', 'http://schemas.android.com/apk/res/android')
if ($versionName -cnotmatch '^\d+\.\d+\.\d+$') { throw 'Invalid BlueFish versionName in AndroidManifest.xml.' }

function Invoke-BuildTool([string]$Executable, [string[]]$ToolArgs) {
    & $Executable @ToolArgs
    if ($LASTEXITCODE -ne 0) { throw "$Executable failed with code $LASTEXITCODE" }
}
$work = Join-Path $build ('compile-' + [Guid]::NewGuid().ToString('N'))
$generated = Join-Path $work 'generated'
$classes = Join-Path $work 'classes'
$dex = Join-Path $work 'dex'
New-Item -ItemType Directory -Path $work,$generated,$classes,$dex -Force | Out-Null
$unsigned = Join-Path $work 'unsigned.apk'
$aligned = Join-Path $work 'aligned.apk'
$aapt = Join-Path $BuildTools 'aapt2.exe'
Invoke-BuildTool $aapt @('compile', '--dir', (Join-Path $sources 'res'), '-o', (Join-Path $work 'res.zip'))
Invoke-BuildTool $aapt @('link', '-o', $unsigned, '-I', $AndroidJar, '--manifest', $manifestPath,
   '--java', $generated, (Join-Path $work 'res.zip'))
$buildConfig = Join-Path $generated 'cn/lanwen/chat/BuildConfig.java'
$trial = ConvertTo-Json -InputObject ([string]$TrialOrigin) -Compress
$r2 = ConvertTo-Json -InputObject ([string]$UpdateR2Origin) -Compress
$tunnel = ConvertTo-Json -InputObject ([string]$UpdateTunnelOrigin) -Compress
[IO.File]::WriteAllText($buildConfig, @"
package cn.lanwen.chat;
final class BuildConfig {
    static final String TRIAL_ORIGIN = $trial;
    static final String UPDATE_R2_ORIGIN = $r2;
    static final String UPDATE_TUNNEL_ORIGIN = $tunnel;
}
"@)
$list = @(Get-ChildItem (Join-Path $sources 'src'),$generated -Recurse -File -Filter '*.java' | ForEach-Object { $_.FullName })
Invoke-BuildTool 'javac' (@('--release','8','-encoding','UTF-8','-classpath',$AndroidJar,'-d',$classes) + $list)
$classJar = Join-Path $work 'classes.jar'
Invoke-BuildTool 'jar' @('--create','--file',$classJar,'-C',$classes,'.')
Invoke-BuildTool 'java' @('-cp',(Join-Path $BuildTools 'lib/d8.jar'),'com.android.tools.r8.D8','--release','--min-api','26','--lib',$AndroidJar,'--output',$dex,$classJar)
# The Windows aapt2 binary writes nested asset paths with backslashes.
Invoke-BuildTool 'jar' @('--update','--file',$unsigned,'-C',$dex,'classes.dex','-C',$sources,'assets')
Invoke-BuildTool (Join-Path $BuildTools 'zipalign.exe') @('-p','-f','4',$unsigned,$aligned)

$signing = Join-Path $build 'signing'
New-Item -ItemType Directory -Path $signing -Force | Out-Null
$key = Join-Path $signing 'lanwen.p12'
$passFile = Join-Path $signing 'password.txt'
if (!(Test-Path -LiteralPath $key)) {
    $bytes = [byte[]]::new(32)
    [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    [IO.File]::WriteAllText($passFile, [Convert]::ToHexString($bytes))
    Invoke-BuildTool 'keytool' @('-genkeypair','-storetype','PKCS12','-keystore',$key,'-storepass:file',$passFile,
        '-alias','lanwen','-keyalg','RSA','-keysize','3072','-validity','10950','-dname','CN=Lanwen Android')
}
if (!(Test-Path -LiteralPath $passFile)) { throw 'The APK signing password file is missing.' }
$signer = Join-Path $BuildTools 'lib/apksigner.jar'
$packageName = "BlueFish-$versionName.apk"
$apk = Join-Path $work $packageName
Invoke-BuildTool 'java' @('-jar',$signer,'sign','--ks',$key,'--ks-pass',("file:" + $passFile),'--ks-key-alias','lanwen','--out',$apk,$aligned)
Invoke-BuildTool 'java' @('-jar',$signer,'verify','--verbose','--print-certs',$apk)
Invoke-BuildTool (Join-Path $BuildTools 'zipalign.exe') @('-c','-p','4',$apk)
$output = Join-Path $dist $packageName
Copy-Item -LiteralPath $apk -Destination $output -Force
Get-FileHash -Algorithm SHA256 -LiteralPath $output
