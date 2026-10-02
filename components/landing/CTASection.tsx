import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 md:p-12 lg:p-16 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4">
            جاهز <span className="text-primary">للانطلاق</span>؟
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto">
            انضم إلى آلاف العملاء الراضين وابدأ في تنمية حساباتك اليوم بأسهل وأسرع الطرق.
          </p>
          <Button asChild size="lg" className="w-full sm:w-auto px-10 rounded-full font-bold text-lg">
            <Link href="/register">إنشاء حساب مجاني الآن 🎉</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
