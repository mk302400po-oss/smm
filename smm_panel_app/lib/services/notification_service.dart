import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../config/app_config.dart';
import '../config/app_theme.dart';
import 'supabase_service.dart';

class NotificationService {
  static final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  static String? _currentToken;

  static Future<void> initialize() async {
    // Initialize Awesome Notifications
    await AwesomeNotifications().initialize(null, [
      // Orders Channel
      NotificationChannel(
        channelKey: AppConfig.ordersChannelId,
        channelName: 'الطلبات',
        channelDescription: 'إشعارات الطلبات الجديدة والتحديثات',
        defaultColor: AppColors.primary,
        ledColor: AppColors.primary,
        importance: NotificationImportance.High,
        playSound: true,
        enableVibration: true,
      ),
      // Deposits Channel
      NotificationChannel(
        channelKey: AppConfig.depositsChannelId,
        channelName: 'الإيداعات',
        channelDescription: 'إشعارات الإيداعات والمدفوعات',
        defaultColor: AppColors.success,
        ledColor: AppColors.success,
        importance: NotificationImportance.Max,
        playSound: true,
        enableVibration: true,
      ),
      // Admin Channel
      NotificationChannel(
        channelKey: AppConfig.adminChannelId,
        channelName: 'إشعارات الإدارة',
        channelDescription: 'إشعارات مهمة للمسؤولين',
        defaultColor: AppColors.error,
        ledColor: AppColors.error,
        importance: NotificationImportance.Max,
        playSound: true,
        enableVibration: true,
        criticalAlerts: true,
      ),
    ]);

    // Request permissions
    await requestPermissions();

    // Setup FCM
    await setupFCM();

    // Setup listeners
    setupListeners();
  }

  static Future<void> requestPermissions() async {
    // Request Awesome Notifications permission
    await AwesomeNotifications().isNotificationAllowed().then((isAllowed) {
      if (!isAllowed) {
        AwesomeNotifications().requestPermissionToSendNotifications();
      }
    });

    // Request FCM permission
    await _fcm.requestPermission(alert: true, badge: true, sound: true);
  }

  static Future<void> setupFCM() async {
    try {
      // Get FCM Token
      String? token = await _fcm.getToken();
      if (token != null) {
        _currentToken = token;
        print('FCM Token: $token');

        // Auto-save token to Supabase on initialization
        await saveTokenToSupabase(token);
      }

      // Handle token refresh
      _fcm.onTokenRefresh.listen((newToken) async {
        print('FCM Token refreshed: $newToken');
        _currentToken = newToken;
        await saveTokenToSupabase(newToken);
      });
    } catch (e) {
      print('Error setting up FCM: $e');
    }
  }

  // Auto-save FCM token to Supabase
  static Future<void> saveTokenToSupabase(String token) async {
    try {
      final user = SupabaseService.currentUser;
      if (user != null) {
        await SupabaseService.saveFCMToken(token);
        print('FCM Token saved to Supabase');
      }
    } catch (e) {
      print('Error saving FCM token: $e');
    }
  }

  // Re-save token after login
  static Future<void> updateTokenAfterLogin() async {
    if (_currentToken != null) {
      await saveTokenToSupabase(_currentToken!);
    }
  }

  static void setupListeners() {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      showNotificationFromFCM(message);
    });

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle notification taps
    AwesomeNotifications().setListeners(
      onActionReceivedMethod: onNotificationAction,
      onNotificationCreatedMethod: onNotificationCreated,
      onNotificationDisplayedMethod: onNotificationDisplayed,
      onDismissActionReceivedMethod: onDismissAction,
    );
  }

  @pragma('vm:entry-point')
  static Future<void> _firebaseMessagingBackgroundHandler(
    RemoteMessage message,
  ) async {
    showNotificationFromFCM(message);
  }

  static Future<void> showNotificationFromFCM(RemoteMessage message) async {
    final data = message.data;

    await AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
        channelKey: data['channelKey'] ?? AppConfig.ordersChannelId,
        title: message.notification?.title ?? data['title'],
        body: message.notification?.body ?? data['body'],
        bigPicture: data['bigPicture'],
        notificationLayout: data['layout'] == 'BigPicture'
            ? NotificationLayout.BigPicture
            : NotificationLayout.Default,
        payload: Map<String, String>.from(data),
      ),
      actionButtons: data['buttons'] != null
          ? (data['buttons'] as List).map((btn) {
              return NotificationActionButton(
                key: btn['key'],
                label: btn['label'],
              );
            }).toList()
          : null,
    );
  }

  // Show local notification
  static Future<void> showNotification({
    required String title,
    required String body,
    String? channelKey,
    Map<String, String>? payload,
    String? bigPicture,
    List<NotificationActionButton>? actionButtons,
  }) async {
    await AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
        channelKey: channelKey ?? AppConfig.ordersChannelId,
        title: title,
        body: body,
        bigPicture: bigPicture,
        notificationLayout: bigPicture != null
            ? NotificationLayout.BigPicture
            : NotificationLayout.Default,
        payload: payload,
      ),
      actionButtons: actionButtons,
    );
  }

  // Helper methods for common notifications
  static Future<void> showOrderNotification({
    required String orderId,
    required String title,
    required String body,
  }) async {
    await showNotification(
      title: title,
      body: body,
      channelKey: AppConfig.ordersChannelId,
      payload: {'type': 'order', 'orderId': orderId},
    );
  }

  static Future<void> showDepositNotification({
    required String depositId,
    required String title,
    required String body,
    bool isApproved = false,
  }) async {
    await showNotification(
      title: title,
      body: body,
      channelKey: AppConfig.depositsChannelId,
      payload: {
        'type': 'deposit',
        'depositId': depositId,
        'approved': isApproved.toString(),
      },
    );
  }

  static Future<void> showAdminNotification({
    required String title,
    required String body,
    Map<String, String>? extraData,
  }) async {
    await showNotification(
      title: title,
      body: body,
      channelKey: AppConfig.adminChannelId,
      payload: {'type': 'admin', ...?extraData},
    );
  }

  // Notification event handlers with navigation
  @pragma('vm:entry-point')
  static Future<void> onNotificationAction(
    ReceivedAction receivedAction,
  ) async {
    final payload = receivedAction.payload;
    if (payload == null) return;

    print('Notification clicked with payload: $payload');

    // TODO: Implement navigation
    // This requires a GlobalKey<NavigatorState> or route handling
    // For now, we'll just log the intended action

    final type = payload['type'];
    switch (type) {
      case 'order':
        final orderId = payload['orderId'];
        print('Should navigate to order details: $orderId');
        // NavigationService.navigateTo('/orders/$orderId');
        break;

      case 'deposit':
        final approved = payload['approved'] == 'true';
        print('Should navigate to deposits. Approved: $approved');
        // NavigationService.navigateTo('/wallet');
        break;

      case 'admin':
        print('Should navigate to admin panel');
        // NavigationService.navigateTo('/admin');
        break;

      default:
        print('Unknown notification type: $type');
    }
  }

  @pragma('vm:entry-point')
  static Future<void> onNotificationCreated(
    ReceivedNotification receivedNotification,
  ) async {
    print('Notification created: ${receivedNotification.id}');
  }

  @pragma('vm:entry-point')
  static Future<void> onNotificationDisplayed(
    ReceivedNotification receivedNotification,
  ) async {
    print('Notification displayed: ${receivedNotification.id}');
  }

  @pragma('vm:entry-point')
  static Future<void> onDismissAction(ReceivedAction receivedAction) async {
    print('Notification dismissed: ${receivedAction.id}');
  }

  // Get current FCM token
  static String? get currentToken => _currentToken;

  // Clear notifications
  static Future<void> clearAllNotifications() async {
    await AwesomeNotifications().cancelAll();
  }

  // Get notification count
  static Future<int> getNotificationCount() async {
    final notifications = await AwesomeNotifications()
        .listScheduledNotifications();
    return notifications.length;
  }
}
