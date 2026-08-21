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
