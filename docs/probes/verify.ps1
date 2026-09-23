$ErrorActionPreference = 'Stop'
$evidenceDirectory = Join-Path $PSScriptRoot 'responses'
$verified = 0
$failures = 0
foreach ($metaFile in Get-ChildItem -LiteralPath $evidenceDirectory -Filter '*.meta.json') {
    $metadata = Get-Content -LiteralPath $metaFile.FullName -Raw | ConvertFrom-Json
    if ($metadata.error) {
        Write-Output "RECORDED FAILURE: $($metadata.requested_url) -- $($metadata.error)"
        $failures++
        continue
    }
    $actual = (Get-FileHash -LiteralPath (Join-Path $evidenceDirectory $metadata.file) -Algorithm SHA256).Hash.ToLower()
    if ($actual -ne $metadata.sha256) { throw "Evidence hash mismatch: $($metadata.file)" }
    [void]([DateTimeOffset]$metadata.fetched_at)
    Write-Output "PASS: $($metadata.file) HTTP $($metadata.status); SHA-256 matches"
    $verified++
}
[xml]$rates = Get-Content -LiteralPath (Join-Path $evidenceDirectory 'ecb-daily.xml') -Raw
$datedCube = $rates.SelectSingleNode("//*[local-name()='Cube' and @time]")
$currencyRecords = $datedCube.SelectNodes("*[local-name()='Cube' and @currency and @rate]")
$usd = $datedCube.SelectSingleNode("*[local-name()='Cube' and @currency='USD']")
Write-Output "ECB XML: date=$($datedCube.time); currencies=$($currencyRecords.Count); USD per EUR=$($usd.rate)"
[xml]$stringsXml = Get-Content -LiteralPath (Join-Path $evidenceDirectory 'ec-xl-sharedStrings.xml') -Raw
$strings = @($stringsXml.sst.si | ForEach-Object { $_.InnerText })
[xml]$sheetXml = Get-Content -LiteralPath (Join-Path $evidenceDirectory 'ec-xl-worksheets-sheet1.xml') -Raw
$cells = @{}
foreach ($row in $sheetXml.worksheet.sheetData.row) {
    foreach ($cell in $row.c) {
        $value = $cell.v
        if ($cell.t -eq 's') { $value = $strings[[int]$cell.v] }
        $cells[$cell.r] = $value
    }
}
$observationDate = [DateTime]::FromOADate([double]$cells['A2']).ToString('yyyy-MM-dd')
Write-Output "EC workbook: date=$observationDate; country=$($cells['A3']); diesel=$($cells['C3']) EUR/$($cells['C2'])"
Write-Output "Evidence summary: $verified successful HTTP responses verified; $failures recorded access failure(s)."
Write-Output 'Application tests: NOT RUN -- Phase 1 contains no application or test suite.'
Write-Output 'Application build: NOT RUN -- Phase 1 contains no application or build configuration.'
Write-Output 'Phase 1 exit gate: NOT MET -- no road-surcharge source approved for automated public use.'
