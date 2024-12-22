'use client';

import { useEffect } from 'react';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
}

const COLORS = [
  '#CE9CF4',
  '#EFC9E9',
  '#FACA97',
  '#FAE59F',
  '#FAE8EA',
  '#FBE8C8',
  '#FF808E',
];

export function AnimatedBackground({ children }: AnimatedBackgroundProps) {
  useEffect(() => {
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const randInt = (min: number, max: number) =>
      Math.floor(rand(min, max + 1));

    const blobs = document.querySelectorAll('.blob');
    let keyframesCSS = '';

    blobs.forEach((blob, i) => {
      const isMobile = window.innerWidth <= 768;
      const size = isMobile ? randInt(30, 50) : randInt(40, 60);
      const element = blob as HTMLElement;

      element.style.width = `${size}vw`;
      element.style.height = `${size}vw`;
      element.style.background = `radial-gradient(circle, ${COLORS[i]}, transparent)`;

      const keyframeSteps = Array.from({ length: 6 }, () => ({
        x: randInt(-20, 120),
        y: randInt(-20, 120),
        scale: rand(0.9, 1.6),
      }));

      const animationName = `moveGrow${i}`;
      keyframesCSS += `
        @keyframes ${animationName} {
          ${keyframeSteps
            .map(
              (step, index) =>
                `${index * 20}% { transform: translate(${step.x}vw, ${
                  step.y
                }vh) scale(${step.scale}); }`
            )
            .join('\n')}
        }
      `;

      const duration = size >= 50 ? randInt(20, 30) : randInt(16, 32);
      element.style.animation = `${animationName} ${duration}s infinite alternate`;
    });

    const styleEl = document.createElement('style');
    styleEl.innerHTML = keyframesCSS;
    document.head.appendChild(styleEl);

    return () => {
      // Cleanup: remove style element on unmount
      styleEl.remove();
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full">
      {/* 
        The background color fade:
        - uses our custom animation: animate-background-fade
        - with a negative z-index behind content
      */}
      <div className="fixed inset-0 z-far-behind animate-background-fade opacity-80" />

      {/* 
        Blob container:
        - Another negative z-index so it's behind your main content 
      */}
      <div className="fixed inset-0 overflow-hidden z-behind pointer-events-none">
        {COLORS.map((color, i) => (
          <div
            key={i}
            className="blob absolute rounded-full blur-[80px] md:blur-[30px]"
          />
        ))}
      </div>

      {/* Main content on top */}
      <div className="relative z-0">{children}</div>
    </div>
  );
}
