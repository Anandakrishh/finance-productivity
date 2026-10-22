// Cloudflare Worker + D1 backend for PULSE. Zero paid services required.

const ALLOWED_ORIGINS = [
  'https://ak-finance-productivity.vercel.app',
  'https://pulse.hello-anandha.workers.dev',
];

function getCorsHeaders(request) {
  const origin = request?.headers?.get('Origin') || '';
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

  const allowOrigin = isAllowed ? origin : (origin || '*');

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      ...CORS_HEADERS,
    },
  });

const id = () => crypto.randomUUID();
const bytesToHex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const hexToBytes = (h) => Uint8Array.from(h.match(/.{1,2}/g) || [], (x) => parseInt(x, 16));
const b64 = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const unb64 = (s) => Uint8Array.from(atob(s.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

function getSecret(env) {
  return env.AUTH_SECRET || 'pulse-local-development-secret-key-32-chars';
}

async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return bytesToHex(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: hexToBytes(salt), iterations: 100000, hash: 'SHA-256' },
      key,
      256
    )
  );
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

async function issue(userId, env) {
  const secret = getSecret(env);
  const payload = b64(new TextEncoder().encode(JSON.stringify({ sub: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })));
  return `${payload}.${await sign(payload, secret)}`;
}

async function me(request, env) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const secret = getSecret(env);
  if (sig !== (await sign(payload, secret))) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(unb64(payload)));
    return data.exp > Date.now() ? data.sub : null;
  } catch {
    return null;
  }
}

async function requireUser(request, env) {
  const userId = await me(request, env);
  if (!userId) throw new Error('UNAUTHORIZED');
  return userId;
}

// ---------------------------------------------------------------------------
// Auth Handlers
// ---------------------------------------------------------------------------

async function register(request, env) {
  return json({ error: 'Public registration is disabled. Access is by administrator invitation only.' }, 403);
}

async function createUser(request, env) {
  await requireUser(request, env);
  const { email, password, displayName } = await request.json();
  const cleanEmail = email?.trim().toLowerCase();

  if (!cleanEmail || !password || password.length < 6) {
    return json({ error: 'Please provide a valid email and a password of at least 6 characters.' }, 400);
  }

  const existing = await env.DB.prepare('select id from users where email = ?').bind(cleanEmail).first();
  if (existing) {
    return json({ error: 'An account with that email already exists.' }, 409);
  }

  const newUserId = id();
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const hashed = await passwordHash(password, salt);
  const name = displayName?.trim() || cleanEmail.split('@')[0] || 'User';

  await env.DB.batch([
    env.DB.prepare('insert into users (id, email, display_name, password_hash, password_salt) values (?, ?, ?, ?, ?)')
      .bind(newUserId, cleanEmail, name, hashed, salt),
    env.DB.prepare('insert into profiles (id, display_name, currency) values (?, ?, ?)')
      .bind(newUserId, name, 'INR'),
  ]);

  return json({
    ok: true,
    user: { id: newUserId, email: cleanEmail, displayName: name },
  });
}

async function login(request, env) {
  const { email, password } = await request.json();
  const cleanEmail = email?.trim().toLowerCase();

  if (!cleanEmail || !password) {
    return json({ error: 'Please enter both email and password.' }, 400);
  }

  const user = await env.DB.prepare('select * from users where email = ?').bind(cleanEmail).first();
  if (!user || user.password_hash !== (await passwordHash(password, user.password_salt))) {
    return json({ error: 'Invalid email or password.' }, 401);
  }

  const profile = await env.DB.prepare('select * from profiles where id = ?').bind(user.id).first();
  const token = await issue(user.id, env);

  return json({
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: profile?.display_name || user.display_name,
    },
  });
}

async function getMe(request, env) {
  const userId = await requireUser(request, env);
  const user = await env.DB.prepare('select id, email, display_name from users where id = ?').bind(userId).first();
  if (!user) return json({ error: 'User not found.' }, 404);

  const profile = await env.DB.prepare('select display_name, currency from profiles where id = ?').bind(userId).first();
  return json({
    user: {
      id: user.id,
      email: user.email,
      displayName: profile?.display_name || user.display_name,
      currency: profile?.currency || 'INR',
    },
  });
}

async function resetPassword(request, env) {
  const { email } = await request.json();
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail) return json({ error: 'Please provide an email address.' }, 400);

  const user = await env.DB.prepare('select id from users where email = ?').bind(cleanEmail).first();
  if (!user) {
    return json({ message: 'If that email exists, password reset instructions have been recorded.' });
  }

  return json({ message: 'Password reset request acknowledged.' });
}

// ---------------------------------------------------------------------------
// Data Handlers
// ---------------------------------------------------------------------------

async function getData(request, env) {
  const userId = await requireUser(request, env);

  const [
    tasksRes,
    goalsRes,
    habitsRes,
    transactionsRes,
    assetsRes,
    liabilitiesRes,
    budgetsRes,
    savingsGoalsRes,
    investmentsRes,
    calendarEventsRes,
    emisRes,
  ] = await env.DB.batch([
    env.DB.prepare('select * from tasks where user_id = ? order by id').bind(userId),
    env.DB.prepare('select * from goals where user_id = ? order by id').bind(userId),
    env.DB.prepare('select * from habits where user_id = ? order by id').bind(userId),
    env.DB.prepare('select * from transactions where user_id = ? order by date desc').bind(userId),
    env.DB.prepare('select * from assets where user_id = ? order by id').bind(userId),
    env.DB.prepare('select * from liabilities where user_id = ? order by id').bind(userId),
    env.DB.prepare('select * from budgets where user_id = ? order by id').bind(userId),
    env.DB.prepare('select * from savings_goals where user_id = ? order by id').bind(userId),
    env.DB.prepare('select * from investments where user_id = ? order by id').bind(userId),
    env.DB.prepare('select * from calendar_events where user_id = ? order by date').bind(userId),
    env.DB.prepare('select * from emis where user_id = ? order by due_day, id').bind(userId),
  ]);

  const habits = (habitsRes.results || []).map((h) => {
    let completedDates = [];
    if (typeof h.completed_dates === 'string') {
      try {
        completedDates = JSON.parse(h.completed_dates);
      } catch {
        completedDates = [];
      }
    } else if (Array.isArray(h.completed_dates)) {
      completedDates = h.completed_dates;
    }
    return { ...h, completed_dates: completedDates };
  });

  return json({
    tasks: tasksRes.results || [],
    goals: goalsRes.results || [],
    habits,
    transactions: transactionsRes.results || [],
    assets: assetsRes.results || [],
    liabilities: liabilitiesRes.results || [],
    budgets: budgetsRes.results || [],
    savingsGoals: savingsGoalsRes.results || [],
    investments: investmentsRes.results || [],
    calendarEvents: calendarEventsRes.results || [],
    emis: emisRes.results || [],
  });
}

const TABLE_SCHEMAS = {
  tasks: {
    columns: ['id', 'user_id', 'title', 'category', 'priority', 'date', 'time', 'completed'],
    map: (row, userId) => [
      row.id,
      userId,
      row.title || '',
      row.category || 'Personal',
      row.priority || 'Medium',
      row.date || '',
      row.time || '',
      row.completed ? 1 : 0,
    ],
  },
  goals: {
    columns: ['id', 'user_id', 'title', 'description', 'category', 'progress', 'target_date', 'status', 'milestones', 'completed_milestones'],
    map: (row, userId) => [
      row.id,
      userId,
      row.title || '',
      row.description || '',
      row.category || 'Personal',
      row.progress || 0,
      row.target_date || '',
      row.status || 'On track',
      row.milestones || 0,
      row.completed_milestones || 0,
    ],
  },
  habits: {
    columns: ['id', 'user_id', 'name', 'category', 'frequency', 'streak', 'best_streak', 'completed_dates'],
    map: (row, userId) => [
      row.id,
      userId,
      row.name || '',
      row.category || 'Personal',
      row.frequency || 'Daily',
      row.streak || 0,
      row.best_streak || 0,
      JSON.stringify(Array.isArray(row.completed_dates) ? row.completed_dates : []),
    ],
  },
  transactions: {
    columns: ['id', 'user_id', 'description', 'title', 'amount', 'type', 'category', 'date', 'account'],
    map: (row, userId) => [
      row.id,
      userId,
      row.description || row.title || '',
      row.title || row.description || '',
      row.amount || 0,
      row.type || 'expense',
      row.category || 'Other',
      row.date || '',
      row.account || null,
    ],
  },
  assets: {
    columns: ['id', 'user_id', 'name', 'type', 'value', 'updated_at'],
    map: (row, userId) => [
      row.id,
      userId,
      row.name || '',
      row.type || 'Other',
      row.value || 0,
      row.updated_at || null,
    ],
  },
  liabilities: {
    columns: ['id', 'user_id', 'name', 'type', 'amount', 'updated_at'],
    map: (row, userId) => [
      row.id,
      userId,
      row.name || '',
      row.type || 'Other',
      row.amount || 0,
      row.updated_at || null,
    ],
  },
  budgets: {
    columns: ['id', 'user_id', 'name', '"limit"'],
    map: (row, userId) => [
      row.id,
      userId,
      row.name || '',
      row.limit || 0,
    ],
  },
  savings_goals: {
    columns: ['id', 'user_id', 'name', 'target', 'saved', 'deadline'],
    map: (row, userId) => [
      row.id,
      userId,
      row.name || '',
      row.target || 0,
      row.saved || 0,
      row.deadline || '',
    ],
  },
  investments: {
    columns: ['id', 'user_id', 'name', 'symbol', 'type', 'invested', 'current', 'units', 'date'],
    map: (row, userId) => [
      row.id,
      userId,
      row.name || '',
      row.symbol || '',
      row.type || 'Stock',
      row.invested || 0,
      row.current || 0,
      row.units || 0,
      row.date || null,
    ],
  },
  calendar_events: {
    columns: ['id', 'user_id', 'title', 'date', 'time', 'category', 'location', 'description'],
    map: (row, userId) => [
      String(row.id),
      userId,
      row.title || '',
      row.date || '',
      row.time || null,
      row.category || 'Personal',
      row.location || null,
      row.description || null,
    ],
  },
  emis: {
    columns: [
      'id',
      'user_id',
      'name',
      'category',
      'lender',
      'monthly_emi',
      'total_tenure_months',
      'paid_months',
      'total_amount',
      'interest_rate',
      'due_day',
      'start_date',
      'auto_debit_account',
      'last_paid_date',
    ],
    map: (row, userId) => [
      row.id,
      userId,
      row.name || '',
      row.category || 'Other',
      row.lender || '',
      row.monthly_emi || row.monthlyEmi || 0,
      row.total_tenure_months || row.totalTenureMonths || 12,
      row.paid_months || row.paidMonths || 0,
      row.total_amount || row.totalAmount || 0,
      row.interest_rate || row.interestRate || 0,
      row.due_day || row.dueDay || 5,
      row.start_date || row.startDate || null,
      row.auto_debit_account || row.autoDebitAccount || null,
      row.last_paid_date || row.lastPaidDate || null,
    ],
  },
};

async function replaceTableData(request, env, tableName) {
  const userId = await requireUser(request, env);
  const spec = TABLE_SCHEMAS[tableName];
  if (!spec) {
    return json({ error: `Unknown table: ${tableName}` }, 400);
  }

  const { rows } = await request.json();
  const cleanRows = Array.isArray(rows) ? rows : [];

  const statements = [
    env.DB.prepare(`delete from ${tableName} where user_id = ?`).bind(userId),
  ];

  if (cleanRows.length > 0) {
    const colList = spec.columns.join(', ');
    const placeholders = spec.columns.map(() => '?').join(', ');
    const insertSql = `insert into ${tableName} (${colList}) values (${placeholders})`;

    for (const row of cleanRows) {
      const values = spec.map(row, userId);
      statements.push(env.DB.prepare(insertSql).bind(...values));
    }
  }

  await env.DB.batch(statements);
  return json({ ok: true, count: cleanRows.length });
}

// ---------------------------------------------------------------------------
// API Dispatcher
// ---------------------------------------------------------------------------

async function handleApi(request, env) {
  const url = new URL(request.url);
  const corsHeaders = getCorsHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let res;
    if (request.method === 'POST' && url.pathname === '/api/auth/register') {
      res = await register(request, env);
    } else if (request.method === 'POST' && url.pathname === '/api/auth/create-user') {
      res = await createUser(request, env);
    } else if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      res = await login(request, env);
    } else if (request.method === 'GET' && url.pathname === '/api/auth/me') {
      res = await getMe(request, env);
    } else if (request.method === 'POST' && url.pathname === '/api/auth/reset-password') {
      res = await resetPassword(request, env);
    } else if (request.method === 'GET' && url.pathname === '/api/data') {
      res = await getData(request, env);
    } else if (request.method === 'PUT' && url.pathname.startsWith('/api/data/')) {
      const tableName = url.pathname.replace('/api/data/', '');
      res = await replaceTableData(request, env, tableName);
    } else {
      res = json({ error: 'Endpoint not found' }, 404);
    }

    const headers = new Headers(res.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      headers.set(key, value);
    }
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  } catch (err) {
    if (err.message === 'UNAUTHORIZED') {
      return new Response(JSON.stringify({ error: 'Please sign in.' }), {
        status: 401,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store',
          ...corsHeaders,
        },
      });
    }
    console.error('Worker API error:', err);
    return new Response(
      JSON.stringify({ error: 'The service is temporarily unavailable. Please try again later.' }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store',
          ...corsHeaders,
        },
      }
    );
  }
}

// ---------------------------------------------------------------------------
// Main Worker Entrypoint
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env);
    }

    // Serve static assets when deployed
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      // SPA Fallback: if route is not an asset file and returns 404, serve index.html
      if (response.status === 404 && request.method === 'GET' && !url.pathname.includes('.')) {
        return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }
      return response;
    }

    return new Response('PULSE Cloudflare Worker API is running.', {
      headers: { 'content-type': 'text/plain', ...getCorsHeaders(request) },
    });
  },
};
