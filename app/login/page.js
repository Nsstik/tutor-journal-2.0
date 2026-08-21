import { signIn, signUpRepetitor } from './actions';

export default function LoginPage({ searchParams }) {
  const mode = searchParams?.mode === 'signup' ? 'signup' : 'signin';
  const error = searchParams?.error;

  return (
    <div className="shell" style={{ maxWidth: 460, paddingTop: 80 }}>
      <div className="masthead" style={{ display: 'block', textAlign: 'center' }}>
        <div className="eyebrow">Журнал успеваемости</div>
        <h1>{mode === 'signup' ? 'Регистрация репетитора' : 'Вход'}</h1>
      </div>

      {error && <p className="error-text">{error}</p>}

      {mode === 'signin' ? (
        <form action={signIn}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Пароль</label>
            <input id="password" name="password" type="password" required />
          </div>
          <button className="btn" type="submit" style={{ width: '100%', marginTop: 8 }}>
            Войти
          </button>
        </form>
      ) : (
        <form action={signUpRepetitor}>
          <div className="field">
            <label htmlFor="fullName">Ваше имя</label>
            <input id="fullName" name="fullName" type="text" required />
          </div>
          <div className="field">
            <label htmlFor="email2">E-mail</label>
            <input id="email2" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="password2">Пароль</label>
            <input id="password2" name="password" type="password" required minLength={6} />
          </div>
          <div className="field">
            <label htmlFor="inviteCode">Секретный код (TUTOR_SIGNUP_CODE)</label>
            <input id="inviteCode" name="inviteCode" type="text" required />
          </div>
          <button className="btn" type="submit" style={{ width: '100%', marginTop: 8 }}>
            Создать аккаунт репетитора
          </button>
        </form>
      )}

      <p className="muted" style={{ textAlign: 'center', marginTop: 20 }}>
        {mode === 'signin' ? (
          <a href="/login?mode=signup">Первый раз здесь? Зарегистрировать аккаунт репетитора</a>
        ) : (
          <a href="/login">У меня уже есть аккаунт</a>
        )}
      </p>

      <p className="muted" style={{ textAlign: 'center', marginTop: 6, fontSize: '0.8rem' }}>
        Доступ для родителей создаётся репетитором из личного кабинета —
        отдельной регистрации для родителей нет.
      </p>
    </div>
  );
}
