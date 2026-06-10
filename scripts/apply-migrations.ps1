param(
    [string]$DatabaseUrl = $env:DATABASE_URL
)

if (-not $DatabaseUrl) {
    Write-Error "DATABASE_URL not set. Set the environment variable or pass -DatabaseUrl '<url>'"
    exit 1
}

$migrationsPath = Join-Path -Path (Get-Location) -ChildPath 'supabase\migrations'
if (-not (Test-Path $migrationsPath)) {
    Write-Error "Migrations folder not found: $migrationsPath"
    exit 1
}

$migrations = Get-ChildItem -Path $migrationsPath -Filter *.sql | Sort-Object Name
if ($migrations.Count -eq 0) {
    Write-Error "No migration files found in $migrationsPath"
    exit 1
}

foreach ($m in $migrations) {
    Write-Host "Applying $($m.FullName)"
    psql $DatabaseUrl -f $m.FullName
}

Write-Host "All migrations applied."
