import { createClient } from '@/lib/supabase/server';
import { TrendChart, StarsDisplay, StarInput } from '@/lib/trend-chart';
import {
  addLesson,
  togglePaid,
  toggleHomework,
  addTopic,
  toggleTopic,
  createParentAccount,
  updateParentPayment,
  removeParentAccess,
  deleteStudent,
} from './actions';

export default async function StudentPage({ params, searchParams }) {
  const studentId = params.id;
  const supabase = createClient();

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, subject')
    .eq('id', studentId)
    .single();

  if (!student) {
    return (
      <div className="shell">
        <p className="error-text">Ученик не найден или у вас нет к нему доступа.</p>
        <a href="/dashboard">← Назад к списку</a>
      </div>
    );
  }

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*, payments(*)')
    .eq('student_id', studentId)
    .order('lesson_date', { ascending: false });

  const { data: topics } = await supabase
    .from('topics_to_review')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true });

  const { data: parents } = await supabase
    .from('profiles')
    .select('id, full_name, show_payment')
    .eq('student_id', studentId)
    .eq('role', 'parent');

  const addLessonAction = addLesson.bind(null, studentId);
  const togglePaidAction = togglePaid.bind(null, studentId);
  const toggleHomeworkAction = toggleHomework.bind(null, studentId);
  const addTopicAction = addTopic.bind(null, studentId);
  const toggleTopicAction = toggleTopic.bind(null, studentId);
  const createParentAction = createParentAccount.bind(null, studentId);
  const updateParentPaymentAction = updateParentPayment.bind(null, studentId);
  const removeParentAction = removeParentAccess.bind(null, studentId);
  const deleteStudentAction = deleteStudent.bind(null, studentId);

  const topicsDone = (topics || []).filter((t) => t.done).length;
  const topicsTotal = (topics || []).length;
  const topicsPercent = topicsTotal ? Math.round((topicsDone / topicsTotal) * 100) : 0;

  return (
    <div className="shell">
      <div className="masthead">
        <div>
          <div className="eyebrow">{student.subject}</div>
          <h1>{student.full_name}</h1>
        </div>
        <a href="/dashboard" className="btn-secondary" style={{ textDecoration: 'none' }}>
          ← Все ученики
        </a>
      </div>

      {searchParams?.newParent && searchParams?.newPassword && (
        <div className="card" style={{ borderColor: 'var(--gold)' }}>
          <span className="stamp">Доступ создан</span>
          <p style={{ marginTop: 12 }}>
            Логин: <strong>{searchParams.newParent}</strong>
            <br />
            Временный пароль: <strong>{searchParams.newPassword}</strong>
          </p>
          <p className="muted">
            Сохраните этот пароль сейчас — повторно он не показывается. Передайте его родителю
            лично или в сообщении; вход по адресу вашего сайта → «Вход».
          </p>
        </div>
      )}
      {searchParams?.error && <p className="error-text">{searchParams.error}</p>}

      {/* ------------------- УРОКИ ------------------- */}
      <div className="card">
        <div className="card-title">Уроки</div>
        {lessons && lessons.length > 0 ? (
          <table className="ledger">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тема</th>
                <th>Поведение</th>
                <th>Работа на уроке</th>
                <th>ДЗ</th>
                <th>Оплата</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => {
                const payment = l.payments?.[0];
                return (
                  <tr key={l.id}>
                    <td>{l.lesson_date}</td>
                    <td>
                      {l.topic}
                      {l.behavior_comment && (
                        <div className="muted">{l.behavior_comment}</div>
                      )}
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
                        <input
                          type="hidden"
                          name="nextValue"
                          value={(!l.homework_done).toString()}
                        />
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
                      {payment ? (
                        <form action={togglePaidAction}>
                          <input type="hidden" name="paymentId" value={payment.id} />
                          <input
                            type="hidden"
                            name="nextValue"
                            value={(!payment.paid).toString()}
                          />
                          <button
                            type="submit"
                            className="btn-secondary"
                            style={{ padding: '2px 10px', fontSize: '0.85rem' }}
                          >
                            {payment.paid ? (
                              <span className="check">✓ {payment.amount ?? ''}₽</span>
                            ) : (
                              <span className="cross">не оплачено {payment.amount ?? ''}₽</span>
                            )}
                          </button>
                        </form>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="muted">Уроков пока нет.</p>
        )}
      </div>

      {/* ------------------- ГРАФИК ДИНАМИКИ ------------------- */}
      <div className="card card-chart">
        <div className="card-title">Динамика по урокам</div>
        <TrendChart lessons={lessons || []} />
      </div>

      {/* ------------------- ДОБАВИТЬ УРОК ------------------- */}
      <div className="card">
        <div className="card-title">Добавить урок</div>
        <form action={addLessonAction}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="lesson_date">Дата</label>
              <input id="lesson_date" name="lesson_date" type="date" required />
            </div>
            <div className="field">
              <label htmlFor="topic">Тема урока</label>
              <input id="topic" name="topic" type="text" required />
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontVariant: 'normal' }}>
                <input id="homework_done" name="homework_done" type="checkbox" style={{ width: 'auto' }} />
                выполнена
              </label>
            </div>
            <div className="field">
              <label htmlFor="homework_comment">Комментарий к ДЗ</label>
              <input id="homework_comment" name="homework_comment" type="text" />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="amount">Сумма за урок, ₽</label>
              <input id="amount" name="amount" type="number" step="1" />
            </div>
            <div className="field">
              <label htmlFor="paid">Оплата</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontVariant: 'normal' }}>
                <input id="paid" name="paid" type="checkbox" style={{ width: 'auto' }} />
                оплачено
              </label>
            </div>
          </div>

          <button className="btn" type="submit">Сохранить урок</button>
        </form>
      </div>

      {/* ------------------- ТЕМЫ ------------------- */}
      <div className="card">
        <div className="card-title">Темы 📚</div>

        {topicsTotal > 0 && (
          <div className="topics-progress">
            <div className="topics-progress-bar">
              <div className="topics-progress-fill" style={{ width: `${topicsPercent}%` }} />
            </div>
            <span className="muted">
              Пройдено {topicsDone} из {topicsTotal} ({topicsPercent}%)
            </span>
          </div>
        )}

        {topics && topics.length > 0 ? (
          <div className="topic-chips">
            {topics.map((t) => (
              <form action={toggleTopicAction} key={t.id}>
                <input type="hidden" name="topicId" value={t.id} />
                <input type="hidden" name="nextValue" value={(!t.done).toString()} />
                <button
                  type="submit"
                  className={`topic-chip ${t.done ? 'topic-chip-done' : 'topic-chip-pending'}`}
                >
                  <span className="topic-chip-icon">{t.done ? '✅' : '📌'}</span>
                  {t.topic}
                </button>
              </form>
            ))}
          </div>
        ) : (
          <p className="muted">Список пуст.</p>
        )}

        <form action={addTopicAction} style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <input name="topic" type="text" placeholder="Например: проценты" required />
          <button className="btn-secondary" type="submit">+ Добавить тему</button>
        </form>
      </div>

      {/* ------------------- ДОСТУП РОДИТЕЛЯ ------------------- */}
      <div className="card">
        <div className="card-title">Доступ для родителя</div>

        {parents && parents.length > 0 && (
          <table className="ledger" style={{ marginBottom: 20 }}>
            <thead>
              <tr>
                <th>E-mail (логин)</th>
                <th>Видит оплату</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {parents.map((p) => (
                <tr key={p.id}>
                  <td>{p.full_name}</td>
                  <td>
                    <form action={updateParentPaymentAction}>
                      <input type="hidden" name="profileId" value={p.id} />
                      <input type="hidden" name="nextValue" value={(!p.show_payment).toString()} />
                      <button
                        type="submit"
                        className="btn-secondary"
                        style={{ padding: '2px 10px', fontSize: '0.85rem' }}
                      >
                        {p.show_payment ? <span className="check">да ✓</span> : <span className="muted">нет</span>}
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={removeParentAction}>
                      <input type="hidden" name="profileId" value={p.id} />
                      <button type="submit" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                        Отозвать доступ
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form action={createParentAction}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="parentEmail">E-mail родителя</label>
              <input id="parentEmail" name="parentEmail" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="showPayment">Графа «Оплата»</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontVariant: 'normal' }}>
                <input id="showPayment" name="showPayment" type="checkbox" style={{ width: 'auto' }} />
                показывать этому родителю
              </label>
            </div>
          </div>
          <button className="btn" type="submit">Создать доступ</button>
        </form>
      </div>

      {/* ------------------- УДАЛЕНИЕ УЧЕНИКА ------------------- */}
      <div className="card card-danger">
        <div className="card-title">Опасная зона</div>
        {searchParams?.confirmDelete ? (
          <>
            <p>
              Точно удалить ученика <strong>{student.full_name}</strong>? Все его уроки, темы и
              история оценок будут удалены безвозвратно. Это действие нельзя отменить.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <form action={deleteStudentAction}>
                <button type="submit" className="btn-danger">Да, удалить навсегда</button>
              </form>
              <a
                href={`/dashboard/students/${studentId}`}
                className="btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                Отмена
              </a>
            </div>
          </>
        ) : (
          <a
            href={`/dashboard/students/${studentId}?confirmDelete=1`}
            className="btn-danger"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            Удалить ученика
          </a>
        )}
      </div>
    </div>
  );
}
