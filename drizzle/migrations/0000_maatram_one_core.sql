
-- ============ ROLES & PROFILES ============
create type public.app_role as enum ('admin','student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "profiles read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.email,''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'student') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- generic: non-admins cannot set protected columns. args: col, default, col, default ... ('__null' = null)
create or replace function public.protect_columns()
returns trigger language plpgsql security definer set search_path = public as $$
declare n jsonb; o jsonb; i int; col text; def text;
begin
  if public.is_admin() or auth.uid() is null then return new; end if;
  n := to_jsonb(new);
  if tg_op = 'UPDATE' then o := to_jsonb(old); end if;
  i := 0;
  while i < tg_nargs loop
    col := tg_argv[i]; def := tg_argv[i+1];
    if tg_op = 'UPDATE' then
      n := jsonb_set(n, array[col], coalesce(o->col, 'null'::jsonb));
    else
      n := jsonb_set(n, array[col], case when def = '__null' then 'null'::jsonb else to_jsonb(def) end);
    end if;
    i := i + 2;
  end loop;
  new := jsonb_populate_record(new, n);
  return new;
end; $$;

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notif read" on public.notifications for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "notif update" on public.notifications for update to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "notif delete" on public.notifications for delete to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "notif insert admin" on public.notifications for insert to authenticated with check (public.is_admin());

create or replace function public.notify(_user uuid, _title text, _body text, _link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, title, body, link) values (_user, _title, _body, _link);
$$;

-- ============ M01 ADMISSION ============
create sequence public.app_ref_seq start 1001;

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  ref_no text unique,
  stage text not null default 'draft' check (stage in ('draft','submitted','doc_review','doc_correction','tele_verification','pv_eligible','pv_scheduled','pv_review','online_interview','final_interview','selected','not_selected','on_hold')),
  full_name text, dob date, gender text, email text, mobile text,
  guardian_name text, guardian_relation text, guardian_phone text,
  address text, district text, locality text, pincode text,
  school_name text, board text, completion_year int, subjects text, stream text,
  marks_obtained numeric, total_marks numeric, percentage numeric,
  father_name text, father_occupation text, mother_name text, mother_occupation text,
  family_income numeric, family_members int, family_background text,
  preferred_stream text, interested_course text, preferred_area text,
  willing_chennai boolean, willing_outside_chennai boolean, willing_relocate boolean, other_preferences text,
  assigned_to text,
  final_decision text check (final_decision in ('selected','not_selected','on_hold')),
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.applications to authenticated;
grant all on public.applications to service_role;
alter table public.applications enable row level security;
create policy "app read" on public.applications for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "app insert" on public.applications for insert to authenticated with check (user_id = auth.uid() and stage = 'draft');
create policy "app update" on public.applications for update to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "app delete admin" on public.applications for delete to authenticated using (public.is_admin());

create or replace function public.application_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if not public.is_admin() and auth.uid() is not null then
    new.final_decision := old.final_decision;
    new.assigned_to := old.assigned_to;
    new.decided_at := old.decided_at;
    new.ref_no := old.ref_no;
    new.submitted_at := old.submitted_at;
    if new.stage <> old.stage and not (old.stage = 'draft' and new.stage = 'submitted')
       and not (old.stage = 'doc_correction' and new.stage = 'doc_review') then
      new.stage := old.stage;
    end if;
    -- after submission, form sections are locked for students
    if old.stage <> 'draft' then
      new.full_name := old.full_name; new.dob := old.dob; new.percentage := old.percentage;
      new.marks_obtained := old.marks_obtained; new.total_marks := old.total_marks;
      new.family_income := old.family_income; new.district := old.district;
    end if;
  end if;
  if new.stage = 'submitted' and old.stage = 'draft' then
    new.submitted_at := now();
    if new.ref_no is null then
      new.ref_no := 'MO-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.app_ref_seq')::text, 5, '0');
    end if;
  end if;
  if new.final_decision is distinct from old.final_decision and new.final_decision is not null then
    new.decided_at := now();
  end if;
  return new;
end; $$;
create trigger applications_guard before update on public.applications for each row execute function public.application_guard();

create or replace function public.application_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare label text;
begin
  if new.stage is distinct from old.stage then
    label := case new.stage
      when 'submitted' then 'Application submitted — reference ' || coalesce(new.ref_no,'')
      when 'doc_review' then 'Your documents are under review'
      when 'doc_correction' then 'Action needed: document correction requested'
      when 'tele_verification' then 'Documents cleared — tele-verification next'
      when 'pv_eligible' then 'You are eligible for physical verification'
      when 'pv_scheduled' then 'Physical verification visit scheduled'
      when 'pv_review' then 'Physical verification report under review'
      when 'online_interview' then 'You have moved to the online interview stage'
      when 'final_interview' then 'You have moved to the final interview stage'
      when 'selected' then 'Congratulations! You have been selected by Maatram Foundation'
      when 'not_selected' then 'Final decision recorded on your application'
      when 'on_hold' then 'Your application has been placed on hold'
      else 'Application updated' end;
    perform public.notify(new.user_id, label, null, '/student/admission');
  end if;
  return new;
end; $$;
create trigger applications_notify after update on public.applications for each row execute function public.application_notify();

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null,
  doc_type text not null,
  file_path text,
  file_name text,
  status text not null default 'pending_review' check (status in ('pending_review','verified','invalid','missing','reupload_required')),
  remarks text,
  uploaded_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (application_id, doc_type)
);
grant select, insert, update, delete on public.application_documents to authenticated;
grant all on public.application_documents to service_role;
alter table public.application_documents enable row level security;
create policy "doc read" on public.application_documents for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "doc insert" on public.application_documents for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
create policy "doc update" on public.application_documents for update to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "doc delete" on public.application_documents for delete to authenticated using (public.is_admin());

create table public.document_history (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.application_documents(id) on delete cascade,
  user_id uuid not null,
  action text not null,
  status text,
  remarks text,
  file_name text,
  created_at timestamptz not null default now()
);
grant select on public.document_history to authenticated;
grant all on public.document_history to service_role;
alter table public.document_history enable row level security;
create policy "dochist read" on public.document_history for select to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.document_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    new.status := 'pending_review';
    if tg_op = 'UPDATE' then new.remarks := old.remarks; new.reviewed_at := old.reviewed_at; else new.remarks := null; new.reviewed_at := null; end if;
    if new.file_path is not null then new.uploaded_at := now(); end if;
  else
    if tg_op = 'UPDATE' and new.status is distinct from old.status then new.reviewed_at := now(); end if;
  end if;
  return new;
end; $$;
create trigger documents_guard before insert or update on public.application_documents for each row execute function public.document_guard();

create or replace function public.document_after()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.document_history (document_id, user_id, action, status, remarks, file_name)
    values (new.id, new.user_id, case when new.file_path is null then 'created' else 'uploaded' end, new.status, new.remarks, new.file_name);
  else
    if new.file_path is distinct from old.file_path then
      insert into public.document_history (document_id, user_id, action, status, remarks, file_name)
      values (new.id, new.user_id, 'uploaded', new.status, null, new.file_name);
    end if;
    if new.status is distinct from old.status and public.is_admin() then
      insert into public.document_history (document_id, user_id, action, status, remarks, file_name)
      values (new.id, new.user_id, 'reviewed', new.status, new.remarks, new.file_name);
      if new.status in ('invalid','missing','reupload_required') then
        perform public.notify(new.user_id, 'Document needs attention: ' || new.doc_type, new.remarks, '/student/admission');
      elsif new.status = 'verified' then
        perform public.notify(new.user_id, 'Document verified: ' || new.doc_type, null, '/student/admission');
      end if;
    end if;
  end if;
  return new;
end; $$;
create trigger documents_after after insert or update on public.application_documents for each row execute function public.document_after();

create table public.tele_verifications (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  conducted_by text not null,
  conducted_at timestamptz not null default now(),
  contacted boolean not null default true,
  outcome text not null check (outcome in ('successful','clarification_required','pending','unsuccessful')),
  remarks text,
  clarification text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tele_verifications to authenticated;
grant all on public.tele_verifications to service_role;
alter table public.tele_verifications enable row level security;
create policy "tv admin" on public.tele_verifications for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text, email text,
  district text, locality text, pincode text,
  areas text,
  available boolean not null default true,
  completed_visits int not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.volunteers to authenticated;
grant all on public.volunteers to service_role;
alter table public.volunteers enable row level security;
create policy "vol admin" on public.volunteers for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.pv_assignments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null,
  volunteer_id uuid references public.volunteers(id) on delete set null,
  volunteer_name text, volunteer_phone text,
  visit_date date,
  status text not null default 'assigned' check (status in ('assigned','scheduled','completed','cancelled')),
  outcome text check (outcome in ('successful','clarification_required','incomplete','unsuccessful')),
  findings text,
  recommendations text,
  office_decision text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.pv_assignments to authenticated;
grant all on public.pv_assignments to service_role;
alter table public.pv_assignments enable row level security;
create policy "pv read" on public.pv_assignments for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "pv write" on public.pv_assignments for insert to authenticated with check (public.is_admin());
create policy "pv update" on public.pv_assignments for update to authenticated using (public.is_admin());
create policy "pv delete" on public.pv_assignments for delete to authenticated using (public.is_admin());

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null,
  kind text not null check (kind in ('online','final')),
  scheduled_at timestamptz,
  mode_detail text,
  panel text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','rescheduled','absent','cancelled')),
  outcome text check (outcome in ('recommended','not_recommended','hold')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.interviews to authenticated;
grant all on public.interviews to service_role;
alter table public.interviews enable row level security;
create policy "iv read" on public.interviews for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "iv insert" on public.interviews for insert to authenticated with check (public.is_admin());
create policy "iv update" on public.interviews for update to authenticated using (public.is_admin());
create policy "iv delete" on public.interviews for delete to authenticated using (public.is_admin());

create or replace function public.interview_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify(new.user_id,
    case when new.kind = 'online' then 'Online interview scheduled' else 'Final interview scheduled' end,
    coalesce(to_char(new.scheduled_at at time zone 'Asia/Kolkata','DD Mon YYYY, HH12:MI AM'),'') || ' ' || coalesce(new.mode_detail,''),
    '/student/admission');
  return new;
end; $$;
create trigger interviews_notify after insert on public.interviews for each row execute function public.interview_notify();

create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  stage text,
  note text not null,
  author text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.internal_notes to authenticated;
grant all on public.internal_notes to service_role;
alter table public.internal_notes enable row level security;
create policy "notes admin" on public.internal_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============ M02 MENTORSHIP ============
create table public.support_staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('anchor','zone_coordinator','mentor')),
  designation text, phone text, email text, photo_url text, zone text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.support_staff to authenticated;
grant all on public.support_staff to service_role;
alter table public.support_staff enable row level security;
create policy "staff read" on public.support_staff for select to authenticated using (true);
create policy "staff write" on public.support_staff for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.student_groups (
  id uuid primary key default gen_random_uuid(),
  college text not null,
  batch text not null,
  anchor1_id uuid references public.support_staff(id) on delete set null,
  anchor2_id uuid references public.support_staff(id) on delete set null,
  zc_id uuid references public.support_staff(id) on delete set null,
  mentor_id uuid references public.support_staff(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.student_groups to authenticated;
grant all on public.student_groups to service_role;
alter table public.student_groups enable row level security;
create policy "groups read" on public.student_groups for select to authenticated using (true);
create policy "groups write" on public.student_groups for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.group_members (
  user_id uuid primary key,
  group_id uuid not null references public.student_groups(id) on delete cascade,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.group_members to authenticated;
grant all on public.group_members to service_role;
alter table public.group_members enable row level security;
create policy "gm read" on public.group_members for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "gm write" on public.group_members for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind text not null default 'meeting' check (kind in ('meeting','activity','zone_activity')),
  organiser_id uuid references public.support_staff(id) on delete set null,
  group_id uuid references public.student_groups(id) on delete set null,
  starts_at timestamptz not null,
  mode text not null default 'online' check (mode in ('online','offline')),
  location text,
  status text not null default 'published' check (status in ('published','cancelled','completed')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.meetings to authenticated;
grant all on public.meetings to service_role;
alter table public.meetings enable row level security;
create policy "meet read" on public.meetings for select to authenticated using (true);
create policy "meet write" on public.meetings for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.meeting_rsvps (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null,
  response text not null check (response in ('going','maybe','not_going')),
  updated_at timestamptz not null default now(),
  primary key (meeting_id, user_id)
);
grant select, insert, update, delete on public.meeting_rsvps to authenticated;
grant all on public.meeting_rsvps to service_role;
alter table public.meeting_rsvps enable row level security;
create policy "rsvp read" on public.meeting_rsvps for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "rsvp write" on public.meeting_rsvps for insert to authenticated with check (user_id = auth.uid());
create policy "rsvp update" on public.meeting_rsvps for update to authenticated using (user_id = auth.uid());
create policy "rsvp delete" on public.meeting_rsvps for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create table public.meeting_attendance (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null,
  status text not null default 'not_marked' check (status in ('present','absent','not_marked')),
  updated_at timestamptz not null default now(),
  primary key (meeting_id, user_id)
);
grant select, insert, update, delete on public.meeting_attendance to authenticated;
grant all on public.meeting_attendance to service_role;
alter table public.meeting_attendance enable row level security;
create policy "att read" on public.meeting_attendance for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "att write" on public.meeting_attendance for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  staff_id uuid not null references public.support_staff(id) on delete cascade,
  sender text not null check (sender in ('student','staff')),
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "msg read" on public.messages for select to authenticated using (student_id = auth.uid() or public.is_admin());
create policy "msg student insert" on public.messages for insert to authenticated with check ((student_id = auth.uid() and sender = 'student') or (public.is_admin() and sender = 'staff'));
create policy "msg delete" on public.messages for delete to authenticated using (public.is_admin());

create or replace function public.message_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare sname text;
begin
  if new.sender = 'staff' then
    select name into sname from public.support_staff where id = new.staff_id;
    perform public.notify(new.student_id, 'New message from ' || coalesce(sname,'your support team'), left(new.body, 120), '/student/messages');
  end if;
  return new;
end; $$;
create trigger messages_notify after insert on public.messages for each row execute function public.message_notify();

create table public.queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  staff_id uuid references public.support_staff(id) on delete set null,
  title text not null,
  description text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  response text,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.queries to authenticated;
grant all on public.queries to service_role;
alter table public.queries enable row level security;
create policy "q read" on public.queries for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "q insert" on public.queries for insert to authenticated with check (user_id = auth.uid());
create policy "q update" on public.queries for update to authenticated using (public.is_admin());
create policy "q delete" on public.queries for delete to authenticated using (public.is_admin());
create trigger queries_protect before insert on public.queries for each row execute function public.protect_columns('status','open','response','__null','responded_at','__null');

create or replace function public.query_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.response is distinct from old.response and new.response is not null then
    new.responded_at := now();
  end if;
  return new;
end; $$;
create trigger queries_respond before update on public.queries for each row execute function public.query_notify();

create or replace function public.query_after()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.response is distinct from old.response or new.status is distinct from old.status then
    perform public.notify(new.user_id, 'Query update: ' || new.title, 'Status: ' || replace(new.status,'_',' '), '/student/queries');
  end if;
  return new;
end; $$;
create trigger queries_after after update on public.queries for each row execute function public.query_after();

create table public.mentor_observations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  staff_id uuid references public.support_staff(id) on delete set null,
  category text,
  observation text not null,
  follow_up text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.mentor_observations to authenticated;
grant all on public.mentor_observations to service_role;
alter table public.mentor_observations enable row level security;
create policy "obs admin" on public.mentor_observations for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============ M03 ACADEMICS ============
create table public.academic_profiles (
  user_id uuid primary key,
  college text, course text, department text, degree text, roll_no text,
  start_year int, duration_years int, total_semesters int,
  attendance_pct numeric,
  attendance_updated_at timestamptz,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.academic_profiles to authenticated;
grant all on public.academic_profiles to service_role;
alter table public.academic_profiles enable row level security;
create policy "ap all" on public.academic_profiles for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  academic_year text,
  semester_no int not null,
  exam_status text not null default 'not_written' check (exam_status in ('not_written','written','results_published')),
  completed boolean not null default false,
  sgpa numeric, cgpa numeric, arrears int default 0,
  result_file_path text, result_file_name text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  remarks text,
  created_at timestamptz not null default now(),
  unique (user_id, semester_no)
);
grant select, insert, update, delete on public.semesters to authenticated;
grant all on public.semesters to service_role;
alter table public.semesters enable row level security;
create policy "sem all" on public.semesters for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create trigger semesters_protect before insert or update on public.semesters for each row execute function public.protect_columns('verification_status','pending','remarks','__null');

create table public.learning_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  month text not null,
  platform text not null,
  course_name text not null,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  hours numeric,
  notes text,
  certificate_path text, certificate_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.learning_updates to authenticated;
grant all on public.learning_updates to service_role;
alter table public.learning_updates enable row level security;
create policy "lu all" on public.learning_updates for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create table public.training_programmes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  description text,
  audience text default 'All selected students',
  starts_on date, ends_on date,
  schedule text,
  mode text,
  status text not null default 'open' check (status in ('open','closed','completed')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.training_programmes to authenticated;
grant all on public.training_programmes to service_role;
alter table public.training_programmes enable row level security;
create policy "tp read" on public.training_programmes for select to authenticated using (true);
create policy "tp write" on public.training_programmes for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.programme_registrations (
  programme_id uuid not null references public.training_programmes(id) on delete cascade,
  user_id uuid not null,
  attendance text not null default 'not_marked' check (attendance in ('present','absent','not_marked')),
  created_at timestamptz not null default now(),
  primary key (programme_id, user_id)
);
grant select, insert, update, delete on public.programme_registrations to authenticated;
grant all on public.programme_registrations to service_role;
alter table public.programme_registrations enable row level security;
create policy "pr all" on public.programme_registrations for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create trigger pr_protect before insert or update on public.programme_registrations for each row execute function public.protect_columns('attendance','not_marked');

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  category text,
  achieved_on date,
  description text,
  file_path text, file_name text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.achievements to authenticated;
grant all on public.achievements to service_role;
alter table public.achievements enable row level security;
create policy "ach all" on public.achievements for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create trigger ach_protect before insert or update on public.achievements for each row execute function public.protect_columns('verified','false');

-- ============ M04 SKILLS & PLACEMENT ============
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  category text,
  level text check (level in ('beginner','intermediate','advanced')),
  evidence_url text,
  status text not null default 'submitted' check (status in ('submitted','verified','rejected')),
  remarks text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.skills to authenticated;
grant all on public.skills to service_role;
alter table public.skills enable row level security;
create policy "sk all" on public.skills for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create trigger sk_protect before insert or update on public.skills for each row execute function public.protect_columns('status','submitted','remarks','__null');

create table public.career_profiles (
  user_id uuid primary key,
  headline text, career_interests text, preferred_roles text, preferred_locations text,
  linkedin text, github text, portfolio text,
  resume_path text, resume_name text,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.career_profiles to authenticated;
grant all on public.career_profiles to service_role;
alter table public.career_profiles enable row level security;
create policy "cp all" on public.career_profiles for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  kind text not null default 'aptitude' check (kind in ('aptitude','technical','communication','coding','mock_interview')),
  score numeric, max_score numeric,
  held_on date,
  feedback text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.assessments to authenticated;
grant all on public.assessments to service_role;
alter table public.assessments enable row level security;
create policy "as read" on public.assessments for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "as write" on public.assessments for insert to authenticated with check (public.is_admin());
create policy "as update" on public.assessments for update to authenticated using (public.is_admin());
create policy "as delete" on public.assessments for delete to authenticated using (public.is_admin());

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text, website text, contact_person text, contact_email text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.companies to authenticated;
grant all on public.companies to service_role;
alter table public.companies enable row level security;
create policy "co read" on public.companies for select to authenticated using (true);
create policy "co write" on public.companies for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  title text not null,
  kind text not null default 'job' check (kind in ('job','internship')),
  description text,
  location text,
  package text,
  min_cgpa numeric,
  eligible_departments text,
  deadline date,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.opportunities to authenticated;
grant all on public.opportunities to service_role;
alter table public.opportunities enable row level security;
create policy "op read" on public.opportunities for select to authenticated using (true);
create policy "op write" on public.opportunities for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  user_id uuid not null,
  status text not null default 'applied' check (status in ('applied','shortlisted','interview','offered','rejected','joined','withdrawn')),
  remarks text,
  created_at timestamptz not null default now(),
  unique (opportunity_id, user_id)
);
grant select, insert, update, delete on public.opportunity_applications to authenticated;
grant all on public.opportunity_applications to service_role;
alter table public.opportunity_applications enable row level security;
create policy "oa all" on public.opportunity_applications for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create trigger oa_protect before insert on public.opportunity_applications for each row execute function public.protect_columns('status','applied','remarks','__null');

create or replace function public.oa_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    new.remarks := old.remarks;
    if new.status <> old.status and new.status <> 'withdrawn' then new.status := old.status; end if;
  elsif new.status is distinct from old.status then
    perform public.notify(new.user_id, 'Placement application update', 'Status: ' || new.status, '/student/placements');
  end if;
  return new;
end; $$;
create trigger oa_guard before update on public.opportunity_applications for each row execute function public.oa_guard();

-- ============ M05 VOLUNTEERING ============
create table public.volunteer_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null check (kind in ('tele_verification','physical_verification','school_visit','event_assistance','karpom_karpippom','outreach')),
  description text,
  location text,
  activity_date date,
  slots int,
  status text not null default 'published' check (status in ('published','closed','completed')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.volunteer_activities to authenticated;
grant all on public.volunteer_activities to service_role;
alter table public.volunteer_activities enable row level security;
create policy "va read" on public.volunteer_activities for select to authenticated using (true);
create policy "va write" on public.volunteer_activities for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.activity_responses (
  activity_id uuid not null references public.volunteer_activities(id) on delete cascade,
  user_id uuid not null,
  response text not null check (response in ('interested','not_available')),
  assignment text not null default 'pending' check (assignment in ('pending','assigned','not_assigned','completed')),
  hours numeric,
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);
grant select, insert, update, delete on public.activity_responses to authenticated;
grant all on public.activity_responses to service_role;
alter table public.activity_responses enable row level security;
create policy "ar all" on public.activity_responses for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create trigger ar_protect before insert or update on public.activity_responses for each row execute function public.protect_columns('assignment','pending','hours','__null');

create or replace function public.ar_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if new.assignment is distinct from old.assignment and new.assignment = 'assigned' then
    select title into t from public.volunteer_activities where id = new.activity_id;
    perform public.notify(new.user_id, 'You are assigned: ' || coalesce(t,'volunteering activity'), null, '/student/volunteering');
  end if;
  return new;
end; $$;
create trigger ar_notify after update on public.activity_responses for each row execute function public.ar_notify();

-- ============ M06 ALUMNI ============
create table public.alumni_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  graduation_year int,
  current_status text,
  organisation text,
  designation text,
  city text,
  linkedin text,
  willing_to_mentor boolean not null default false,
  bio text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  remarks text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.alumni_applications to authenticated;
grant all on public.alumni_applications to service_role;
alter table public.alumni_applications enable row level security;
create policy "al read" on public.alumni_applications for select to authenticated using (user_id = auth.uid() or public.is_admin() or status = 'approved');
create policy "al insert" on public.alumni_applications for insert to authenticated with check (user_id = auth.uid());
create policy "al update" on public.alumni_applications for update to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "al delete" on public.alumni_applications for delete to authenticated using (public.is_admin());
create trigger al_protect before insert or update on public.alumni_applications for each row execute function public.protect_columns('status','pending','remarks','__null');

create table public.alumni_referrals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company text not null,
  role text not null,
  kind text not null default 'job' check (kind in ('job','internship')),
  description text,
  link text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.alumni_referrals to authenticated;
grant all on public.alumni_referrals to service_role;
alter table public.alumni_referrals enable row level security;
create policy "ref read" on public.alumni_referrals for select to authenticated using (user_id = auth.uid() or public.is_admin() or status = 'approved');
create policy "ref insert" on public.alumni_referrals for insert to authenticated with check (user_id = auth.uid());
create policy "ref update" on public.alumni_referrals for update to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "ref delete" on public.alumni_referrals for delete to authenticated using (user_id = auth.uid() or public.is_admin());
create trigger ref_protect before insert or update on public.alumni_referrals for each row execute function public.protect_columns('status','pending');

create table public.sangamam_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date timestamptz,
  venue text,
  status text not null default 'upcoming' check (status in ('upcoming','completed','cancelled')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.sangamam_events to authenticated;
grant all on public.sangamam_events to service_role;
alter table public.sangamam_events enable row level security;
create policy "ev read" on public.sangamam_events for select to authenticated using (true);
create policy "ev write" on public.sangamam_events for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.event_registrations (
  event_id uuid not null references public.sangamam_events(id) on delete cascade,
  user_id uuid not null,
  attended boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
grant select, insert, update, delete on public.event_registrations to authenticated;
grant all on public.event_registrations to service_role;
alter table public.event_registrations enable row level security;
create policy "er all" on public.event_registrations for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create trigger er_protect before insert or update on public.event_registrations for each row execute function public.protect_columns('attended','false');

-- ============ STORAGE POLICIES (bucket: student-files) ============
create policy "student files read" on storage.objects for select to authenticated
  using (bucket_id = 'student-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "student files insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'student-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "student files update" on storage.objects for update to authenticated
  using (bucket_id = 'student-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "student files delete" on storage.objects for delete to authenticated
  using (bucket_id = 'student-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ============ SAMPLE SHARED DATA ============
insert into public.volunteers (name, phone, email, district, locality, pincode, areas, available, completed_visits) values
('Karthik Raman','98400 11223','karthik.r@example.org','Chennai','Anna Nagar','600040','Anna Nagar, Shenoy Nagar, Aminjikarai',true,12),
('Divya Lakshmi','98410 22334','divya.l@example.org','Chennai','Mogappair','600037','Mogappair, Anna Nagar West, Padi',true,7),
('Suresh Babu','98420 33445','suresh.b@example.org','Chennai','Kilpauk','600010','Kilpauk, Purasawalkam',false,15),
('Meena Sundar','98430 44556','meena.s@example.org','Madurai','K.K. Nagar','625020','K.K. Nagar, Anna Nagar Madurai, Tallakulam',true,9),
('Arun Prakash','98440 55667','arun.p@example.org','Coimbatore','R.S. Puram','641002','R.S. Puram, Gandhipuram, Saibaba Colony',true,4),
('Lavanya Devi','98450 66778','lavanya.d@example.org','Salem','Fairlands','636016','Fairlands, Hasthampatti',true,6);

insert into public.support_staff (name, role, designation, phone, email, zone) values
('Priyanka Mohan','anchor','Student Anchor','90030 10101','priyanka.m@maatram.org','Chennai North'),
('Rahul Venkat','anchor','Student Anchor','90030 20202','rahul.v@maatram.org','Chennai North'),
('Sangeetha Ravi','zone_coordinator','Zone Coordinator — Chennai','90030 30303','sangeetha.r@maatram.org','Chennai'),
('Dr. Vijay Anand','mentor','Core Team Mentor','90030 40404','vijay.a@maatram.org','Tamil Nadu');

insert into public.training_programmes (title, category, description, starts_on, ends_on, schedule, mode, status) values
('Japanese Language — N5 Batch','Language','Beginner Japanese classes preparing for JLPT N5.', current_date + 7, current_date + 97, 'Sat & Sun, 10:00–11:30 AM','Online','open'),
('Communication Skills Bootcamp','Soft skills','Spoken English, presentation and group discussion practice.', current_date + 3, current_date + 33, 'Wednesdays, 6:00–7:30 PM','Online','open'),
('Python for Engineers','Technical','Hands-on Python programming from basics to projects.', current_date + 14, current_date + 74, 'Tue & Thu, 7:00–8:30 PM','Online','open');

insert into public.companies (name, industry, website) values
('Zoho Corporation','Software','https://www.zoho.com'),
('Tata Consultancy Services','IT Services','https://www.tcs.com'),
('Ashok Leyland','Automotive','https://www.ashokleyland.com');

insert into public.opportunities (company_id, title, kind, description, location, package, min_cgpa, eligible_departments, deadline, status)
select id, 'Member Technical Staff', 'job', 'Software development role for final-year engineering students.', 'Chennai', '₹ 6.5 LPA', 7, 'CSE, IT, ECE', current_date + 21, 'open' from public.companies where name = 'Zoho Corporation';
insert into public.opportunities (company_id, title, kind, description, location, package, min_cgpa, eligible_departments, deadline, status)
select id, 'Assistant System Engineer', 'job', 'Entry-level IT services role.', 'Chennai / Coimbatore', '₹ 3.6 LPA', 6, 'All branches', current_date + 30, 'open' from public.companies where name = 'Tata Consultancy Services';
insert into public.opportunities (company_id, title, kind, description, location, package, min_cgpa, eligible_departments, deadline, status)
select id, 'Summer Manufacturing Intern', 'internship', '8-week internship on the shop floor and quality team.', 'Ennore, Chennai', '₹ 15,000 / month', 6.5, 'Mechanical, Automobile, EEE', current_date + 14, 'open' from public.companies where name = 'Ashok Leyland';

insert into public.volunteer_activities (title, kind, description, location, activity_date, slots, status) values
('School Visit — Govt. Hr. Sec. School, Ambattur','school_visit','Talk to Class 12 students about Maatram admissions.','Ambattur, Chennai', current_date + 10, 6, 'published'),
('Karpom Karpippom — Weekend Tutoring','karpom_karpippom','Teach Maths and Science to Class 10 students.','Online', current_date + 5, 15, 'published'),
('Admission Tele-verification Drive','tele_verification','Call new applicants and confirm their details.','Online', current_date + 3, 10, 'published');

insert into public.sangamam_events (title, description, event_date, venue, status) values
('Sangamam 2026 — Annual Alumni Meet','Alumni, students and the Maatram team come together to share journeys.', now() + interval '45 days', 'Chennai Trade Centre','upcoming');
