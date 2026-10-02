import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/supabase_service.dart';

class UsersManagementTab extends StatefulWidget {
  const UsersManagementTab({super.key});

  @override
  State<UsersManagementTab> createState() => _UsersManagementTabState();
}

class _UsersManagementTabState extends State<UsersManagementTab> {
  List<Map<String, dynamic>> _users = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    try {
      final users = await SupabaseService.getAllUsers();
      setState(() {
        _users = users;
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

  List<Map<String, dynamic>> get _filteredUsers {
    if (_searchQuery.isEmpty) return _users;
    return _users.where((user) {
      final name = (user['name'] ?? '').toString().toLowerCase();
      final email = (user['email'] ?? '').toString().toLowerCase();
      return name.contains(_searchQuery.toLowerCase()) ||
          email.contains(_searchQuery.toLowerCase());
    }).toList();
  }

  Future<void> _updateBalance(String userId, String currentBalance) async {
    final controller = TextEditingController(text: currentBalance);
    final result = await showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تعديل الرصيد'),
        content: TextField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(
            labelText: 'الرصيد الجديد (\$)',
            prefixIcon: Icon(Icons.attach_money),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              final amount = double.tryParse(controller.text);
              if (amount != null) {
                Navigator.pop(context, amount);
              }
            },
            child: const Text('حفظ'),
          ),
        ],
      ),
    );

    if (result != null) {
      try {
        await SupabaseService.updateUserBalance(userId, result);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('تم تحديث الرصيد بنجاح')));
        _loadUsers();
      } catch (e) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('خطأ: $e')));
      }
    }
  }

  Future<void> _changeRole(String userId, String currentRole) async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تغيير نوع الحساب'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('مستخدم عادي'),
              leading: Radio<String>(
                value: 'user',
                groupValue: currentRole,
                onChanged: (value) => Navigator.pop(context, value),
              ),
            ),
            ListTile(
              title: const Text('مدير'),
              leading: Radio<String>(
                value: 'admin',
                groupValue: currentRole,
                onChanged: (value) => Navigator.pop(context, value),
              ),
            ),
          ],
        ),
      ),
    );

    if (result != null && result != currentRole) {
      try {
        await SupabaseService.updateUserRole(userId, result);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم تغيير نوع الحساب بنجاح')),
        );
        _loadUsers();
      } catch (e) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('خطأ: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      children: [
        // Search Bar
        Padding(
          padding: const EdgeInsets.all(AppSizes.md),
          child: TextField(
            decoration: const InputDecoration(
              hintText: 'بحث بالاسم أو البريد...',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (value) => setState(() => _searchQuery = value),
          ),
        ),

        // Users List
        Expanded(
          child: _filteredUsers.isEmpty
              ? const Center(child: Text('لا توجد نتائج'))
              : ListView.builder(
                  itemCount: _filteredUsers.length,
                  itemBuilder: (context, index) {
                    final user = _filteredUsers[index];
                    final isActive = user['active'] ?? true;

                    return Card(
                      margin: const EdgeInsets.symmetric(
                        horizontal: AppSizes.md,
                        vertical: AppSizes.xs,
                      ),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isActive
                              ? AppColors.primary.withOpacity(0.1)
                              : Colors.grey.withOpacity(0.1),
                          child: Text(
                            (user['name'] ?? 'U')[0].toUpperCase(),
                            style: TextStyle(
                              color: isActive ? AppColors.primary : Colors.grey,
                            ),
                          ),
                        ),
                        title: Text(user['name'] ?? 'Unknown'),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(user['email'] ?? ''),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: user['role'] == 'admin'
                                        ? AppColors.primary.withOpacity(0.2)
                                        : AppColors.info.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    user['role'] == 'admin' ? 'مدير' : 'مستخدم',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: user['role'] == 'admin'
                                          ? AppColors.primary
                                          : AppColors.info,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '\$${(user['balance'] ?? 0).toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.success,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        trailing: PopupMenuButton(
                          itemBuilder: (context) => [
                            const PopupMenuItem(
                              value: 'balance',
                              child: Row(
                                children: [
                                  Icon(Icons.account_balance_wallet, size: 20),
                                  SizedBox(width: 8),
                                  Text('تعديل الرصيد'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: 'role',
                              child: Row(
                                children: [
                                  Icon(Icons.admin_panel_settings, size: 20),
                                  SizedBox(width: 8),
                                  Text('تغيير نوع الحساب'),
                                ],
                              ),
                            ),
                            PopupMenuItem(
                              value: 'toggle',
                              child: Row(
                                children: [
                                  Icon(
                                    isActive ? Icons.block : Icons.check_circle,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    isActive ? 'تعطيل الحساب' : 'تفعيل الحساب',
                                  ),
                                ],
                              ),
                            ),
                          ],
                          onSelected: (value) async {
                            switch (value) {
                              case 'balance':
                                _updateBalance(
                                  user['id'],
                                  (user['balance'] ?? 0).toString(),
                                );
                                break;
                              case 'role':
                                _changeRole(user['id'], user['role'] ?? 'user');
                                break;
                              case 'toggle':
                                try {
                                  await SupabaseService.toggleUserStatus(
                                    user['id'],
                                    !isActive,
                                  );
                                  _loadUsers();
                                } catch (e) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('خطأ: $e')),
                                  );
                                }
                                break;
                            }
                          },
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
