-- PULSE Cloudflare D1 (SQLite) database schema
-- Run once on your new Cloudflare account:
-- npx.cmd wrangler d1 execute pulse-db --remote --file=schema-d1.sql

create table if not exists users (
  id text primary key,
  email text not null unique,
  display_name text not null,
  password_hash text not null,
  password_salt text not null,
  created_at text not null default current_timestamp
);

create table if not exists profiles (
  id text primary key references users(id) on delete cascade,
  display_name text not null default 'PULSE User',
  currency text not null default 'INR',
  created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp
);

create table if not exists tasks (
  id integer not null,
  user_id text not null references users(id) on delete cascade,
  title text not null,
  category text not null default 'Personal',
  priority text not null default 'Medium',
  date text not null,
  time text not null default '',
  completed integer not null default 0,
  primary key (user_id, id)
);

create table if not exists goals (
  id integer not null,
  user_id text not null references users(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'Personal',
  progress integer not null default 0,
  target_date text not null,
  status text not null default 'On track',
  milestones integer not null default 0,
  completed_milestones integer not null default 0,
  primary key (user_id, id)
);

create table if not exists habits (
  id integer not null,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  category text not null default 'Personal',
  frequency text not null default 'Daily',
  streak integer not null default 0,
  best_streak integer not null default 0,
  completed_dates text not null default '[]',
  primary key (user_id, id)
);

create table if not exists transactions (
  id integer not null,
  user_id text not null references users(id) on delete cascade,
  description text not null,
  title text,
  amount real not null default 0,
  type text not null,
  category text not null default 'Other',
  date text not null,
  account text,
  primary key (user_id, id)
);

create table if not exists assets (
  id integer not null,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  type text not null,
  value real not null default 0,
  updated_at text,
  primary key (user_id, id)
);

create table if not exists liabilities (
  id integer not null,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  type text not null,
  amount real not null default 0,
  updated_at text,
  primary key (user_id, id)
);

create table if not exists budgets (
  id integer not null,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  "limit" real not null default 0,
  primary key (user_id, id)
);

create table if not exists savings_goals (
  id integer not null,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  target real not null default 0,
  saved real not null default 0,
  deadline text not null,
  primary key (user_id, id)
);

create table if not exists investments (
  id integer not null,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  symbol text not null default '',
  type text not null,
  invested real not null default 0,
  current real not null default 0,
  units real not null default 0,
  date text,
  primary key (user_id, id)
);

create table if not exists calendar_events (
  id text not null,
  user_id text not null references users(id) on delete cascade,
  title text not null,
  date text not null,
  time text,
  category text not null default 'Personal',
  location text,
  description text,
  primary key (user_id, id)
);

create table if not exists emis (
  id integer not null,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  category text not null default 'Other',
  lender text not null default '',
  monthly_emi real not null default 0,
  total_tenure_months integer not null default 12,
  paid_months integer not null default 0,
  total_amount real not null default 0,
  interest_rate real not null default 0,
  due_day integer not null default 5,
  start_date text,
  auto_debit_account text,
  last_paid_date text,
  primary key (user_id, id)
);

-- Fast lookup indexes
create index if not exists idx_tasks_user on tasks (user_id);
create index if not exists idx_goals_user on goals (user_id);
create index if not exists idx_habits_user on habits (user_id);
create index if not exists idx_transactions_user on transactions (user_id);
create index if not exists idx_assets_user on assets (user_id);
create index if not exists idx_liabilities_user on liabilities (user_id);
create index if not exists idx_budgets_user on budgets (user_id);
create index if not exists idx_savings_goals_user on savings_goals (user_id);
create index if not exists idx_investments_user on investments (user_id);
create index if not exists idx_calendar_events_user on calendar_events (user_id);
create index if not exists idx_emis_user on emis (user_id);

