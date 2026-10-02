import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/supabase_service.dart';

class OrdersManagementTab extends StatefulWidget {
  const OrdersManagementTab({super.key});

  @override
  State<OrdersManagementTab> createState() => _OrdersManagementTabState();
}

class _OrdersManagementTabState extends State<OrdersManagementTab> {
  List<Map<String, dynamic>> _orders = [];
  bool _isLoading = true;
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    try {
      final orders = await SupabaseService.getAllOrders();
      setState(() {
        _orders = orders;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('خطأ: $e')));
      }
    }
  }

  List<Map<String, dynamic>> get _filteredOrders {
    if (_statusFilter == 'all') return _orders;
    return _orders.where((order) => order['status'] == _statusFilter).toList();
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return AppColors.warning;
      case 'in_progress':
        return AppColors.info;
      case 'completed':
        return AppColors.success;
      case 'cancelled':
      case 'failed':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'معلق';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      case 'failed':
        return 'فشل';
      default:
        return status;
    }
  }

  Future<void> _changeStatus(String orderId, String currentStatus) async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تغيير حالة الطلب'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildStatusRadio('pending', 'معلق', currentStatus),
            _buildStatusRadio('in_progress', 'قيد التنفيذ', currentStatus),
            _buildStatusRadio('completed', 'مكتمل', currentStatus),
            _buildStatusRadio('failed', 'فشل', currentStatus),
          ],
        ),
      ),
    );

    if (result != null && result != currentStatus) {
      try {
        await SupabaseService.updateOrderStatus(orderId, result);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم تحديث حالة الطلب بنجاح')),
        );
        _loadOrders();
      } catch (e) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('خطأ: $e')));
      }
    }
  }

  Widget _buildStatusRadio(String value, String label, String groupValue) {
    return ListTile(
      title: Text(label),
      leading: Radio<String>(
        value: value,
        groupValue: groupValue,
        onChanged: (val) => Navigator.pop(context, val),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      children: [
        // Filter Chips
        Padding(
          padding: const EdgeInsets.all(AppSizes.md),
          child: Wrap(
            spacing: AppSizes.sm,
            children: [
              FilterChip(
                label: const Text('الكل'),
                selected: _statusFilter == 'all',
                onSelected: (selected) => setState(() => _statusFilter = 'all'),
              ),
              FilterChip(
                label: const Text('معلق'),
                selected: _statusFilter == 'pending',
                onSelected: (selected) =>
                    setState(() => _statusFilter = 'pending'),
              ),
              FilterChip(
                label: const Text('قيد التنفيذ'),
                selected: _statusFilter == 'in_progress',
                onSelected: (selected) =>
                    setState(() => _statusFilter = 'in_progress'),
              ),
              FilterChip(
                label: const Text('مكتمل'),
                selected: _statusFilter == 'completed',
                onSelected: (selected) =>
                    setState(() => _statusFilter = 'completed'),
              ),
            ],
          ),
        ),

        // Orders List
        Expanded(
          child: _filteredOrders.isEmpty
              ? const Center(child: Text('لا توجد طلبات'))
              : ListView.builder(
                  itemCount: _filteredOrders.length,
                  itemBuilder: (context, index) {
                    final order = _filteredOrders[index];
                    final service = order['service'];
                    final user = order['user'];

                    return Card(
                      margin: const EdgeInsets.symmetric(
                        horizontal: AppSizes.md,
                        vertical: AppSizes.xs,
                      ),
                      child: ExpansionTile(
                        title: Text(service?['name'] ?? 'خدمة غير معروفة'),
                        subtitle: Text(user?['name'] ?? 'مستخدم غير معروف'),
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: _getStatusColor(
                              order['status'],
                            ).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.shopping_cart,
                            color: _getStatusColor(order['status']),
                          ),
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: _getStatusColor(
                              order['status'],
                            ).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _getStatusText(order['status']),
                            style: TextStyle(
                              color: _getStatusColor(order['status']),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(AppSizes.md),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Show provider_order_id if available
                                if (order['provider_order_id'] != null)
                                  _buildInfoRow(
                                    'رقم الطلب',
                                    order['provider_order_id'].toString(),
                                  ),
                                _buildInfoRow('الرابط', order['link'] ?? '-'),
                                _buildInfoRow(
                                  'رقم الخدمة',
                                  order['service_id']?.toString() ?? '-',
                                ),
                                _buildInfoRow(
                                  'الكمية',
                                  order['quantity'].toString(),
                                ),
                                _buildInfoRow(
                                  'البريد الإلكتروني',
                                  user?['email'] ?? '-',
                                ),
                                const SizedBox(height: AppSizes.md),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    onPressed: () => _changeStatus(
                                      order['id'],
                                      order['status'],
                                    ),
                                    icon: const Icon(Icons.edit),
                                    label: const Text('تغيير الحالة'),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
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
                fontWeight: FontWeight.bold,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
