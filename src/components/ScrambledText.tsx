import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

import './ScrambledText.css';

const ScrambledText = ({
  radius = 100,
  duration = 1.2,
  speed = 0.5,
  scrambleChars = '.:',
  className = '',
  style = {},
  children
}) => {
  const rootRef = useRef(null);
  const [chars, setChars] = useState([]);

  useEffect(() => {
    if (!rootRef.current || !children) return;

    // Split text into characters manually
    const text = typeof children === 'string' ? children : children.toString();
    const charElements = text.split('').map((char, i) => ({
      id: i,
      original: char,
      current: char
    }));
    setChars(charElements);
  }, [children]);

  const scrambleChar = (char, callback) => {
    const chars = scrambleChars.split('');
    let iterations = 0;
    const maxIterations = Math.floor(10 * speed);
    
    const interval = setInterval(() => {
      if (iterations >= maxIterations) {
        clearInterval(interval);
        callback(char.original);
      } else {
        const randomChar = chars[Math.floor(Math.random() * chars.length)];
        callback(randomChar);
        iterations++;
      }
    }, 50);
  };

  const handleMove = (e) => {
    if (!rootRef.current) return;

    const charElements = rootRef.current.querySelectorAll('.char');
    charElements.forEach((c, index) => {
      const { left, top, width, height } = c.getBoundingClientRect();
      const dx = e.clientX - (left + width / 2);
      const dy = e.clientY - (top + height / 2);
      const dist = Math.hypot(dx, dy);

      if (dist < radius) {
        scrambleChar(chars[index], (newChar) => {
          c.textContent = newChar;
        });
      }
    });
  };

  return (
    <div 
      ref={rootRef} 
      className={`text-block ${className}`} 
      style={style}
      onPointerMove={handleMove}
    >
      <p>
        {chars.map((char) => (
          <span key={char.id} className="char" style={{ display: 'inline-block' }}>
            {char.current}
          </span>
        ))}
      </p>
    </div>
  );
};

export default ScrambledText;
