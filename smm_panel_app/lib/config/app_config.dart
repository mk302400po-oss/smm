import 'package:flutter/foundation.dart';

class AppConfig {
  // Supabase Configuration
  static const String supabaseUrl = 'https://vbdoyidihtjukycvwalb.supabase.co';
  static const String supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZG95aWRpaHRqdWt5Y3Z3YWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTEyMjIsImV4cCI6MjA4MjkyNzIyMn0.jT49Fz2D6OV5D52g9R3FSNwMaTBDH4vWx9UzGCUCm0M';

  // App Info
  static const String appName = 'Venom Media';
  static const String appVersion = '1.0.0';

  // API Endpoints
  static const String apiBaseUrl = 'YOUR_API_URL';

  // Debug Mode
  static bool get isDebugMode => kDebugMode;

  // Notification Channels
  static const String ordersChannelId = 'orders';
  static const String depositsChannelId = 'deposits';
  static const String adminChannelId = 'admin';

  // Currency
  static const double exchangeRate = 50.0;
}
