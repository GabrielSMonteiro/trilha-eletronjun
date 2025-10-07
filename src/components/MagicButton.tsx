import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import './MagicButton.css';

interface MagicButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  glowColor?: string;
}

const MagicButton = ({
  children,
  onClick,
  className = '',
  enableStars = true,
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
  clickEffect = true,
  particleCount = 12,
  glowColor = '27, 184, 205'
}: MagicButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isHoveredRef = useRef(false);

  const createParticle = (x: number, y: number) => {
    const particle = document.createElement('div');
    particle.className = 'magic-particle';
    particle.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgb(${glowColor});
      box-shadow: 0 0 6px rgba(${glowColor}, 0.6);
      pointer-events: none;
      z-index: 100;
      left: ${x}px;
      top: ${y}px;
    `;
    return particle;
  };

  const clearAllParticles = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  };

  useEffect(() => {
    if (!buttonRef.current) return;

    const element = buttonRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;

      if (enableStars) {
        const rect = element.getBoundingClientRect();
        for (let i = 0; i < particleCount; i++) {
          const timeoutId = setTimeout(() => {
            if (!isHoveredRef.current || !buttonRef.current) return;

            const particle = createParticle(
              Math.random() * rect.width,
              Math.random() * rect.height
            );
            
            buttonRef.current.appendChild(particle);
            particlesRef.current.push(particle);

            gsap.fromTo(
              particle,
              { scale: 0, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
            );

            gsap.to(particle, {
              x: (Math.random() - 0.5) * 100,
              y: (Math.random() - 0.5) * 100,
              rotation: Math.random() * 360,
              duration: 2 + Math.random() * 2,
              ease: 'none',
              repeat: -1,
              yoyo: true
            });

            gsap.to(particle, {
              opacity: 0.3,
              duration: 1.5,
              ease: 'power2.inOut',
              repeat: -1,
              yoyo: true
            });
          }, i * 100);

          timeoutsRef.current.push(timeoutId);
        }
      }

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;

        gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: inherit;
        background: radial-gradient(circle at ${x}px ${y}px, rgba(${glowColor}, 0.4) 0%, transparent 70%);
        left: 0;
        top: 0;
        pointer-events: none;
        z-index: 1000;
      `;

      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 2,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [enableStars, enableTilt, enableMagnetism, clickEffect, particleCount, glowColor]);

  return (
    <Button
      ref={buttonRef}
      onClick={onClick}
      className={`magic-button ${enableBorderGlow ? 'magic-button--glow' : ''} ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        // @ts-ignore
        '--glow-color': glowColor
      }}
    >
      {children}
    </Button>
  );
};

export default MagicButton;
