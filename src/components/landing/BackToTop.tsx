import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      window.scrollTo({ top: 0 });
    } else {
      gsap.to(window, { duration: 0.7, scrollTo: 0, ease: 'power3.inOut' });
    }
  };

  return (
    <button
      onClick={scrollTop}
      aria-label="Back to top"
      className={`fixed bottom-6 right-6 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-background shadow-lg transition-all duration-300 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ChevronUp className="h-5 w-5 text-foreground" />
    </button>
  );
};

export default BackToTop;
