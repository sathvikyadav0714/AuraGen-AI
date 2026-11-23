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
 * GlowCard: Premium transparent frosted glassmorphism container with:
 * - 3D Gyro Perspective Tilt reacting to cursor coordinates
 * - Traveling light beam border effect (OnlyPipe / StyleMe style)
 * - Corner glow pulse sparkles
 * - Cursor-following spotlight glow & hover-revealed cyber grid
 */
export default function GlowCard({
  accent = 'indigo',
  className = '',
  children,
  onClick
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [active, setActive] = useState(false);
  const rgb = ACCENTS[accent] || ACCENTS.indigo;

  const moveTo = (clientX, clientY, el) => {
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setPos({ x, y });

    // Subtle 3D perspective tilt (-3.5deg to +3.5deg)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rx = ((y - centerY) / centerY) * -3.5;
    const ry = ((x - centerX) / centerX) * 3.5;
    setTilt({ rx, ry });
  };

  const handleMouseMove = (e) => moveTo(e.clientX, e.clientY, e.currentTarget);

  const handleTouch = (e) => {
    const touch = e.touches[0];
    if (touch) {
      moveTo(touch.clientX, touch.clientY, e.currentTarget);
      setActive(true);
    }
  };

  const handleMouseLeave = () => {
    setActive(false);
    setTilt({ rx: 0, ry: 0 });
  };

  const gridMask = `radial-gradient(240px circle at ${pos.x}px ${pos.y}px, black, transparent 75%)`;

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleMouseLeave}
      onFocus={() => setActive(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setActive(false);
          setTilt({ rx: 0, ry: 0 });
        }
      }}
      style={{
        transform: active
          ? `perspective(1200px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`
          : 'perspective(1200px) rotateX(0deg) rotateY(0deg)',
        transition: active ? 'transform 0.12s ease-out' : 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}
      className={`relative rounded-3xl group ${className}`}
    >
      {/* Edge layer 1: translucent subtle base border */}
      <div aria-hidden="true" className="absolute inset-0 rounded-3xl bg-white/[0.05] border border-white/[0.1] pointer-events-none" />

      {/* Edge layer 2: Traveling light beam effect along all 4 borders */}
      <div aria-hidden="true" className="absolute -inset-px rounded-3xl overflow-hidden pointer-events-none z-20">
        {/* Top beam */}
        <div className="absolute top-0 left-0 h-[2.5px] w-[45%] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-85 blur-[0.5px] animate-beam-top" />
        {/* Right beam */}
        <div className="absolute top-0 right-0 w-[2.5px] h-[45%] bg-gradient-to-b from-transparent via-purple-300 to-transparent opacity-85 blur-[0.5px] animate-beam-right" />
        {/* Bottom beam */}
        <div className="absolute bottom-0 right-0 h-[2.5px] w-[45%] bg-gradient-to-r from-transparent via-pink-300 to-transparent opacity-85 blur-[0.5px] animate-beam-bottom" />
        {/* Left beam */}
        <div className="absolute bottom-0 left-0 w-[2.5px] h-[45%] bg-gradient-to-b from-transparent via-indigo-300 to-transparent opacity-85 blur-[0.5px] animate-beam-left" />

        {/* 4 Corner breathing glow sparkles */}
        <div className="absolute top-0 left-0 h-2 w-2 rounded-full bg-cyan-400/80 blur-[2px] animate-pulse" />
        <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-purple-400/80 blur-[2px] animate-pulse" style={{ animationDelay: '300ms' }} />
        <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-pink-400/80 blur-[2px] animate-pulse" style={{ animationDelay: '700ms' }} />
        <div className="absolute bottom-0 left-0 h-2 w-2 rounded-full bg-indigo-400/80 blur-[2px] animate-pulse" style={{ animationDelay: '1000ms' }} />
      </div>

      {/* Edge layer 3: dynamic cursor spotlight glow border tracking pointer */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 rounded-3xl transition-opacity duration-500 pointer-events-none z-10 ${
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
