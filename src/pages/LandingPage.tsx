import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { supabase } from '@/SupabaseClient';

const LandingPage = () => {
  const landingRef = useRef<HTMLDivElement>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const navigate = useNavigate();
  useLandingGsap(landingRef);

  const handleOpenScanner = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/dashboard');
      return;
    }
    setLoginOpen(true);
  };

  return (
    <div ref={landingRef} className="min-h-screen bg-background">
      <LandingHeader onOpenLogin={handleOpenScanner} />
      <main>
        <HeroSection onOpenLogin={handleOpenScanner} />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <CTASection onOpenLogin={handleOpenScanner} />
      </main>
      <LandingFooter />
      <BackToTop />
      <ModernLogin open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
};

export default LandingPage;
