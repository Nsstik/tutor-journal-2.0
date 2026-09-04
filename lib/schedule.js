// Помощники для расписания: слот = день недели (0-6, как Date.getDay(),
// 0 — воскресенье) + время. Постоянный слот, который репетитор может
// в любой момент отредактировать или удалить.

export const WEEKDAY_NAMES = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
];

export const WEEKDAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

// Ближайшая дата/время, когда наступит этот слот расписания
// (считая от текущего момента, слот сегодня в будущем — тоже подходит).
export function nextOccurrence(weekday, timeOfDay, from = new Date()) {
  const [h, m] = timeOfDay.split(':').map(Number);
  const result = new Date(from);
  result.setHours(h, m || 0, 0, 0);

  let diffDays = (weekday - result.getDay() + 7) % 7;
  if (diffDays === 0 && result.getTime() <= from.getTime()) {
    diffDays = 7;
  }
  result.setDate(result.getDate() + diffDays);
  return result;
}

export function formatTime(timeOfDay) {
  return (timeOfDay || '').slice(0, 5);
}

// Сортирует слоты по ближайшей дате наступления и добавляет вычисленную дату.
export function sortByNextOccurrence(slots, from = new Date()) {
  return [...(slots || [])]
    .map((s) => ({ ...s, _next: nextOccurrence(s.weekday, s.time_of_day, from) }))
    .sort((a, b) => a._next - b._next);
}
