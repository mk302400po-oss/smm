# Supabase Edge Function Deployment Guide

## Prerequisites
- Supabase CLI installed
- Firebase Service Account JSON file

## Step 1: Install Supabase CLI

```powershell
# Install via npm
npm install -g supabase
```

## Step 2: Login to Supabase

```powershell
supabase login
```

## Step 3: Link Project

```powershell
cd c:\Users\Administrator\script\smm_panel_app
supabase link --project-ref YOUR_PROJECT_REF
```

Get YOUR_PROJECT_REF from: https://supabase.com/dashboard/project/_/settings/general

## Step 4: Set Firebase Service Account Secret

After getting the Firebase service account JSON file:

```powershell
supabase secrets set FIREBASE_SERVICE_ACCOUNT='PASTE_JSON_CONTENT_HERE'
```

## Step 5: Deploy Edge Function

```powershell
supabase functions deploy send-fcm-notification
```

## Step 6: Create Database Trigger

Run this SQL in Supabase SQL Editor:

```sql
-- First, enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to call Edge Function
CREATE OR REPLACE FUNCTION trigger_send_fcm_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Call Edge Function via HTTP
  PERFORM
    net.http_post(
      url := 'YOUR_EDGE_FUNCTION_URL',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body := jsonb_build_object(
        'notification_id', NEW.id,
        'user_id', NEW.user_id,
        'title', NEW.title,
        'message', NEW.message
      )
    );
  
  RETURN NEW;
END;
$function$;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS on_notification_insert ON notifications;
CREATE TRIGGER on_notification_insert
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION trigger_send_fcm_notification();
```

Replace:
- `YOUR_EDGE_FUNCTION_URL`: Example: `https://vbdoyidihtjukycvwalb.supabase.co/functions/v1/send-fcm-notification`
- `YOUR_ANON_KEY`: Get from Supabase Dashboard → Settings → API

## Step 7: Test

Insert a test notification:

```sql
INSERT INTO notifications (user_id, title, message, read)
VALUES ('USER_ID_HERE', 'Test', 'Testing FCM', false);
```

Notification should arrive on device automatically!
