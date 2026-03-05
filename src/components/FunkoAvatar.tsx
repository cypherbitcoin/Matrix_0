import React from 'react';

interface FunkoAvatarProps {
  type: 'neo' | 'trinity' | 'morpheus' | 'smith' | 'oracle' | 'architect';
  size?: number;
  className?: string;
}

export const FunkoAvatar: React.FC<FunkoAvatarProps> = ({ type, size = 64, className }) => {
  const colors = {
    neo: { hair: '#0a0a0a', skin: '#fce4ec', suit: '#000000', eyes: '#000000', accent: '#00ff41' },
    trinity: { hair: '#000000', skin: '#fce4ec', suit: '#1a1a1a', eyes: '#000000', accent: '#00ff41' },
    morpheus: { hair: '#000000', skin: '#5d4037', suit: '#4a0e0e', eyes: '#000000', accent: '#00ff41' },
    smith: { hair: '#4a4a4a', skin: '#fce4ec', suit: '#2c3e50', eyes: '#000000', accent: '#00ff41' },
    oracle: { hair: '#ffffff', skin: '#8d5524', suit: '#27ae60', eyes: '#000000', accent: '#00ff41' },
    architect: { hair: '#e0e0e0', skin: '#fce4ec', suit: '#ffffff', eyes: '#000000', accent: '#00ff41' },
  };

  const c = colors[type];

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      style={{ filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))' }}
    >
      <defs>
        <linearGradient id="matrixGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00ff41" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Background Glow for Architect */}
      {type === 'architect' && (
        <circle cx="50" cy="40" r="45" fill="url(#matrixGradient)" opacity="0.5" />
      )}

      {/* Body */}
      <rect x="32" y="65" width="36" height="25" rx="4" fill={c.suit} />
      
      {/* Head - Funko Style (Large and Square-ish) */}
      <rect x="18" y="12" width="64" height="55" rx="12" fill={c.skin} />
      
      {/* Hair / Head Details */}
      {type === 'neo' && (
        <path d="M18 25 Q18 12 50 12 Q82 12 82 25 L82 32 L18 32 Z" fill={c.hair} />
      )}
      {type === 'trinity' && (
        <path d="M18 28 Q18 12 50 12 Q82 12 82 28 L82 40 L18 40 Z" fill={c.hair} />
      )}
      {type === 'morpheus' && (
        <rect x="18" y="12" width="64" height="10" rx="5" fill={c.hair} opacity="0.2" />
      )}
      {type === 'smith' && (
        <path d="M18 22 Q18 12 50 12 Q82 12 82 22 L82 28 L18 28 Z" fill={c.hair} />
      )}
      {type === 'architect' && (
        <g>
          <path d="M18 28 Q18 12 50 12 Q82 12 82 28 L82 35 L18 35 Z" fill={c.hair} />
          <rect x="35" y="65" width="30" height="2" fill="#ccc" opacity="0.5" /> {/* Tie/Detail */}
        </g>
      )}
      
      {/* Eyes - Large Black Circles */}
      <circle cx="38" cy="48" r="7" fill={c.eyes} />
      <circle cx="62" cy="48" r="7" fill={c.eyes} />
      
      {/* Sunglasses for Matrix characters */}
      {(type === 'neo' || type === 'trinity' || type === 'morpheus' || type === 'smith') && (
        <g opacity="0.95">
          <rect x="28" y="42" width="18" height="12" rx="5" fill="#000" />
          <rect x="54" y="42" width="18" height="12" rx="5" fill="#000" />
          <line x1="46" y1="48" x2="54" y2="48" stroke="#000" strokeWidth="2" />
          {/* Lens Reflection */}
          <rect x="30" y="44" width="4" height="2" rx="1" fill="#fff" opacity="0.2" />
          <rect x="56" y="44" width="4" height="2" rx="1" fill="#fff" opacity="0.2" />
        </g>
      )}

      {/* Architect Glasses */}
      {type === 'architect' && (
        <g opacity="0.8">
          <rect x="28" y="42" width="18" height="12" rx="2" fill="none" stroke="#000" strokeWidth="1" />
          <rect x="54" y="42" width="18" height="12" rx="2" fill="none" stroke="#000" strokeWidth="1" />
          <line x1="46" y1="48" x2="54" y2="48" stroke="#000" strokeWidth="1" />
        </g>
      )}
      
      {/* Tiny Matrix Code Elements */}
      <g opacity="0.4">
        <rect x="20" y="15" width="1" height="3" fill="#00ff41" />
        <rect x="78" y="20" width="1" height="4" fill="#00ff41" />
        <rect x="25" y="55" width="1" height="2" fill="#00ff41" />
      </g>
    </svg>
  );
};
