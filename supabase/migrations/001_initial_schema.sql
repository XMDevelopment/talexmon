-- ============================================================
-- TaleXMon – Volledige database migratie
-- Uitvoeren in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. APP SETTINGS
-- ============================================================
create table if not exists public."AppSettings" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  association_name text,
  association_kvk text,
  association_address text,
  contact_email_dpo text,
  privacy_statement_html text,
  privacy_statement_version text,
  consent_text_version text
);

alter table public."AppSettings" enable row level security;
create policy "Iedereen kan lezen" on public."AppSettings" for select using (true);
create policy "Alleen admin kan schrijven" on public."AppSettings" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- 2. USER (extends auth.users)
-- ============================================================
create table if not exists public."User" (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  email text,
  role text not null default 'speler' check (role in ('admin','tc','hoofdcoach','coach','teammanager','speler','ouder')),
  coached_team_ids uuid[] default '{}',
  managed_team_ids uuid[] default '{}',
  hoofdcoach_age_category_ids uuid[] default '{}',
  last_seen timestamptz default now(),
  email_notifications_enabled boolean default true
);

alter table public."User" enable row level security;
create policy "Gebruiker ziet eigen profiel" on public."User" for select using (auth.uid() = id);
create policy "Admin ziet alles" on public."User" for select using (
  exists (select 1 from public."User" u where u.id = auth.uid() and u.role in ('admin','tc'))
);
create policy "Admin kan bijwerken" on public."User" for update using (
  exists (select 1 from public."User" u where u.id = auth.uid() and u.role = 'admin')
);

-- Auto-create User record on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public."User" (id, email, role)
  values (new.id, new.email, 'speler');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 3. SEASON
-- ============================================================
create table if not exists public."Season" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'actief' check (status in ('actief','gearchiveerd'))
);

alter table public."Season" enable row level security;
create policy "Iedereen kan seizoenen lezen" on public."Season" for select using (true);
create policy "Alleen admin kan seizoenen beheren" on public."Season" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- 4. AGE CATEGORY
-- ============================================================
create table if not exists public."AgeCategory" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  code text not null unique,
  label text not null,
  gender text not null check (gender in ('m','v','gemengd')),
  is_jeugd boolean default true,
  min_age integer,
  max_age integer,
  sort_order integer not null,
  active boolean default true
);

alter table public."AgeCategory" enable row level security;
create policy "Iedereen kan leeftijdscategorieën lezen" on public."AgeCategory" for select using (true);
create policy "Alleen admin kan categorieën beheren" on public."AgeCategory" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- 5. TEAM
-- ============================================================
create table if not exists public."Team" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  name text not null,
  age_category text,
  age_category_id uuid references public."AgeCategory"(id),
  level text not null check (level in ('selectie','recreatief')),
  season_id uuid not null references public."Season"(id),
  coach_emails text[] default '{}',
  knvb_ical_url text,
  knvb_team_code text,
  last_sync_at timestamptz,
  last_sync_status text default 'never' check (last_sync_status in ('ok','error','never')),
  last_sync_error text
);

alter table public."Team" enable row level security;
create policy "Coaches zien hun teams" on public."Team" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or (auth.jwt() ->> 'email') = any(coach_emails)
);
create policy "Admin beheert teams" on public."Team" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
);

-- ============================================================
-- 6. PLAYER
-- ============================================================
create table if not exists public."Player" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  position text not null check (position in ('keeper','verdediger','middenvelder','aanvaller')),
  dominant_foot text check (dominant_foot in ('links','rechts','beide')),
  status text default 'actief' check (status in ('actief','geblesseerd','gestopt')),
  team_id uuid references public."Team"(id),
  season_id uuid references public."Season"(id),
  extra_team_ids uuid[] default '{}',
  player_email text,
  player_phone text,
  parent_email text,
  parent_phone text,
  address text,
  photo_url text,
  is_minor boolean default false,
  talent_label text default 'geen' check (talent_label in ('geen','talent','groot_talent','doorstroom')),
  consent_data_processing boolean default false,
  consent_data_processing_at timestamptz,
  consent_photo_internal boolean default false,
  consent_photo_website boolean default false,
  consent_photo_socials boolean default false,
  consent_text_version text,
  parent_consent_given boolean default false,
  parent_consent_at timestamptz,
  membership_end_date date,
  archive_after date,
  delete_after date
);

alter table public."Player" enable row level security;
create policy "Spelers lezen eigen profiel" on public."Player" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or player_email = (auth.jwt() ->> 'email')
  or parent_email = (auth.jwt() ->> 'email')
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach','teammanager')
    and team_id = any(u.coached_team_ids || u.managed_team_ids)
  )
);
create policy "Coach en TC beheren spelers" on public."Player" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach')
    and team_id = any(u.coached_team_ids)
  )
);

-- ============================================================
-- 7. ASSESSMENT
-- ============================================================
create table if not exists public."Assessment" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  player_id uuid not null references public."Player"(id) on delete cascade,
  team_id uuid not null references public."Team"(id),
  season_id uuid not null references public."Season"(id),
  assessor_email text not null,
  assessor_name text,
  date date not null,
  tech_ball_control numeric(4,1),
  tech_passing numeric(4,1),
  tech_dribbling numeric(4,1),
  tact_game_insight numeric(4,1),
  tact_positioning numeric(4,1),
  tact_transition numeric(4,1),
  phys_speed numeric(4,1),
  phys_endurance numeric(4,1),
  phys_strength numeric(4,1),
  ment_effort numeric(4,1),
  ment_coachability numeric(4,1),
  ment_teamwork numeric(4,1),
  coach_notes text,
  development_advice text,
  shared_with_player boolean default false,
  delete_after date
);

alter table public."Assessment" enable row level security;
create policy "Coaches zien beoordelingen van eigen team" on public."Assessment" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach')
    and team_id = any(u.coached_team_ids)
  )
);
create policy "Coaches beheren beoordelingen" on public."Assessment" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach')
    and team_id = any(u.coached_team_ids)
  )
);

-- ============================================================
-- 8. MATCH
-- ============================================================
create table if not exists public."Match" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  team_id uuid not null references public."Team"(id),
  season_id uuid not null references public."Season"(id),
  date date not null,
  time text,
  location text,
  opponent text not null,
  home_away text not null check (home_away in ('thuis','uit')),
  status text default 'gepland' check (status in ('gepland','gespeeld','afgelast')),
  goals_for integer,
  goals_against integer,
  notes text,
  lineup_published boolean default false,
  external_id text,
  external_source text default 'handmatig' check (external_source in ('handmatig','knvb_ical','sportlink')),
  competition_name text,
  match_number text,
  last_synced_at timestamptz,
  manual_overrides text[] default '{}'
);

alter table public."Match" enable row level security;
create policy "Iedereen ziet gepubliceerde wedstrijden" on public."Match" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach','teammanager')
    and team_id = any(u.coached_team_ids || u.managed_team_ids)
  )
  or exists (select 1 from public."User" where id = auth.uid() and role in ('speler','ouder'))
);
create policy "Coaches beheren wedstrijden" on public."Match" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach')
    and team_id = any(u.coached_team_ids)
  )
);

-- ============================================================
-- 9. MATCH STAT
-- ============================================================
create table if not exists public."MatchStat" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  match_id uuid not null references public."Match"(id) on delete cascade,
  player_id uuid not null references public."Player"(id) on delete cascade,
  team_id uuid not null references public."Team"(id),
  season_id uuid not null references public."Season"(id),
  goals integer default 0,
  assists integer default 0,
  yellow_cards integer default 0,
  red_cards integer default 0,
  minutes_played integer default 0,
  started boolean default true,
  rating numeric(3,1)
);

alter table public."MatchStat" enable row level security;
create policy "Coaches zien stats" on public."MatchStat" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach')
    and team_id = any(u.coached_team_ids)
  )
);
create policy "Coaches beheren stats" on public."MatchStat" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach')
    and team_id = any(u.coached_team_ids)
  )
);

-- ============================================================
-- 10. MATCH LINEUP
-- ============================================================
create table if not exists public."MatchLineup" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  match_id uuid not null references public."Match"(id) on delete cascade,
  player_id uuid not null references public."Player"(id) on delete cascade,
  team_id uuid not null references public."Team"(id),
  season_id uuid not null references public."Season"(id),
  position_in_lineup text default 'basisspeler' check (position_in_lineup in ('basisspeler','invaller','afwezig','niet_geselecteerd')),
  field_position integer,
  shirt_number integer,
  notes text
);

alter table public."MatchLineup" enable row level security;
create policy "Iedereen ziet opstellingen" on public."MatchLineup" for select using (true);
create policy "Coaches beheren opstellingen" on public."MatchLineup" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach')
    and team_id = any(u.coached_team_ids)
  )
);

-- ============================================================
-- 11. INJURY
-- ============================================================
create table if not exists public."Injury" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  player_id uuid not null references public."Player"(id) on delete cascade,
  team_id uuid not null references public."Team"(id),
  season_id uuid not null references public."Season"(id),
  injury_type text not null check (injury_type in ('spierblessure','knieblessure','enkelblessure','hamstring','lies','rug','hoofd','breuk','overig')),
  severity text not null check (severity in ('licht','matig','ernstig')),
  status text default 'actief' check (status in ('actief','hersteld')),
  start_date date not null,
  expected_return date,
  actual_return date,
  notes text,
  player_email text,
  parent_email text,
  consent_given boolean default false,
  consent_given_at timestamptz,
  consent_given_by_email text,
  delete_after date
);

alter table public."Injury" enable row level security;
create policy "Coaches zien blessures van eigen team" on public."Injury" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach')
    and team_id = any(u.coached_team_ids)
  )
  or player_email = (auth.jwt() ->> 'email')
  or parent_email = (auth.jwt() ->> 'email')
);
create policy "Coaches beheren blessures" on public."Injury" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach')
    and team_id = any(u.coached_team_ids)
  )
);

-- ============================================================
-- 12. TRAINING
-- ============================================================
create table if not exists public."Training" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  team_id uuid not null references public."Team"(id),
  season_id uuid not null references public."Season"(id),
  date date not null,
  time text,
  duration_minutes integer default 90,
  location text,
  theme text,
  notes text,
  status text default 'gepland' check (status in ('gepland','afgerond','geannuleerd'))
);

alter table public."Training" enable row level security;
create policy "Betrokkenen zien trainingen" on public."Training" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach','teammanager')
    and team_id = any(u.coached_team_ids || u.managed_team_ids)
  )
  or exists (select 1 from public."User" where id = auth.uid() and role in ('speler','ouder'))
);
create policy "Coaches beheren trainingen" on public."Training" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach')
    and team_id = any(u.coached_team_ids)
  )
);

-- ============================================================
-- 13. TRAINING ATTENDANCE
-- ============================================================
create table if not exists public."TrainingAttendance" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  training_id uuid not null references public."Training"(id) on delete cascade,
  player_id uuid not null references public."Player"(id) on delete cascade,
  team_id uuid not null references public."Team"(id),
  season_id uuid not null references public."Season"(id),
  present boolean default true,
  reason_absent text,
  unique(training_id, player_id)
);

alter table public."TrainingAttendance" enable row level security;
create policy "Coaches zien aanwezigheid" on public."TrainingAttendance" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach')
    and team_id = any(u.coached_team_ids)
  )
);
create policy "Coaches beheren aanwezigheid" on public."TrainingAttendance" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach')
    and team_id = any(u.coached_team_ids)
  )
);

-- ============================================================
-- 14. DRILL LIBRARY
-- ============================================================
create table if not exists public."DrillLibrary" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  name text not null,
  category text not null check (category in ('techniek','tactiek','fysiek','spelvorm','warming_up','cooling_down')),
  difficulty text default 'gemiddeld' check (difficulty in ('makkelijk','gemiddeld','moeilijk')),
  description text,
  coaching_points text,
  min_players integer,
  max_players integer,
  duration_minutes integer,
  field_size text,
  materials text,
  image_url text,
  video_url text,
  tags text[] default '{}',
  age_categories text[] default '{}'
);

alter table public."DrillLibrary" enable row level security;
create policy "Iedereen ziet oefeningen" on public."DrillLibrary" for select using (true);
create policy "TC en admin beheren oefeningen" on public."DrillLibrary" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
);

-- ============================================================
-- 15. TRAINING DRILL
-- ============================================================
create table if not exists public."TrainingDrill" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  training_id uuid not null references public."Training"(id) on delete cascade,
  drill_id uuid not null references public."DrillLibrary"(id),
  "order" integer,
  duration_minutes integer,
  notes text
);

alter table public."TrainingDrill" enable row level security;
create policy "Coaches zien trainingsdrills" on public."TrainingDrill" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc','coach','hoofdcoach'))
);
create policy "Coaches beheren trainingsdrills" on public."TrainingDrill" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc','coach','hoofdcoach'))
);

-- ============================================================
-- 16. PLAYER LOAN
-- ============================================================
create table if not exists public."PlayerLoan" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  player_id uuid not null references public."Player"(id) on delete cascade,
  from_team_id uuid not null references public."Team"(id),
  to_team_id uuid not null references public."Team"(id),
  season_id uuid not null references public."Season"(id),
  match_id uuid references public."Match"(id),
  date_from date not null,
  date_to date,
  notes text,
  status text default 'actief' check (status in ('actief','beeindigd'))
);

alter table public."PlayerLoan" enable row level security;
create policy "TC en admin zien uitleningen" on public."PlayerLoan" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
);
create policy "TC en admin beheren uitleningen" on public."PlayerLoan" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
);

-- ============================================================
-- 17. PLAYER ABSENCE
-- ============================================================
create table if not exists public."PlayerAbsence" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  player_id uuid not null references public."Player"(id) on delete cascade,
  team_id uuid not null references public."Team"(id),
  season_id uuid not null references public."Season"(id),
  type text not null check (type in ('training','wedstrijd','beide')),
  date_from date not null,
  date_to date,
  reason text,
  notes text
);

alter table public."PlayerAbsence" enable row level security;
create policy "Coaches zien afmeldingen" on public."PlayerAbsence" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach','teammanager')
    and team_id = any(u.coached_team_ids || u.managed_team_ids)
  )
);
create policy "Coaches beheren afmeldingen" on public."PlayerAbsence" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or exists (
    select 1 from public."User" u
    where u.id = auth.uid()
    and u.role in ('coach','hoofdcoach','teammanager')
    and team_id = any(u.coached_team_ids || u.managed_team_ids)
  )
);

-- ============================================================
-- 18. COACH PROFILE
-- ============================================================
create table if not exists public."CoachProfile" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  coach_email text not null unique,
  coach_user_id uuid references public."User"(id),
  first_name text,
  last_name text,
  function text,
  coach_certificate text default 'geen' check (coach_certificate in ('geen','VC1','VC2','VC3','VC4','VC5')),
  vog_aanwezig boolean default false,
  vog_date date,
  vog_expiry_date date,
  notes text,
  delete_after date
);

alter table public."CoachProfile" enable row level security;
create policy "Coach ziet eigen profiel" on public."CoachProfile" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or coach_email = (auth.jwt() ->> 'email')
);
create policy "TC en admin beheren coachprofielen" on public."CoachProfile" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
);

-- ============================================================
-- 19. NOTIFICATION
-- ============================================================
create table if not exists public."Notification" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  recipient_email text not null,
  type text not null check (type in ('training_nieuw','training_geannuleerd','wedstrijd_gewijzigd','wedstrijd_afgelast','opstelling_gepubliceerd')),
  title text not null,
  message text not null,
  read boolean default false,
  team_id uuid references public."Team"(id),
  reference_id uuid,
  delete_after date
);

alter table public."Notification" enable row level security;
create policy "Gebruiker ziet eigen meldingen" on public."Notification" for select using (
  recipient_email = (auth.jwt() ->> 'email')
);
create policy "Systeem maakt meldingen" on public."Notification" for insert with check (true);
create policy "Gebruiker beheert eigen meldingen" on public."Notification" for update using (
  recipient_email = (auth.jwt() ->> 'email')
);

-- ============================================================
-- 20. USER REQUEST (aanmeldformulier)
-- ============================================================
create table if not exists public."UserRequest" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  address text,
  city text,
  date_of_birth date,
  requested_role text not null check (requested_role in ('coach','speler','teammanager','tc')),
  team_preference text,
  motivation text,
  is_minor boolean default false,
  parent_email text,
  parent_name text,
  status text default 'nieuw' check (status in ('nieuw','wacht_op_ouder','goedgekeurd','afgewezen')),
  admin_notes text,
  consent_given boolean default false,
  consent_given_at timestamptz,
  consent_text_version text,
  parent_consent_token text,
  parent_consent_token_expires timestamptz,
  parent_consent_at timestamptz
);

alter table public."UserRequest" enable row level security;
create policy "Iedereen kan aanmelding indienen" on public."UserRequest" for insert with check (true);
create policy "Admin beheert aanmeldingen" on public."UserRequest" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
);
create policy "Admin werkt aanmeldingen bij" on public."UserRequest" for update using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
);

-- ============================================================
-- 21. ROLE PERMISSIONS
-- ============================================================
create table if not exists public."RolePermissions" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  role text not null unique check (role in ('admin','tc','coach','teammanager','speler','ouder')),
  permissions jsonb not null default '{}'
);

alter table public."RolePermissions" enable row level security;
create policy "Iedereen kan rechten lezen" on public."RolePermissions" for select using (true);
create policy "Alleen admin kan rechten beheren" on public."RolePermissions" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- 22. CONSENT LOG (AVG)
-- ============================================================
create table if not exists public."ConsentLog" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  consent_type text not null check (consent_type in ('data_processing','photo_internal','photo_website','photo_socials','health_data','parent_consent_minor')),
  action text not null check (action in ('gegeven','ingetrokken','verlopen','gewijzigd')),
  timestamp timestamptz not null,
  given_by_email text not null,
  given_by_role text,
  subject_player_id uuid references public."Player"(id),
  subject_user_email text,
  consent_text_version text,
  ip_address text,
  notes text
);

alter table public."ConsentLog" enable row level security;
create policy "Iedereen mag toestemming loggen" on public."ConsentLog" for insert with check (true);
create policy "TC en eigen records lezen" on public."ConsentLog" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or given_by_email = (auth.jwt() ->> 'email')
  or subject_user_email = (auth.jwt() ->> 'email')
);
create policy "Alleen admin verwijdert logs" on public."ConsentLog" for delete using (
  exists (select 1 from public."User" where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- 23. DATA ACCESS LOG (AVG audit)
-- ============================================================
create table if not exists public."DataAccessLog" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  accessed_at timestamptz not null,
  accessed_by_email text not null,
  accessed_by_role text,
  entity_name text not null,
  action text not null check (action in ('read','create','update','delete','export')),
  record_id uuid,
  subject_player_id uuid references public."Player"(id),
  ip_address text
);

alter table public."DataAccessLog" enable row level security;
create policy "Iedereen mag acties loggen" on public."DataAccessLog" for insert with check (true);
create policy "Alleen TC en admin zien logs" on public."DataAccessLog" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
);

-- ============================================================
-- 24. DATA SUBJECT REQUEST (AVG betrokkenenverzoek)
-- ============================================================
create table if not exists public."DataSubjectRequest" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  request_type text not null check (request_type in ('inzage','rectificatie','verwijdering','beperking','data_portabiliteit','bezwaar','intrekking_toestemming')),
  requester_email text not null,
  requester_name text,
  requester_player_id uuid references public."Player"(id),
  requested_at timestamptz not null,
  deadline date not null,
  deadline_extended boolean default false,
  description text,
  status text default 'nieuw' check (status in ('nieuw','identiteit_geverifieerd','in_behandeling','afgerond','afgewezen')),
  outcome text check (outcome in ('uitgevoerd','gedeeltelijk_uitgevoerd','afgewezen')),
  outcome_explanation text,
  admin_notes text,
  completed_at timestamptz
);

alter table public."DataSubjectRequest" enable row level security;
create policy "Iedereen kan verzoek indienen" on public."DataSubjectRequest" for insert with check (true);
create policy "TC en eigen verzoeken lezen" on public."DataSubjectRequest" for select using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
  or requester_email = (auth.jwt() ->> 'email')
);
create policy "TC beheert verzoeken" on public."DataSubjectRequest" for update using (
  exists (select 1 from public."User" where id = auth.uid() and role in ('admin','tc'))
);

-- ============================================================
-- 25. DATA BREACH (AVG datalekregister)
-- ============================================================
create table if not exists public."DataBreach" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  incident_date date not null,
  discovered_date date not null,
  reported_to_dpa_at timestamptz,
  reported_to_subjects_at timestamptz,
  description text not null,
  affected_categories text,
  affected_count integer,
  mitigation_measures text,
  status text default 'nieuw' check (status in ('nieuw','in_behandeling','gemeld_ap','afgerond'))
);

alter table public."DataBreach" enable row level security;
create policy "Alleen admin ziet datalekken" on public."DataBreach" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- 26. MODULE
-- ============================================================
create table if not exists public."Module" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  code text not null unique,
  name text not null,
  description text,
  icon text,
  category text not null check (category in ('core','optional')),
  default_enabled boolean default false,
  entities text[] default '{}',
  depends_on text[] default '{}',
  menu_routes text[] default '{}',
  sort_order integer not null,
  active boolean default true
);

alter table public."Module" enable row level security;
create policy "Iedereen ziet modules" on public."Module" for select using (true);
create policy "Alleen admin beheert modules" on public."Module" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- 27. MODULE ACTIVATION
-- ============================================================
create table if not exists public."ModuleActivation" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  module_code text not null references public."Module"(code),
  scope_type text not null check (scope_type in ('club','age_category','team','role')),
  active boolean default true,
  season_id uuid references public."Season"(id),
  team_id uuid references public."Team"(id),
  age_category_id uuid references public."AgeCategory"(id),
  role text check (role in ('admin','tc','coach','teammanager','speler','ouder')),
  valid_from date,
  valid_until date,
  notes text
);

alter table public."ModuleActivation" enable row level security;
create policy "Iedereen ziet activeringen" on public."ModuleActivation" for select using (true);
create policy "Alleen admin beheert activeringen" on public."ModuleActivation" for all using (
  exists (select 1 from public."User" where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- SEED: Default modules
-- ============================================================
insert into public."Module" (code, name, description, icon, category, default_enabled, entities, sort_order, active) values
  ('CORE', 'Kern', 'Basisfunctionaliteit: spelers, teams, seizoenen', 'users', 'core', true, array['Player','Team','Season','AgeCategory'], 1, true),
  ('MATCHES', 'Wedstrijden', 'Wedstrijdbeheer, opstellingen en statistieken', 'ball-football', 'optional', true, array['Match','MatchStat','MatchLineup'], 2, true),
  ('TRAINING', 'Trainingen', 'Trainingsbeheer, aanwezigheid en oefenbibliotheek', 'run', 'optional', true, array['Training','TrainingAttendance','DrillLibrary','TrainingDrill'], 3, true),
  ('ASSESSMENTS', 'Beoordelingen', 'Spelersbeoordelingen per categorie', 'clipboard-check', 'optional', true, array['Assessment'], 4, true),
  ('INJURIES', 'Blessures', 'Blessureregistratie en hersteltracking', 'first-aid-kit', 'optional', true, array['Injury'], 5, true),
  ('MEMBERSHIP', 'Aanmeldingen', 'Aanmeldformulier en ledenbeheer', 'user-plus', 'optional', false, array['UserRequest'], 6, true),
  ('GDPR', 'Privacy & AVG', 'Toestemmingsbeheer, auditlog en betrokkenenverzoeken', 'shield-lock', 'optional', false, array['ConsentLog','DataAccessLog','DataSubjectRequest','DataBreach'], 7, true)
on conflict (code) do nothing;

-- ============================================================
-- SEED: Default age categories (KNVB)
-- ============================================================
insert into public."AgeCategory" (code, label, gender, is_jeugd, min_age, max_age, sort_order) values
  ('JO7', 'JO7', 'm', true, 6, 7, 1),
  ('JO8', 'JO8', 'm', true, 7, 8, 2),
  ('JO9', 'JO9', 'm', true, 8, 9, 3),
  ('JO10', 'JO10', 'm', true, 9, 10, 4),
  ('JO11', 'JO11', 'm', true, 10, 11, 5),
  ('JO12', 'JO12', 'm', true, 11, 12, 6),
  ('JO13', 'JO13', 'm', true, 12, 13, 7),
  ('JO14', 'JO14', 'm', true, 13, 14, 8),
  ('JO15', 'JO15', 'm', true, 14, 15, 9),
  ('JO17', 'JO17', 'm', true, 15, 17, 10),
  ('JO19', 'JO19', 'm', true, 17, 19, 11),
  ('MO7', 'MO7', 'v', true, 6, 7, 12),
  ('MO8', 'MO8', 'v', true, 7, 8, 13),
  ('MO9', 'MO9', 'v', true, 8, 9, 14),
  ('MO10', 'MO10', 'v', true, 9, 10, 15),
  ('MO11', 'MO11', 'v', true, 10, 11, 16),
  ('MO12', 'MO12', 'v', true, 11, 12, 17),
  ('MO13', 'MO13', 'v', true, 12, 13, 18),
  ('MO14', 'MO14', 'v', true, 13, 14, 19),
  ('MO15', 'MO15', 'v', true, 14, 15, 20),
  ('MO17', 'MO17', 'v', true, 15, 17, 21),
  ('MO19', 'MO19', 'v', true, 17, 19, 22),
  ('SEN_M', 'Senioren Heren', 'm', false, 19, null, 23),
  ('SEN_V', 'Senioren Dames', 'v', false, 19, null, 24),
  ('VET35', 'Veteranen 35+', 'm', false, 35, null, 25),
  ('VET45', 'Veteranen 45+', 'm', false, 45, null, 26)
on conflict (code) do nothing;
