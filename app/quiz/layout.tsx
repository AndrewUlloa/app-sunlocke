import React from 'react';
import { AnimatedBackground } from '../../components/ui/animated-background';

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnimatedBackground>
      {children}
    </AnimatedBackground>
  );
} 