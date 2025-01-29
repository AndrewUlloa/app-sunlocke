'use client';

import { useEffect, useCallback } from 'react';

// Example colors for radial gradients
const COLORS = [
  '#CE9CF4FF',
  '#EFC9E9FF',
  '#FACA97FF',
  '#FAE59FFF',
  '#FAE8EAFF',
  '#FBE8C8FF',
  '#FF808EFF',
].map(color => color.replace('FF', 'BB')); // Making colors more visible

interface AnimatedBlobBackgroundProps {
  position?: 'front' | 'behind';
  gridSize?: number; // Number of blobs per row/column
}

interface GridPosition {
  x: number;
  y: number;
}

/**
 * Renders random color-shifting blobs.
 * By default, puts them in *front*, over the page content.
 */
export function AnimatedBlobBackground({
  position = 'front',
  gridSize = 3, // Creates a 3x3 grid by default
}: AnimatedBlobBackgroundProps) {
  const runAnimation = useCallback(() => {
    // Create an AbortController for cleanup
    const abortController = new AbortController();

    try {
      const rand = (min: number, max: number) => Math.random() * (max - min) + min;
      const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

      const blobs = document.querySelectorAll('.blob');
      let keyframesCSS = '';

      // Calculate grid positions
      const gridPositions: GridPosition[] = [];
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          gridPositions.push({
            x: (x * 100) / (gridSize - 1),
            y: (y * 100) / (gridSize - 1),
          });
        }
      }

      blobs.forEach((blob, i) => {
        const isMobile = window.innerWidth <= 768;
        const size = isMobile ? randInt(70, 90) : randInt(80, 100);
        const element = blob as HTMLElement;

        element.style.width = `${size}vw`;
        element.style.height = `${size}vw`;
        
        // Use multiple colors for each blob to create more interesting gradients
        const color1 = COLORS[i % COLORS.length];
        const color2 = COLORS[(i + 1) % COLORS.length];
        element.style.background = `
          radial-gradient(circle, 
            ${color1} 0%, 
            ${color2} 50%, 
            transparent 80%
          )
        `;

        // Get starting grid position
        const startPos = gridPositions[i % gridPositions.length];
        
        // Generate keyframe steps with controlled randomness
        const animationName = `moveGrow${i}`;
        keyframesCSS += `
          @keyframes ${animationName} {
            0% { 
              transform: translate(${startPos.x}vw, ${startPos.y}vh) scale(1);
              opacity: 0.8;
            }
            50% { 
              transform: translate(${startPos.x + randInt(-20, 20)}vw, ${
                startPos.y + randInt(-20, 20)
              }vh) scale(${rand(1.2, 1.5)});
              opacity: 1;
            }
            100% { 
              transform: translate(${startPos.x}vw, ${startPos.y}vh) scale(1);
              opacity: 0.8;
            }
          }
        `;

        // Slower animation for more subtle movement
        element.style.animation = `${animationName} 4s ease-in-out infinite`;
      });

      // Remove any old <style> if it exists
      const existingStyle = document.getElementById('blob-animations');
      if (existingStyle) existingStyle.remove();

      // Insert our new keyframes
      const styleEl = document.createElement('style');
      styleEl.id = 'blob-animations';
      styleEl.innerHTML = keyframesCSS;
      document.head.appendChild(styleEl);

      // Return proper cleanup function
      return () => {
        abortController.abort();
        const styleEl = document.getElementById('blob-animations');
        if (styleEl) styleEl.remove();
        
        const blobs = document.querySelectorAll('.blob');
        blobs.forEach(blob => {
          const element = blob as HTMLElement;
          element.style.animation = 'none';
          element.style.opacity = '0';
        });
      };
    } catch (error) {
      console.error('Animation error:', error);
    }
  }, [gridSize]);

  useEffect(() => {
    const cleanup = runAnimation();
    
    // Ensure cleanup runs
    return () => {
      if (cleanup) cleanup();
    };
  }, [runAnimation]);

  // Optionally add minimal styling to prevent weird stacking
  // with the old/new view transitions if you like
  return (
    <>
      <style
        id="view-transition-styles"
        dangerouslySetInnerHTML={{
          __html: `
          ::view-transition-old(root),
          ::view-transition-new(root) {
            animation: none;
            mix-blend-mode: normal;
          }
          ::view-transition-old(root) { z-index: 1; }
          ::view-transition-new(root) { z-index: 2; }
        `,
        }}
      />

      {/**
       * We place the blobs in a container that sits 
       * "in front" of everything if position === 'front'.
       * Adjust the z-classes or your own tailwind classes to taste.
       */}
      <div
        className={
          position === 'front'
            ? 'pointer-events-none fixed inset-0 z-[9998] overflow-hidden'
            : 'pointer-events-none fixed inset-0 -z-10 overflow-hidden'
        }
      >
        {/* Create enough blobs to fill the grid */}
        {Array.from({ length: gridSize * gridSize }).map((_, i) => (
          <div
            key={i}
            className="blob absolute rounded-full opacity-[0.95] mix-blend-screen
                       blur-3xl md:blur-2xl"
          />
        ))}
      </div>
    </>
  );
}
