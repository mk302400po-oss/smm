import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'dart:async';
import '../../config/app_theme.dart';
import '../../services/supabase_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();

    // Auto-refresh every 5 seconds
    Timer.periodic(const Duration(seconds: 5), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      _loadNotifications();
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    try {
      final notifications = await SupabaseService.getAdminNotifications();
      if (mounted) {
        setState(() {
          _notifications = notifications;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('خطأ في تحميل الإشعارات: $e')));
      }
    }
  }

  Future<void> _markAsRead(String notificationId) async {
    try {
      await SupabaseService.markNotificationAsRead(notificationId);
      _loadNotifications();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('خطأ: $e')));
      }
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await SupabaseService.markAllNotificationsAsRead();
      _loadNotifications();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('خطأ: $e')));
      }
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'deposit':
        return Icons.account_balance_wallet;
      case 'order':
        return Icons.shopping_cart;
      case 'cancellation':
        return Icons.cancel;
      default:
        return Icons.notifications;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'deposit':
        return AppColors.warning;
      case 'order':
        return AppColors.primary;
      case 'cancellation':
        return AppColors.error;
      default:
        return AppColors.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الإشعارات'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          if (_notifications.any((n) => n['is_read'] == false))
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text(
                'تعليم الكل كمقروء',
                style: TextStyle(color: Colors.white),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_none,
                    size: 64,
                    color: Colors.white.withValues(alpha: 0.3),
                  ),
                  const SizedBox(height: AppSizes.md),
                  const Text(
                    'لا توجد إشعارات',
                    style: TextStyle(
                      fontSize: 18,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadNotifications,
              child: ListView.builder(
                padding: const EdgeInsets.all(AppSizes.md),
                itemCount: _notifications.length,
                itemBuilder: (context, index) {
                  final notification = _notifications[index];
                  final isRead = notification['is_read'] as bool;
                  final createdAt = DateTime.parse(notification['created_at']);
                  final type = notification['type'] as String;

                  return Card(
                    margin: const EdgeInsets.only(bottom: AppSizes.md),
                    color: isRead
                        ? null
                        : AppColors.primary.withValues(alpha: 0.1),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _getColorForType(
                          type,
                        ).withValues(alpha: 0.2),
                        child: Icon(
                          _getIconForType(type),
                          color: _getColorForType(type),
                        ),
                      ),
                      title: Text(
                        notification['title'],
                        style: TextStyle(
                          fontWeight: isRead
                              ? FontWeight.normal
                              : FontWeight.bold,
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: AppSizes.xs),
                          Text(notification['body']),
                          const SizedBox(height: AppSizes.xs),
                          Text(
                            DateFormat('yyyy-MM-dd HH:mm').format(createdAt),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      trailing: isRead
                          ? null
                          : Icon(
                              Icons.circle,
                              size: 12,
                              color: _getColorForType(type),
                            ),
                      onTap: () {
                        if (!isRead) {
                          _markAsRead(notification['id']);
                        }
                      },
                    ),
                  );
                },
              ),
            ),
    );
  }
}
