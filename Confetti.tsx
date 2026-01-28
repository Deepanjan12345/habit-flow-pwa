
import React, { useEffect, useState } from 'react';

const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<{ id: number, x: number, y: number, color: string, size: number, angle: number }[]>([]);

  useEffect(() => {
    const colors = ['#00d5ff', '#3a00a7', '#ffffff', '#ff0055', '#ffcc00'];
    const p = [...Array(100)].map((_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      angle: Math.random() * 360,
    }));
    setParticles(p);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-confetti"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            transform: `rotate(${p.angle}deg)`,
            '--tx': `${(Math.random() - 0.5) * 200}px`,
            '--ty': `${window.innerHeight + 100}px`,
            '--tr': `${Math.random() * 720}deg`,
          } as any}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(var(--tr)); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Confetti;
