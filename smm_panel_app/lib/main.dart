import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';
import 'config/app_config.dart';
import 'config/app_theme.dart';
import 'services/supabase_service.dart';
import 'services/notification_service.dart';
import 'services/notification_service_inapp.dart';
import 'services/notification_sender_service.dart';
import 'services/fcm_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await SupabaseService.initialize();

  // Initialize Local Notifications
  try {
    await InAppNotificationService.initializeLocalNotifications();
  } catch (e) {
    debugPrint('Local notifications failed to initialize: $e');
  }

  // Initialize OneSignal
  OneSignal.Debug.setLogLevel(OSLogLevel.verbose);
  OneSignal.initialize("7fa49903-57b0-495b-a7a9-dddc16332da4");
  OneSignal.Notifications.requestPermission(true);

  // Start automatic notification sender
  NotificationSenderService.startListening();

  // Initialize FCM (Push Notifications)
  try {
    await FCMService.initialize();
  } catch (e) {
    debugPrint('FCM service failed to initialize: $e');
    // App will continue without push notifications
  }

  // Initialize Notifications (with error handling)
  try {
    await NotificationService.initialize();
  } catch (e) {
    debugPrint('Notification service failed to initialize: $e');
    // App will continue without notifications
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        colorScheme: ColorScheme.dark(
          primary: AppColors.primary,
          secondary: AppColors.secondary,
          surface: const Color(0xFF0F1629), // Dark navy like website
          // background: const Color(0xFF0A0F29), // Deprecated
        ),
        scaffoldBackgroundColor: const Color(
          0xFF0A0F29,
        ), // Match website dark bg
        appBarTheme: AppBarTheme(
          elevation: 0,
          centerTitle: true,
          backgroundColor: const Color(0xFF0F1629).withValues(alpha: 0.9),
          foregroundColor: Colors.white,
        ),
        cardTheme: CardThemeData(
          elevation: 4,
          color: const Color(0xFF1A1F3A), // Dark card color
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSizes.radiusM),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(
              horizontal: AppSizes.lg,
              vertical: AppSizes.md,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppSizes.radiusM),
            ),
          ),
        ),
        textTheme: GoogleFonts.cairoTextTheme().apply(
          bodyColor: Colors.white.withValues(alpha: 0.9),
          displayColor: Colors.white,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF1A1F3A),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppSizes.radiusM),
            borderSide: BorderSide(
              color: AppColors.primary.withValues(alpha: 0.3),
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppSizes.radiusM),
            borderSide: BorderSide(
              color: AppColors.primary.withValues(alpha: 0.2),
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppSizes.radiusM),
            borderSide: BorderSide(color: AppColors.primary, width: 2),
          ),
          contentPadding: const EdgeInsets.all(AppSizes.md),
        ),
        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: const Color(0xFF0F1629),
          selectedItemColor: AppColors.primary,
          unselectedItemColor: Colors.white.withValues(alpha: 0.5),
        ),
        useMaterial3: true,
      ),
      home: const NotificationListener(child: AuthWrapper()),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder(
      stream: SupabaseService.authStateChanges,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final session = snapshot.hasData ? snapshot.data!.session : null;

        if (session != null) {
          return const HomeScreen();
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}
