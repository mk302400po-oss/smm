import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../config/app_theme.dart';
import '../../services/supabase_service.dart';

class ActivityLogTab extends StatefulWidget {
  const ActivityLogTab({super.key});

  @override
  State<ActivityLogTab> createState() => _ActivityLogTabState();
}

class _ActivityLogTabState extends State<ActivityLogTab> {
  List<Map<String, dynamic>> _activities = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _filterType = 'all';

  // Use app theme colors for consistency
  static const Color _primaryBlue = AppColors.primary; // Purple from theme
  static const Color _successGreen = AppColors.success; // Green
  static const Color _warningOrange = AppColors.warning; // Amber/Orange
  static const Color _dangerRed = AppColors.error; // Red
  static const Color _infoPurple = AppColors.accent; // Purple accent
  static const Color _neutralGray = AppColors.textMuted; // Muted gray
  static const Color _lightBackground = AppColors.surface; // Dark surface
  static const Color _cardWhite = AppColors.cardBg; // Card bg (dark)
  static const Color _textDark =
      AppColors.textPrimary; // Light text (for dark theme)
  static const Color _textSecondary = AppColors.textSecondary; // Secondary text

  @override
  void initState() {
    super.initState();
    _loadActivity();
  }

  Future<void> _loadActivity() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final activities = await SupabaseService.getRecentActivity();

      if (mounted) {
        setState(() {
          _activities = activities;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'خطأ في تحميل السجل: $e';
        });
      }
    }
  }

  List<Map<String, dynamic>> get _filteredActivities {
    if (_filterType == 'all') return _activities;
    return _activities
        .where((activity) => activity['action_type'] == _filterType)
        .toList();
  }

  IconData _getActivityIcon(String? actionType) {
    switch (actionType?.toLowerCase()) {
      case 'user_registered':
        return Icons.person_add_alt_1_rounded;
      case 'order_created':
        return Icons.shopping_bag_rounded;
      case 'order_status_changed':
        return Icons.sync_alt_rounded;
      case 'deposit_requested':
        return Icons.account_balance_wallet_outlined;
      case 'deposit_approved':
        return Icons.check_circle_outline_rounded;
      case 'deposit_rejected':
        return Icons.highlight_off_rounded;
      default:
        return Icons.info_outline_rounded;
    }
  }

  Color _getActivityColor(String? actionType) {
    switch (actionType?.toLowerCase()) {
      case 'user_registered':
        return _successGreen;
      case 'order_created':
        return _primaryBlue;
      case 'deposit_approved':
        return _successGreen;
      case 'deposit_rejected':
        return _dangerRed;
      case 'order_status_changed':
        return _warningOrange;
      case 'deposit_requested':
        return _infoPurple;
      default:
        return _neutralGray;
    }
  }

  String _getActivityTitle(String? actionType) {
    switch (actionType?.toLowerCase()) {
      case 'user_registered':
        return 'مستخدم جديد';
      case 'order_created':
        return 'طلب جديد';
      case 'deposit_approved':
        return 'موافقة إيداع';
      case 'deposit_rejected':
        return 'رفض إيداع';
      case 'order_status_changed':
        return 'تحديث حالة';
      case 'deposit_requested':
        return 'طلب إيداع';
      default:
        return 'نشاط';
    }
  }

  String _getEnhancedDescription(Map<String, dynamic> activity) {
    final actionType = activity['action_type'] as String?;
    final description = activity['description'] as String? ?? 'نشاط غير معروف';
    final metadata = activity['metadata'] as Map<String, dynamic>?;

    if (metadata == null) return description;

    try {
      if (actionType == 'deposit_approved' ||
          actionType == 'deposit_rejected') {
        final amount = metadata['amount'];
        if (amount != null) {
          final egpAmount = (amount as num) * 50;
          final usdAmount = (amount as num);
          return '${egpAmount.toStringAsFixed(2)} ج.م (\$${usdAmount.toStringAsFixed(2)})';
        }
      }

      if (actionType == 'order_created') {
        final orderId = metadata['order_id'];
        final serviceName = metadata['service_name'];
        if (orderId != null && serviceName != null) {
          return '$serviceName\nرقم الطلب: ${orderId.toString().substring(0, 8)}...';
        }
      }

      if (actionType == 'order_status_changed') {
        final orderId = metadata['order_id'];
        final newStatus = metadata['new_status'];
        if (orderId != null) {
          final statusText = _translateStatus(newStatus);
          return 'رقم الطلب: ${orderId.toString().substring(0, 8)}...\nالحالة: $statusText';
        }
      }
    } catch (e) {
      debugPrint('Error parsing metadata: $e');
    }

    return description;
  }

  String _translateStatus(dynamic status) {
    if (status == null) return '';
    switch (status.toString().toLowerCase()) {
      case 'pending':
        return 'قيد الانتظار';
      case 'processing':
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
      case 'canceled':
        return 'ملغي';
      case 'failed':
        return 'فشل';
      default:
        return status.toString();
    }
  }

  String _getRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'الآن';
    } else if (difference.inHours < 1) {
      return 'منذ ${difference.inMinutes} دقيقة';
    } else if (difference.inDays < 1) {
      return 'منذ ${difference.inHours} ساعة';
    } else if (difference.inDays < 7) {
      return 'منذ ${difference.inDays} يوم';
    } else {
      return DateFormat('yyyy/MM/dd').format(dateTime);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: _lightBackground,
      child: Column(
        children: [
          // Header with filter chips
          _buildHeader(),

          // Content
          Expanded(
            child: _isLoading
                ? _buildLoadingState()
                : _errorMessage != null
                ? _buildErrorState()
                : _activities.isEmpty
                ? _buildEmptyState()
                : _buildActivityList(),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardWhite,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            offset: const Offset(0, 2),
            blurRadius: 4,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.history_rounded, color: _primaryBlue, size: 24),
              const SizedBox(width: 8),
              const Text(
                'سجل النشاطات',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: _textDark,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: _loadActivity,
                icon: const Icon(Icons.refresh_rounded),
                color: _primaryBlue,
                tooltip: 'تحديث',
              ),
            ],
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip(
                  'all',
                  'الكل',
                  Icons.select_all_rounded,
                  _primaryBlue,
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'deposit_approved',
                  'موافقات',
                  Icons.check_circle_rounded,
                  _successGreen,
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'deposit_rejected',
                  'رفض',
                  Icons.cancel_rounded,
                  _dangerRed,
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'order_created',
                  'طلبات',
                  Icons.shopping_cart_rounded,
                  _primaryBlue,
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'user_registered',
                  'مستخدمين',
                  Icons.person_add_rounded,
                  _successGreen,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(
    String type,
    String label,
    IconData icon,
    Color color,
  ) {
    final isSelected = _filterType == type;

    return Material(
      color: isSelected ? color.withOpacity(0.12) : Colors.grey.shade100,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: () => setState(() => _filterType = type),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? color : Colors.transparent,
              width: 2,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: isSelected ? color : _textSecondary),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? color : _textSecondary,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: _primaryBlue),
          const SizedBox(height: 16),
          Text(
            'جاري تحميل السجل...',
            style: TextStyle(color: _textSecondary, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: _dangerRed.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline_rounded,
                size: 64,
                color: _dangerRed,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              _errorMessage!,
              style: TextStyle(
                color: _dangerRed,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadActivity,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('إعادة المحاولة'),
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryBlue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    _primaryBlue.withOpacity(0.1),
                    _infoPurple.withOpacity(0.1),
                  ],
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.history_rounded, size: 80, color: _primaryBlue),
            ),
            const SizedBox(height: 24),
            const Text(
              'لا توجد أنشطة في السجل',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: _textDark,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'الأنشطة ستظهر هنا عند حدوثها',
              style: TextStyle(fontSize: 14, color: _textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityList() {
    return RefreshIndicator(
      onRefresh: _loadActivity,
      color: _primaryBlue,
      child: _filteredActivities.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'لا توجد أنشطة لهذا الفلتر',
                  style: TextStyle(fontSize: 16, color: _textSecondary),
                ),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: _filteredActivities.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final activity = _filteredActivities[index];
                return _buildActivityCard(activity, index);
              },
            ),
    );
  }

  Widget _buildActivityCard(Map<String, dynamic> activity, int index) {
    final actionType = activity['action_type'] as String?;
    final description = _getEnhancedDescription(activity);
    final createdAtStr = activity['created_at'] as String?;
    final userData = activity['user'];

    String userName = 'مستخدم';
    if (userData is Map) {
      userName =
          userData['name'] as String? ??
          userData['email'] as String? ??
          'مستخدم';
    }

    DateTime createdAt;
    try {
      createdAt = createdAtStr != null
          ? DateTime.parse(createdAtStr)
          : DateTime.now();
    } catch (e) {
      createdAt = DateTime.now();
    }

    final color = _getActivityColor(actionType);
    final icon = _getActivityIcon(actionType);
    final title = _getActivityTitle(actionType);

    return TweenAnimationBuilder<double>(
      duration: Duration(milliseconds: 300 + (index * 30)),
      tween: Tween(begin: 0.0, end: 1.0),
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 20 * (1 - value)),
            child: child,
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: _cardWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200, width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              offset: const Offset(0, 2),
              blurRadius: 8,
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {},
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icon
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: color.withOpacity(0.3),
                          offset: const Offset(0, 4),
                          blurRadius: 12,
                        ),
                      ],
                    ),
                    child: Icon(icon, color: Colors.white, size: 26),
                  ),
                  const SizedBox(width: 14),
                  // Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: color.withOpacity(0.2),
                              width: 1,
                            ),
                          ),
                          child: Text(
                            title,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: color,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Description
                        Text(
                          description,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                            height: 1.4,
                            color: _textDark,
                          ),
                        ),
                        const SizedBox(height: 12),
                        // User and Time Row
                        Row(
                          children: [
                            // User
                            Flexible(
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: Colors.blue.shade100,
                                    width: 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.person_outline_rounded,
                                      size: 14,
                                      color: Colors.blue.shade700,
                                    ),
                                    const SizedBox(width: 6),
                                    Flexible(
                                      child: Text(
                                        userName.length > 15
                                            ? '${userName.substring(0, 15)}...'
                                            : userName,
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.blue.shade900,
                                          fontWeight: FontWeight.w600,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Time
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.amber.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: Colors.amber.shade100,
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.access_time_rounded,
                                    size: 14,
                                    color: Colors.amber.shade800,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    _getRelativeTime(createdAt),
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.amber.shade900,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
