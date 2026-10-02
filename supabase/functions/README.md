# Edge Functions Setup Guide

## Overview
Two Edge Functions for sending push notifications via Firebase Cloud Messaging (FCM).

## Functions Created

### 1. send-admin-notification
**Path:** `supabase/functions/send-admin-notification/index.ts`

**Triggers:**
- New user registration
- New order created
- New deposit request

**Payload Example:**
```json
{
  "type": "new_user",
  "data": {
    "userId": "uuid",
    "userName": "John Doe"
  }
}
```

### 2. send-user-notification
**Path:** `supabase/functions/send-user-notification/index.ts`

**Triggers:**
- Order status changed
- Deposit approved
- Deposit rejected

**Payload Example:**
```json
{
  "type": "order_status_changed",
  "userId": "uuid",
  "data": {
    "orderId": "uuid",
    "status": "completed"
  }
}
```

## Deployment Steps

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link Your Project
```bash
supabase link --project-ref vbdoyidihtjukycvwalb
```

### 4. Set Environment Variables
```bash
# FCM Server Key (from Firebase Console)
supabase secrets set FCM_SERVER_KEY=your-fcm-server-key
```

### 5. Deploy Functions
```bash
# Deploy admin notification function
supabase functions deploy send-admin-notification

# Deploy user notification function
supabase functions deploy send-user-notification
```

## Get FCM Server Key

1. Go to Firebase Console
2. Project Settings → Cloud Messaging
3. Copy "Server key" from Cloud Messaging API (Legacy)
4. Add to Supabase secrets

## Testing Functions

### Test Admin Notification:
```bash
curl -X POST 'https://vbdoyidihtjukycvwalb.supabase.co/functions/v1/send-admin-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "new_order",
    "data": {
      "orderId": "123",
      "userName": "Test User",
      "serviceName": "Instagram Followers"
    }
  }'
```

### Test User Notification:
```bash
curl -X POST 'https://vbdoyidihtjukycvwalb.supabase.co/functions/v1/send-user-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "deposit_approved",
    "userId": "user-uuid",
    "data": {
      "depositId": "123",
      "amount": 50
    }
  }'
```

## Integration with Database Triggers

### Option 1: Database Triggers (Recommended)
Create PostgreSQL triggers that call the Edge Functions:

```sql
-- Example: Trigger on new order
CREATE OR REPLACE FUNCTION notify_admin_new_order()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  service_name TEXT;
BEGIN
  -- Get user and service details
  SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
  SELECT name INTO service_name FROM services WHERE id = NEW.service_id;
  
  -- Call Edge Function
  PERFORM http_post(
    'https://vbdoyidihtjukycvwalb.supabase.co/functions/v1/send-admin-notification',
    json_build_object(
      'type', 'new_order',
      'data', json_build_object(
        'orderId', NEW.id::text,
        'userName', user_name,
        'serviceName', service_name
      )
    )::text,
    'application/json'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_admin_new_order
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_admin_new_order();
```

### Option 2: Manual Calls from App
Call the functions directly after operations in Flutter:

```dart
// After creating order
await supabase.functions.invoke('send-admin-notification', body: {
  'type': 'new_order',
  'data': {...}
});
```

## Monitoring

View function logs in Supabase Dashboard:
- Functions → Logs
- Check for errors and execution times

## Notes

- Edge Functions are deployed globally on Deno Deploy
- Cold start: ~200-500ms
- Warm execution: ~50-100ms
- Rate limits apply (check Supabase plan)
