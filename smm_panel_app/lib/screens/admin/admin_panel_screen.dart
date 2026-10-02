import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../config/app_config.dart';
import '../../config/app_theme.dart';
import '../../services/supabase_service.dart';
import 'activity_log_tab.dart';
import 'notifications_screen.dart';
import 'orders_management_tab.dart';
import 'users_management_tab.dart';

class AdminPanelScreen extends StatefulWidget {
  const AdminPanelScreen({super.key});

  @override
  State<AdminPanelScreen> createState() => _AdminPanelScreenState();
}

class _AdminPanelScreenState extends State<AdminPanelScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<Map<String, dynamic>> _deposits = [];
  int _totalUsers = 0;
  int _totalOrders = 0;
  Timer? _refreshTimer;
  int _unreadNotifications = 0;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadAllData();

    // Refresh every 30 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) {
        _loadAllData();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadAllData() async {
    if (!mounted) return;

    try {
      // Check if user is logged in
      final currentUser = SupabaseService.currentUser;
      if (currentUser == null) {
        if (mounted) {
          Navigator.of(context).pushReplacementNamed('/login');
        }
        return;
      }

      // Get user profile from database to check role
      final userProfile = await SupabaseService.getUserProfile();
      final role = userProfile['role'] as String?;

      if (role != 'admin') {
        if (mounted) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('غير مصرح لك بالوصول')));
        }
        return;
      }

      // Load data safely
      final deposits = await SupabaseService.getAllDepositRequests();
      final users = await SupabaseService.getAllUsers();
      final orders = await SupabaseService.getAllOrders();
      final unreadCount = await SupabaseService.getUnreadNotificationsCount();

      if (mounted) {
        setState(() {
          _deposits = deposits;
          _totalUsers = users.length;
          _totalOrders = orders.length;
          _unreadNotifications = unreadCount;
          _isLoading = false;
          _errorMessage = null;
        });
      }
    } catch (e) {
      debugPrint('Error loading admin data: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'خطأ في تحميل البيانات: $e';
        });
      }
    }
  }

  Future<void> _approveDeposit(String depositId) async {
    try {
      final currentUser = SupabaseService.currentUser;
      if (currentUser == null) {
        _showError('المستخدم غير مسجل دخول');
        return;
      }

      await SupabaseService.approveDeposit(depositId, currentUser.id);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('تم قبول الإيداع بنجاح')));
        _loadAllData();
      }
    } catch (e) {
      _showError('خطأ في قبول الإيداع: $e');
    }
  }

  Future<void> _rejectDeposit(String depositId) async {
    try {
      final currentUser = SupabaseService.currentUser;
      if (currentUser == null) {
        _showError('المستخدم غير مسجل دخول');
        return;
      }

      await SupabaseService.rejectDeposit(
        depositId,
        currentUser.id,
        'تم الرفض من قبل المشرف',
      );
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('تم رفض الإيداع')));
        _loadAllData();
      }
    } catch (e) {
      _showError('خطأ في رفض الإيداع: $e');
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
    }
  }

  void _viewReceipt(String imageUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppBar(
              title: const Text('إيصال الدفع'),
              automaticallyImplyLeading: false,
              actions: [
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            Expanded(
              child: InteractiveViewer(
                child: Image.network(
                  imageUrl,
                  fit: BoxFit.contain,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Center(
                      child: CircularProgressIndicator(
                        value: loadingProgress.expectedTotalBytes != null
                            ? loadingProgress.cumulativeBytesLoaded /
                                  loadingProgress.expectedTotalBytes!
                            : null,
                      ),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.error, size: 48, color: Colors.red),
                          SizedBox(height: 8),
                          Text('خطأ في تحميل الصورة'),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('لوحة الإدارة')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: AppColors.error),
              const SizedBox(height: 16),
              Text(_errorMessage!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _isLoading = true;
                    _errorMessage = null;
                  });
                  _loadAllData();
                },
                child: const Text('إعادة المحاولة'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('لوحة الإدارة'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          // Notification Bell
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const NotificationsScreen(),
                    ),
                  ).then((_) => _loadAllData());
                },
              ),
              if (_unreadNotifications > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      '$_unreadNotifications',
                      style: const TextStyle(color: Colors.white, fontSize: 10),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          // Refresh Button
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() => _isLoading = true);
              _loadAllData();
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(icon: Icon(Icons.request_quote), text: 'الإيداعات'),
            Tab(icon: Icon(Icons.people), text: 'المستخدمين'),
            Tab(icon: Icon(Icons.shopping_cart), text: 'الطلبات'),
            Tab(icon: Icon(Icons.history), text: 'السجل'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDepositsTab(),
          const UsersManagementTab(),
          const OrdersManagementTab(),
          const ActivityLogTab(),
        ],
      ),
    );
  }

  Widget _buildDepositsTab() {
    // Filter only PENDING deposits
    final pendingDeposits = _deposits
        .where((d) => (d['status'] as String? ?? '').toLowerCase() == 'pending')
        .toList();

    if (pendingDeposits.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.account_balance_wallet, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('لا توجد طلبات إيداع معلقة', style: TextStyle(fontSize: 18)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAllData,
      child: ListView.builder(
        padding: const EdgeInsets.all(AppSizes.md),
        itemCount: pendingDeposits.length,
        itemBuilder: (context, index) {
          final deposit = pendingDeposits[index];
          return _buildDepositCard(deposit);
        },
      ),
    );
  }

  Widget _buildDepositCard(Map<String, dynamic> deposit) {
    // Safe value extraction with defaults
    final depositId = deposit['id'] as String? ?? '';
    final amount = (deposit['amount'] is num)
        ? (deposit['amount'] as num).toDouble()
        : 0.0;
    final status = deposit['status'] as String? ?? 'pending';
    final paymentMethod = deposit['payment_method'] as String? ?? 'غير محدد';
    final transactionId = deposit['transaction_id'] as String?;
    final createdAtStr = deposit['created_at'] as String?;

    // Safe user data extraction
    final userData = deposit['user'];
    final userName = userData is Map
        ? (userData['name'] as String? ?? 'مستخدم غير معروف')
        : 'مستخدم غير معروف';
    final userEmail = userData is Map
        ? (userData['email'] as String? ?? '')
        : '';

    // Parse date safely
    DateTime createdAt;
    try {
      createdAt = createdAtStr != null
          ? DateTime.parse(createdAtStr)
          : DateTime.now();
    } catch (e) {
      createdAt = DateTime.now();
    }

    // Status color
    Color statusColor;
    String statusText;
    switch (status.toLowerCase()) {
      case 'approved':
        statusColor = AppColors.success;
        statusText = 'مقبول';
        break;
      case 'rejected':
        statusColor = AppColors.error;
        statusText = 'مرفوض';
        break;
      default:
        statusColor = AppColors.warning;
        statusText = 'معلق';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: AppSizes.md),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppSizes.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        userName,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      if (userEmail.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          userEmail,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),

            // Details
            _buildDetailRow(
              'المبلغ',
              '${(amount * AppConfig.exchangeRate).toStringAsFixed(2)} EGP\n(\$${amount.toStringAsFixed(2)})',
            ),
            _buildDetailRow('طريقة الدفع', paymentMethod),
            if (transactionId != null && transactionId.isNotEmpty)
              _buildDetailRow('رقم المعاملة', transactionId),
            _buildDetailRow(
              'التاريخ',
              DateFormat('yyyy-MM-dd HH:mm').format(createdAt),
            ),

            // Action Buttons (only for pending)
            if (status.toLowerCase() == 'pending') ...[
              const SizedBox(height: AppSizes.md),
              // View Receipt Button (if screenshot exists)
              if (deposit['screenshot_url'] != null &&
                  (deposit['screenshot_url'] as String).isNotEmpty) ...[
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      _viewReceipt(deposit['screenshot_url'] as String);
                    },
                    icon: const Icon(Icons.receipt_long),
                    label: const Text('عرض الإيصال'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.info,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],
              // Approve/Reject Buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _approveDeposit(depositId),
                      icon: const Icon(Icons.check),
                      label: const Text('قبول'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _rejectDeposit(depositId),
                      icon: const Icon(Icons.close),
                      label: const Text('رفض'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.error,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
