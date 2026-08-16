"use client";
import React, { useRef, useEffect } from 'react';
import './PixelButton.css';

interface GlowingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: string;
  bgColor?: string;
  children: React.ReactNode;
}

export default function GlowingButton({ 
  color = '#FF6B00', 
  bgColor = '#FF6B00', 
  children, 
  className = '', 
  ...props 
}: GlowingButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const pixelcontainer = containerRef.current;
    
    if (!button || !pixelcontainer) return;

    pixelcontainer.innerHTML = '';
    const pixSize = 10;
    const btnwidth = button.offsetWidth;
    const btnheight = button.offsetHeight;

    if (btnwidth === 0 || btnheight === 0) return;

    const cols = Math.ceil(btnwidth / pixSize);
    const rows = Math.ceil(btnheight / pixSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const pixel = document.createElement('div');
        pixel.classList.add('pixel');
        pixel.style.left = `${col * pixSize}px`;
        pixel.style.top = `${row * pixSize}px`;

        const delay = Math.random() * 0.5;
        pixel.style.transitionDelay = `${delay}s`;

        const tx = (Math.random() - 0.5) * 60;
        const ty = (Math.random() - 0.5) * 60;

        pixel.style.setProperty('--tx', `${tx}px`);
        pixel.style.setProperty('--ty', `${ty}px`);

        pixelcontainer.appendChild(pixel);
      }
    }
  }, []);

  return (
    <button 
      ref={buttonRef}
      className={`pixel-btn btn-glowing ${className}`} 
      style={{ '--clr': color, backgroundColor: bgColor } as React.CSSProperties}
      {...props}
    >
      <div className="pixel-content">{children}</div>
      <div 
        ref={containerRef} 
        className="pixel-container" 
      />
    </button>
  );
}
