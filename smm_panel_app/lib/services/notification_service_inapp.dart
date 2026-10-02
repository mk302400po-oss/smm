import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'supabase_service.dart';

class InAppNotificationService {
  static final _client = SupabaseService.client;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  static bool _initialized = false;

  /// Initialize local notifications
  static Future<void> initializeLocalNotifications() async {
    if (_initialized) return;

    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const initSettings = InitializationSettings(android: androidSettings);

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Handle notification tap
        debugPrint('Notification tapped: ${response.payload}');
      },
    );

    // Create notification channel for Android
    const androidChannel = AndroidNotificationChannel(
      'default_channel',
      'Default Notifications',
      description: 'Channel for general app notifications',
      importance: Importance.high,
      playSound: true,
      enableVibration: false, // Sound only, no vibration
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(androidChannel);

    _initialized = true;
  }

  /// Show local notification in system tray
  static Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'default_channel',
      'Default Notifications',
      channelDescription: 'Channel for general app notifications',
      importance: Importance.high,
      priority: Priority.high,
      playSound: true,
      enableVibration: false, // Sound only, no vibration
      icon: '@mipmap/ic_launcher',
    );

    const notificationDetails = NotificationDetails(android: androidDetails);

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      notificationDetails,
      payload: payload,
    );
  }

  /// Get notifications stream for real-time updates
  static Stream<List<Map<String, dynamic>>> getNotificationsStream(
    String userId,
  ) {
    return _client
        .from('notifications')
        .stream(primaryKey: ['id'])
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(50);
  }

  /// Get unread notifications count
  static Future<int> getUnreadCount(String userId) async {
    try {
      final response = await _client
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('read', false);

      return (response as List).length;
    } catch (e) {
      debugPrint('Error getting unread count: $e');
      return 0;
    }
  }

  /// Mark notification as read
  static Future<void> markAsRead(String notificationId) async {
    try {
      await _client
          .from('notifications')
          .update({'read': true})
          .eq('id', notificationId);
    } catch (e) {
      debugPrint('Error marking as read: $e');
    }
  }

  /// Mark all notifications as read for user
  static Future<void> markAllAsRead(String userId) async {
    try {
      await _client
          .from('notifications')
          .update({'read': true})
          .eq('user_id', userId)
          .eq('read', false);
    } catch (e) {
      debugPrint('Error marking all as read: $e');
    }
  }

  /// Delete notification
  static Future<void> deleteNotification(String notificationId) async {
    try {
      await _client.from('notifications').delete().eq('id', notificationId);
    } catch (e) {
      debugPrint('Error deleting notification: $e');
    }
  }

  /// Get notification icon based on type
  static IconData getNotificationIcon(String? type) {
    switch (type) {
      case 'deposit':
        return Icons.account_balance_wallet;
      case 'order':
        return Icons.shopping_bag;
      case 'success':
        return Icons.check_circle;
      case 'warning':
        return Icons.warning;
      case 'error':
        return Icons.error;
      default:
        return Icons.notifications;
    }
  }

  /// Get notification color based on type
  static Color getNotificationColor(String? type) {
    switch (type) {
      case 'deposit':
        return Colors.blue;
      case 'order':
        return Colors.purple;
      case 'success':
        return Colors.green;
      case 'warning':
        return Colors.orange;
      case 'error':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
