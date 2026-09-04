'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { StarInput, StarsDisplay } from '@/lib/trend-chart';
import { Toast } from '@/components/Toast';

const initialState = { ok: false, ts: 0 };

// Строка урока в таблице + раскрывающаяся форма редактирования.
// Раньше открытие/закрытие делалось хитрым CSS-трюком через скрытый
// чекбокс — из-за этого сохранение иногда работало ненадёжно.
// Теперь это обычный React-компонент с состоянием — открытие панели
// и сохранение изменений работают предсказуемо в любом браузере.
export function LessonRow({ lesson: l, payment, dateParts, action, toggleHomeworkAction, togglePaymentAction }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(action, initialState);
  const lastTs = useRef(0);

  useEffect(() => {
    if (state.ok && state.ts !== lastTs.current) {
      lastTs.current = state.ts;
      setOpen(false);
    }
  }, [state]);

  const editId = `edit-${l.id}`;

  return (
    <>
      <tr className={open ? 'lesson-row lesson-row-active' : 'lesson-row'}>
        <td className="date-cell">
          <div className="date-day">{dateParts.day}</div>
          <div className="date-rest muted">{dateParts.rest}</div>
        </td>
        <td>
          {l.topic}
          {l.behavior_comment && <div className="muted">{l.behavior_comment}</div>}
        </td>
        <td>
          {l.behavior_rating ? (
            <StarsDisplay value={l.behavior_rating} />
          ) : l.behavior ? (
            <span className="tag tag-neutral">{l.behavior}</span>
          ) : (
            <span className="muted">—</span>
          )}
        </td>
        <td>
          <StarsDisplay value={l.work_rating} />
        </td>
        <td>
          <form action={toggleHomeworkAction}>
            <input type="hidden" name="lessonId" value={l.id} />
            <input type="hidden" name="nextValue" value={(!l.homework_done).toString()} />
            <button
              type="submit"
              className="btn-secondary"
              style={{ padding: '2px 10px', fontSize: '0.85rem' }}
            >
              {l.homework_done ? (
                <span className="check">✓ сделано</span>
              ) : (
                <span className="cross">— не сделано</span>
              )}
            </button>
          </form>
        </td>
                <td>
          <form action={togglePaymentAction}>
            <input type="hidden" name="lessonId" value={l.id} />
            {payment?.id && <input type="hidden" name="paymentId" value={payment.id} />}
            <input type="hidden" name="nextValue" value={(!payment?.paid).toString()} />
            <button
              type="submit"
              className="btn-secondary"
              style={{ padding: '2px 10px', fontSize: '0.85rem' }}
            >
              {payment?.paid ? (
                <span className="check">✓ {payment.amount ? `${payment.amount} ₽` : 'оплачено'}</span>
              ) : (
                <span className="cross">
                  {payment?.amount ? `${payment.amount} ₽ · не оплачено` : '— не оплачено'}
                </span>
              )}
            </button>
          </form>
        </td>
        <td className="actions-cell">
          <button
            type="button"
            className="btn-secondary edit-btn"
            title="Редактировать урок"
            onClick={() => setOpen((v) => !v)}
          >
            ✎
          </button>
        </td>
      </tr>

      {open && (
        <tr className="lesson-edit-row">
          <td colSpan={7}>
            <form action={formAction} className="lesson-edit-form">
              <input type="hidden" name="lessonId" value={l.id} />
              {payment?.id && <input type="hidden" name="paymentId" value={payment.id} />}

              <div className="form-row">
                <div className="field">
                  <label htmlFor={`${editId}-date`}>Дата</label>
                  <input
                    id={`${editId}-date`}
                    name="lesson_date"
                    type="date"
                    defaultValue={l.lesson_date}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor={`${editId}-topic`}>Тема урока</label>
                  <input
                    id={`${editId}-topic`}
                    name="topic"
                    type="text"
                    list="pending-topics-list"
                    defaultValue={l.topic || ''}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Поведение</label>
                  <StarInput
                    name="behavior_rating"
                    idPrefix={`${editId}-behavior`}
                    defaultValue={l.behavior_rating || 5}
                  />
                </div>
                <div className="field">
                  <label>Работа на уроке</label>
                  <StarInput
                    name="work_rating"
                    idPrefix={`${editId}-work`}
                    defaultValue={l.work_rating || 5}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor={`${editId}-behavior-comment`}>Комментарий</label>
                <input
                  id={`${editId}-behavior-comment`}
                  name="behavior_comment"
                  type="text"
                  defaultValue={l.behavior_comment || ''}
                />
              </div>

              <div className="form-row">
                <div className="field">
                  <label style={{ marginBottom: 10 }}>Домашняя работа</label>
                  <label className="checkbox-label">
                    <input name="homework_done" type="checkbox" defaultChecked={l.homework_done} />
                    выполнена
                  </label>
                </div>
                <div className="field">
                  <label htmlFor={`${editId}-hw-comment`}>Комментарий к ДЗ</label>
                  <input
                    id={`${editId}-hw-comment`}
                    name="homework_comment"
                    type="text"
                    defaultValue={l.homework_comment || ''}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label htmlFor={`${editId}-amount`}>Сумма оплаты, ₽</label>
                  <input
                    id={`${editId}-amount`}
                    name="amount"
                    type="number"
                    defaultValue={payment?.amount ?? ''}
                    placeholder="сумма"
                  />
                </div>
                <div className="field">
                  <label style={{ marginBottom: 10 }}>Статус оплаты</label>
                  <label className="checkbox-label">
                    <input name="paid" type="checkbox" defaultChecked={payment?.paid} />
                    оплачено
                  </label>
                </div>
              </div>

              <div className="lesson-edit-actions">
                <button className="btn" type="submit">
                  Сохранить изменения
                </button>
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                  Отмена
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}

      <Toast trigger={state.ts} />
    </>
  );
}
