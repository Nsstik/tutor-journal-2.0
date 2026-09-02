'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Небольшое всплывающее уведомление внизу экрана — появляется каждый раз,
// когда меняется `trigger` (обычно это timestamp успешного сохранения),
// и само пропадает через пару секунд. Рендерится через портал в <body>,
// чтобы его можно было безопасно вызывать даже изнутри строк таблицы.
export function Toast({ trigger, message = 'Сохранено' }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div className="save-toast" role="status">
      ✓ {message}
    </div>,
    document.body
  );
}
