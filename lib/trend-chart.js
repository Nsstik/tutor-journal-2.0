import { Fragment } from 'react';

/* =========================================================
   Звёздный рейтинг — ввод (форма добавления урока)
   ========================================================= */
export function StarInput({ name, defaultValue = 5, idPrefix = name }) {
  return (
    <div className="star-input">
      {[5, 4, 3, 2, 1].map((v) => (
        <Fragment key={v}>
          <input
            type="radio"
            id={`${idPrefix}-star-${v}`}
            name={name}
            value={v}
            defaultChecked={v === defaultValue}
          />
          <label htmlFor={`${idPrefix}-star-${v}`}>★</label>
        </Fragment>
      ))}
    </div>
  );
}

/* =========================================================
   Звёздный рейтинг — только просмотр (таблица уроков)
   ========================================================= */
export function StarsDisplay({ value }) {
  if (!value) return <span className="muted">—</span>;
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="stars-display">
      <span className="stars-filled">{'★'.repeat(v)}</span>
      <span className="stars-empty">{'★'.repeat(5 - v)}</span>
    </span>
  );
}

/* =========================================================
   График динамики — без сетки/линейки, мягкая заливка,
   просто линия с точками и подписями дат снизу.
   ========================================================= */
function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

// Строит гладкую путь-линию (кривые Безье) по набору точек.
function buildSmoothPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function TrendChart({ lessons }) {
  // приходят отсортированными по убыванию даты — разворачиваем в хронологический порядок
  const chronological = [...(lessons || [])].reverse();
  const data = chronological.filter(
    (l) => l.behavior_rating != null || l.work_rating != null
  );

  if (data.length < 2) {
    return (
      <p className="muted">
        Пока недостаточно данных для графика — понадобится хотя бы два урока с оценками.
      </p>
    );
  }

  const width = 640;
  const height = 140;
  const padX = 16;
  const padTop = 14;
  const padBottom = 28;
  const n = data.length;
  const stepX = n > 1 ? (width - padX * 2) / (n - 1) : 0;
  const scaleY = (v) => {
    const clamped = Math.max(1, Math.min(5, v));
    return height - padBottom - ((clamped - 1) / 4) * (height - padTop - padBottom);
  };

  const behaviorPoints = data.map((d, i) => ({
    x: padX + i * stepX,
    y: d.behavior_rating != null ? scaleY(d.behavior_rating) : null,
  }));
  const workPoints = data.map((d, i) => ({
    x: padX + i * stepX,
    y: d.work_rating != null ? scaleY(d.work_rating) : null,
  }));

  const onlyReal = (pts) => pts.filter((p) => p.y != null);
  const behaviorPath = buildSmoothPath(onlyReal(behaviorPoints));
  const workPath = buildSmoothPath(onlyReal(workPoints));

  const workAreaPath = (() => {
    const real = onlyReal(workPoints);
    if (real.length < 2) return '';
    const line = buildSmoothPath(real);
    const last = real[real.length - 1];
    const first = real[0];
    return `${line} L ${last.x} ${height - padBottom} L ${first.x} ${height - padBottom} Z`;
  })();

  // подписи дат: первая, последняя и одна-две в середине, чтобы не наслаивались
  const labelIdx = new Set([0, n - 1]);
  if (n >= 5) labelIdx.add(Math.floor((n - 1) / 2));

  return (
    <div className="chart-wrap">
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="workAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--green-ink)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--green-ink)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {workAreaPath && <path d={workAreaPath} fill="url(#workAreaFill)" stroke="none" />}

        {behaviorPath && <path d={behaviorPath} className="chart-line chart-line-behavior" />}
        {workPath && <path d={workPath} className="chart-line chart-line-work" />}

        {behaviorPoints.map(
          (p, i) => p.y != null && <circle key={`b${i}`} cx={p.x} cy={p.y} r="3.5" className="chart-dot-behavior" />
        )}
        {workPoints.map(
          (p, i) => p.y != null && <circle key={`w${i}`} cx={p.x} cy={p.y} r="3.5" className="chart-dot-work" />
        )}

        {data.map(
          (d, i) =>
            labelIdx.has(i) && (
              <text
                key={`l${i}`}
                x={padX + i * stepX}
                y={height - 8}
                textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                className="chart-axis-label"
              >
                {formatShortDate(d.lesson_date)}
              </text>
            )
        )}
      </svg>

      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot legend-dot-behavior" /> Поведение
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-dot-work" /> Работа на уроке
        </span>
      </div>
    </div>
  );
}


/* =========================================================
   График выполнения ДЗ — процент за всё время + полоса
   из цветных ячеек по каждому уроку в хронологическом порядке.
   ========================================================= */
export function HomeworkChart({ lessons }) {
  // приходят отсортированными по убыванию даты — разворачиваем в хронологический порядок
  const chronological = [...(lessons || [])].reverse();
  const data = chronological.filter((l) => l.homework_done !== null && l.homework_done !== undefined);

  if (data.length === 0) {
    return <p className="muted">Пока нет данных о выполнении ДЗ.</p>;
  }

  const doneCount = data.filter((l) => l.homework_done).length;
  const percent = Math.round((doneCount / data.length) * 100);

  return (
    <div className="hw-chart">
      <div className="topics-progress">
        <div className="topics-progress-bar">
          <div className="topics-progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="muted">
          Выполнено {doneCount} из {data.length} ({percent}%)
        </span>
      </div>

      <div className="hw-cells">
        {data.map((l, i) => (
          <div
            key={l.id ?? i}
            className={`hw-cell ${l.homework_done ? 'hw-cell-done' : 'hw-cell-pending'}`}
            title={`${formatShortDate(l.lesson_date)} — ${l.homework_done ? 'выполнено' : 'не выполнено'}`}
          />
        ))}
      </div>

      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--green-ink)' }} /> Выполнено
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--red-pen)' }} /> Не выполнено
        </span>
      </div>
    </div>
  );
}
