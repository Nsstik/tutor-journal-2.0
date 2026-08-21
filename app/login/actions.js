'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function signIn(formData) {
  const email = formData.get('email');
  const password = formData.get('password');
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect('/login?error=' + encodeURIComponent('Неверный e-mail или пароль'));
  }

  redirect('/dashboard');
}

// Регистрация аккаунта РЕПЕТИТОРА. Родителей репетитор создаёт сам из
// панели /dashboard — этой формой пользуется только сама репетитор один раз.
export async function signUpRepetitor(formData) {
  const email = formData.get('email');
  const password = formData.get('password');
  const fullName = formData.get('fullName');
  const inviteCode = formData.get('inviteCode');

  if (inviteCode !== process.env.TUTOR_SIGNUP_CODE) {
    redirect('/login?mode=signup&error=' + encodeURIComponent('Неверный код регистрации'));
  }

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    redirect('/login?mode=signup&error=' + encodeURIComponent(error.message));
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: data.user.id,
    role: 'repetitor',
    full_name: fullName,
  });

  if (profileError) {
    redirect('/login?mode=signup&error=' + encodeURIComponent(profileError.message));
  }

  const supabase = createClient();
  await supabase.auth.signInWithPassword({ email, password });

  redirect('/dashboard');
}
