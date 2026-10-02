-- Add icon column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🌐';

-- Create function to auto-assign icon based on platform
CREATE OR REPLACE FUNCTION assign_service_icon()
RETURNS TRIGGER AS $$
BEGIN
    -- If icon is not provided or is default, auto-assign based on platform
    IF NEW.icon IS NULL OR NEW.icon = '' OR NEW.icon = '🌐' THEN
        -- Platform-based icons
        CASE LOWER(NEW.platform)
            WHEN 'instagram' THEN NEW.icon := '📷';
            WHEN 'tiktok' THEN NEW.icon := '🎵';
            WHEN 'youtube' THEN NEW.icon := '▶️';
            WHEN 'facebook' THEN NEW.icon := '👤';
            WHEN 'twitter' THEN NEW.icon := '🐦';
            WHEN 'telegram' THEN NEW.icon := '✈️';
            WHEN 'snapchat' THEN NEW.icon := '👻';
            WHEN 'linkedin' THEN NEW.icon := '💼';
            WHEN 'pinterest' THEN NEW.icon := '📌';
            WHEN 'reddit' THEN NEW.icon := '🤖';
            WHEN 'discord' THEN NEW.icon := '💬';
            WHEN 'twitch' THEN NEW.icon := '🎮';
            WHEN 'spotify' THEN NEW.icon := '🎧';
            WHEN 'soundcloud' THEN NEW.icon := '🔊';
            WHEN 'vimeo' THEN NEW.icon := '🎬';
            ELSE
                -- Fallback to category-based icons
                CASE LOWER(COALESCE(NEW.category, 'other'))
                    WHEN 'followers' THEN NEW.icon := '👥';
                    WHEN 'likes' THEN NEW.icon := '❤️';
                    WHEN 'views' THEN NEW.icon := '👁️';
                    WHEN 'comments' THEN NEW.icon := '💬';
                    WHEN 'shares' THEN NEW.icon := '🔄';
                    WHEN 'subscribers' THEN NEW.icon := '🔔';
                    WHEN 'plays' THEN NEW.icon := '▶️';
                    ELSE NEW.icon := '🌐';
                END CASE;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign icons on INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_assign_service_icon ON services;
CREATE TRIGGER trigger_assign_service_icon
    BEFORE INSERT OR UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION assign_service_icon();

-- Update existing services with icons based on their platform
UPDATE services
SET icon = CASE LOWER(platform)
    WHEN 'instagram' THEN '📷'
    WHEN 'tiktok' THEN '🎵'
    WHEN 'youtube' THEN '▶️'
    WHEN 'facebook' THEN '👤'
    WHEN 'twitter' THEN '🐦'
    WHEN 'telegram' THEN '✈️'
    WHEN 'snapchat' THEN '👻'
    WHEN 'linkedin' THEN '💼'
    WHEN 'pinterest' THEN '📌'
    WHEN 'reddit' THEN '🤖'
    WHEN 'discord' THEN '💬'
    WHEN 'twitch' THEN '🎮'
    WHEN 'spotify' THEN '🎧'
    WHEN 'soundcloud' THEN '🔊'
    WHEN 'vimeo' THEN '🎬'
    ELSE 
        CASE LOWER(COALESCE(category, 'other'))
            WHEN 'followers' THEN '👥'
            WHEN 'likes' THEN '❤️'
            WHEN 'views' THEN '👁️'
            WHEN 'comments' THEN '💬'
            WHEN 'shares' THEN '🔄'
            WHEN 'subscribers' THEN '🔔'
            WHEN 'plays' THEN '▶️'
            ELSE '🌐'
        END
END
WHERE icon IS NULL OR icon = '' OR icon = '🌐';

COMMENT ON COLUMN services.icon IS 'Auto-assigned emoji icon based on platform/category';
COMMENT ON FUNCTION assign_service_icon IS 'Automatically assigns icon to service based on platform and category';
