import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'supabase_service.dart';
import 'notification_service_inapp.dart';

// Background message handler - must be top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('📩 Background message: ${message.notification?.title}');
}

class FCMService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static bool _initialized = false;

  /// Initialize FCM and request permissions
  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Initialize Firebase
      await Firebase.initializeApp();
      debugPrint('✅ Firebase initialized');

      // Set background message handler
      FirebaseMessaging.onBackgroundMessage(
        _firebaseMessagingBackgroundHandler,
      );

      // Request permission
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('✅ FCM permission granted');

        // Get and save FCM token
        String? token = await _messaging.getToken();
        if (token != null) {
          debugPrint('📱 FCM Token: ${token.substring(0, 20)}...');
          await _saveFCMToken(token);
        }

        // Listen for token refresh
        _messaging.onTokenRefresh.listen((newToken) {
          debugPrint('🔄 FCM Token refreshed');
          _saveFCMToken(newToken);
        });

        // Handle foreground messages
        FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          debugPrint('📬 Foreground message: ${message.notification?.title}');
          _handleForegroundMessage(message);
        });

        // Handle notification tap (when app is in background)
        FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
          debugPrint('👆 Notification tapped: ${message.data}');
          _handleNotificationTap(message);
        });

        // Check for initial message (when app is opened from terminated state)
        RemoteMessage? initialMessage = await _messaging.getInitialMessage();
        if (initialMessage != null) {
          debugPrint('🚀 App opened from notification: ${initialMessage.data}');
          _handleNotificationTap(initialMessage);
        }

        _initialized = true;
      } else {
        debugPrint('❌ FCM permission denied');
      }
    } catch (e) {
      debugPrint('❌ FCM initialization error: $e');
    }
  }

  /// Save FCM token to Supabase
  static Future<void> _saveFCMToken(String token) async {
    try {
      final userId = SupabaseService.currentUser?.id;
      if (userId == null) {
        debugPrint('⚠️ No user ID, skipping token save');
        return;
      }

      await SupabaseService.client.from('fcm_tokens').upsert({
        'user_id': userId,
        'token': token,
        'device_type': 'android',
        'updated_at': DateTime.now().toIso8601String(),
      });

      debugPrint('✅ FCM token saved to Supabase');
    } catch (e) {
      debugPrint('❌ Error saving FCM token: $e');
    }
  }

  /// Handle foreground messages (show local notification)
  static void _handleForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    debugPrint('📬 Foreground: ${notification.title} - ${notification.body}');

    // Show local notification using InAppNotificationService
    try {
      await InAppNotificationService.showLocalNotification(
        title: notification.title ?? 'إشعار جديد',
        body: notification.body ?? '',
        payload: message.data.toString(),
      );
    } catch (e) {
      debugPrint('❌ Error showing local notification: $e');
    }
  }

  /// Handle notification tap
  static void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;

    // Navigate based on notification type
    if (data.containsKey('deposit_id')) {
      debugPrint('Navigate to deposits screen');
      // TODO: Navigate to deposits screen
    } else if (data.containsKey('order_id')) {
      debugPrint('Navigate to orders screen');
      // TODO: Navigate to orders screen
    } else if (data.containsKey('user_id')) {
      debugPrint('Navigate to admin/users screen');
      // TODO: Navigate to admin screen
    }
  }

  /// Delete FCM token when user logs out
  static Future<void> deleteToken() async {
    try {
      final userId = SupabaseService.currentUser?.id;
      if (userId == null) return;

      // Delete from Supabase
      await SupabaseService.client
          .from('fcm_tokens')
          .delete()
          .eq('user_id', userId);

      // Delete from Firebase
      await _messaging.deleteToken();

      debugPrint('✅ FCM token deleted');
    } catch (e) {
      debugPrint('❌ Error deleting FCM token: $e');
    }
  }

  /// Subscribe to topic (optional - for broadcast messages)
  static Future<void> subscribeToTopic(String topic) async {
    try {
      await _messaging.subscribeToTopic(topic);
      debugPrint('✅ Subscribed to topic: $topic');
    } catch (e) {
      debugPrint('❌ Error subscribing to topic: $e');
    }
  }

  /// Unsubscribe from topic
  static Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _messaging.unsubscribeFromTopic(topic);
      debugPrint('✅ Unsubscribed from topic: $topic');
    } catch (e) {
      debugPrint('❌ Error unsubscribing from topic: $e');
    }
  }
}
