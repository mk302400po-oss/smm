import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/notification_service_inapp.dart';
import '../../services/supabase_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    // Mark all as read when opening notifications
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final userId = SupabaseService.currentUser?.id;
      if (userId != null) {
        InAppNotificationService.markAllAsRead(userId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final userId = SupabaseService.currentUser?.id;

    if (userId == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('الإشعارات')),
        body: const Center(child: Text('يرجى تسجيل الدخول')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('الإشعارات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            tooltip: 'تحديد الكل كمقروء',
            onPressed: () {
              InAppNotificationService.markAllAsRead(userId);
            },
          ),
        ],
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: InAppNotificationService.getNotificationsStream(userId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('خطأ: ${snapshot.error}'));
          }

          final notifications = snapshot.data ?? [];

          if (notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_none,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'لا توجد إشعارات',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            itemCount: notifications.length,
            separatorBuilder: (context, index) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final notification = notifications[index];
              final isRead = notification['read'] == true;
              final type = notification['type'] as String?;
              final createdAt = DateTime.parse(
                notification['created_at'] as String,
              );

              return Dismissible(
                key: Key(notification['id']),
                background: Container(
                  color: Colors.red,
                  alignment: Alignment.centerLeft,
                  padding: const EdgeInsets.only(left: 20),
                  child: const Icon(Icons.delete, color: Colors.white),
                ),
                direction: DismissDirection.endToStart,
                onDismissed: (direction) {
                  InAppNotificationService.deleteNotification(notification['id']);
                },
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: InAppNotificationService.getNotificationColor(
                      type,
                    ).withOpacity(0.2),
                    child: Icon(
                      InAppNotificationService.getNotificationIcon(type),
                      color: InAppNotificationService.getNotificationColor(type),
                    ),
                  ),
                  title: Text(
                    notification['title'] ?? 'إشعار',
                    style: TextStyle(
                      fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text(notification['message'] ?? ''),
                      const SizedBox(height: 4),
                      Text(
                        _formatDate(createdAt),
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                  tileColor: isRead ? null : Colors.blue.withOpacity(0.05),
                  onTap: () {
                    if (!isRead) {
                      InAppNotificationService.markAsRead(notification['id']);
                    }
                    // TODO: Navigate to related screen based on type
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inMinutes < 1) {
      return 'الآن';
    } else if (difference.inHours < 1) {
      return 'منذ ${difference.inMinutes} دقيقة';
    } else if (difference.inDays < 1) {
      return 'منذ ${difference.inHours} ساعة';
    } else if (difference.inDays < 7) {
      return 'منذ ${difference.inDays} يوم';
    } else {
      return DateFormat('dd/MM/yyyy').format(date);
    }
  }
}
