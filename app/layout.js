import './globals.css';

export const metadata = {
  title: 'Журнал успеваемости',
  description: 'Учёт прогресса учеников для репетитора и родителей',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
