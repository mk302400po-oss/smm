import React from 'react';
import { platforms } from '@/lib/constants/landing';

export function PlatformsSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4">
            <span className="text-primary">جميع المنصات</span> تحت سقف واحد
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">ندعم أكبر منصات التواصل الاجتماعي لتنمية تواجدك الرقمي.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 max-w-5xl mx-auto">
          {platforms.map((platform, index) => (
            <div key={index} className="bg-background border border-border rounded-2xl p-6 md:p-8 text-center hover:border-primary/50 hover:shadow-sm transition-all group cursor-pointer">
              <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${platform.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {platform.icon}
              </div>
              <p className="font-bold text-foreground text-sm md:text-base">{platform.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
