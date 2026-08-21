import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/dashboard/actions';

export default async function ParentPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
                    <td>{l.behavior && <span className="tag tag-neutral">{l.behavior}</span>}</td>
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
                            <span className="check">✓ оплачено {payment.amount ?? ''}₽</span>
                          ) : (
                            <span className="cross">не оплачено {payment.amount ?? ''}₽</span>
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

      <div className="card">
        <div className="card-title">Что нужно подтянуть</div>
        {topics && topics.length > 0 ? (
          topics.map((t) => (
            <div key={t.id} className={`checkbox-row ${t.done ? 'done' : ''}`}>
              <span style={{ width: 18 }}>{t.done ? <span className="check">✓</span> : '·'}</span>
              <span>{t.topic}</span>
            </div>
          ))
        ) : (
          <p className="muted">Список пуст.</p>
        )}
      </div>
    </div>
  );
}
