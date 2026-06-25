import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export const useLandingGsap = (rootRef: RefObject<HTMLElement>) => {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      // ── Hero copy children stagger ──────────────────────────────────────
      gsap.from('[data-gsap="hero-copy"] > *', {
        y: 28,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.09,
      });

      // ── Hero terminal panel ─────────────────────────────────────────────
      gsap.from('[data-gsap="hero-panel"]', {
        y: 34,
        opacity: 0,
        rotateX: -4,
        duration: 1,
        ease: 'power3.out',
        delay: 0.22,
      });

      // ── Hero parallax grid ──────────────────────────────────────────────
      gsap.to('[data-gsap="hero-grid"]', {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // ── Section reveals (.landing-reveal) ──────────────────────────────
      gsap.utils.toArray<HTMLElement>('.landing-reveal').forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        });
      });

      // ── Individual card reveals (.landing-card) with stagger per row ───
      gsap.utils.toArray<HTMLElement>('.landing-card').forEach((el, i) => {
        gsap.from(el, {
          y: 30,
          opacity: 0,
          duration: 0.65,
          ease: 'power3.out',
          delay: (i % 4) * 0.07,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      // ── Stagger-grid containers (data-gsap="stagger-grid") ─────────────
      // Reveals direct children as a staggered group
      gsap.utils.toArray<HTMLElement>('[data-gsap="stagger-grid"]').forEach((grid) => {
        const children = Array.from(grid.children) as HTMLElement[];
        gsap.from(children, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: grid, start: 'top 85%', once: true },
        });
      });

      // ── Section-level fade-up (.landing-section) ───────────────────────
      gsap.utils.toArray<HTMLElement>('.landing-section').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });
    }, root);

    // ── Smooth anchor scroll ────────────────────────────────────────────
    const handleAnchorClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;
      const target = root.querySelector<HTMLElement>(link.hash);
      if (!target) return;
      e.preventDefault();
      gsap.to(window, { duration: 0.9, scrollTo: { y: target, offsetY: 96 }, ease: 'power3.inOut' });
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      ctx.revert();
    };
  }, [rootRef]);
};
