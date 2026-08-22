import './globals.css';

export const metadata = {
  title: 'Журнал успеваемости',
  description: 'Учёт прогресса учеников для репетитора и родителей',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <div className="site-signature" aria-hidden="true">
          <span className="signature-mark">Ю</span>
          <span>Юрлова А.И.</span>
        </div>
      </body>
    </html>
  );
}
