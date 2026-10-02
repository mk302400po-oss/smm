import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../config/app_config.dart';
import '../../services/supabase_service.dart';

class NewOrderScreen extends StatefulWidget {
  const NewOrderScreen({super.key});

  @override
  State<NewOrderScreen> createState() => _NewOrderScreenState();
}

class _NewOrderScreenState extends State<NewOrderScreen> {
  final _formKey = GlobalKey<FormState>();
  final _linkController = TextEditingController();
  final _quantityController = TextEditingController();

  List<Map<String, dynamic>> _services = [];
  List<String> _platforms = [];
  List<String> _categories = [];

  String? _selectedPlatform;
  String? _selectedCategory;
  Map<String, dynamic>? _selectedService;

  bool _isLoading = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  @override
  void dispose() {
    _linkController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  Future<void> _loadServices() async {
    try {
      final services = await SupabaseService.getServices();
      final platforms = services
          .map((s) => s['platform'] as String)
          .toSet()
          .toList();
      platforms.sort();

      setState(() {
        _services = services;
        _platforms = platforms;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('خطأ في تحميل الخدمات: $e')));
      }
    }
  }

  List<String> get _filteredCategories {
    if (_selectedPlatform == null) return [];

    final categories = _services
        .where((s) => s['platform'] == _selectedPlatform)
        .map((s) => s['category'] as String)
        .toSet()
        .toList();
    categories.sort();
    return categories;
  }

  List<Map<String, dynamic>> get _filteredServices {
    if (_selectedCategory == null) return [];

    return _services
        .where(
          (s) =>
              s['platform'] == _selectedPlatform &&
              s['category'] == _selectedCategory,
        )
        .toList();
  }

  // Helper function to get price from service (handles both price and price_per_1000)
  double _getServicePrice(Map<String, dynamic> service) {
    // Try price_per_1000 first
    final pricePerK = (service['price_per_1000'] as num?)?.toDouble();
    if (pricePerK != null && pricePerK > 0) {
      return pricePerK;
    }

    // Fall back to price field
    final price = (service['price'] as num?)?.toDouble();
    if (price != null && price > 0) {
      return price * 1000; // Convert to price_per_1000 format
    }

    return 0.0;
  }

  double _calculateTotalPrice() {
    if (_selectedService == null || _quantityController.text.isEmpty) {
      return 0.0;
    }

    try {
      final quantity = int.parse(_quantityController.text);
      final pricePerThousand = _getServicePrice(_selectedService!);

      return (quantity / 1000) * pricePerThousand;
    } catch (e) {
      return 0.0;
    }
  }

  Future<void> _submitOrder() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedService == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('الرجاء اختيار خدمة')));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await SupabaseService.createOrder(
        serviceId: _selectedService!['id'],
        link: _linkController.text,
        quantity: int.parse(_quantityController.text),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم إنشاء الطلب بنجاح ✅'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('خطأ: $e')));
      }
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('طلب جديد')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('طلب جديد'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSizes.md),
          children: [
            // Platform Dropdown
            DropdownButtonFormField<String>(
              value: _selectedPlatform,
              decoration: const InputDecoration(
                labelText: 'اختر المنصة',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.category),
              ),
              items: _platforms.map((platform) {
                return DropdownMenuItem(value: platform, child: Text(platform));
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedPlatform = value;
                  _selectedCategory = null;
                  _selectedService = null;
                });
              },
              validator: (value) =>
                  value == null ? 'الرجاء اختيار المنصة' : null,
            ),

            const SizedBox(height: AppSizes.md),

            // Category Dropdown
            if (_selectedPlatform != null)
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(
                  labelText: 'اختر الفئة',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.list),
                ),
                items: _filteredCategories.map((category) {
                  return DropdownMenuItem(
                    value: category,
                    child: Text(category),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedCategory = value;
                    _selectedService = null;
                  });
                },
                validator: (value) =>
                    value == null ? 'الرجاء اختيار الفئة' : null,
              ),

            const SizedBox(height: AppSizes.md),

            // Service Dropdown
            if (_selectedCategory != null)
              DropdownButtonFormField<Map<String, dynamic>>(
                value: _selectedService,
                decoration: const InputDecoration(
                  labelText: 'اختر الخدمة',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.build),
                ),
                items: _filteredServices.map((service) {
                  final serviceName =
                      service['name'] as String? ?? 'خدمة غير معروفة';
                  final pricePerK = _getServicePrice(service);

                  return DropdownMenuItem(
                    value: service,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          serviceName,
                          style: const TextStyle(fontSize: 14),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '\$${pricePerK.toStringAsFixed(2)} / ${(pricePerK * AppConfig.exchangeRate).toStringAsFixed(2)} EGP',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() => _selectedService = value);
                },
                validator: (value) =>
                    value == null ? 'الرجاء اختيار الخدمة' : null,
                isExpanded: true,
              ),

            const SizedBox(height: AppSizes.lg),

            // Service Details Card
            if (_selectedService != null) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppSizes.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'تفاصيل الخدمة',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: AppSizes.sm),
                      _buildDetailRow(
                        'الحد الأدنى',
                        '${(_selectedService!['min_quantity'] as num?)?.toInt() ?? 0} وحدة',
                      ),
                      _buildDetailRow(
                        'الحد الأقصى',
                        '${(_selectedService!['max_quantity'] as num?)?.toInt() ?? 0} وحدة',
                      ),
                      _buildDetailRow(
                        'السعر',
                        '\$${_getServicePrice(_selectedService!).toStringAsFixed(2)} / ${(_getServicePrice(_selectedService!) * AppConfig.exchangeRate).toStringAsFixed(2)} EGP',
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSizes.lg),
            ],

            // Link Input
            if (_selectedService != null)
              TextFormField(
                controller: _linkController,
                decoration: const InputDecoration(
                  labelText: 'الرابط',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.link),
                  hintText: 'أدخل رابط الحساب أو المنشور',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'الرجاء إدخال الرابط';
                  }
                  if (!value.startsWith('http')) {
                    return 'الرجاء إدخال رابط صحيح';
                  }
                  return null;
                },
                keyboardType: TextInputType.url,
              ),

            const SizedBox(height: AppSizes.md),

            // Quantity Input
            if (_selectedService != null)
              TextFormField(
                controller: _quantityController,
                decoration: const InputDecoration(
                  labelText: 'الكمية',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.numbers),
                  hintText: 'أدخل الكمية المطلوبة',
                ),
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'الرجاء إدخال الكمية';
                  }
                  final quantity = int.tryParse(value);
                  if (quantity == null) {
                    return 'الرجاء إدخال رقم صحيح';
                  }
                  final min =
                      (_selectedService!['min_quantity'] as num?)?.toInt() ?? 0;
                  final max =
                      (_selectedService!['max_quantity'] as num?)?.toInt() ?? 0;
                  if (quantity < min || quantity > max) {
                    return 'الكمية يجب أن تكون بين $min و $max';
                  }
                  return null;
                },
              ),

            const SizedBox(height: AppSizes.lg),

            // Price Display
            if (_selectedService != null && _quantityController.text.isNotEmpty)
              Card(
                color: AppColors.primary.withAlpha(20),
                child: Padding(
                  padding: const EdgeInsets.all(AppSizes.md),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'السعر الإجمالي:',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '\$${_calculateTotalPrice().toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('بالجنيه المصري:'),
                          Text(
                            '${(_calculateTotalPrice() * AppConfig.exchangeRate).toStringAsFixed(2)} EGP',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: AppSizes.xl),

            // Submit Button
            if (_selectedService != null)
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submitOrder,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: AppSizes.md),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppSizes.radiusM),
                  ),
                ),
                child: _isSubmitting
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        'إنشاء الطلب',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
