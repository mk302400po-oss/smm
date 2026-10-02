import 'package:flutter/material.dart';

class AppColors {
  // Dark Theme - Website Match
  static const Color background = Color(0xFF0A0F29); // Navy Dark
  static const Color surface = Color(0xFF0F1629); // Slightly lighter
  static const Color cardBg = Color(0xFF1A1F3A); // Card background

  // Purple Primary (from website)
  static const Color primary = Color(0xFF7C3AED); // Main purple
  static const Color primaryLight = Color(0xFFA855F7); // Light purple
  static const Color primaryDark = Color(0xFF6D28D9); // Dark purple

  // Secondary & Accents
  static const Color secondary = Color(0xFFEC4899); // Pink
  static const Color accent = Color(0xFF8B5CF6); // Purple accent

  // Status Colors
  static const Color success = Color(0xFF10B981); // Green
  static const Color error = Color(0xFFEF4444); // Red
  static const Color warning = Color(0xFFFBBF24); // Amber
  static const Color info = Color(0xFF3B82F6); // Blue

  // Text Colors (for dark theme)
  static const Color textPrimary = Color(0xFFF9FAFB); // Almost white
  static const Color textSecondary = Color(0xFFD1D5DB); // Light gray
  static const Color textMuted = Color(0xFF9CA3AF); // Muted gray

  // Border & Dividers
  static const Color border = Color(0xFF374151); // Dark gray
  static const Color divider = Color(0xFF1F2937); // Darker
}

class AppSizes {
  // Padding & Margins
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0; // Added XXL

  // Border Radius
  static const double radiusS = 8.0;
  static const double radiusM = 12.0;
  static const double radiusL = 16.0;
  static const double radiusXL = 24.0;

  // Icon Sizes
  static const double iconS = 16.0;
  static const double iconM = 24.0;
  static const double iconL = 32.0;
  static const double iconXL = 48.0;
}
