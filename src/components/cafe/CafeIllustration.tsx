export const CafeIllustration = () => {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto opacity-40"
      >
        {/* Coffee cup */}
        <path
          d="M150 180 L150 220 L200 220 L200 180 L150 180 Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M145 180 L205 180"
          stroke="currentColor"
          strokeWidth="2"
        />
        <ellipse cx="175" cy="180" rx="27" ry="8" stroke="currentColor" strokeWidth="2" fill="none" />
        
        {/* Handle */}
        <path
          d="M200 190 Q220 200 200 210"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Steam */}
        <path
          d="M165 160 Q160 145 165 130"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.6"
          strokeLinecap="round"
        />
        <path
          d="M175 165 Q170 150 175 135"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.6"
          strokeLinecap="round"
        />
        <path
          d="M185 160 Q180 145 185 130"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.6"
          strokeLinecap="round"
        />
        
        {/* Laptop */}
        <path
          d="M100 200 L100 240 L280 240 L280 200"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <rect x="110" y="210" width="160" height="20" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="90" y1="240" x2="290" y2="240" stroke="currentColor" strokeWidth="3" />
        
        {/* Book */}
        <rect x="240" y="180" width="40" height="60" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="240" y1="190" x2="280" y2="190" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <line x1="240" y1="200" x2="280" y2="200" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        
        {/* Plant */}
        <ellipse cx="320" cy="230" rx="20" ry="15" stroke="currentColor" strokeWidth="2" fill="none" />
        <path
          d="M320 230 Q310 210 305 195"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M320 230 Q330 210 335 195"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <ellipse cx="305" cy="195" rx="8" ry="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <ellipse cx="335" cy="195" rx="8" ry="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
};
