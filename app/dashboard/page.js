import { createClient } from '@/lib/supabase/server';
import { addStudent, signOut } from './actions';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, subject')
    .order('full_name');

  return (
    <div className="shell">
      <div className="masthead">
        <div>
          <div className="eyebrow">Журнал успеваемости</div>
          <h1>{profile?.full_name || 'Мой кабинет'}</h1>
        </div>
        <form action={signOut}>
          <button className="btn-secondary" type="submit">Выйти</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">Ученики</div>
        {students && students.length > 0 ? (
          <ul className="student-list">
            {students.map((s) => (
              <li key={s.id}>
                <a href={`/dashboard/students/${s.id}`}>
                  <span>{s.full_name}</span>
                  <span className="muted">{s.subject}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Пока нет ни одного ученика — добавьте первого ниже.</p>
        )}
      </div>

      <div className="card">
        <div className="card-title">Добавить ученика</div>
        <form action={addStudent}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="fullName">Имя ученика</label>
              <input id="fullName" name="fullName" type="text" required />
            </div>
            <div className="field">
              <label htmlFor="subject">Предмет</label>
              <input id="subject" name="subject" type="text" defaultValue="Математика" />
            </div>
          </div>
          <button className="btn" type="submit">Добавить</button>
        </form>
      </div>
    </div>
  );
}
