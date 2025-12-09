import React from 'react';
import { cn } from '@/lib/utils';

interface StarfallBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const NUM_STARS = 50;

const StarfallBackground: React.FC<StarfallBackgroundProps> = ({ children, className }) => {
  const stars = Array.from({ length: NUM_STARS }).map((_, i) => {
    const size = Math.random() * 2 + 1; // 1px to 3px
    const duration = Math.random() * 10 + 5; // 5s to 15s
    const delay = Math.random() * 10; // 0s to 10s
    const left = Math.random() * 100; // 0% to 100% horizontal position

    return (
      <div
        key={i}
        className="absolute rounded-full bg-white shadow-lg dark:shadow-cyan-500/50 animate-starfall"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}vw`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          // Start position above the viewport
          top: `-${Math.random() * 100}vh`,
        }}
      />
    );
  });

  return (
    <div className={cn("relative overflow-hidden min-h-screen", className)}>
      {/* Background layer for stars - using a dark background to make stars visible */}
      <div className="absolute inset-0 bg-slate-950 z-0">
        {stars}
      </div>
      {/* Content layer */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default StarfallBackground;