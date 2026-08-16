"use client";

import React, { useRef, useEffect } from 'react';
import './PixelButton.css';

interface PixelButtonProps extends React.HTMLAttributes<HTMLElement> {
  color?: string; // Hex color for pixels
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function PixelButton({ 
  children, 
  className = 'w-full h-[56px] bg-[#FF6B00] text-white text-base font-extrabold rounded-2xl', 
  color = '#FF6B00', // Default brand color
  as: Component = 'button',
  ...props 
}: PixelButtonProps & { as?: any }) {
  const buttonRef = useRef<HTMLElement>(null);
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
  }, [children]);

  return (
    <Component 
      ref={buttonRef}
      className={`pixel-btn ${className}`}
      {...props}
    >
      <div className="pixel-content">{children}</div>
      <div 
        ref={containerRef} 
        className="pixel-container" 
        style={{ '--clr': color } as React.CSSProperties}
      />
    </Component>
  );
}
