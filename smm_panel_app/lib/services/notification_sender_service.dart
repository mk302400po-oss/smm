import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'supabase_service.dart';
import 'notification_service_inapp.dart';

class NotificationSenderService {
  // Firebase Cloud Messaging Server Key
  // Get this from Firebase Console > Project Settings > Cloud Messaging > Server key
  static const String FCM_SERVER_KEY =
      'YOUR_FCM_SERVER_KEY_HERE'; // TODO: Replace with actual key

  /// Send notification to specific user
  static Future<void> sendToUser(
    String userId,
    String title,
    String message,
  ) async {
    try {
      // 1. Insert notification into database
      await SupabaseService.client.from('notifications').insert({
        'user_id': userId,
        'title': title,
        'message': message,
        'read': false,
        'created_at': DateTime.now().toIso8601String(),
      });

      debugPrint('✅ Notification inserted for user $userId');

      // 2. Get user's FCM token
      final tokenResponse = await SupabaseService.client
          .from('fcm_tokens')
          .select('token')
          .eq('user_id', userId)
          .maybeSingle();

      if (tokenResponse == null || tokenResponse['token'] == null) {
        debugPrint('⚠️ No FCM token found for user $userId');
        return;
      }

      final fcmToken = tokenResponse['token'] as String;

      // 3. Send FCM push notification
      await _sendFCMNotification(fcmToken, title, message);
    } catch (e) {
      debugPrint('❌ Error sending notification: $e');
    }
  }

  /// Send FCM push notification
  static Future<void> _sendFCMNotification(
    String fcmToken,
    String title,
    String message,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('https://fcm.googleapis.com/fcm/send'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'key=$FCM_SERVER_KEY',
        },
        body: jsonEncode({
          'to': fcmToken,
          'notification': {'title': title, 'body': message, 'sound': 'default'},
          'priority': 'high',
          'data': {
            'click_action': 'FLUTTER_NOTIFICATION_CLICK',
            'title': title,
            'message': message,
          },
        }),
      );

      if (response.statusCode == 200) {
        debugPrint('✅ FCM notification sent successfully');
      } else {
        debugPrint('❌ FCM error: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      debugPrint('❌ Error sending FCM notification: $e');
    }
  }

  /// Broadcast notification to all users (admin only)
  static Future<void> broadcastToAll(String title, String message) async {
    try {
      // Get all users
      final usersResponse = await SupabaseService.client
          .from('users')
          .select('id');

      for (var user in usersResponse) {
        await sendToUser(user['id'], title, message);
      }

      debugPrint('✅ Broadcast sent to all users');
    } catch (e) {
      debugPrint('❌ Error broadcasting: $e');
    }
  }

  // Legacy method - no longer used
  static void startListening() {
    debugPrint('⚠️ startListening() is deprecated. Notifications now use FCM.');
  }
}
