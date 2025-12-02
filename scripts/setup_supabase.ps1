$projectId = Read-Host -Prompt "Enter your Supabase Project ID (e.g., abcdefghijklm)"

if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "itaopssgcncqnfabfvqs" -ForegroundColor Red
    exit 1
}

Write-Host "Initializing Supabase..."
cmd /c "npx supabase init"

Write-Host "Logging in to Supabase (opens browser)..."
cmd /c "npx supabase login"

Write-Host "Linking project $projectId..."
cmd /c "npx supabase link --project-ref $projectId"

Write-Host "Pushing migrations..."
cmd /c "npx supabase db push"

Write-Host "Migration complete!" -ForegroundColor Green
