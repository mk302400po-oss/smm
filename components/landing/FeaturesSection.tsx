import React from 'react';
import { features } from '@/lib/constants/landing';

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4">
            لماذا <span className="text-primary">نحن الأفضل</span>؟
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            نقدم أفضل الخدمات بتقنيات متطورة وأمان عالي لضمان نمو حساباتك بفعالية.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="bg-background border border-border rounded-2xl p-6 md:p-8 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4 md:mb-6">{feature.icon}</div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 md:mb-3">{feature.title}</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
