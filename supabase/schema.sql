-- =========================================================
-- Схема «Журнал ученика» для Supabase
-- Скопируйте весь этот файл в SQL Editor в Supabase и нажмите Run.
-- =========================================================

-- 1. ПРОФИЛИ (роль: repetitor / parent)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('repetitor', 'parent')),
  full_name text,
  student_id uuid,               -- заполняется только для родителя
  show_payment boolean default false, -- видна ли графа "Оплата" этому родителю
  created_at timestamptz default now()
);

-- 2. УЧЕНИКИ
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  repetitor_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  subject text default 'Математика',
  notes text,
  created_at timestamptz default now()
);

alter table public.profiles
  add constraint profiles_student_id_fkey
  foreign key (student_id) references public.students (id) on delete set null;

-- 3. УРОКИ (дата, тема, поведение, ДЗ — одна запись = один урок)
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  lesson_date date not null default current_date,
  topic text,
  behavior text check (behavior in ('активно работал', 'отвлекался', 'устал', 'не был готов', 'без замечаний')),
  behavior_comment text,
  homework_done boolean,
  homework_comment text,
  created_at timestamptz default now()
);

-- 4. ОПЛАТА (отдельная таблица — чтобы у части родителей её вообще не было видно)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid unique references public.lessons (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  amount numeric,
  paid boolean default false,
  created_at timestamptz default now()
);

-- 5. ТЕМЫ "ЧТО НУЖНО ПОДТЯНУТЬ" (репетитор заносит заранее, потом отмечает галочкой)
create table if not exists public.topics_to_review (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  topic text not null,
  done boolean default false,
  created_at timestamptz default now()
);

-- 6. РАСПИСАНИЕ (постоянные слоты: день недели + время; можно назначить
-- несколько на одного ученика, и в любой момент отредактировать)
create table if not exists public.schedule_slots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = воскресенье ... 6 = суббота (как в JS Date.getDay())
  time_of_day time not null,
  created_at timestamptz default now()
);

-- =========================================================
-- ФУНКЦИИ-ПОМОЩНИКИ (чтобы не дублировать подзапросы в политиках)
-- =========================================================
create or replace function public.current_role_is_repetitor()
returns boolean language sql stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'repetitor');
$$;

create or replace function public.current_parent_student_id()
returns uuid language sql stable as $$
  select student_id from public.profiles where id = auth.uid() and role = 'parent';
$$;

create or replace function public.current_parent_sees_payment()
returns boolean language sql stable as $$
  select coalesce(show_payment, false) from public.profiles where id = auth.uid() and role = 'parent';
$$;

-- =========================================================
-- ВКЛЮЧАЕМ RLS (без этого никто, кроме владельца service-role, доступа не получит)
-- =========================================================
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.lessons enable row level security;
alter table public.payments enable row level security;
alter table public.topics_to_review enable row level security;
alter table public.schedule_slots enable row level security;

-- ---------- profiles ----------
create policy "видеть свой профиль" on public.profiles
  for select using (id = auth.uid());

create policy "репетитор видит профили своих родителей" on public.profiles
  for select using (
    public.current_role_is_repetitor()
    and student_id in (select id from public.students where repetitor_id = auth.uid())
  );

create policy "обновлять свой профиль" on public.profiles
  for update using (id = auth.uid());

-- ---------- students ----------
create policy "репетитор управляет своими учениками" on public.students
  for all using (repetitor_id = auth.uid()) with check (repetitor_id = auth.uid());

create policy "родитель видит своего ученика" on public.students
  for select using (id = public.current_parent_student_id());

-- ---------- lessons ----------
create policy "репетитор управляет уроками своих учеников" on public.lessons
  for all using (
    student_id in (select id from public.students where repetitor_id = auth.uid())
  ) with check (
    student_id in (select id from public.students where repetitor_id = auth.uid())
  );

create policy "родитель видит уроки своего ученика" on public.lessons
  for select using (student_id = public.current_parent_student_id());

-- ---------- payments ----------
create policy "репетитор управляет оплатой своих учеников" on public.payments
  for all using (
    student_id in (select id from public.students where repetitor_id = auth.uid())
  ) with check (
    student_id in (select id from public.students where repetitor_id = auth.uid())
  );

-- ключевая политика: родитель видит оплату, ТОЛЬКО если show_payment = true
create policy "родитель видит оплату только если разрешено" on public.payments
  for select using (
    student_id = public.current_parent_student_id()
    and public.current_parent_sees_payment()
  );

-- ---------- topics_to_review ----------
create policy "репетитор управляет темами своих учеников" on public.topics_to_review
  for all using (
    student_id in (select id from public.students where repetitor_id = auth.uid())
  ) with check (
    student_id in (select id from public.students where repetitor_id = auth.uid())
  );

create policy "родитель видит темы своего ученика" on public.topics_to_review
  for select using (student_id = public.current_parent_student_id());

-- ---------- schedule_slots ----------
create policy "репетитор управляет расписанием своих учеников" on public.schedule_slots
  for all using (
    student_id in (select id from public.students where repetitor_id = auth.uid())
  ) with check (
    student_id in (select id from public.students where repetitor_id = auth.uid())
  );

create policy "родитель видит расписание своего ученика" on public.schedule_slots
  for select using (student_id = public.current_parent_student_id());

-- =========================================================
-- Готово. После выполнения этого файла:
-- 1) Зарегистрируйте себя как репетитора через страницу /login (кнопка "Создать аккаунт репетитора" —
--    см. SETUP.md, шаг про первый аккаунт).
-- 2) Все дальнейшие действия — через интерфейс сайта.
-- =========================================================
