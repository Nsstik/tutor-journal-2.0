// Простой SVG-график динамики без клиентского JS — рендерится на сервере,
// как и весь остальной сайт.

import { Fragment } from 'react';

function formatShortDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export function TrendChart({ lessons }) {
  const points = (lessons || [])
    .filter((l) => l.behavior_rating || l.work_rating)
    .slice()
    .sort((a, b) => new Date(a.lesson_date) - new Date(b.lesson_date));

  if (points.length === 0) {
    return (
      <p className="muted">
        Пока нет оценок для графика — поставьте звёзды на уроке, и здесь появится динамика.
      </p>
    );
  }

  const w = Math.max(340, points.length * 64);
  const h = 190;
  const padL = 26;
  const padR = 16;
  const padT = 14;
  const padB = 26;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const xFor = (i) =>
    padL + (points.length === 1 ? plotW / 2 : (i * plotW) / (points.length - 1));
  const yFor = (v) => padT + plotH - ((v - 1) / 4) * plotH;

  const behaviorLine = points
    .map((p, i) => (p.behavior_rating ? `${xFor(i)},${yFor(p.behavior_rating)}` : null))
    .filter(Boolean)
    .join(' ');
  const workLine = points
    .map((p, i) => (p.work_rating ? `${xFor(i)},${yFor(p.work_rating)}` : null))
    .filter(Boolean)
    .join(' ');

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="trend-chart"
        role="img"
        aria-label="График поведения и работы на уроке по датам"
      >
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={padL} x2={w - padR} y1={yFor(v)} y2={yFor(v)} className="chart-grid" />
            <text x={padL - 6} y={yFor(v) + 4} className="chart-axis-label" textAnchor="end">
              {v}
            </text>
          </g>
        ))}

        {workLine && <polyline points={workLine} className="chart-line chart-line-work" />}
        {behaviorLine && (
          <polyline points={behaviorLine} className="chart-line chart-line-behavior" />
        )}

        {points.map((p, i) => (
          <g key={p.id}>
            {p.work_rating && (
              <circle cx={xFor(i)} cy={yFor(p.work_rating)} r="4" className="chart-dot chart-dot-work" />
            )}
            {p.behavior_rating && (
              <circle
                cx={xFor(i)}
                cy={yFor(p.behavior_rating)}
                r="4"
                className="chart-dot chart-dot-behavior"
              />
            )}
            <text x={xFor(i)} y={h - 6} className="chart-axis-label" textAnchor="middle">
              {formatShortDate(p.lesson_date)}
            </text>
          </g>
        ))}
      </svg>
      <div className="chart-legend">
        <span className="legend-item">
          <i className="legend-dot legend-dot-behavior" /> Поведение
        </span>
        <span className="legend-item">
          <i className="legend-dot legend-dot-work" /> Работа на уроке
        </span>
      </div>
    </div>
  );
}

export function StarsDisplay({ value }) {
  if (!value) return <span className="muted">—</span>;
  return (
    <span className="stars-display" title={`${value} из 5`}>
      <span className="stars-filled">{'★'.repeat(value)}</span>
      <span className="stars-empty">{'★'.repeat(5 - value)}</span>
    </span>
  );
}

export function StarInput({ name, defaultValue = 5 }) {
  // Важно: input и label должны быть ПРЯМЫМИ соседями внутри .star-input
  // (без обёрток), иначе CSS-трюк с общим соседним селектором (~), который
  // подсвечивает звёзды без единой строчки JS, не сработает.
  const values = [5, 4, 3, 2, 1];
  return (
    <div className="star-input">
      {values.map((v) => (
        <Fragment key={v}>
          <input
            type="radio"
            id={`${name}_${v}`}
            name={name}
            value={v}
            defaultChecked={v === defaultValue}
          />
          <label htmlFor={`${name}_${v}`} title={`${v} из 5`}>
            ★
          </label>
        </Fragment>
      ))}
    </div>
  );
}
