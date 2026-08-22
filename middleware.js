import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (error) {
    // Битый/просроченный refresh-токен в cookie — Supabase кидает исключение
    // вместо того, чтобы вернуть user: null. Раньше это роняло сайт с 500.
    // Считаем пользователя неавторизованным и чистим "мёртвые" cookies сессии.
    console.error('Auth error in middleware, clearing session:', error?.message);
    user = null;
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.set(cookie.name, '', { maxAge: 0 });
      }
    });
  }

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith('/login');
  const isDashboard = path.startsWith('/dashboard');
  const isParentArea = path.startsWith('/parent');

  if (!user && (isDashboard || isParentArea)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && (isAuthPage || isDashboard || isParentArea)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    // Пользователь авторизован, но в таблице profiles для него нет записи
    // (или роль пустая) — раньше это приводило к бесконечному редиректу
    // /dashboard -> /parent -> /dashboard. Вместо цикла — выходим из системы
    // и показываем понятную ошибку на странице входа.
    if (!profile?.role) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      url.searchParams.set(
        'error',
        'Профиль не найден. Обратитесь к репетитору или напишите разработчику.'
      );
      return NextResponse.redirect(url);
    }

    if (isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = profile.role === 'parent' ? '/parent' : '/dashboard';
      return NextResponse.redirect(url);
    }

    if (isDashboard && profile.role !== 'repetitor') {
      const url = request.nextUrl.clone();
      url.pathname = '/parent';
      return NextResponse.redirect(url);
    }
    if (isParentArea && profile.role !== 'parent') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/parent/:path*', '/login'],
};
