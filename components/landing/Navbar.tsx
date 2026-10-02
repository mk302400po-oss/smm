import React from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="Venom Media"
              className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />

          </Link>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex rounded-full")}>
                تسجيل الدخول
            </Link>
            <Link href="/register" className={cn(buttonVariants(), "rounded-full px-6")}>
                إنشاء حساب
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
