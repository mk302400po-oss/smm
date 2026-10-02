import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center space-y-8 md:space-y-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight tracking-tight">
            نمِّ حساباتك
            <br />
            بسرعة البرق <span className="text-primary">⚡</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
            منصة احترافية موثوقة لزيادة المتابعين، اللايكات، والمشاهدات على جميع منصات التواصل الاجتماعي. صُممت لتقديم أفضل النتائج لعملائنا.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto px-8 rounded-full font-semibold")}>
                🚀 ابدأ الآن مجاناً
            </Link>
            <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full sm:w-auto px-8 rounded-full font-semibold")}>
                تسجيل الدخول
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-3xl mx-auto pt-12 px-4 border-t border-border mt-12">
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground">10K+</p>
              <p className="text-sm text-muted-foreground font-medium">عميل راضٍ</p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground">1M+</p>
              <p className="text-sm text-muted-foreground font-medium">طلب مكتمل</p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-primary">99.8%</p>
              <p className="text-sm text-muted-foreground font-medium">نسبة النجاح</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
