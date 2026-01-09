# plan.md — PRD (extenso) — AI-DEX
**Producto:** AI-DEX (companion app gamificada para ejecución diaria)  
**Owner:** Jordi / Comunidad Skool  
**Stack objetivo:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (Auth + Postgres + Storage) + Vercel  
**Estado:** PRD v1 (MVP + v1.1)  
**Nota clave:** AI-DEX debe funcionar **100% independiente** de Skool. Cualquier integración con Skool es **opcional** y **no bloqueante**.

---

## 0) Resumen ejecutivo
AI-DEX es una web app utilitaria (mobile-first) que convierte el aprendizaje en ejecución diaria: misiones, checklists, notas, progreso (XP/niveles), skills y milestones. El usuario elige un "track" (microproductos, servicios, 1:1, automatizaciones/agencia, creator engine) y el sistema le genera un plan diario y una ruta semanal/mensual con tareas específicas y medibles.

**Resultado esperado:** aumentar consistencia, reducir fricción, y acelerar "first win" (primer deploy / primer contenido / primer prospecto / primer pago) mediante un sistema de ejecución gamificado y estructurado.

---

## 1) Objetivos, no-objetivos y métricas

### 1.1 Objetivos (MVP)
1) Onboarding claro + segmentación por track y tiempo disponible.  
2) Dashboard "Hoy" con Daily Quest + checklist + progreso (XP/level/streak/skills).  
3) Misiones (Main/Side/Daily) con asignación inteligente.  
4) Registro de completions con evidencia/reflexión opcional.  
5) Notes / Idea Vault con tags, búsqueda y plantillas.  
6) Sistema de XP/skills/levels/streaks con reglas transparentes.  
7) Seguridad sólida (RLS) + multiusuario aislado por user_id.  
8) Admin panel mínimo (solo para admins) para CRUD de misiones + plantillas.

### 1.2 No-objetivos (MVP)
- No depende de API de Skool (si no existe o no es accesible).  
- No incluye chat interno tipo red social (puede agregarse en v2).  
- No incluye IA generativa dentro de la app (puede agregarse luego).  
- No incluye pagos/checkout dentro de AI-DEX (se maneja fuera).  
- No incluye PWA push notifications en MVP (opcional v1.1).

### 1.3 Métricas (definiciones)
**Activación (A1):** usuario completa onboarding + completa 1 misión en 24h.  
**Retención (R7):** usuario con ≥3 días activos en 7 días.  
**Ejecución (E):** % de usuarios que completan Daily Quest ≥4 días/semana.  
**Progreso (P):** % que completa milestones clave (stack, primer deploy, 7-day streak).  
**Valor (V):** % que registra "primer win" (ej: primer contenido publicado / primer lead contactado / primer pago) en 30 días.  
**Calidad:** tasa de errores, latencia, fallas auth, y bugs reportados.

---

## 2) Usuarios, roles y permisos

### 2.1 Roles
- **Member (default):** ve/gestiona solo sus datos.
- **Admin:** gestiona catálogo (misiones, cards, plantillas), ve métricas agregadas opcionales.

### 2.2 Permisos por rol (alto nivel)
- **Member:** CRUD de notes propias; completar misiones asignadas; ver catálogo DEX según unlocks; editar su perfil.
- **Admin:** CRUD global de misiones/cards/plantillas; seed y cambios de XP rules; ver panel interno.

**Implementación recomendada:** tabla `admins` + RLS que permita acciones si `auth.uid()` está en admins.

---

## 3) Alcance funcional detallado (MVP)

### 3.1 Auth y perfil
- Registro, login, reset password con Supabase Auth.
- Perfil (`profiles`):
  - nombre / alias
  - track principal (y opcional secundario)
  - nivel inicial (0–3)
  - tiempo disponible diario (30/60/120)
  - modo preferido: builder / creator / seller (multi-select opcional)
  - herramientas instaladas (checklist)
  - zona horaria (por defecto Uruguay si no se provee)
- "Estado de onboarding" (completado / en progreso).

### 3.2 Onboarding Wizard (4–5 pasos)
1) Objetivo principal (microproductos / servicios / 1:1 / agencia / creator engine).  
2) Nivel actual (0–3).  
3) Tiempo disponible (30/60/120 min).  
4) Preferencia de ejecución (builder/creator/seller).  
5) Setup actual (GitHub/Vercel/Supabase/Dyad/Resend/etc.) + opcional link perfil Skool o "access code".

**Resultado:** asignar track + generar un "Plan Base" (misiones iniciales) y crear asignaciones.

### 3.3 Dashboard "Hoy"
- Daily Quest (1–3 tareas según tiempo).
- Checklist de hábitos diarios (2–8 items según tiempo y track).
- Botón "Completar" por tarea (con evidencia/reflexión opcional).
- Progreso:
  - XP total
  - Nivel
  - Streak (actual y mejor)
  - Skills (top 3)
- "Recomendación del día" (1 sidequest sugerida).

### 3.4 Misiones
- Tipos:
  - **Daily Quest:** acciones cortas, repetibles.
  - **Main Quest:** ruta grande con steps; progreso semanal/mensual.
  - **Sidequests:** alto leverage opcional.
- Filtros por:
  - track
  - skill
  - dificultad
  - estado (asignada / completada / pendiente)

### 3.5 Skills
- Lista de skills + barras de progreso.
- "Qué acciones la suben" (misiones mapeadas).
- Recomendaciones automáticas ("si querés subir Distribución: completá X/Y").

### 3.6 Notes / Idea Vault
- Notas con:
  - título, contenido, tags array
  - plantillas rápidas (hooks, scripts, ofertas, outreach)
- Búsqueda full-text (v1.1 recomendado) o búsqueda simple por título/tags MVP.

### 3.7 DEX (catálogo desbloqueable)
- Cards (herramientas, guías, templates, mini-recursos)
- Unlock rule simple (ej: "completá misión X" o "alcanzá level Y" o "streak >= 7").
- Cada card:
  - descripción
  - pasos de setup
  - links
  - misiones relacionadas

### 3.8 Admin panel (MVP mínimo)
- CRUD de `missions`, `mission_steps`, `dex_cards`, `note_templates`.
- Toggle `is_active`.
- Mapear misión a track/skill/dificultad/XP.

---

## 4) Gamificación — reglas exactas (MVP)

### 4.1 Skills (lista inicial)
- **Vibecoding**
- **Stack Setup**
- **Distribución (Contenido)**
- **Ventas (Outreach / Closing)**
- **Oferta (Packaging / Pricing)**
- **Delivery (Servicio / Producto)**
- **Automatización (Sistemas)**
- **Mindset & Consistencia** (opcional, útil para hábitos y streak)

### 4.2 XP y niveles
**Regla principal:** cada completion genera 1 evento en `xp_events`.

#### 4.2.1 XP por dificultad (base)
- Dificultad 1 (S): 10 XP
- Dificultad 2 (M): 25 XP
- Dificultad 3 (L): 60 XP
- Dificultad 4 (XL): 120 XP

**Bonos**
- +10% XP si incluye reflexión (≥ 10 caracteres).
- +15% XP si incluye evidencia URL (y no está vacía).
- Streak bonus (solo Daily Quest):  
  - día 1–3: +0  
  - día 4–7: +10%  
  - día 8–14: +20%  
  - día 15+: +30%

> Nota: los bonos deben estar controlados para no "romper" la progresión. Se recomienda cap: bonus total máximo 50%.

#### 4.2.2 Fórmula de nivel (simple y escalable)
Definimos niveles por thresholds (tabla). Evita fórmulas "raras", facilita UI y balanceo.

| Nivel | XP acumulada mínima |
|------:|---------------------:|
| 1 | 0 |
| 2 | 200 |
| 3 | 500 |
| 4 | 900 |
| 5 | 1400 |
| 6 | 2000 |
| 7 | 2700 |
| 8 | 3500 |
| 9 | 4400 |
| 10 | 5400 |
| 11 | 6500 |
| 12 | 7700 |
| 13 | 9000 |
| 14 | 10400 |
| 15 | 11900 |
| 16 | 13500 |
| 17 | 15200 |
| 18 | 17000 |
| 19 | 18900 |
| 20 | 20900 |

**Cómo se calcula (paso a paso):**
1) Sumás todos los `xp_events.xp` del usuario => `xp_total`.  
2) Buscás el mayor nivel cuyo threshold <= `xp_total`.  
Ejemplo: `xp_total = 930` → nivel 4 (900) porque 930 < 1400.

### 4.3 Streak
- Streak sube si el usuario completa al menos 1 Daily Quest ese día.
- Si pasa un día sin completar, streak vuelve a 0 (o se rompe; se guarda best streak).
- Guardar:
  - `streak_current`
  - `streak_best`
  - `last_daily_completed_at` (fecha)

### 4.4 Anti-cheat suave (MVP)
- Evidencia y reflexión son opcionales, pero:
  - Si no aporta nada por 7 días, la app muestra "sugerencia" para agregar 1 línea.
- Para misiones de ventas/contenido, sugerir evidencia (link post / texto DM / screenshot en storage).
- No bloquear completions (evitar fricción), solo guiar.

---

## 5) Generación de plan diario (motor de asignación)

### 5.1 Inputs
- track
- tiempo disponible
- nivel actual
- estado de milestones (ej: stack incompleto)
- historial de completions (evitar repetición excesiva)

### 5.2 Reglas
1) Si faltan prerequisitos (GitHub/Vercel/Supabase) → priorizar Setup/Stack.  
2) Daily Quest siempre existe (mínimo 1).  
3) Checklist/hábitos se ajusta al tiempo disponible:
- 30 min: 1 daily quest + 2 hábitos + 0–1 sidequest sugerida
- 60 min: 1 daily + 4 hábitos + 1 sidequest
- 120 min: 1 daily + 6 hábitos + 1 main-step + 1 sidequest

4) Balance de skills:
- al menos 2 skills distintas por semana (para no ser monotemático).
5) "Swap":
- el usuario puede cambiar una misión por otra equivalente (misma skill y dificultad similar).
- limitar swaps/día (ej: 2) para evitar "gaming".

### 5.3 Persistencia del plan
- Guardar asignaciones en `user_mission_assignments` con `assigned_at`.
- El plan diario se recalcula solo si:
  - es un nuevo día
  - el usuario pide "Regenerar"
  - o cambia su configuración (tiempo/track)

---

## 6) Arquitectura técnica (MVP)

### 6.1 Componentes
- **Frontend (Next.js App Router):**
  - Server Components para fetch inicial
  - Client Components para interacción (checklists, modals)
- **Backend:**
  - Supabase Postgres + RLS
  - Server Actions (Next.js) o API Routes para operaciones críticas
- **Auth:**
  - Supabase Auth (email/password; OAuth opcional v1.1)
- **Storage:**
  - Evidencia (images/screenshots) en bucket `evidence` por user_id

### 6.2 Principios de escalabilidad
- RLS para seguridad y aislamiento.
- Índices correctos (user_id, created_at, mission_id).
- Paginar feeds (misiones, notes).
- Evitar queries N+1: usar joins controlados o RPC si hace falta.
- Logging y observabilidad (opcional v1.1): PostHog/Umami/Sentry.

---

## 7) Seguridad — requisitos y medidas

### 7.1 Requisitos
- Ningún usuario puede leer/escribir datos de otro.
- Admin solo si está en lista admins.
- Storage aislado por usuario.
- Evitar exposición de claves (solo env vars).
- Validación server-side para completions/XP events.

### 7.2 Amenazas típicas y mitigaciones
- **IDOR / acceso por ID:** mitigado por RLS + filtros `user_id = auth.uid()`.
- **Escalada a admin:** admins solo desde tabla y RLS, no por client.
- **Manipulación XP desde client:** XP se calcula del lado server (server action) y se inserta en `xp_events`.
- **Inyección SQL:** usar queries parametrizadas (Supabase client).
- **XSS en notes:** sanitizar render si se permite markdown; para MVP, mostrar como texto plano.
- **Abuso storage:** limitar tamaño de uploads; validar mime type; rate-limit (v1.1).

---

## 8) Modelo de datos — tablas (MVP)

> Importante: nombres y tipos sugeridos. Ajustar según preferencias, pero mantener el aislamiento por `user_id`.

### 8.1 SQL — tablas base
```sql
-- 1) Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  track_id uuid,
  level_initial int default 1,
  time_daily int default 60, -- 30/60/120
  preferences jsonb default '{}'::jsonb,
  tools jsonb default '{}'::jsonb,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Tracks
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

-- 3) Skills
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

-- 4) Missions
create type public.mission_type as enum ('daily','main','side');

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  type public.mission_type not null,
  title text not null,
  description text,
  skill_id uuid references public.skills(id),
  track_id uuid references public.tracks(id),
  difficulty int not null default 1, -- 1..4
  xp_reward int not null default 10, -- baseline; el server puede recalcular según difficulty
  is_active boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5) Mission steps
create table if not exists public.mission_steps (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  title text not null,
  step_order int not null default 1,
  is_required boolean default true
);

-- 6) User mission assignments
create type public.assignment_status as enum ('assigned','completed','skipped');

create table if not exists public.user_mission_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  status public.assignment_status default 'assigned',
  assigned_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists idx_uma_user on public.user_mission_assignments(user_id);
create index if not exists idx_uma_mission on public.user_mission_assignments(mission_id);

-- 7) Completions
create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  evidence_url text,
  reflection text,
  created_at timestamptz default now()
);

create index if not exists idx_completions_user_created on public.completions(user_id, created_at desc);

-- 8) XP events
create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null, -- 'completion' etc
  source_id uuid, -- completion_id
  xp int not null,
  skill_id uuid references public.skills(id),
  created_at timestamptz default now()
);

create index if not exists idx_xp_user_created on public.xp_events(user_id, created_at desc);

-- 9) User stats (cache de lectura rápida)
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp_total int not null default 0,
  level int not null default 1,
  streak_current int not null default 0,
  streak_best int not null default 0,
  last_daily_completed_at date,
  last_active_at timestamptz
);

-- 10) Notes
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text not null,
  tags text[] default '{}'::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_notes_user_updated on public.notes(user_id, updated_at desc);

-- 11) DEX cards
create table if not exists public.dex_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  unlock_rule jsonb default '{}'::jsonb, -- e.g. {"type":"level","value":5} or {"type":"mission","mission_id":"..."}
  links jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 12) User dex unlocks
create table if not exists public.user_dex_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dex_card_id uuid not null references public.dex_cards(id) on delete cascade,
  unlocked_at timestamptz default now(),
  unique(user_id, dex_card_id)
);

-- 13) Admins
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
```

---

## 9) RLS (Row Level Security) — políticas (MVP)

### 9.1 Principio
RLS habilitado en todas las tablas user-owned.

Policies: `user_id = auth.uid()`.

Admin policies: allow si `exists (select 1 from admins where user_id = auth.uid())`.

### 9.2 SQL — habilitar RLS y policies
```sql
-- helper: admin check
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_mission_assignments enable row level security;
alter table public.completions enable row level security;
alter table public.xp_events enable row level security;
alter table public.user_stats enable row level security;
alter table public.notes enable row level security;
alter table public.user_dex_unlocks enable row level security;

-- Public reference tables (tracks/skills/missions/dex_cards/mission_steps):
-- Opción A: lectura pública (authenticated) + escritura solo admin
alter table public.tracks enable row level security;
alter table public.skills enable row level security;
alter table public.missions enable row level security;
alter table public.mission_steps enable row level security;
alter table public.dex_cards enable row level security;
alter table public.admins enable row level security;

-- PROFILES
create policy "profiles_select_own" on public.profiles
for select to authenticated
using (user_id = auth.uid());

create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check (user_id = auth.uid());

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ASSIGNMENTS
create policy "assignments_rw_own" on public.user_mission_assignments
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- COMPLETIONS
create policy "completions_rw_own" on public.completions
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- XP EVENTS
create policy "xp_select_own" on public.xp_events
for select to authenticated
using (user_id = auth.uid());

-- Inserción de XP events idealmente solo desde server actions con service role.
-- Si igual se permite insert desde client, limitar:
create policy "xp_insert_own" on public.xp_events
for insert to authenticated
with check (user_id = auth.uid());

-- USER STATS
create policy "stats_rw_own" on public.user_stats
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- NOTES
create policy "notes_rw_own" on public.notes
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- USER DEX UNLOCKS
create policy "dex_unlocks_rw_own" on public.user_dex_unlocks
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- TRACKS / SKILLS / MISSIONS / STEPS / DEX_CARDS: lectura para authenticated
create policy "tracks_read" on public.tracks
for select to authenticated using (true);

create policy "skills_read" on public.skills
for select to authenticated using (true);

create policy "missions_read" on public.missions
for select to authenticated using (is_active = true or public.is_admin());

create policy "mission_steps_read" on public.mission_steps
for select to authenticated using (true);

create policy "dex_cards_read" on public.dex_cards
for select to authenticated using (is_active = true or public.is_admin());

-- Escritura solo admin
create policy "tracks_admin_write" on public.tracks
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "skills_admin_write" on public.skills
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "missions_admin_write" on public.missions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "mission_steps_admin_write" on public.mission_steps
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "dex_cards_admin_write" on public.dex_cards
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ADMINS: solo admin puede ver/escribir (o restringir más)
create policy "admins_admin_only" on public.admins
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
```

### 9.3 Storage policies (evidence)
Bucket: `evidence`

Ruta recomendada: `user_id/yyyy-mm/filename.ext`

Policy: authenticated puede subir/leer solo si path comienza con su `auth.uid()`.

---

## 10) Rutas y estructura Next.js (App Router)

### 10.1 Rutas (MVP)
- `/` → landing interna (si logueado, redirect `/today`)
- `/auth/login`
- `/auth/register`
- `/auth/reset`
- `/onboarding`
- `/today` (Dashboard)
- `/missions` (tabs: Daily/Main/Side)
- `/missions/[id]`
- `/skills`
- `/notes`
- `/notes/[id]`
- `/dex`
- `/settings`
- `/admin` (solo admin)
- `/admin/missions`
- `/admin/dex`
- `/admin/templates`

### 10.2 Componentes clave
- MissionCard, MissionDetail, CompletionModal
- XPProgress, LevelBadge, StreakWidget
- SkillBars
- NotesEditor (simple textarea MVP)
- DexCard

---

## 11) Acciones server-side (críticas)

Regla: XP, stats, streak deben actualizarse del lado server para evitar manipulación.

### 11.1 Server Actions (recomendado)
**completeMission({ missionId, evidenceUrl?, reflection? })**
- valida misión activa
- inserta completion
- calcula XP (difficulty + bonos + streak)
- inserta xp_event
- actualiza assignment status
- recalcula user_stats (xp_total, level, streak)
- chequea unlocks del DEX

**generateDailyPlan()**
- crea assignments si no existen hoy

**swapMission(assignmentId, newMissionId)**
- valida equivalencia (skill/difficulty/track)

**createNote, updateNote, deleteNote** (con RLS + server)

### 11.2 Reglas de consistencia
- Usar transacciones (RPC o server con service role) para completeMission.
- Evitar doble completion: unique constraint opcional:
  - para daily: 1 completion por misión por día (si aplica)
  - para main/side: allow repetir si querés, pero default no repetir.

---

## 12) Diseño UX/UI (simple, sólido, mobile-first)

- UI minimal con tabs y cards.
- No animaciones complejas en MVP.
- Animación "micro" opcional v1.1:
  - confetti/shine al subir de nivel
  - checkmark animado al completar
- Estados vacíos (importante):
  - "No tenés misiones asignadas hoy" → botón generar plan.
  - "Aún no tenés notas" → botón crear.
  - "DEX bloqueado" → mostrar "cómo desbloquear".

---

## 13) PASO ESPECÍFICO — Catálogo masivo de misiones (MVP + largo del juego)

Este paso está intencionalmente aislado para que no se mezcle con arquitectura o seguridad.
Objetivo: tener suficiente contenido para "mantenerlos en el ruedo" por semanas/meses.

### 13.1 Convenciones del catálogo
Cada misión define:
- ID lógico (para seed): SETUP-01, VC-12, etc. (luego se convierte a UUID en DB)
- Tipo: daily / main / side
- Track: universal o track específico
- Skill: una principal
- Dificultad: 1..4
- XP base: según dificultad (10/25/60/120)
- Descripción y evidencia sugerida

### 13.2 Misiones UNIVERSALES (base para todos) — 40

#### Setup/Stack (10)
**SETUP-01** (side, universal, Stack Setup, diff1) — Crear cuenta GitHub + 2FA. Evidencia: link perfil.

**SETUP-02** (side, universal, Stack Setup, diff2) — Crear cuenta Vercel + conectar GitHub. Evidencia: screenshot deploy page.

**SETUP-03** (side, universal, Stack Setup, diff2) — Crear proyecto Supabase + guardar keys en env. Evidencia: screenshot settings.

**SETUP-04** (side, universal, Stack Setup, diff3) — Activar RLS en tablas base (si ya existe proyecto). Evidencia: screenshot policies.

**SETUP-05** (side, universal, Stack Setup, diff1) — Instalar Dyad (o editor elegido) + correr "hello world". Evidencia: screenshot.

**SETUP-06** (side, universal, Stack Setup, diff2) — Configurar variables de entorno en Vercel. Evidencia: screenshot env vars.

**SETUP-07** (side, universal, Stack Setup, diff1) — Crear repo "ai-dex-sandbox" para pruebas. Evidencia: link repo.

**SETUP-08** (side, universal, Stack Setup, diff2) — Instalar PostHog/Umami (opcional) o dejar stub. Evidencia: nota.

**SETUP-09** (side, universal, Stack Setup, diff3) — Implementar login Supabase en un proyecto de prueba. Evidencia: link deploy.

**SETUP-10** (side, universal, Stack Setup, diff4) — Primer deploy con auth + DB read simple. Evidencia: link.

#### Plan 1K / Fundaciones (10)
**P1K-01** (main, universal, Oferta, diff1) — Completar Parte 1 del Plan 1K (checkpoint). Evidencia: reflexión 2 líneas.

**P1K-02** (main, universal, Oferta, diff1) — Completar Parte 2 (checkpoint).

**P1K-03** (main, universal, Ventas, diff1) — Completar Parte 3 (checkpoint).

**P1K-04** (side, universal, Oferta, diff2) — Definir "quién ayudo + resultado + mecanismo" en 1 párrafo. Evidencia: texto.

**P1K-05** (side, universal, Oferta, diff2) — Escribir 3 ofertas (microproducto/servicio/1:1) en bullets.

**P1K-06** (side, universal, Ventas, diff2) — Armar lista de 30 leads (tabla). Evidencia: screenshot.

**P1K-07** (side, universal, Ventas, diff1) — Redactar DM frío #1 (plantilla).

**P1K-08** (side, universal, Ventas, diff1) — Redactar follow-up #1 y #2.

**P1K-09** (side, universal, Delivery, diff2) — Crear SOP básico de entrega (10 bullets).

**P1K-10** (side, universal, Autom. Sistemas, diff2) — Crear checklist de onboarding cliente (inputs obligatorios).

#### Ejecución diaria (10)
**DAILY-01** (daily, universal, Mindset, diff1) — Plan de 10 minutos: "3 tareas críticas de hoy". Evidencia: nota.

**DAILY-02** (daily, universal, Distribución, diff1) — Publicar 1 story con CTA suave. Evidencia: link o nota.

**DAILY-03** (daily, universal, Ventas, diff1) — Enviar 5 mensajes (frío o warm). Evidencia: texto.

**DAILY-04** (daily, universal, Vibecoding, diff1) — 20 min de building (commit o nota). Evidencia: link commit.

**DAILY-05** (daily, universal, Oferta, diff1) — Refinar 1 línea de la oferta.

**DAILY-06** (daily, universal, Delivery, diff1) — Mejorar 1 asset del delivery (template, SOP).

**DAILY-07** (daily, universal, Distribución, diff2) — Producir 1 video corto o 5 imágenes. Evidencia: link.

**DAILY-08** (daily, universal, Ventas, diff2) — Follow-up a 3 leads. Evidencia: texto.

**DAILY-09** (daily, universal, Autom., diff1) — Automatizar 1 micro-tarea (ej: plantilla, snippet). Evidencia: nota.

**DAILY-10** (daily, universal, Mindset, diff1) — "Reflection": qué salió bien, qué ajusto mañana (2 líneas).

#### Milestones universales (10)
**MILE-01** (main, universal, Stack Setup, diff2) — "Stack listo": GitHub+Vercel+Supabase confirmados.

**MILE-02** (main, universal, Vibecoding, diff3) — Construir mini-app #1 (habit tracker básico).

**MILE-03** (main, universal, Vibecoding, diff3) — Construir mini-app #2 (smart notes).

**MILE-04** (main, universal, Ventas, diff2) — 50 mensajes enviados acumulados.

**MILE-05** (main, universal, Distribución, diff2) — 10 piezas de contenido publicadas.

**MILE-06** (main, universal, Oferta, diff2) — Landing simple + CTA.

**MILE-07** (main, universal, Delivery, diff2) — Caso de estudio #1 (aunque sea pequeño).

**MILE-08** (main, universal, Ventas, diff3) — 1 llamada agendada (si aplica).

**MILE-09** (main, universal, Ventas, diff4) — Primer pago recibido (registrado como nota/evidencia).

**MILE-10** (main, universal, Mindset, diff2) — Streak 7 días.

### 13.3 Misiones por TRACK (macro-catálogo)

#### TRACK 1 — MICROPRODUCTOS (60)
Objetivo del track: definir microproducto, construirlo rápido, validar demanda, vender y optimizar.

##### A) Oferta & Producto (15)
**MP-OF-01** (side, Oferta, d2) — Definir microproducto en 1 promesa + 3 bullets.

**MP-OF-02** (side, Oferta, d2) — Definir "quién NO es para" (anti-avatar).

**MP-OF-03** (side, Oferta, d2) — Escribir 10 nombres posibles + elegir 1.

**MP-OF-04** (side, Oferta, d3) — Escribir outline del microproducto (módulos o secciones).

**MP-OF-05** (side, Oferta, d2) — Crear 3 bundles (base/pro/vip) con diferencia real.

**MP-OF-06** (side, Oferta, d2) — Escribir 10 objeciones + respuestas (FAQ).

**MP-OF-07** (side, Oferta, d3) — "Mecanismo único" explicado en 5 líneas.

**MP-OF-08** (side, Oferta, d2) — Precio inicial + razón (anclaje simple).

**MP-OF-09** (side, Oferta, d2) — Garantía / política (simple, clara).

**MP-OF-10** (side, Oferta, d3) — Crear lead magnet relacionado (1 página).

**MP-OF-11** (main, Oferta, d3) — MVP del microproducto listo (versión 0.1).

**MP-OF-12** (side, Delivery, d2) — Template de entrega (checklist de "cómo usarlo").

**MP-OF-13** (side, Delivery, d2) — Página "Getting Started" (texto simple).

**MP-OF-14** (side, Oferta, d2) — Crear "1-liner" + "elevator pitch".

**MP-OF-15** (main, Delivery, d3) — Entrega en formato final (PDF/Notion/Video).

##### B) Distribución (15)
**MP-DIS-01** (daily, Distribución, d1) — 1 post corto: "problema → insight".

**MP-DIS-02** (daily, Distribución, d2) — 1 reel: "antes/después".

**MP-DIS-03** (side, Distribución, d2) — Lista de 30 ideas de contenido.

**MP-DIS-04** (side, Distribución, d2) — 10 hooks específicos del microproducto.

**MP-DIS-05** (side, Distribución, d2) — Script 30–45s con CTA.

**MP-DIS-06** (side, Distribución, d2) — 5 imágenes carrusel (títulos).

**MP-DIS-07** (side, Distribución, d3) — Calendario 7 días (tema por día).

**MP-DIS-08** (daily, Distribución, d1) — 10 minutos: responder DMs/comentarios.

**MP-DIS-09** (side, Distribución, d3) — "Contenido reciclable": 1 idea → 5 formatos.

**MP-DIS-10** (main, Distribución, d3) — 7 días de publicaciones consecutivas.

**MP-DIS-11** (side, Distribución, d2) — 3 CTAs distintos (DM, link, encuesta).

**MP-DIS-12** (side, Distribución, d2) — Story funnel de 4 historias.

**MP-DIS-13** (side, Distribución, d2) — Checklist de grabación (setup simple).

**MP-DIS-14** (side, Distribución, d2) — "Pin" 3 posts top (plan).

**MP-DIS-15** (main, Distribución, d4) — 30 contenidos publicados acumulados.

##### C) Ventas (15)
**MP-VEN-01** (daily, Ventas, d1) — 5 DMs de interés.

**MP-VEN-02** (daily, Ventas, d2) — 1 mini-conversación hasta CTA.

**MP-VEN-03** (side, Ventas, d2) — DM script: curiosidad + pregunta.

**MP-VEN-04** (side, Ventas, d2) — Página checkout (externa) preparada.

**MP-VEN-05** (side, Ventas, d2) — Oferta limitada (deadline real).

**MP-VEN-06** (side, Ventas, d2) — 10 respuestas a objeciones comunes.

**MP-VEN-07** (side, Ventas, d3) — "DM to sale" flow de 6 pasos.

**MP-VEN-08** (main, Ventas, d3) — 20 conversaciones iniciadas.

**MP-VEN-09** (main, Ventas, d4) — 5 ventas del microproducto (registradas).

**MP-VEN-10** (side, Ventas, d2) — Test A/B de pricing (si aplica).

**MP-VEN-11** (side, Ventas, d2) — Crear upsell simple.

**MP-VEN-12** (side, Ventas, d2) — Crear downsell simple.

**MP-VEN-13** (side, Ventas, d2) — Template de seguimiento (3 mensajes).

**MP-VEN-14** (main, Ventas, d3) — Primer testimonio obtenido.

**MP-VEN-15** (main, Ventas, d4) — $1K acumulado en ventas (nota/evidencia).

##### D) Automatización/Sistemas (15)
**MP-SYS-01** (side, Autom., d2) — Guardar respuestas rápidas (snippets).

**MP-SYS-02** (side, Autom., d2) — Tagging simple de leads en hoja.

**MP-SYS-03** (side, Autom., d2) — Template de delivery auto-email (si aplica).

**MP-SYS-04** (side, Autom., d2) — Checklist de publicación (pre/post).

**MP-SYS-05** (side, Autom., d3) — Dashboard simple de métricas (sheet).

**MP-SYS-06** (side, Autom., d3) — Pipeline: idea → guion → post (pasos).

**MP-SYS-07** (daily, Autom., d1) — 10 min: limpiar/ordenar assets.

**MP-SYS-08** (side, Autom., d2) — Carpeta "assets del microproducto".

**MP-SYS-09** (side, Autom., d2) — Plantilla de caso de estudio.

**MP-SYS-10** (main, Autom., d3) — "Sistema mínimo listo" (todo documentado).

**MP-SYS-11** (side, Delivery, d2) — Checklist soporte post-compra.

**MP-SYS-12** (side, Delivery, d2) — Encuesta de feedback (3 preguntas).

**MP-SYS-13** (side, Autom., d3) — "Release notes" para updates.

**MP-SYS-14** (main, Delivery, d3) — v1.1 del microproducto (mejoras).

**MP-SYS-15** (main, Autom., d4) — Máquina de contenido semanal estable.

#### TRACK 2 — SERVICIOS / CONSULTORÍA (70)
Objetivo: conseguir clientes, entregar bien, sistematizar, subir precios.

##### A) Oferta (15)
**SV-OF-01** (side, Oferta, d2) — Definir nicho + dolor principal.

**SV-OF-02** (side, Oferta, d2) — "Outcome ladder": 3 niveles de resultado.

**SV-OF-03** (side, Oferta, d3) — 3 paquetes (starter/pro/elite) con entregables.

**SV-OF-04** (side, Oferta, d2) — "No brainer guarantee" (si aplica).

**SV-OF-05** (side, Oferta, d2) — Página de oferta 1 página.

**SV-OF-06** (side, Oferta, d2) — 10 preguntas de discovery call.

**SV-OF-07** (side, Oferta, d3) — Propuesta template (mini deck/1pager).

**SV-OF-08** (side, Oferta, d2) — Pricing con anclaje.

**SV-OF-09** (side, Oferta, d2) — 5 casos de uso concretos.

**SV-OF-10** (main, Oferta, d3) — Oferta final publicada (link).

**SV-OF-11** (side, Oferta, d2) — Objection handling doc.

**SV-OF-12** (side, Oferta, d2) — "Elevator pitch" 15s y 45s.

**SV-OF-13** (side, Oferta, d2) — Checklist de preparación de llamada.

**SV-OF-14** (main, Oferta, d3) — 3 propuestas enviadas.

**SV-OF-15** (main, Oferta, d4) — Primer cierre.

##### B) Ventas/Outreach (20)
**SV-VEN-01** (daily, Ventas, d1) — 5 DMs fríos.

**SV-VEN-02** (daily, Ventas, d2) — 3 follow-ups.

**SV-VEN-03** (side, Ventas, d2) — Lista de 50 leads calificados.

**SV-VEN-04** (side, Ventas, d2) — Script de DM "diagnóstico".

**SV-VEN-05** (side, Ventas, d2) — Script de llamada 20 min.

**SV-VEN-06** (side, Ventas, d2) — "One-liner + prueba social".

**SV-VEN-07** (main, Ventas, d3) — 10 conversaciones activas.

**SV-VEN-08** (main, Ventas, d3) — 3 llamadas agendadas.

**SV-VEN-09** (side, Ventas, d2) — Checklist de CRM (manual).

**SV-VEN-10** (side, Ventas, d2) — Template seguimiento post-llamada.

**SV-VEN-11** (side, Ventas, d3) — Caso de estudio "antes/después".

**SV-VEN-12** (main, Ventas, d4) — Cerrar 2 clientes en 30 días.

**SV-VEN-13** (side, Ventas, d2) — Auditoría express gratis (estructura).

**SV-VEN-14** (daily, Ventas, d1) — 1 warm outreach.

**SV-VEN-15** (side, Ventas, d3) — Oferta "pilot" 14 días.

**SV-VEN-16** (main, Ventas, d3) — 100 DMs enviados total.

**SV-VEN-17** (side, Ventas, d2) — "Risk reversal" mensaje.

**SV-VEN-18** (side, Ventas, d2) — Checklist de objeciones.

**SV-VEN-19** (main, Ventas, d4) — $1K con servicios.

**SV-VEN-20** (main, Ventas, d4) — Subir precios (nuevo rate) y venderlo.

##### C) Delivery (20)
**SV-DEL-01** (side, Delivery, d2) — Onboarding form (inputs).

**SV-DEL-02** (side, Delivery, d2) — SOP de kickoff call.

**SV-DEL-03** (side, Delivery, d2) — Checklist semanal de entrega.

**SV-DEL-04** (side, Delivery, d3) — Primer workflow/proyecto en producción.

**SV-DEL-05** (side, Delivery, d2) — Documentar "cómo se usa" para cliente.

**SV-DEL-06** (main, Delivery, d3) — Entregar primer resultado tangible.

**SV-DEL-07** (side, Delivery, d2) — Feedback loop (3 preguntas).

**SV-DEL-08** (main, Delivery, d3) — Testimonio obtenido.

**SV-DEL-09** (side, Delivery, d2) — "Handover pack" (credenciales, docs).

**SV-DEL-10** (side, Delivery, d2) — Reunión de revisión mensual (agenda).

**SV-DEL-11** (side, Delivery, d2) — Checklist de QA.

**SV-DEL-12** (side, Delivery, d3) — Monitoreo básico y alertas.

**SV-DEL-13** (main, Delivery, d4) — Retención: cliente renueva.

**SV-DEL-14** (side, Delivery, d2) — Plantilla reporte semanal.

**SV-DEL-15** (side, Delivery, d2) — "Scope control" documento.

**SV-DEL-16** (main, Delivery, d3) — SOP completo del servicio.

**SV-DEL-17** (side, Delivery, d2) — Checklist de seguridad (mínimo).

**SV-DEL-18** (side, Delivery, d2) — Backups / export.

**SV-DEL-19** (main, Delivery, d4) — 3 clientes activos.

**SV-DEL-20** (main, Delivery, d4) — Equipo/outsourcing (primer hire).

##### D) Automatización (15)
**SV-AUT-01** (side, Autom., d2) — Sistema de seguimiento (sheet/CRM).

**SV-AUT-02** (side, Autom., d2) — Template propuesta auto.

**SV-AUT-03** (side, Autom., d2) — Snippets de mensajes.

**SV-AUT-04** (side, Autom., d3) — Pipeline lead → call → proposal.

**SV-AUT-05** (side, Autom., d2) — Repositorio de assets.

**SV-AUT-06** (main, Autom., d3) — "Operations kit" listo.

**SV-AUT-07** (daily, Autom., d1) — 10 min orden/limpieza.

**SV-AUT-08** (side, Autom., d3) — SOP de onboarding automatizable.

**SV-AUT-09** (side, Autom., d3) — Dashboard KPIs.

**SV-AUT-10** (main, Autom., d4) — Escalar entrega sin perder calidad.

**SV-AUT-11** (side, Autom., d2) — Checklist de compliance básico.

**SV-AUT-12** (side, Autom., d2) — Versionado de docs.

**SV-AUT-13** (side, Autom., d2) — Template de contrato (si aplica).

**SV-AUT-14** (main, Autom., d3) — Reducir tiempo de entrega 30%.

**SV-AUT-15** (main, Autom., d4) — Sistema "retainer machine".

#### TRACK 3 — SESIONES 1:1 / COACHING (55)
Objetivo: empaquetar, vender sesiones, mejorar conversion y delivery.

**CCH-OF-01..15** (oferta)

**CCH-VEN-01..15** (ventas)

**CCH-DEL-01..15** (delivery y materiales)

**CCH-DIS-01..10** (distribución y autoridad)

*(Por extensión del documento, el patrón es el mismo que Servicios, pero con foco: guiones, frameworks, worksheet, y retención. Se debe seedear con el mismo formato que arriba.)*

#### TRACK 4 — AUTOMATIZACIONES / AGENCIA (65)
Objetivo: conseguir cuentas, construir sistemas, retener.

**AG-OF-01..15**

**AG-VEN-01..20**

**AG-DEL-01..20**

**AG-AUT-01..10**

*(Mismo patrón; seed con foco en discovery técnico, SOW, QA, monitoreo, seguridad.)*

#### TRACK 5 — CREATOR ENGINE (60)
Objetivo: consistencia de contenido, pipeline, distribución, conversión por DM.

##### A) Pipeline de contenido (20)
**CR-PIPE-01** (side, Distribución, d2) — Definir 3 pilares de contenido.

**CR-PIPE-02** (side, Distribución, d2) — 30 ideas (lista).

**CR-PIPE-03** (side, Distribución, d2) — 20 hooks (lista).

**CR-PIPE-04** (side, Distribución, d2) — 10 scripts cortos.

**CR-PIPE-05** (side, Distribución, d2) — 10 end-frames (copy).

**CR-PIPE-06** (side, Distribución, d2) — 5 CTAs para DM.

**CR-PIPE-07** (main, Distribución, d3) — Calendario 14 días.

**CR-PIPE-08** (daily, Distribución, d1) — Publicar 1 story.

**CR-PIPE-09** (daily, Distribución, d2) — Publicar 1 reel o 5 imágenes.

**CR-PIPE-10** (side, Distribución, d2) — Checklist de grabación.

**CR-PIPE-11** (side, Distribución, d2) — Template de caption.

**CR-PIPE-12** (side, Distribución, d2) — "Repurpose" 1→3 formatos.

**CR-PIPE-13** (main, Distribución, d4) — 30 posts publicados.

**CR-PIPE-14** (side, Distribución, d2) — "Content vault" organizado.

**CR-PIPE-15** (daily, Distribución, d1) — Responder comentarios 10 min.

**CR-PIPE-16** (side, Distribución, d2) — 10 ganchos hablados (lista).

**CR-PIPE-17** (side, Distribución, d2) — 5 guiones de objeciones.

**CR-PIPE-18** (main, Distribución, d3) — Serie de 5 episodios.

**CR-PIPE-19** (side, Distribución, d3) — Mejorar retención (primeros 2s).

**CR-PIPE-20** (main, Distribución, d4) — 7 días seguidos.

##### B) Conversión por DM (20)
**CR-DM-01** (side, Ventas, d2) — Script DM: diagnóstico.

**CR-DM-02** (side, Ventas, d2) — Script DM: prueba social.

**CR-DM-03** (side, Ventas, d2) — Script DM: cierre suave.

**CR-DM-04** (daily, Ventas, d1) — 5 DMs iniciados.

**CR-DM-05** (daily, Ventas, d2) — 3 follow-ups.

**CR-DM-06** (side, Ventas, d2) — "Keyword to DM" plan (manual).

**CR-DM-07** (main, Ventas, d3) — 20 conversaciones.

**CR-DM-08** (main, Ventas, d4) — 1 venta desde DM.

**CR-DM-09** (side, Ventas, d2) — Respuestas objeciones.

**CR-DM-10** (side, Ventas, d2) — CTA variants.

**CR-DM-11** (main, Ventas, d3) — 100 DMs en 30 días.

**CR-DM-12** (side, Ventas, d2) — Mini-CRM en sheet.

**CR-DM-13** (side, Ventas, d2) — Propuesta corta (texto).

**CR-DM-14** (main, Ventas, d3) — 3 llamados agendados.

**CR-DM-15** (side, Ventas, d2) — Checklist de pre-call.

**CR-DM-16** (side, Ventas, d2) — Post-call follow-up.

**CR-DM-17** (side, Ventas, d2) — "Close the loop" mensaje.

**CR-DM-18** (main, Ventas, d4) — $1K en 30 días.

**CR-DM-19** (side, Ventas, d3) — 3 testimonios recolectados.

**CR-DM-20** (main, Ventas, d4) — Oferta optimizada por data.

##### C) Sistema y consistencia (20)
**CR-SYS-01** (side, Autom., d2) — Librería de assets.

**CR-SYS-02** (side, Autom., d2) — Templates base (caption, hooks).

**CR-SYS-03** (side, Autom., d2) — SOP semanal de producción.

**CR-SYS-04** (side, Autom., d3) — Batch day plan (2 horas).

**CR-SYS-05** (daily, Mindset, d1) — 10 min plan del día.

**CR-SYS-06** (main, Autom., d3) — Pipeline estable 2 semanas.

**CR-SYS-07** (side, Autom., d2) — Tracking métricas simple.

**CR-SYS-08** (side, Delivery, d2) — Caso de estudio público.

**CR-SYS-09** (main, Delivery, d3) — Autoridad: 5 posts educativos.

**CR-SYS-10** (side, Autom., d2) — Checklist publicación.

**CR-SYS-11** (side, Autom., d2) — Organización de ideas por pilar.

**CR-SYS-12** (side, Autom., d3) — "Repurpose machine" documentada.

**CR-SYS-13** (main, Autom., d4) — 60 piezas publicadas total.

**CR-SYS-14** (side, Mindset, d2) — Ritual de consistencia 7 días.

**CR-SYS-15** (main, Mindset, d3) — Streak 14 días.

**CR-SYS-16** (side, Autom., d2) — Plan de backups.

**CR-SYS-17** (side, Delivery, d2) — "Offer doc" público.

**CR-SYS-18** (main, Delivery, d4) — 5 clientes desde contenido.

**CR-SYS-19** (side, Autom., d2) — Optimizar bio/perfil.

**CR-SYS-20** (main, Distribución, d4) — Viral loop: 3 reels top.

---

## 14) PASO ESPECÍFICO — Seed inicial recomendado (MVP)

Para que el MVP sea jugable desde el día 1:
- 40 universales (arriba)
- 30 por el track elegido (selección curada)

Total por usuario al inicio: ~70 misiones disponibles + asignación diaria dinámica

**Implementación seed:**
- Insertar tracks/skills
- Insertar missions con metadata:
  - category: setup | vibecoding | distribution | sales | delivery | systems
  - prerequisites: array de IDs lógicos (opcional)
  - evidence_suggested: boolean
  - repeatable: boolean (true para daily)
- Insertar dex_cards con unlocks simples:
  - card "Stack Starter Pack" unlock al completar SETUP-03
  - card "DM Scripts" unlock al completar P1K-07
  - card "Content Vault" unlock con streak 7

---

## 15) Roadmap

### 15.1 MVP (prioridad absoluta)
- DB + RLS + Auth
- Onboarding + perfil
- Motor daily plan (simple)
- Completar misión (server action transaccional) + XP/stats
- Dashboard hoy
- Misiones list/detail
- Notes
- DEX básico
- Admin panel mínimo
- QA + hardening

### 15.2 v1.1 (mejoras)
- Animaciones micro (level up / completion)
- Búsqueda full-text en notes
- PWA / push (si vale la pena)
- Analytics + Sentry
- Cohorts y rankings (solo si no rompe privacidad)
- Export/import (backups)

---

## 16) Testing y calidad (obligatorio)

### 16.1 Test plan mínimo
- Unit tests: cálculo XP, nivel, streak.
- Integration tests: completeMission transaccional.
- RLS tests: usuario A no accede a datos de B.
- Storage tests: uploads aislados.
- Regression: onboarding → plan → completion → stats.

### 16.2 Checklist de QA manual (MVP)
- Crear cuenta y completar onboarding.
- Ver plan diario.
- Completar daily quest con/ sin evidencia.
- Ver XP subir, nivel cambiar en threshold.
- Streak: completar 2 días, romper 1 día.
- Notes CRUD.
- DEX unlock.
- Admin CRUD misiones.

---

## 17) Definition of Done (MVP)

- ✓ RLS habilitado y probado en todas las tablas.
- ✓ No hay endpoints que escriban XP sin validación server.
- ✓ Dashboard hoy funciona en mobile y desktop.
- ✓ Onboarding asigna track y genera plan.
- ✓ Completar misión actualiza assignments + completion + xp_events + user_stats en una sola operación consistente.
- ✓ Notes/DEX listos.
- ✓ Admin panel mínimo operativo.
- ✓ Logs de error básicos y manejo de estados (loading/error/empty).
- ✓ Performance aceptable: listas paginadas, queries indexadas.
- ✓ Deploy en Vercel con env vars correctas.

---

## 18) Riesgos y mitigaciones

- **Contenido demasiado grande sin curación:** usar seed curado + motor que seleccione lo correcto.
- **Usuarios "marcan completado" sin ejecutar:** anti-cheat suave + evidencia sugerida + reflexión.
- **Complejidad de reglas XP:** mantener simple, thresholds editables.
- **Escalado DB:** índices + paginación + cache user_stats.
- **Seguridad:** RLS + server actions transaccionales + storage policies.

---

## 19) Apéndice — Reglas prácticas para tu implementación (sin grietas)

- Todo write crítico pasa por server action (completions, xp, stats, unlocks).
- Client jamás decide XP; solo envía "quiero completar X".
- RLS primero: si una tabla no tiene RLS/policies, no se usa.
- Índices desde el día 1 en (user_id, created_at).
- Paginar missions/notes; no traer todo.
- Versionar catálogo: si cambiás XP o misiones, guardá updated_at y metadata.
- Evitar features sociales hasta que el core (ejecución diaria) sea sólido.

---

**FIN plan.md**