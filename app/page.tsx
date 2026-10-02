import React from 'react';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { PlatformsSection } from '@/components/landing/PlatformsSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary" dir="rtl">
      <Navbar />
      
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <PlatformsSection />
        <ServicesSection />
        <CTASection />
      </main>

      <Footer />
      
      <FloatingWhatsApp />
    </div>
  );
}

