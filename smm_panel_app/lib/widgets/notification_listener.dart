import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/notification_service_inapp.dart';
import '../../services/supabase_service.dart';

class NotificationListener extends StatefulWidget {
  final Widget child;

  const NotificationListener({super.key, required this.child});

  @override
  State<NotificationListener> createState() => _NotificationListenerState();
}

class _NotificationListenerState extends State<NotificationListener> {
  StreamSubscription? _notificationSubscription;
  List<String> _seenNotificationIds = [];

  @override
  void initState() {
    super.initState();
    _listenToNotifications();
  }

  void _listenToNotifications() {
    final userId = SupabaseService.currentUser?.id;
    if (userId == null) return;

    _notificationSubscription =
        InAppNotificationService.getNotificationsStream(userId).listen((
          notifications,
        ) {
          if (notifications.isEmpty) return;

          // Get the latest notification
          final latest = notifications.first;
          final id = latest['id'] as String;

          // Check if we've already shown this notification
          if (_seenNotificationIds.contains(id)) return;

          // Mark as seen
          _seenNotificationIds.add(id);

          // Show local notification in system tray
          InAppNotificationService.showLocalNotification(
            title: latest['title'] ?? 'إشعار',
            body: latest['message'] ?? '',
            payload: id,
          );
        });
  }

  @override
  void dispose() {
    _notificationSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
