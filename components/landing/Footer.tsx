import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-border py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-primary mb-4 md:mb-6 flex items-center gap-2">
              <img src="/logo.png" alt="Venom Media" className="h-8 w-auto object-contain" />
              Venom Media
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              منصة احترافية مستقبلية لخدمات التواصل الاجتماعي، نوفر لك الأدوات اللازمة للنجاح الرقمي.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-foreground mb-4 md:mb-6">روابط سريعة</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-primary transition-colors">تسجيل الدخول</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">إنشاء حساب</Link></li>
              <li><Link href="/add-funds" className="hover:text-primary transition-colors">شحن الرصيد</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-foreground mb-4 md:mb-6">الخدمات</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><span>👥</span> متابعين</li>
              <li className="flex items-center gap-2"><span>❤️</span> لايكات</li>
              <li className="flex items-center gap-2"><span>👁️</span> مشاهدات</li>
              <li className="flex items-center gap-2"><span>💬</span> تعليقات</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-foreground mb-4 md:mb-6">تواصل معنا</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="break-all flex items-center gap-2"><span>📧</span> mk3024002@gmail.com</li>
              <li className="flex items-center gap-2"><span>📱</span> 01550289974</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-right">
          <p className="text-sm text-muted-foreground">&copy; 2026 Venom Media. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">الشروط والأحكام</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">سياسة الخصوصية</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
