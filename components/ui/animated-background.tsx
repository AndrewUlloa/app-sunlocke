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
      const size = isMobile ? randInt(15, 30) : randInt(40, 60);
      const element = blob as HTMLElement;

      const sizeUnit = isMobile ? 'vh' : 'vw';
      element.style.width = `${size}${sizeUnit}`;
      element.style.height = `${size}${sizeUnit}`;
      element.style.background = `radial-gradient(circle, ${COLORS[i]}, transparent)`;

      const keyframeSteps = Array.from({ length: 6 }, () => ({
        x: isMobile ? randInt(0, 90) : randInt(-20, 120),
        y: isMobile ? randInt(0, 90) : randInt(-20, 120),
        scale: isMobile ? rand(0.8, 1.1) : rand(0.9, 1.6),
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
    <div className="relative min-h-[100dvh] w-full overflow-hidden">
      <div className="fixed inset-0 z-far-behind animate-background-fade opacity-80" />

      <div className="fixed inset-0 z-behind pointer-events-none">
        {COLORS.map((color, i) => (
          <div
            key={i}
            className="blob absolute rounded-full blur-[40px] md:blur-[80px]"
          />
        ))}
      </div>

      <div className="relative z-0">{children}</div>
    </div>
  );
}
