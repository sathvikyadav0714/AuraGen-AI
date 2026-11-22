import React, { useState } from 'react';

// Spotlight accent RGB values for dynamic cursor glow
const ACCENTS = {
  indigo: '129, 140, 248',
  purple: '168, 85, 247',
  cyan: '34, 211, 238',
  emerald: '52, 211, 153',
  fuchsia: '232, 121, 249',
  amber: '251, 191, 36',
  rose: '244, 63, 94'
};

// Subtle cyber grid image
const GRID_IMAGE =
  'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)';

/**
 * GlowCard: Premium transparent frosted glassmorphism container with
 * cursor-following spotlight glow, dynamic glowing border, and hover-revealed cyber grid.
 */
export default function GlowCard({
  accent = 'indigo',
  className = '',
  children,
  onClick
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const rgb = ACCENTS[accent] || ACCENTS.indigo;

  const moveTo = (clientX, clientY, el) => {
    const rect = el.getBoundingClientRect();
    setPos({ x: clientX - rect.left, y: clientY - rect.top });
  };

  const handleMouseMove = (e) => moveTo(e.clientX, e.clientY, e.currentTarget);

  const handleTouch = (e) => {
    const touch = e.touches[0];
    if (touch) {
      moveTo(touch.clientX, touch.clientY, e.currentTarget);
      setActive(true);
    }
  };

  const gridMask = `radial-gradient(240px circle at ${pos.x}px ${pos.y}px, black, transparent 75%)`;

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setActive(false);
      }}
      className={`relative rounded-3xl transition-all duration-300 ${className}`}
    >
      {/* Edge layer 1: translucent subtle border */}
      <div aria-hidden="true" className="absolute inset-0 rounded-3xl bg-white/[0.05] border border-white/[0.1] pointer-events-none" />

      {/* Edge layer 2: bright glowing border that follows the cursor */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 rounded-3xl transition-opacity duration-500 pointer-events-none ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, rgba(${rgb}, 0.9), transparent 70%)`
        }}
      />

      {/* Card face: transparent frosted glassmorphism with spotlight and cursor-following grid */}
      <div aria-hidden="true" className="absolute inset-px overflow-hidden rounded-[23px] bg-slate-900/20 backdrop-blur-3xl border border-white/[0.12] pointer-events-none shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        {/* Cursor inner spotlight glow */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, rgba(${rgb}, 0.22), transparent 65%)`
          }}
        />
        {/* Interactive cyber grid revealing on hover */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
          style={{
            backgroundImage: GRID_IMAGE,
            backgroundSize: '26px 26px',
            maskImage: gridMask,
            WebkitMaskImage: gridMask
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
