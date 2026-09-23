param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$Name
)
$ErrorActionPreference = 'Stop'
$evidenceDirectory = Join-Path $PSScriptRoot 'responses'
New-Item -ItemType Directory -Force -Path $evidenceDirectory | Out-Null
$outputFile = Join-Path $evidenceDirectory $Name
$started = [DateTime]::UtcNow.ToString('o')
try {
    $response = Invoke-WebRequest -Uri $Url -UserAgent 'AlpineFreightCockpit-SourceDiscovery/0.1 (portfolio research; contact: CONTACT_EMAIL_PENDING)' -TimeoutSec 20 -MaximumRedirection 5 -OutFile $outputFile -PassThru
    $result = [ordered]@{
        requested_url = $Url
        final_url = $response.BaseResponse.RequestMessage.RequestUri.AbsoluteUri
        fetched_at = $started
        completed_at = [DateTime]::UtcNow.ToString('o')
        status = [int]$response.StatusCode
        content_type = [string]$response.Headers.'Content-Type'
        bytes = (Get-Item -LiteralPath $outputFile).Length
        sha256 = (Get-FileHash -LiteralPath $outputFile -Algorithm SHA256).Hash.ToLower()
        file = $Name
    }
} catch {
    $result = [ordered]@{requested_url=$Url; fetched_at=$started; error=$_.Exception.Message; file=$null}
}
$result | ConvertTo-Json | Set-Content -LiteralPath ($outputFile + '.meta.json') -Encoding utf8
$result | ConvertTo-Json -Compress
