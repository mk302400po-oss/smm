$filePath = ".\app\`(dashboard`)\new-order\page.tsx"
$content = Get-Content $filePath -Raw

# Add getPlatformLabel function
$content = $content -replace '(    const platforms = Array\.from)', @'
    const getPlatformLabel = (platform: string) => {
        const labels: Record<string, string> = {
            'instagram': '📷 Instagram',
            'facebook': '👤 Facebook',
            'tiktok': '🎵 TikTok',
            'youtube': '▶️ YouTube',
            'twitter': '🐦 Twitter',
            'snapchat': '👻 Snapchat',
            'telegram': '✈️ Telegram',
            'whatsapp': '💬 WhatsApp',
            'other': '🌐 أخرى'
        }
        return labels[platform.toLowerCase()] || `🌐 ${platform}`
    }

    $1'@

# Update platform button text
$content = $content -replace '(\s+className=\{`px-6 py-3 rounded-full border transition-all duration-300 capitalize[^}]+\})\s+>\s+\{platform\}', '$1>
                                    {getPlatformLabel(platform)}'

Set-Content $filePath -Value $content -NoNewline
Write-Host "File updated successfully!"
