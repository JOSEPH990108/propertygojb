'use client';

import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect pointer type
    if (!window.matchMedia('(pointer: fine)').matches) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    const speed = prefersReducedMotion ? 1 : 0.15;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    };

    const animate = () => {
      ringX += (mouseX - ringX) * speed;
      ringY += (mouseY - ringY) * speed;

      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(animate);
    };

    const addHover = () => {
      ring.classList.add('cursor-hover');
      dot.classList.add('cursor-hover');
    };

    const removeHover = () => {
      ring.classList.remove('cursor-hover');
      dot.classList.remove('cursor-hover');
    };

    // Track interactive elements
    const interactiveSelectors = 'a, button, [role="button"], [data-cursor]';
    const interactiveEls = document.querySelectorAll(interactiveSelectors);

    interactiveEls.forEach((el) => {
      el.addEventListener('mouseenter', addHover);
      el.addEventListener('mouseleave', removeHover);
    });

    window.addEventListener('mousemove', onMouseMove);
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      interactiveEls.forEach((el) => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
      });
    };
  }, []);

  return (
    <>
      {/* Outer ring */}
      <div ref={ringRef} className="custom-cursor" />

      {/* Inner dot */}
      <div ref={dotRef} className="custom-cursor custom-cursor-dot" />
    </>
  );
}
