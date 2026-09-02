'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { StarInput } from '@/lib/trend-chart';
import { Toast } from '@/components/Toast';

const initialState = { ok: false, ts: 0 };

export function AddLessonForm({ action, todayISO, hasPendingTopics }) {
  const formRef = useRef(null);
  const [state, formAction] = useFormState(action, initialState);

  // После успешного сохранения — очищаем форму, чтобы можно было сразу
  // вносить следующий урок, не стирая вручную предыдущие значения.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ts]);

  return (
    <>
      <form ref={formRef} action={formAction}>
        <div className="form-row">
          <div className="field">
            <label htmlFor="lesson_date">Дата</label>
            <input id="lesson_date" name="lesson_date" type="date" defaultValue={todayISO} required />
          </div>
          <div className="field">
            <label htmlFor="topic">Тема урока</label>
            <input
              id="topic"
              name="topic"
              type="text"
              list="pending-topics-list"
              placeholder={hasPendingTopics ? 'Начните вводить или выберите из списка' : 'Например: проценты'}
              autoComplete="off"
              required
            />
            {hasPendingTopics && (
              <span className="field-hint muted">
                💡 можно выбрать из тем «на подтянуть» — совпавшая тема автоматически отметится пройденной
              </span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Поведение</label>
            <StarInput name="behavior_rating" defaultValue={5} />
          </div>
          <div className="field">
            <label>Работа на уроке</label>
            <StarInput name="work_rating" defaultValue={5} />
          </div>
        </div>

        <div className="form-row">
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="behavior_comment">Комментарий (необязательно)</label>
            <input id="behavior_comment" name="behavior_comment" type="text" />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="homework_done">Домашняя работа</label>
            <label className="checkbox-label">
              <input id="homework_done" name="homework_done" type="checkbox" />
              выполнена
            </label>
          </div>
          <div className="field">
            <label htmlFor="homework_comment">Комментарий к ДЗ</label>
            <input id="homework_comment" name="homework_comment" type="text" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="paid">Оплата</label>
          <label className="checkbox-label">
            <input id="paid" name="paid" type="checkbox" />
            оплачено
          </label>
        </div>

        <button className="btn" type="submit">Сохранить урок</button>
      </form>
      <Toast trigger={state.ts} />
    </>
  );
}
