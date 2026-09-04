'use client';

import { useState } from 'react';
import { WEEKDAY_NAMES, formatTime } from '@/lib/schedule';

// Постоянные слоты расписания ученика: репетитор назначает день недели +
// время, слот сохраняется «навсегда» (пока его не удалят), но в любой
// момент можно открыть редактирование и поменять день/время.
export function ScheduleManager({ slots, addAction, updateAction, deleteAction }) {
  const [editingId, setEditingId] = useState(null);

  return (
    <div>
      {slots && slots.length > 0 ? (
        <div className="schedule-list">
          {slots.map((s) =>
            editingId === s.id ? (
              <form
                key={s.id}
                action={updateAction}
                className="schedule-row schedule-row-editing"
                onSubmit={() => setEditingId(null)}
              >
                <input type="hidden" name="slotId" value={s.id} />
                <select name="weekday" defaultValue={s.weekday}>
                  {WEEKDAY_NAMES.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
                <input name="time_of_day" type="time" defaultValue={formatTime(s.time_of_day)} required />
                <button type="submit" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                  Сохранить
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => setEditingId(null)}
                >
                  Отмена
                </button>
              </form>
            ) : (
              <div key={s.id} className="schedule-row">
                <span className="schedule-row-label">
                  {WEEKDAY_NAMES[s.weekday]}, {formatTime(s.time_of_day)}
                </span>
                <div className="schedule-row-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => setEditingId(s.id)}
                  >
                    Изменить
                  </button>
                  <form action={deleteAction}>
                    <input type="hidden" name="slotId" value={s.id} />
                    <button type="submit" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                      Удалить
                    </button>
                  </form>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <p className="muted">Расписание пока не назначено.</p>
      )}

      <form action={addAction} className="schedule-add-form">
        <select name="weekday" defaultValue={1}>
          {WEEKDAY_NAMES.map((name, idx) => (
            <option key={idx} value={idx}>
              {name}
            </option>
          ))}
        </select>
        <input name="time_of_day" type="time" required />
        <button type="submit" className="btn-secondary">
          + Добавить занятие
        </button>
      </form>
    </div>
  );
}
