import { useRef, useState } from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import StatsSection from '@/components/landing/StatsSection';
import CTASection from '@/components/landing/CTASection';
import LandingFooter from '@/components/landing/LandingFooter';
import BackToTop from '@/components/landing/BackToTop';
import ModernLogin from '@/components/ModernLogin';
import { useLandingGsap } from '@/hooks/useLandingGsap';

const LandingPage = () => {
  const landingRef = useRef<HTMLDivElement>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  useLandingGsap(landingRef);

  return (
    <div ref={landingRef} className="min-h-screen bg-background">
      <LandingHeader onOpenLogin={() => setLoginOpen(true)} />
      <main>
        <HeroSection onOpenLogin={() => setLoginOpen(true)} />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <CTASection onOpenLogin={() => setLoginOpen(true)} />
      </main>
      <LandingFooter />
      <BackToTop />
      <ModernLogin open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
};

export default LandingPage;
