import React from 'react';
import { PenEntity } from './penPhysics';

interface PenGraphicProps {
  pen: PenEntity;
  isTurn: boolean;
  isDragging: boolean;
}

export const PenGraphic: React.FC<PenGraphicProps> = ({ pen, isTurn, isDragging }) => {
  const isFountain = pen.archetypeId === 'fountain';
  const isMarker = pen.archetypeId === 'marker';
  const isGel = pen.archetypeId === 'gel';
  const mods = pen.mods || { capPos: 'cap_back', spring: 'normal', grip: 'bare' };

  const scale = pen.isFellOff ? Math.max(0.1, 1 - pen.fallProgress * 0.8) : 1;
  const opacity = pen.isFellOff ? Math.max(0, 1 - pen.fallProgress) : 1;

  const hasCapBack = mods.capPos === 'cap_back';
  const hasCapFront = mods.capPos === 'cap_front';
  const hasRubberBand = mods.grip === 'rubber_band';

  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: `${pen.x}px`,
        top: `${pen.y}px`,
        transform: `translate(-50%, -50%) rotate(${pen.angle}rad) scale(${scale})`,
        opacity,
        transition: pen.isFellOff ? 'transform 0.5s ease-in, opacity 0.5s ease-in' : 'none',
        zIndex: isDragging ? 30 : 20,
      }}
    >
      {/* Active turn indicator pulse */}
      {isTurn && !pen.isFellOff && (
        <div
          className="absolute -inset-4 rounded-full animate-pulse border-2 border-dashed"
          style={{ borderColor: pen.color, opacity: 0.7 }}
        />
      )}

      {/* SVG Pen Renderer */}
      <svg
        width={pen.length}
        height={pen.width * 2.2}
        viewBox={`0 0 ${pen.length} ${pen.width * 2.2}`}
        className="drop-shadow-md overflow-visible"
      >
        <defs>
          <linearGradient id={`grad-pen-${pen.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
            <stop offset="35%" stopColor={pen.color} />
            <stop offset="85%" stopColor={pen.color} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.4} />
          </linearGradient>

          <linearGradient id={`grad-cap-${pen.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} />
            <stop offset="40%" stopColor={pen.capColor} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.35} />
          </linearGradient>

          <linearGradient id="metal-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <linearGradient id="gold-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse
          cx={pen.length / 2}
          cy={pen.width * 1.5}
          rx={pen.length * 0.46}
          ry={pen.width * 0.28}
          fill="rgba(0,0,0,0.28)"
          filter="blur(2px)"
        />

        {/* Main Body */}
        <rect
          x={30}
          y={pen.width * 0.4}
          width={pen.length - 54}
          height={pen.width}
          rx={isMarker ? 6 : 3}
          fill={`url(#grad-pen-${pen.id})`}
          stroke="#0f172a"
          strokeWidth="1.2"
        />

        {/* Rubber Band Mod Wound Around Barrel */}
        {hasRubberBand && (
          <g>
            <rect x={pen.length * 0.45} y={pen.width * 0.4 - 1.5} width={12} height={pen.width + 3} rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
            <line x1={pen.length * 0.45 + 3} y1={pen.width * 0.4} x2={pen.length * 0.45 + 3} y2={pen.width * 1.4} stroke="#a16207" strokeWidth="1.5" />
            <line x1={pen.length * 0.45 + 7} y1={pen.width * 0.4} x2={pen.length * 0.45 + 7} y2={pen.width * 1.4} stroke="#a16207" strokeWidth="1.5" />
          </g>
        )}

        {/* Gel Pen Ridges */}
        {isGel && !hasRubberBand && (
          <g>
            <rect
              x={pen.length - 56}
              y={pen.width * 0.4 - 1}
              width={26}
              height={pen.width + 2}
              rx="3"
              fill="#1e293b"
              opacity="0.85"
            />
            <line x1={pen.length - 50} y1={pen.width * 0.4} x2={pen.length - 50} y2={pen.width * 1.4} stroke="#64748b" strokeWidth="1.5" />
            <line x1={pen.length - 44} y1={pen.width * 0.4} x2={pen.length - 44} y2={pen.width * 1.4} stroke="#64748b" strokeWidth="1.5" />
            <line x1={pen.length - 38} y1={pen.width * 0.4} x2={pen.length - 38} y2={pen.width * 1.4} stroke="#64748b" strokeWidth="1.5" />
          </g>
        )}

        {/* Fountain Pen Gold Accents */}
        {isFountain && (
          <g>
            <rect x={30} y={pen.width * 0.4 - 1} width={4} height={pen.width + 2} fill="url(#gold-grad)" />
            <rect x={pen.length - 30} y={pen.width * 0.4 - 1} width={4} height={pen.width + 2} fill="url(#gold-grad)" />
          </g>
        )}

        {/* Pen Nib Cone */}
        {isFountain ? (
          <polygon
            points={`${pen.length - 24},${pen.width * 0.4} ${pen.length - 24},${pen.width * 1.4} ${pen.length},${pen.width * 0.9}`}
            fill="url(#gold-grad)"
            stroke="#713f12"
            strokeWidth="1"
          />
        ) : (
          <polygon
            points={`${pen.length - 24},${pen.width * 0.4} ${pen.length - 24},${pen.width * 1.4} ${pen.length - 4},${pen.width * 0.9}`}
            fill="url(#metal-grad)"
            stroke="#334155"
            strokeWidth="1"
          />
        )}

        {/* Felt / Ballpoint tip */}
        {isMarker ? (
          <polygon
            points={`${pen.length - 6},${pen.width * 0.6} ${pen.length - 6},${pen.width * 1.2} ${pen.length + 4},${pen.width * 0.9}`}
            fill={pen.color}
          />
        ) : (
          <circle cx={pen.length - 2} cy={pen.width * 0.9} r="2.2" fill="#0f172a" />
        )}

        {/* Front Cap Mod (Covering the nib for heavy punch) */}
        {hasCapFront && (
          <g>
            <rect
              x={pen.length - 32}
              y={pen.width * 0.35}
              width={34}
              height={pen.width * 1.1}
              rx="4"
              fill={`url(#grad-cap-${pen.id})`}
              stroke="#0f172a"
              strokeWidth="1.2"
            />
          </g>
        )}

        {/* Back Cap (if mounted on back) */}
        {hasCapBack && (
          <g>
            <rect
              x={10}
              y={pen.width * 0.4 - (isMarker ? 2 : 1)}
              width={24}
              height={pen.width + (isMarker ? 4 : 2)}
              rx={isMarker ? 5 : 3}
              fill={`url(#grad-cap-${pen.id})`}
              stroke="#0f172a"
              strokeWidth="1.2"
            />
            {/* Click button */}
            <rect
              x={4}
              y={pen.width * 0.55}
              width={7}
              height={pen.width * 0.7}
              rx="2"
              fill="url(#metal-grad)"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Clip */}
            <path
              d={`M 14,${pen.width * 0.4 - 2} L 34,${pen.width * 0.4 - 3} Q 37,${pen.width * 0.4 - 3} 36,${pen.width * 0.4 - 1} L 16,${pen.width * 0.4} Z`}
              fill="url(#metal-grad)"
              stroke="#334155"
              strokeWidth="0.8"
            />
          </g>
        )}

        {/* Pen Brand Stamp on barrel */}
        <text
          x={pen.length * 0.4}
          y={pen.width * 0.95}
          fill="rgba(255,255,255,0.75)"
          fontSize={pen.width * 0.42}
          fontFamily="system-ui"
          fontWeight="bold"
          textAnchor="middle"
          letterSpacing="1"
        >
          {isFountain ? 'HERO 332' : isGel ? 'GRIPPER' : isMarker ? 'HIGHLIGHT' : 'REYNOLDS'}
        </text>
      </svg>
    </div>
  );
};
