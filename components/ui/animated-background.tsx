"use client";

import { useEffect } from 'react';

const BLOB_COLORS = [
  "#CE9CF4",
  "#EFC9E9",
  "#FACA97",
  "#FAE59F",
  "#FAE8EA",
  "#FBE8C8",
  "#FF808E"
];

export function AnimatedBackground() {
  useEffect(() => {
    const blobs = document.querySelectorAll('.blob');
    
    function randInt(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    blobs.forEach((blob) => {
      const isMobile = window.innerWidth <= 768;
      const size = isMobile ? randInt(30, 50) : randInt(40, 60);
      
      (blob as HTMLElement).style.width = `${size}vw`;
      (blob as HTMLElement).style.height = `${size}vw`;
      
      const duration = size >= 50 ? randInt(20, 30) : randInt(16, 32);
      (blob as HTMLElement).style.animationDuration = `${duration}s`;
    });
  }, []);

  return (
    <>
      <div className="animated-background" />
      <div className="blob-container">
        {BLOB_COLORS.map((color, i) => (
          <div
            key={color}
            className={`blob animate-blobMove${(i % 3) + 1}`}
            style={{
              background: `radial-gradient(circle, ${color}, transparent)`
            }}
          />
        ))}
      </div>
    </>
  );
} 