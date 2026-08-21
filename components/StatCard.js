'use client';

import { useEffect, useRef, useState } from 'react';

/* =========================================================
   Виджет-цифра со счётчиком (плавно "докручивается" до значения
   при появлении карточки на экране). Используется на дашборде
   и на странице ученика для быстрой сводки.
   ========================================================= */
export function StatCard({ label, value, suffix = '', accent = 'gold' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const target = Number(value) || 0;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplay(target);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const duration = 700;
            const startTime = performance.now();

            const tick = (now) => {
              const progress = Math.min(1, (now - startTime) / duration);
              const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
              setDisplay(Math.round(target * eased));
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div className={`stat-card stat-card-${accent}`} ref={ref}>
      <div className="stat-card-value">
        {display}
        {suffix}
      </div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
