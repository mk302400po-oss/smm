import 'package:flutter/material.dart';
import '../config/app_config.dart';

/// Helper class for currency formatting and conversion
class CurrencyHelper {
  // Exchange rate: 1 USD = 50 EGP (from AppConfig)
  static const double usdToEgp = AppConfig.exchangeRate;

  /// Format amount in EGP (primary currency)
  static String formatEGP(double amount) {
    return '${amount.toStringAsFixed(2)} ج.م';
  }

  /// Format amount in USD (secondary currency)
  static String formatUSD(double amount) {
    return '\$${amount.toStringAsFixed(2)}';
  }

  /// Format dual currency: EGP primary, USD secondary
  /// Example: "500.00 ج.م\n(\$10.00)"
  static String formatDual(double egpAmount) {
    final usdAmount = egpAmount / usdToEgp;
    return '${egpAmount.toStringAsFixed(2)} ج.م\n(\$${usdAmount.toStringAsFixed(2)})';
  }

  /// Widget for dual currency display
  static Widget buildDualCurrency({
    required double egpAmount,
    TextStyle? primaryStyle,
    TextStyle? secondaryStyle,
  }) {
    final usdAmount = egpAmount / usdToEgp;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '${egpAmount.toStringAsFixed(2)} ج.م',
          style:
              primaryStyle ??
              const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        Text(
          '(\$${usdAmount.toStringAsFixed(2)})',
          style:
              secondaryStyle ??
              TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
      ],
    );
  }

  /// Convert USD to EGP
  static double usdToEgpAmount(double usd) {
    return usd * usdToEgp;
  }

  /// Convert EGP to USD
  static double egpToUsdAmount(double egp) {
    return egp / usdToEgp;
  }
}
