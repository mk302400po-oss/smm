import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/app_config.dart';
import 'notification_sender_service.dart';

class SupabaseService {
  static SupabaseClient? _client;

  static SupabaseClient get client {
    if (_client == null) {
      throw Exception('Supabase not initialized. Call initialize() first.');
    }
    return _client!;
  }

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      anonKey: AppConfig.supabaseAnonKey,
    );
    _client = Supabase.instance.client;
  }

  // Auth Methods
  static Future<AuthResponse> signIn(String email, String password) async {
    return await client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  static Future<AuthResponse> signUp(
    String email,
    String password, {
    required String name,
  }) async {
    final response = await client.auth.signUp(
      email: email,
      password: password,
      data: {'name': name},
    );
    return response;
  }

  static Future<void> signOut() async {
    await client.auth.signOut();
  }

  static User? get currentUser => client.auth.currentUser;

  static Stream<AuthState> get authStateChanges =>
      client.auth.onAuthStateChange;

  // Check if email already exists
  static Future<bool> checkEmailExists(String email) async {
    try {
      final response = await client
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();

      return response != null;
    } catch (e) {
      debugPrint('Error checking email: $e');
      return false;
    }
  }

  // Services Methods
  static Future<List<Map<String, dynamic>>> getServices({
    String? platform,
    String? category,
  }) async {
    var query = client.from('services').select().eq('status', 'active');

    if (platform != null && platform != 'all') {
      query = query.eq('platform', platform);
    }

    if (category != null && category != 'all') {
      query = query.eq('category', category);
    }

    final response = await query;
    return List<Map<String, dynamic>>.from(response);
  }

  // Orders Methods
  static Future<Map<String, dynamic>> createOrder({
    required String serviceId,
    required String link,
    required int quantity,
  }) async {
    try {
      // 1. Get current user's balance and service details
      final profile = await getUserProfile();
      final balance = (profile['balance'] ?? 0).toDouble();

      // 2. Get service details
      final serviceResponse = await client
          .from('services')
          .select()
          .eq('id', serviceId)
          .single();

      final service = Map<String, dynamic>.from(serviceResponse);

      // 3. Calculate cost
      double cost = 0;
      final pricePerThousand = (service['price_per_1000'] ?? 0).toDouble();
      cost = (quantity / 1000) * pricePerThousand;

      // 4. Check if balance is sufficient
      if (balance < cost) {
        throw Exception(
          'رصيدك غير كافٍ لإتمام هذا الطلب. الرصيد الحالي: \$${balance.toStringAsFixed(2)}، المطلوب: \$${cost.toStringAsFixed(2)}',
        );
      }

      // 5. Deduct balance first
      await client
          .from('users')
          .update({'balance': balance - cost})
          .eq('id', currentUser?.id ?? '');

      // 6. Call XFOLLOWR API directly (NO Edge Function!)
      String? providerOrderId;
      if (service['provider_service_id'] != null) {
        try {
          const apiUrl = 'https://xfollowr.com/api/v2';
          const apiKey = 'bcf521ae590567ebbd0af291fb8da55a';

          debugPrint('📞 Calling XFOLLOWR API...');
          debugPrint('Service: ${service['provider_service_id']}');
          debugPrint('Link: $link');
          debugPrint('Quantity: $quantity');

          final response = await http.post(
            Uri.parse(apiUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'key': apiKey,
              'action': 'add',
              'service': service['provider_service_id'],
              'link': link,
              'quantity': quantity,
            }),
          );

          debugPrint('✅ XFOLLOWR Response: ${response.statusCode}');
          debugPrint('Response Body: ${response.body}');

          if (response.statusCode == 200) {
            final data = jsonDecode(response.body);
            if (data['order'] != null) {
              providerOrderId = data['order'].toString();
              debugPrint('🎯 Provider Order ID: $providerOrderId');
            } else if (data['error'] != null) {
              // Refund if external API fails
              await client
                  .from('users')
                  .update({'balance': balance})
                  .eq('id', currentUser?.id ?? '');
              throw Exception('خطأ من المزود: ${data['error']}');
            }
          } else {
            // Refund on any error
            await client
                .from('users')
                .update({'balance': balance})
                .eq('id', currentUser?.id ?? '');
            final errorData = jsonDecode(response.body);
            throw Exception(
              'خطأ من السيرفر: ${errorData['error'] ?? response.reasonPhrase}',
            );
          }
        } catch (e) {
          debugPrint('❌ Error calling XFOLLOWR: $e');
          // Refund if API call fails
          await client
              .from('users')
              .update({'balance': balance})
              .eq('id', currentUser?.id ?? '');
          throw Exception('فشل الاتصال بالمزود: $e');
        }
      }

      // 7. Create order in database
      final response = await client
          .from('orders')
          .insert({
            'user_id': currentUser?.id,
            'service_id': serviceId,
            'link': link,
            'quantity': quantity,
            'total_price': cost,
            'status': providerOrderId != null ? 'pending' : 'processing',
            'provider_order_id': providerOrderId,
            'start_count': 0,
            'current_count': 0,
          })
          .select()
          .single();

      // 8. Create transaction record
      await client.from('transactions').insert({
        'user_id': currentUser?.id,
        'amount': -cost,
        'type': 'order',
        'status': 'completed',
        'reference_id': response['id'],
        'description': 'طلب: ${service['name']}',
      });

      // 9. Log activity
      await logActivity(
        currentUser?.id ?? '',
        'order_created',
        'أنشأ طلباً جديداً: ${service['name']}',
        {'order_id': response['id'], 'service_name': service['name']},
      );

      return response;
    } catch (e) {
      rethrow;
    }
  }

  static Future<List<Map<String, dynamic>>> getOrders() async {
    final response = await client
        .from('orders')
        .select('*, services(*)')
        .eq('user_id', currentUser?.id ?? '')
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  static Future<void> cancelOrder(String orderId) async {
    await client
        .from('orders')
        .update({'status': 'cancelled'})
        .eq('id', orderId);
  }

  // User Profile Methods
  static Future<Map<String, dynamic>> getUserProfile() async {
    return await client
        .from('users')
        .select()
        .eq('id', currentUser?.id ?? '')
        .single();
  }

  // Deposit Methods
  static Future<void> createDepositRequest({
    required double amount,
    required String paymentMethod,
    String? transactionId,
    String? senderPhone,
    String? screenshotUrl,
  }) async {
    if (currentUser == null) return;

    await client.from('deposit_requests').insert({
      'user_id': currentUser?.id,
      'amount': amount,
      'payment_method': paymentMethod,
      'transaction_id': transactionId,
      'sender_phone': senderPhone,
      'screenshot_url': screenshotUrl,
      'status': 'pending',
    });

    // Log activity
    await logActivity(
      currentUser?.id ?? '',
      'deposit_requested',
      'طلب إيداع: ${(amount * AppConfig.exchangeRate).toStringAsFixed(2)} EGP',
      {
        'amount_usd': amount,
        'amount_egp': amount * AppConfig.exchangeRate,
        'payment_method': paymentMethod,
        'transaction_id': transactionId,
        'sender_phone': senderPhone,
      },
    );
  }

  static Future<List<Map<String, dynamic>>> getDepositRequests() async {
    final response = await client
        .from('deposit_requests')
        .select()
        .eq('user_id', currentUser?.id ?? '')
        .order('created_at', ascending: false);

    return List<Map<String, dynamic>>.from(response);
  }

  // Admin: Get ALL deposit requests
  static Future<List<Map<String, dynamic>>> getAllDepositRequests() async {
    try {
      final response = await client
          .from('deposit_requests')
          .select('*, user:users(name, email)') // Join with users table
          .order('created_at', ascending: false);

      if (response == null) return [];
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint('Error fetching deposit requests: $e');
      return [];
    }
  }

  // ==================== ADMIN METHODS ====================

  // Users Management
  static Future<List<Map<String, dynamic>>> getAllUsers() async {
    try {
      final response = await client
          .from('users')
          .select()
          .order('created_at', ascending: false);

      if (response == null) return [];
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint('Error fetching users: $e');
      return [];
    }
  }

  static Future<void> updateUserBalance(
    String userId,
    double newBalance,
  ) async {
    await client.from('users').update({'balance': newBalance}).eq('id', userId);
  }

  static Future<void> updateUserRole(String userId, String role) async {
    await client.from('users').update({'role': role}).eq('id', userId);
  }

  static Future<void> toggleUserStatus(String userId, bool active) async {
    await client.from('users').update({'active': active}).eq('id', userId);
  }

  // Services Management
  static Future<List<Map<String, dynamic>>> getAllServicesAdmin() async {
    final response = await client
        .from('services')
        .select()
        .order('platform', ascending: true);
    return List<Map<String, dynamic>>.from(response);
  }

  static Future<void> createService(Map<String, dynamic> serviceData) async {
    await client.from('services').insert(serviceData);
  }

  static Future<void> updateService(
    String serviceId,
    Map<String, dynamic> data,
  ) async {
    await client.from('services').update(data).eq('id', serviceId);
  }

  static Future<void> deleteService(String serviceId) async {
    await client.from('services').delete().eq('id', serviceId);
  }

  static Future<void> toggleService(String serviceId, bool active) async {
    await client
        .from('services')
        .update({'active': active})
        .eq('id', serviceId);
  }

  // Orders Management (Admin)
  static Future<List<Map<String, dynamic>>> getAllOrders() async {
    try {
      final response = await client
          .from('orders')
          .select('''
          *,
          service:services(*),
          user:users(name, email)
        ''')
          .order('created_at', ascending: false);

      if (response == null) return [];
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint('Error fetching orders: $e');
      return [];
    }
  }

  static Future<void> updateOrderStatus(String orderId, String status) async {
    await client
        .from('orders')
        .update({
          'status': status,
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', orderId);

    // Log activity
    final order = await client
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single();
    await logActivity(
      order['user_id'],
      'order_status_changed',
      'Order status changed to $status',
      {
        'order_id': orderId,
        'new_status': status,
        'old_status': order['status'],
      },
    );
  }

  // Deposits Management (Admin)
  static Future<void> approveDeposit(String depositId, String adminId) async {
    final deposit = await client
        .from('deposit_requests')
        .select('user_id, amount, status, sender_phone')
        .eq('id', depositId)
        .single();

    if (deposit['status'] != 'pending') {
      throw Exception('هذا الطلب تمت معالجته مسبقاً');
    }

    final userId = deposit['user_id'];
    final amount = deposit['amount'];

    // Update user balance
    final user = await client
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

    final newBalance = (user['balance'] ?? 0) + amount;

    await client.from('users').update({'balance': newBalance}).eq('id', userId);

    // Update deposit request
    await client
        .from('deposit_requests')
        .update({
          'status': 'approved',
          'admin_id': adminId,
          'processed_at': DateTime.now().toIso8601String(),
        })
        .eq('id', depositId);

    // Send notification to user
    final amountEGP = (amount * AppConfig.exchangeRate).toStringAsFixed(2);
    final amountUSD = amount.toStringAsFixed(2);
    final senderPhone = deposit['sender_phone'] ?? 'غير محدد';

    await NotificationSenderService.sendToUser(
      userId,
      'تمت موافقة على الإيداع ✅',
      'المبلغ: $amountEGP EGP (\$$amountUSD)\nمن رقم: $senderPhone',
    );

    // Log activity
    await logActivity(
      userId,
      'deposit_approved',
      'تمت موافقة على الإيداع: $amountEGP EGP',
      {
        'deposit_id': depositId,
        'amount_usd': amount,
        'amount_egp': amount * AppConfig.exchangeRate,
        'sender_phone': senderPhone,
      },
    );
  }

  static Future<void> rejectDeposit(
    String depositId,
    String adminId,
    String reason,
  ) async {
    final deposit = await client
        .from('deposit_requests')
        .select('user_id, status, amount, sender_phone')
        .eq('id', depositId)
        .single();

    if (deposit['status'] != 'pending') {
      throw Exception('هذا الطلب تمت معالجته مسبقاً');
    }

    await client
        .from('deposit_requests')
        .update({
          'status': 'rejected',
          'admin_id': adminId,
          'admin_notes': reason,
          'processed_at': DateTime.now().toIso8601String(),
        })
        .eq('id', depositId);

    // Send notification to user
    final amountEGP = (deposit['amount'] * AppConfig.exchangeRate)
        .toStringAsFixed(2);
    final senderPhone = deposit['sender_phone'] ?? 'غير محدد';

    await NotificationSenderService.sendToUser(
      deposit['user_id'],
      'طلب إيداع مرفوض ❌',
      'المبلغ: $amountEGP EGP\nمن رقم: $senderPhone\nالسبب: $reason',
    );

    // Log activity
    await logActivity(
      deposit['user_id'],
      'deposit_rejected',
      'طلب إيداع مرفوض: $reason',
      {
        'deposit_id': depositId,
        'amount_egp': deposit['amount'] * AppConfig.exchangeRate,
        'reason': reason,
        'sender_phone': senderPhone,
      },
    );
  }

  // FCM Token Management
  static Future<void> saveFCMToken(String token) async {
    if (currentUser == null) return;

    await client.from('fcm_tokens').upsert({
      'user_id': currentUser?.id,
      'token': token,
      'updated_at': DateTime.now().toIso8601String(),
    });
  }

  static Future<void> logActivity(
    String userId,
    String action,
    String description,
    Map<String, dynamic>? metadata,
  ) async {
    try {
      await client.from('activity_log').insert({
        'user_id': userId,
        'action_type': action,
        'description': description,
        'metadata': metadata,
      });
    } catch (e) {
      debugPrint('Error logging activity: $e');
    }
  }

  // Get Recent Activity (Admin)
  static Future<List<Map<String, dynamic>>> getRecentActivity() async {
    try {
      final response = await client
          .from('activity_log')
          .select('''
            *,
            user:users(id, full_name, email)
          ''')
          .order('created_at', ascending: false)
          .limit(100);

      if (response == null) return [];
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint('Error fetching activity: $e');
      return [];
    }
  }

  // Admin Notifications
  static Future<List<Map<String, dynamic>>> getAdminNotifications() async {
    if (currentUser == null) return [];

    try {
      final response = await client
          .from('admin_notifications')
          .select()
          .eq('admin_id', currentUser?.id ?? '')
          .order('created_at', ascending: false);

      if (response == null) return [];
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      return [];
    }
  }

  static Future<int> getUnreadNotificationsCount() async {
    if (currentUser == null) return 0;

    try {
      final response = await client
          .from('admin_notifications')
          .select()
          .eq('admin_id', currentUser?.id ?? '')
          .eq('is_read', false);

      if (response == null) return 0;
      return (response as List).length;
    } catch (e) {
      debugPrint('Error fetching unread count: $e');
      return 0;
    }
  }

  static Future<void> markNotificationAsRead(String notificationId) async {
    await client
        .from('admin_notifications')
        .update({'is_read': true})
        .eq('id', notificationId);
  }

  static Future<void> markAllNotificationsAsRead() async {
    if (currentUser == null) return;

    await client
        .from('admin_notifications')
        .update({'is_read': true})
        .eq('admin_id', currentUser?.id ?? '');
  }
}
