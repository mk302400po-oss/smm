import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../config/app_theme.dart';
import '../../services/supabase_service.dart';

class OrdersListScreen extends StatefulWidget {
  const OrdersListScreen({super.key});

  @override
  State<OrdersListScreen> createState() => _OrdersListScreenState();
}

class _OrdersListScreenState extends State<OrdersListScreen> {
  List<Map<String, dynamic>> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    try {
      final orders = await SupabaseService.getOrders();
      setState(() {
        _orders = orders;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('خطأ في تحميل الطلبات: $e')));
      }
    }
  }

  Future<void> _cancelOrder(String orderId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تأكيد الإلغاء'),
        content: const Text('هل أنت متأكد من إلغاء هذا الطلب؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('لا'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('نعم، إلغاء'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await SupabaseService.cancelOrder(orderId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم إلغاء الطلب بنجاح'),
            backgroundColor: AppColors.success,
          ),
        );
        _loadOrders();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('خطأ في إلغاء الطلب: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return AppColors.warning;
      case 'processing':
        return AppColors.info;
      case 'completed':
        return AppColors.success;
      case 'cancelled':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'قيد الانتظار';
      case 'processing':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('طلباتي'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadOrders),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _orders.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.shopping_bag_outlined,
                    size: 80,
                    color: AppColors.textSecondary.withOpacity(0.5),
                  ),
                  const SizedBox(height: AppSizes.md),
                  Text(
                    'لا توجد طلبات',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: AppSizes.sm),
                  const Text('ابدأ بإنشاء طلبك الأول'),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadOrders,
              child: ListView.builder(
                padding: const EdgeInsets.all(AppSizes.md),
                itemCount: _orders.length,
                itemBuilder: (context, index) {
                  final order = _orders[index];
                  final service = order['services'] as Map<String, dynamic>?;
                  final createdAt = DateTime.parse(order['created_at']);

                  // Use provider_order_id if available
                  final providerOrderId = order['provider_order_id']
                      ?.toString();
                  final displayOrderId =
                      providerOrderId ?? order['id'].toString().substring(0, 8);

                  return Card(
                    margin: const EdgeInsets.only(bottom: AppSizes.md),
                    child: InkWell(
                      onTap: () {
                        _showOrderDetails(order);
                      },
                      borderRadius: BorderRadius.circular(AppSizes.radiusM),
                      child: Padding(
                        padding: const EdgeInsets.all(AppSizes.md),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Service Name & Status
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    service?['name'] ?? 'Service',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(fontWeight: FontWeight.bold),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: AppSizes.sm,
                                    vertical: AppSizes.xs,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _getStatusColor(
                                      order['status'],
                                    ).withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(
                                      AppSizes.radiusS,
                                    ),
                                  ),
                                  child: Text(
                                    _getStatusText(order['status']),
                                    style: TextStyle(
                                      color: _getStatusColor(order['status']),
                                      fontWeight: FontWeight.w600,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: AppSizes.sm),

                            // Order ID (show only if provider_order_id exists)
                            if (providerOrderId != null) ...[
                              Row(
                                children: [
                                  const Icon(
                                    Icons.tag,
                                    size: 16,
                                    color: AppColors.primary,
                                  ),
                                  const SizedBox(width: AppSizes.xs),
                                  Text(
                                    'رقم الطلب: $displayOrderId',
                                    style: const TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w500,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: AppSizes.xs),
                            ],

                            // Service ID
                            Row(
                              children: [
                                const Icon(
                                  Icons.layers,
                                  size: 16,
                                  color: AppColors.info,
                                ),
                                const SizedBox(width: AppSizes.xs),
                                Text(
                                  'رقم الخدمة: ${order['service_id']?.toString() ?? '-'}',
                                  style: const TextStyle(
                                    color: AppColors.info,
                                    fontWeight: FontWeight.w500,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: AppSizes.xs),

                            // Order Details
                            Row(
                              children: [
                                const Icon(
                                  Icons.numbers,
                                  size: 16,
                                  color: AppColors.textSecondary,
                                ),
                                const SizedBox(width: AppSizes.xs),
                                Text(
                                  'الكمية: ${order['quantity']}',
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(width: AppSizes.md),
                                const Icon(
                                  Icons.attach_money,
                                  size: 16,
                                  color: AppColors.textSecondary,
                                ),
                                const SizedBox(width: AppSizes.xs),
                                Text(
                                  '\$${(order['total_price'] ?? 0).toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: AppSizes.xs),

                            // Date
                            Row(
                              children: [
                                const Icon(
                                  Icons.access_time,
                                  size: 16,
                                  color: AppColors.textSecondary,
                                ),
                                const SizedBox(width: AppSizes.xs),
                                Text(
                                  DateFormat(
                                    'yyyy-MM-dd HH:mm',
                                  ).format(createdAt),
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),

                            // Cancel Button (only for pending orders)
                            if (order['status'] == 'pending') ...[
                              const SizedBox(height: AppSizes.sm),
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton.icon(
                                  onPressed: () => _cancelOrder(order['id']),
                                  icon: const Icon(Icons.cancel, size: 18),
                                  label: const Text('إلغاء الطلب'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.error,
                                    side: const BorderSide(
                                      color: AppColors.error,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }

  void _showOrderDetails(Map<String, dynamic> order) {
    final service = order['services'] as Map<String, dynamic>?;
    final providerOrderId = order['provider_order_id']?.toString();
    final displayOrderId = providerOrderId ?? order['id'].toString();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSizes.radiusL),
        ),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(AppSizes.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'تفاصيل الطلب',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: AppSizes.lg),

              if (providerOrderId != null)
                _buildDetailRow('رقم الطلب', displayOrderId),
              _buildDetailRow(
                'رقم الخدمة',
                order['service_id']?.toString() ?? '-',
              ),
              _buildDetailRow('الخدمة', service?['name'] ?? '-'),
              _buildDetailRow('المنصة', service?['platform'] ?? '-'),
              _buildDetailRow('الفئة', service?['category'] ?? '-'),
              _buildDetailRow('الرابط', order['link'] ?? '-'),
              _buildDetailRow('الكمية', '${order['quantity']}'),
              _buildDetailRow(
                'السعر',
                '\$${(order['total_price'] ?? 0).toStringAsFixed(4)}',
              ),
              _buildDetailRow('الحالة', _getStatusText(order['status'])),
              _buildDetailRow(
                'التاريخ',
                DateFormat(
                  'yyyy-MM-dd HH:mm',
                ).format(DateTime.parse(order['created_at'])),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSizes.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}
