'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function assertOwnsStudent(supabase, studentId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('repetitor_id', user.id)
    .single();
  if (!student) throw new Error('Нет доступа к этому ученику');
  return user;
}

export async function addLesson(studentId, prevState, formData) {
  const supabase = createClient();
  await assertOwnsStudent(supabase, studentId);

  const lesson_date = formData.get('lesson_date');
  const topic = formData.get('topic');
  const behavior_rating = formData.get('behavior_rating')
    ? Number(formData.get('behavior_rating'))
    : null;
  const work_rating = formData.get('work_rating') ? Number(formData.get('work_rating')) : null;
  const behavior_comment = formData.get('behavior_comment') || null;
  const homework_done = formData.get('homework_done') === 'on';
  const homework_comment = formData.get('homework_comment') || null;
  const paid = formData.get('paid') === 'on';

  const { data: lesson, error } = await supabase
    .from('lessons')
    .insert({
      student_id: studentId,
      lesson_date,
      topic,
      behavior_rating,
      work_rating,
      behavior_comment,
      homework_done,
      homework_comment,
    })
    .select('id')
    .single();

  if (error) throw error;

  await supabase.from('payments').insert({
    lesson_id: lesson.id,
    student_id: studentId,
    paid,
  });

  // Если тема урока совпадает с одной из тем «на подтянуть» — автоматически
  // отмечаем её пройденной, чтобы не приходилось отмечать вручную дважды.
  if (topic) {
    await supabase
      .from('topics_to_review')
      .update({ done: true })
      .eq('student_id', studentId)
      .eq('done', false)
      .ilike('topic', topic.trim());
  }

  revalidatePath(`/dashboard/students/${studentId}`);
  return { ok: true, ts: Date.now() };
}

export async function togglePaid(studentId, formData) {
  const supabase = createClient();
  await assertOwnsStudent(supabase, studentId);

  const paymentId = formData.get('paymentId');
  const lessonId = formData.get('lessonId');
  const nextValue = formData.get('nextValue') === 'true';

  if (paymentId) {
    await supabase.from('payments').update({ paid: nextValue }).eq('id', paymentId);
  } else {
    // Если у урока почему-то ещё нет записи оплаты — создаём её сразу при клике,
    // точно так же просто, как переключается ДЗ.
    await supabase
      .from('payments')
      .upsert(
        { lesson_id: lessonId, student_id: studentId, paid: nextValue },
        { onConflict: 'lesson_id' }
      );
  }

  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function updatePayment(studentId, formData) {
  const supabase = createClient();
  await assertOwnsStudent(supabase, studentId);

  const paymentId = formData.get('paymentId');
  const paid = formData.get('paid') === 'on';
  const amountRaw = formData.get('amount');
  const amount = amountRaw === '' || amountRaw === null ? null : Number(amountRaw);

  await supabase.from('payments').update({ paid, amount }).eq('id', paymentId);
  revalidatePath(`/dashboard/students/${studentId}`);
}

// Полное редактирование урока (дата, тема, оценки, комментарии, ДЗ и оплата
// одновременно) — доступно по кнопке «Редактировать» уже после сохранения урока.
export async function updateLessonFull(studentId, prevState, formData) {
  const supabase = createClient();
  await assertOwnsStudent(supabase, studentId);

  const lessonId = formData.get('lessonId');
  const paymentId = formData.get('paymentId');

  const lesson_date = formData.get('lesson_date');
  const topic = formData.get('topic');
  const behavior_rating = formData.get('behavior_rating')
    ? Number(formData.get('behavior_rating'))
    : null;
  const work_rating = formData.get('work_rating') ? Number(formData.get('work_rating')) : null;
  const behavior_comment = formData.get('behavior_comment') || null;
  const homework_done = formData.get('homework_done') === 'on';
  const homework_comment = formData.get('homework_comment') || null;

  const paid = formData.get('paid') === 'on';
  const amountRaw = formData.get('amount');
  const amount = amountRaw === '' || amountRaw === null ? null : Number(amountRaw);

  const { error } = await supabase
    .from('lessons')
    .update({
      lesson_date,
      topic,
      behavior_rating,
      work_rating,
      behavior_comment,
      homework_done,
      homework_comment,
    })
    .eq('id', lessonId);

  if (error) throw error;

  if (paymentId) {
    await supabase.from('payments').update({ paid, amount }).eq('id', paymentId);
  } else {
    // На случай старых уроков, у которых почему-то не создалась запись оплаты.
    await supabase.from('payments').insert({ lesson_id: lessonId, student_id: studentId, paid, amount });
  }

  revalidatePath(`/dashboard/students/${studentId}`);
  return { ok: true, ts: Date.now() };
}

export async function toggleHomework(studentId, formData) {
  const supabase = createClient();
  await assertOwnsStudent(supabase, studentId);

  const lessonId = formData.get('lessonId');
  const nextValue = formData.get('nextValue') === 'true';

  await supabase.from('lessons').update({ homework_done: nextValue }).eq('id', lessonId);
  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function addTopic(studentId, formData) {
  const supabase = createClient();
  await assertOwnsStudent(supabase, studentId);

  const topic = formData.get('topic');
  if (!topic) return;

  await supabase.from('topics_to_review').insert({ student_id: studentId, topic });
  revalidatePath(`/dashboard/students/${studentId}`);
}

// Добавление сразу нескольким темами — по одной на строку в textarea,
// чтобы удобно было быстро занести список тем на будущее.
export async function addTopicsBulk(studentId, formData) {
  const supabase = createClient();
  await assertOwnsStudent(supabase, studentId);

  const raw = formData.get('topics') || '';
  const rows = raw
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((topic) => ({ student_id: studentId, topic }));

  if (rows.length === 0) return;

  await supabase.from('topics_to_review').insert(rows);
  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function deleteTopic(studentId, formData) {
  const supabase = createClient();
  await assertOwnsStudent(supabase, studentId);

  const topicId = formData.get('topicId');
  await supabase.from('topics_to_review').delete().eq('id', topicId);
  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function toggleTopic(studentId, formData) {
  const supabase = createClient();
  await assertOwnsStudent(supabase, studentId);

  const topicId = formData.get('topicId');
  const nextValue = formData.get('nextValue') === 'true';

  await supabase.from('topics_to_review').update({ done: nextValue }).eq('id', topicId);
  revalidatePath(`/dashboard/students/${studentId}`);
}

// Создаёт логин/пароль для родителя. Пароль генерируется случайно и
// показывается один раз на странице — дальше его нужно самостоятельно
// передать родителю (например, лично или в мессенджере).
export async function createParentAccount(studentId, formData) {
  const supabase = createClient();
  await assertOwnsStudent(supabase, studentId);

  const email = formData.get('parentEmail');
  const showPayment = formData.get('showPayment') === 'on';
  const tempPassword = Math.random().toString(36).slice(-5) + Math.random().toString(36).slice(-5);

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (error) {
    redirect(`/dashboard/students/${studentId}?error=${encodeURIComponent(error.message)}`);
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: data.user.id,
    role: 'parent',
    student_id: studentId,
    show_payment: showPayment,
    full_name: email,
  });

  if (profileError) {
    redirect(`/dashboard/students/${studentId}?error=${encodeURIComponent(profileError.message)}`);
  }

  redirect(
    `/dashboard/students/${studentId}?newParent=${encodeURIComponent(email)}&newPassword=${encodeURIComponent(tempPassword)}`
  );
}

export async function updateParentPayment(studentId, formData) {
  const supabase = createClient();
  await assertOwnsStudent(supabase, studentId);

  const profileId = formData.get('profileId');
  const nextValue = formData.get('nextValue') === 'true';

  await supabase.from('profiles').update({ show_payment: nextValue }).eq('id', profileId);
  revalidatePath(`/dashboard/students/${studentId}`);
}

// Полное удаление ученика: вместе с ним каскадно удаляются все его уроки,
// оплата и список тем (это настроено в базе через "on delete cascade").
// Доступ родителя не удаляется автоматически — просто перестаёт видеть
// данные (ссылка на ученика обнуляется); отдельно его можно отозвать через
// "Отозвать доступ".
export async function deleteStudent(studentId) {
  const supabase = createClient();
  await assertOwnsStudent(supabase, studentId);

  const { error } = await supabase.from('students').delete().eq('id', studentId);
  if (error) throw error;

  redirect('/dashboard');
}

export async function removeParentAccess(studentId, formData) {
  await assertOwnsStudent(createClient(), studentId);
  const profileId = formData.get('profileId');

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(profileId);

  revalidatePath(`/dashboard/students/${studentId}`);
}
