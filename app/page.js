import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/dashboard/actions';
import { TrendChart, StarsDisplay } from '@/lib/trend-chart';

export default async function ParentPage() {
  const supabase = createClient();

  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (error) {
    console.error('Auth error on home page:', error?.message);
    user = null;
  }

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('student_id, show_payment')
    .eq('id', user.id)
    .single();

  if (!profile?.student_id) {
    return (
      <div className="shell">
        <p className="muted">Доступ ещё не настроен. Обратитесь к репетитору.</p>
      </div>
    );
  }

  const { data: student } = await supabase
    .from('students')
    .select('full_name, subject')
    .eq('id', profile.student_id)
    .single();

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*, payments(*)')
    .eq('student_id', profile.student_id)
    .order('lesson_date', { ascending: false });

  const { data: topics } = await supabase
    .from('topics_to_review')
    .select('*')
    .eq('student_id', profile.student_id)
    .order('created_at', { ascending: true });

  const topicsDone = (topics || []).filter((t) => t.done).length;
  const topicsTotal = (topics || []).length;
  const topicsPercent = topicsTotal ? Math.round((topicsDone / topicsTotal) * 100) : 0;

  return (
    <div className="shell">
      <div className="masthead">
        <div>
          <div className="eyebrow">{student?.subject}</div>
          <h1>{student?.full_name}</h1>
        </div>
        <form action={signOut}>
          <button className="btn-secondary" type="submit">Выйти</button>
        </form>
      </div>

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
                {profile.show_payment && <th>Оплата</th>}
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
                      {l.homework_done ? (
                        <span className="check">✓ выполнено</span>
                      ) : (
                        <span className="cross">не выполнено</span>
                      )}
                      {l.homework_comment && <div className="muted">{l.homework_comment}</div>}
                    </td>
                    {profile.show_payment && (
                      <td>
                        {payment ? (
                          payment.paid ? (
                            <span className="check">✓ Оплачено</span>
                          ) : (
                            <span className="cross">Не оплачено</span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="muted">Уроков пока нет.</p>
        )}
      </div>

      <div className="card card-chart">
        <div className="card-title">Динамика по урокам</div>
        <TrendChart lessons={lessons || []} />
      </div>

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
          <div className="topic-list">
            {topics.map((t) => (
              <div
                key={t.id}
                className={`topic-row topic-row-static ${
                  t.done ? 'topic-row-done' : 'topic-row-pending'
                }`}
              >
                <span className="topic-row-check">{t.done ? '✅' : '⬜️'}</span>
                <span className="topic-row-text">{t.topic}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Список пуст.</p>
        )}
      </div>
    </div>
  );
}
