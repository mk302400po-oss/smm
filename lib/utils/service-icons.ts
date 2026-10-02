// Icon mapping based on platform and category
export const getServiceIcon = (platform: string, category?: string): string => {
    const platformIcons: Record<string, string> = {
        'instagram': '📷',
        'tiktok': '🎵',
        'youtube': '▶️',
        'facebook': '👤',
        'twitter': '🐦',
        'telegram': '✈️',
        'snapchat': '👻',
        'linkedin': '💼',
        'pinterest': '📌',
        'reddit': '🤖',
        'discord': '💬',
        'twitch': '🎮',
        'spotify': '🎧',
        'soundcloud': '🔊',
        'vimeo': '🎬',
        'other': '🌐'
    }

    // If we have a specific platform icon, use it
    if (platformIcons[platform.toLowerCase()]) {
        return platformIcons[platform.toLowerCase()]
    }

    // Fallback to category-based icon
    const categoryIcons: Record<string, string> = {
        'followers': '👥',
        'likes': '❤️',
        'views': '👁️',
        'comments': '💬',
        'shares': '🔄',
        'subscribers': '🔔',
        'plays': '▶️',
        'other': '🌐'
    }

    return categoryIcons[category?.toLowerCase() || 'other'] || '🌐'
}

// Detect platform from service name
export const detectPlatform = (name: string): string => {
    const lowerName = name.toLowerCase()

    const platformMap: Record<string, string> = {
        'instagram': 'instagram',
        'insta': 'instagram',
        'tiktok': 'tiktok',
        'tik tok': 'tiktok',
        'youtube': 'youtube',
        'yt': 'youtube',
        'facebook': 'facebook',
        'fb': 'facebook',
        'twitter': 'twitter',
        'x.com': 'twitter',
        'telegram': 'telegram',
        'snapchat': 'snapchat',
        'linkedin': 'linkedin',
        'pinterest': 'pinterest',
        'reddit': 'reddit',
        'discord': 'discord',
        'twitch': 'twitch',
        'spotify': 'spotify',
        'soundcloud': 'soundcloud',
        'vimeo': 'vimeo'
    }

    for (const [keyword, platform] of Object.entries(platformMap)) {
        if (lowerName.includes(keyword)) {
            return platform
        }
    }

    return 'other'
}

// Detect category from service name
export const detectCategory = (name: string): string => {
    const lowerName = name.toLowerCase()

    const categoryMap: Record<string, string[]> = {
        'followers': ['follower', 'متابع', 'متابعين', 'follow'],
        'likes': ['like', 'إعجاب', 'اعجاب', 'heart', 'love'],
        'views': ['view', 'مشاهد', 'مشاهدات'],
        'comments': ['comment', 'تعليق', 'تعليقات'],
        'shares': ['share', 'مشاركة', 'مشاركات', 'repost'],
        'subscribers': ['subscriber', 'مشترك', 'مشتركين', 'subscribe'],
        'plays': ['play', 'تشغيل']
    }

    for (const [category, keywords] of Object.entries(categoryMap)) {
        for (const keyword of keywords) {
            if (lowerName.includes(keyword)) {
                return category
            }
        }
    }

    return 'other'
}
