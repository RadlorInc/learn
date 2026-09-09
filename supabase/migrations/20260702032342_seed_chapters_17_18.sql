-- 17–18 band (Algebra II / Pre-Calc / Statistics / intro Calculus): widen the
-- learners.age_group CHECK to allow '17-18', and seed the 13 chapter rows so
-- progress (sessions / learner_progress, FK → chapters.id) can be saved for them.
-- Mirrors the code registry in src/lib/chapters.ts. sort_order 60–72 (15–16 ended at 59).

alter table public.learners drop constraint if exists learners_age_group_check;
alter table public.learners
  add constraint learners_age_group_check
  check (age_group in ('3-5','6-8','9-11','12-14','15-16','17-18'));

insert into public.chapters (id, name, emoji, sort_order, age_groups) values
  ('functionToolkit',      'Function Toolkit',        '🧰', 60, array['17-18']),
  ('quadraticAnalysis',    'Quadratic Analysis',      '📉', 61, array['17-18']),
  ('polynomialFunctions',  'Polynomial Functions',    '〰️', 62, array['17-18']),
  ('complexNumbers',       'Complex Numbers',         '🧩', 63, array['17-18']),
  ('rationalFunctions',    'Rational Functions',      '➗', 64, array['17-18']),
  ('expLogFunctions',      'Exponential & Log',       '📈', 65, array['17-18']),
  ('unitCircleTrig',       'Unit Circle & Trig',      '🧭', 66, array['17-18']),
  ('trigGraphsIdentities', 'Trig Graphs & Identities','〽️', 67, array['17-18']),
  ('conicSections',        'Conic Sections',          '🛰️', 68, array['17-18']),
  ('systemsMatrices',      'Systems & Matrices',      '🔲', 69, array['17-18']),
  ('sequencesSeries',      'Sequences & Series',      '🔗', 70, array['17-18']),
  ('statsInference',       'Statistics & Inference',  '📊', 71, array['17-18']),
  ('introCalculus',        'Intro to Calculus',       '♾️', 72, array['17-18'])
on conflict (id) do update set
  name = excluded.name, emoji = excluded.emoji,
  sort_order = excluded.sort_order, age_groups = excluded.age_groups;
