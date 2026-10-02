import React from 'react';
import { services } from '@/lib/constants/landing';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function ServicesSection() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4">
            خدمات <span className="text-primary">بأسعار تنافسية</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">جودة عالية وأسعار مناسبة للجميع، مع ضمان التنفيذ.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <div key={index} className="bg-background border border-border rounded-2xl p-6 md:p-8 hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="text-center space-y-4 md:space-y-6 flex-grow">
                <div className={`w-20 h-20 mx-auto rounded-2xl ${service.color} flex items-center justify-center mb-4`}>
                  {service.icon}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">{service.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{service.description}</p>
                
                <div className="py-6">
                  <p className="text-sm text-muted-foreground mb-1">يبدأ من</p>
                  <p className="text-4xl md:text-5xl font-black text-foreground">
                    {service.price}<span className="text-xl text-muted-foreground font-medium">/{service.unit}</span>
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-4">
                <Button asChild className="w-full rounded-xl" size="lg">
                  <Link href="/register">اطلب الآن 🚀</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
