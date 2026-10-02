import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../config/app_theme.dart';
import '../../services/supabase_service.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import '../../config/app_config.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _transactionIdController = TextEditingController();
  final _senderPhoneController = TextEditingController();

  double _balance = 0.0;
  List<Map<String, dynamic>> _depositRequests = [];
  bool _isLoading = true;
  bool _isSubmitting = false;
  String _selectedPaymentMethod = 'vodafone_cash';
  File? _screenshotFile;
  final ImagePicker _picker = ImagePicker();

  // Payment methods with their IDs
  final Map<String, Map<String, String>> _paymentMethods = {
    'vodafone_cash': {'name': 'فودافون كاش', 'id': '01035920160', 'icon': '📱'},
    'etisalat_cash': {'name': 'اتصالات كاش', 'id': '01112182199', 'icon': '📱'},
    'redotpay': {'name': 'RedotPay', 'id': '1590507094', 'icon': '💳'},
    'binance': {'name': 'Binance', 'id': '545177813', 'icon': '🔶'},
    'bybit': {'name': 'Bybit', 'id': '372157946', 'icon': '⚫'},
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _transactionIdController.dispose();
    _senderPhoneController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final profile = await SupabaseService.getUserProfile();
      final deposits = await SupabaseService.getDepositRequests();

      setState(() {
        _balance = (profile['balance'] ?? 0).toDouble();
        _depositRequests = deposits;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('خطأ في تحميل البيانات: $e')));
      }
    }
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _screenshotFile = File(image.path);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('خطأ في اختيار الصورة: $e')));
      }
    }
  }

  Future<void> _submitDepositRequest() async {
    if (!_formKey.currentState!.validate()) return;

    if (_screenshotFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('الرجاء رفع صورة التحويل (إجباري)'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // TODO: Upload screenshot to Supabase Storage
      // For now, we'll just store the local path

      final amountEGP = double.parse(_amountController.text);
      final amountUSD = amountEGP / AppConfig.exchangeRate;

      await SupabaseService.createDepositRequest(
        amount: amountUSD,
        paymentMethod: _selectedPaymentMethod,
        transactionId: _transactionIdController.text.trim().isEmpty
            ? null
            : _transactionIdController.text.trim(),
        senderPhone: _senderPhoneController.text.trim().isEmpty
            ? null
            : _senderPhoneController.text.trim(),
        screenshotUrl: _screenshotFile?.path,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم إرسال طلب الإيداع بنجاح! ✅\nسيتم مراجعته قريباً'),
            backgroundColor: AppColors.success,
          ),
        );
        _amountController.clear();
        _transactionIdController.clear();
        _senderPhoneController.clear();
        setState(() => _screenshotFile = null);
        Navigator.pop(context);
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('خطأ: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _showDepositForm() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSizes.radiusL),
        ),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: AppSizes.lg,
          right: AppSizes.lg,
          top: AppSizes.lg,
        ),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'طلب شحن رصيد',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: AppSizes.lg),

                // Payment Method
                DropdownButtonFormField<String>(
                  value: _selectedPaymentMethod,
                  decoration: const InputDecoration(
                    labelText: 'طريقة الدفع',
                    prefixIcon: Icon(Icons.payment),
                  ),
                  items: _paymentMethods.entries.map((entry) {
                    return DropdownMenuItem(
                      value: entry.key,
                      child: Row(
                        children: [
                          Text(entry.value['icon']!),
                          const SizedBox(width: AppSizes.sm),
                          Text(entry.value['name']!),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() => _selectedPaymentMethod = value!);
                  },
                ),
                const SizedBox(height: AppSizes.md),

                // Payment Info Card
                Container(
                  padding: const EdgeInsets.all(AppSizes.md),
                  decoration: BoxDecoration(
                    color: AppColors.info.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppSizes.radiusM),
                    border: Border.all(color: AppColors.info.withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.info_outline,
                            size: 20,
                            color: AppColors.info,
                          ),
                          const SizedBox(width: AppSizes.sm),
                          Text(
                            'بيانات التحويل',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: AppColors.info,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSizes.sm),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _paymentMethods[_selectedPaymentMethod]!['name']!,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          SelectableText(
                            _paymentMethods[_selectedPaymentMethod]!['id']!,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSizes.md),

                // Amount
                TextFormField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: const InputDecoration(
                    labelText: 'المبلغ (EGP)',
                    prefixIcon: Icon(Icons.attach_money),
                    hintText: '0.00',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'الرجاء إدخال المبلغ';
                    }
                    final amount = double.tryParse(value);
                    if (amount == null || amount <= 0) {
                      return 'الرجاء إدخال مبلغ صحيح';
                    }
                    if (amount < 50) {
                      return 'الحد الأدنى للإيداع: 50 EGP';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: AppSizes.md),

                // Transaction ID
                TextFormField(
                  controller: _transactionIdController,
                  decoration: const InputDecoration(
                    labelText: 'رقم العملية (اختياري)',
                    prefixIcon: Icon(Icons.receipt),
                    hintText: 'TXN123456',
                  ),
                ),
                const SizedBox(height: AppSizes.md),

                // Sender Phone Number
                TextFormField(
                  controller: _senderPhoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'رقم هاتف المُرسِل',
                    prefixIcon: Icon(Icons.phone),
                    hintText: '01234567890',
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'الرجاء إدخال رقم هاتف المُرسِل';
                    }
                    if (value.trim().length < 10) {
                      return 'رقم الهاتف غير صحيح';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: AppSizes.md),

                // Screenshot Upload
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: _screenshotFile == null
                          ? AppColors.error.withOpacity(0.5)
                          : AppColors.success.withOpacity(0.5),
                    ),
                    borderRadius: BorderRadius.circular(AppSizes.radiusM),
                  ),
                  child: InkWell(
                    onTap: _pickImage,
                    borderRadius: BorderRadius.circular(AppSizes.radiusM),
                    child: Padding(
                      padding: const EdgeInsets.all(AppSizes.md),
                      child: Column(
                        children: [
                          Icon(
                            _screenshotFile == null
                                ? Icons.upload_file
                                : Icons.check_circle,
                            size: 48,
                            color: _screenshotFile == null
                                ? AppColors.error
                                : AppColors.success,
                          ),
                          const SizedBox(height: AppSizes.sm),
                          Text(
                            _screenshotFile == null
                                ? 'اضغط لرفع صورة التحويل (إجباري) *'
                                : 'تم رفع الصورة ✓',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: _screenshotFile == null
                                  ? AppColors.error
                                  : AppColors.success,
                            ),
                          ),
                          if (_screenshotFile != null)
                            Text(
                              _screenshotFile!.path.split('/').last,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: AppSizes.lg),

                // Submit Button
                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitDepositRequest,
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('إرسال الطلب'),
                  ),
                ),
                const SizedBox(height: AppSizes.lg),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getDepositStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return AppColors.warning;
      case 'approved':
        return AppColors.success;
      case 'rejected':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  String _getDepositStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'قيد المراجعة';
      case 'approved':
        return 'مقبول';
      case 'rejected':
        return 'مرفوض';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('المحفظة'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(AppSizes.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Balance Card
                  Card(
                    color: AppColors.primary,
                    child: Padding(
                      padding: const EdgeInsets.all(AppSizes.lg),
                      child: Column(
                        children: [
                          const Icon(
                            Icons.account_balance_wallet,
                            size: 48,
                            color: Colors.white,
                          ),
                          const SizedBox(height: AppSizes.sm),
                          const Text(
                            'الرصيد الحالي',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: AppSizes.xs),
                          Text(
                            '${(_balance * AppConfig.exchangeRate).toStringAsFixed(2)} EGP',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '\$${_balance.toStringAsFixed(2)} USD',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSizes.lg),

                  // Deposit Button
                  SizedBox(
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: _showDepositForm,
                      icon: const Icon(Icons.add),
                      label: const Text('شحن رصيد'),
                    ),
                  ),
                  const SizedBox(height: AppSizes.xl),

                  // Deposit Requests Section
                  Text(
                    'طلبات الإيداع',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppSizes.md),

                  if (_depositRequests.isEmpty)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(AppSizes.lg),
                        child: Center(
                          child: Column(
                            children: [
                              Icon(
                                Icons.receipt_long_outlined,
                                size: 48,
                                color: AppColors.textSecondary.withOpacity(0.5),
                              ),
                              const SizedBox(height: AppSizes.sm),
                              const Text('لا توجد طلبات إيداع'),
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    ..._depositRequests.map((deposit) {
                      final createdAt = DateTime.parse(deposit['created_at']);

                      return Card(
                        margin: const EdgeInsets.only(bottom: AppSizes.sm),
                        child: Padding(
                          padding: const EdgeInsets.all(AppSizes.md),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '\$${deposit['amount'].toStringAsFixed(2)}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleLarge
                                        ?.copyWith(
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primary,
                                        ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AppSizes.sm,
                                      vertical: AppSizes.xs,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _getDepositStatusColor(
                                        deposit['status'],
                                      ).withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(
                                        AppSizes.radiusS,
                                      ),
                                    ),
                                    child: Text(
                                      _getDepositStatusText(deposit['status']),
                                      style: TextStyle(
                                        color: _getDepositStatusColor(
                                          deposit['status'],
                                        ),
                                        fontWeight: FontWeight.w600,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: AppSizes.sm),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.payment,
                                    size: 16,
                                    color: AppColors.textSecondary,
                                  ),
                                  const SizedBox(width: AppSizes.xs),
                                  Text(
                                    _paymentMethods[deposit['payment_method']]?['name'] ??
                                        deposit['payment_method'] ??
                                        '-',
                                    style: const TextStyle(
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                              if (deposit['transaction_id'] != null) ...[
                                const SizedBox(height: AppSizes.xs),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.receipt,
                                      size: 16,
                                      color: AppColors.textSecondary,
                                    ),
                                    const SizedBox(width: AppSizes.xs),
                                    Text(
                                      'رقم العملية: ${deposit['transaction_id']}',
                                      style: const TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                              const SizedBox(height: AppSizes.xs),
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
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
