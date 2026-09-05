'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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
import { createAdminClient } from '@/lib/supabase/admin';

// Создание аккаунта ещё одного репетитора. Он получит полностью свою,
// отдельную базу учеников — доступ к вашим данным у него не появится.
export async function createTutorAccount(formData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

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
  });

  if (profileError) {
    redirect(`/dashboard?error=${encodeURIComponent(profileError.message)}`);
  }

  redirect(
    `/dashboard?newTutorEmail=${encodeURIComponent(email)}&newTutorPassword=${encodeURIComponent(tempPassword)}`
  );
}
