# =============================================================================
# WeshBazar — local PostgreSQL provisioning (Windows / PowerShell)
#
# Creates the development role and the development, test and shadow databases,
# and installs the pg_trgm extension required by marketplace search.
#
# Prerequisites: PostgreSQL 15+ installed locally.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/setup-local-db.ps1
#
# The script is idempotent — it is safe to run multiple times.
# =============================================================================
param(
  [string]$PgSuperUser = "postgres",
  [string]$DbHost = "localhost",
  [int]$Port = 5432,
  [string]$AppUser = "weshbazar",
  [string]$AppPassword = "weshbazar"
)

$ErrorActionPreference = "Stop"

function Find-Psql {
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $candidates = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending
  if ($candidates) { return $candidates[0].FullName }
  throw "psql.exe not found. Install PostgreSQL or add its bin directory to PATH."
}

$psql = Find-Psql
Write-Host "Using psql: $psql"

function Invoke-Psql([string]$Database, [string]$Sql) {
  & $psql -U $PgSuperUser -h $DbHost -p $Port -d $Database -v ON_ERROR_STOP=1 -c $Sql
  if ($LASTEXITCODE -ne 0) { throw "psql failed for database '$Database'" }
}

function Test-Scalar([string]$Database, [string]$Sql) {
  $value = & $psql -U $PgSuperUser -h $DbHost -p $Port -d $Database -tAc $Sql
  if ($LASTEXITCODE -ne 0) { throw "psql failed for database '$Database'" }
  return ("$value").Trim() -eq "1"
}

# --- Role --------------------------------------------------------------------
$roleExists = Test-Scalar "postgres" "SELECT 1 FROM pg_roles WHERE rolname='$AppUser'"
if (-not $roleExists) {
  Invoke-Psql "postgres" "CREATE ROLE $AppUser LOGIN PASSWORD '$AppPassword'"
  Write-Host "Created role '$AppUser'."
} else {
  Write-Host "Role '$AppUser' already exists."
}

# --- Databases ---------------------------------------------------------------
$databases = @("weshbazar_dev", "weshbazar_test", "weshbazar_shadow")
foreach ($db in $databases) {
  $dbExists = Test-Scalar "postgres" "SELECT 1 FROM pg_database WHERE datname='$db'"
  if (-not $dbExists) {
    Invoke-Psql "postgres" "CREATE DATABASE $db OWNER $AppUser"
    Write-Host "Created database '$db'."
  } else {
    Write-Host "Database '$db' already exists."
  }

  # --- Extensions (require superuser) ---------------------------------------
  Invoke-Psql $db "CREATE EXTENSION IF NOT EXISTS pg_trgm"
}

Write-Host ""
Write-Host "Local PostgreSQL is ready."
Write-Host "  Application URL : postgresql://${AppUser}:${AppPassword}@${DbHost}:${Port}/weshbazar_dev"
Write-Host "  Test URL        : postgresql://${AppUser}:${AppPassword}@${DbHost}:${Port}/weshbazar_test"
Write-Host "  Shadow URL      : postgresql://${AppUser}:${AppPassword}@${DbHost}:${Port}/weshbazar_shadow"
