'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function addStudent(formData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const fullName = formData.get('fullName');
  const subject = formData.get('subject') || 'Математика';

  await supabase.from('students').insert({
    repetitor_id: user.id,
    full_name: fullName,
    subject,
  });

  revalidatePath('/dashboard');
}

// Создание аккаунта ещё одного репетитора. Он получит полностью свою,
// отдельную базу учеников — доступ к вашим данным у него не появится.
export async function createTutorAccount(formData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!callerProfile?.is_admin) {
    redirect('/dashboard?error=' + encodeURIComponent('Только главный репетитор может создавать аккаунты репетиторов'));
  }

  const email = formData.get('tutorEmail');
  const fullName = formData.get('tutorName');
  const tempPassword = Math.random().toString(36).slice(-5) + Math.random().toString(36).slice(-5);

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: data.user.id,
    role: 'repetitor',
    full_name: fullName,
    is_admin: false,
    created_by: user.id,
  });

  if (profileError) {
    redirect(`/dashboard?error=${encodeURIComponent(profileError.message)}`);
  }

  redirect(
    `/dashboard?newTutorEmail=${encodeURIComponent(email)}&newTutorPassword=${encodeURIComponent(tempPassword)}`
  );
}

// Блокировка/разблокировка входа для репетитора, которого вы создали.
// Данные (ученики, уроки) не удаляются — он просто не сможет войти.
//
// Важно: обновление идёт через административный клиент, потому что
// обычному клиенту это запрещает RLS-политика "обновлять свой профиль"
// (id = auth.uid()) — именно из-за неё кнопка раньше молча не работала.
export async function toggleTutorActive(formData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!callerProfile?.is_admin) {
    redirect('/dashboard?error=' + encodeURIComponent('Недостаточно прав'));
  }

  const tutorId = formData.get('tutorId');
  const nextActive = formData.get('nextActive') === 'true';

  const admin = createAdminClient();

  // Проверяем, что меняем именно того, кого сами создали.
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('id, created_by')
    .eq('id', tutorId)
    .single();

  if (!targetProfile || targetProfile.created_by !== user.id) {
    redirect('/dashboard?error=' + encodeURIComponent('Недостаточно прав'));
  }

  await admin.from('profiles').update({ is_active: nextActive }).eq('id', tutorId);

  revalidatePath('/dashboard');
}

// Полное удаление аккаунта репетитора вместе со всеми его учениками,
// уроками, оплатами, темами и расписанием. Действие необратимо.
export async function deleteTutorAccount(formData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!callerProfile?.is_admin) {
    redirect('/dashboard?error=' + encodeURIComponent('Недостаточно прав'));
  }

  const tutorId = formData.get('tutorId');
  const admin = createAdminClient();

  const { data: targetProfile } = await admin
    .from('profiles')
    .select('id, created_by')
    .eq('id', tutorId)
    .single();

  if (!targetProfile || targetProfile.created_by !== user.id) {
    redirect('/dashboard?error=' + encodeURIComponent('Можно удалять только созданные вами аккаунты'));
  }

  // Удаление пользователя из Auth каскадно удалит его профиль
  // (profiles.id -> auth.users.id on delete cascade), а вместе с профилем —
  // всех его учеников, уроки, оплаты, темы и расписание (там тоже cascade).
  await admin.auth.admin.deleteUser(tutorId);

  revalidatePath('/dashboard');
}
