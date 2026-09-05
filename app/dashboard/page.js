import { createClient } from '@/lib/supabase/server';
import { addStudent, signOut, createTutorAccount } from './actions';

export default async function DashboardPage({ searchParams }) {
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
        <div className="tutor-nameplate">
          <div className="eyebrow">Журнал успеваемости</div>
          <h1 className="tutor-name">{profile?.full_name || 'Мой кабинет'}</h1>
        </div>
        <form action={signOut}>
          <button className="btn-secondary" type="submit">Выйти</button>
        </form>
      </div>

      {searchParams?.error && <p className="error-text">{searchParams.error}</p>}

      {searchParams?.newTutorEmail && searchParams?.newTutorPassword && (
        <div className="card" style={{ borderColor: 'var(--gold)' }}>
          <span className="stamp">Аккаунт репетитора создан</span>
          <p style={{ marginTop: 12 }}>
            Логин: <strong>{searchParams.newTutorEmail}</strong>
            <br />
            Временный пароль: <strong>{searchParams.newTutorPassword}</strong>
          </p>
          <p className="muted" style={{ marginTop: 8 }}>
            Передайте эти данные репетитору — у него будет полностью своя,
            отдельная база учеников, вы её не увидите.
          </p>
        </div>
      )}

      <div className="card">
        <div className="card-title">Ученики</div>
        {students && students.length > 0 ? (
          <ul className="student-list">
            {students.map((s) => (
              <li key={s.id}>
                <a href={`/dashboard/students/${s.id}`}>
                  <span className="student-list-info">
                    <span className="student-list-name">{s.full_name}</span>
                  </span>
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
              <input id="subject" name="subject" defaultValue="Математика" />
            </div>
          </div>
          <button className="btn" type="submit">Добавить</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">Выдать доступ репетитору</div>
        <p className="muted" style={{ marginBottom: 14 }}>
          Создайте отдельный аккаунт для другого репетитора — у него будет своя база
          учеников, полностью независимая от вашей.
        </p>
        <form action={createTutorAccount}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="tutorName">Имя репетитора</label>
              <input id="tutorName" name="tutorName" type="text" required />
            </div>
            <div className="field">
              <label htmlFor="tutorEmail">E-mail</label>
              <input id="tutorEmail" name="tutorEmail" type="email" required />
            </div>
          </div>
          <button className="btn-secondary" type="submit">Создать аккаунт репетитора</button>
        </form>
      </div>
    </div>
  );
}
