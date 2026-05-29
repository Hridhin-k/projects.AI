# Projects.AI

Project management from planning through deployment. Built with **Next.js**, **Supabase** (auth + database), and **Google Gemini** for the AI assistant.

## Features

- Project lifecycle (planning → design → development → testing → staging → deployment)
- Per-project Kanban boards, milestones, and deployment tracking
- Team roles (owner, admin, manager, employee) with invites
- AI task assistant and workload-aware assignment
- Email notifications via Brevo

## Quick start

1. Copy environment variables:

```bash
cp env.template .env.local
```

2. Set Supabase keys and run the SQL migration — see [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js App Router, React, Tailwind CSS |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| AI | Google Gemini |
| Email | Brevo |

## Project structure

```
app/              # Routes and API handlers
components/       # UI components
lib/
  auth/           # Session and permissions
  db/             # Server actions (tasks, projects, invites)
  supabase/       # Supabase clients
  types/          # DB row mappers
supabase/         # Migrations and CLI config
```

## Documentation

- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) — database and auth setup
- [BREVO_EMAIL_SETUP.md](BREVO_EMAIL_SETUP.md) — transactional email (optional)
