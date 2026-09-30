# CRM App — Refine + Supabase

A lightweight CRM with form-based CRUD and one-to-many contact→notes relationships.

## Stack
- **Frontend**: React 18 + Vite + TypeScript
- **UI**: Ant Design via Refine
- **Backend**: Supabase (hosted PostgreSQL + REST API)

## Setup

### 1. Create a Supabase project
1. Go to [app.supabase.com](https://app.supabase.com) → New Project
2. Open **SQL Editor** and run `supabase-schema.sql` (in this folder)
3. Go to **Settings → API** and copy your **Project URL** and **anon public** key

### 2. Configure credentials
Edit `.env` in this folder:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the app
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

## Features
| Feature | Location |
|---|---|
| List all contacts | `/contacts` |
| Create a contact | `/contacts/create` |
| Edit a contact | `/contacts/edit/:id` |
| Delete a contact | list row → delete button |
| View contact + notes | `/contacts/show/:id` |
| Add / delete notes | Contact detail page (inline) |

## Extending
- **Add more tables** (e.g. `deals`, `tasks`): add a new resource in `App.tsx` and a `pages/<resource>/` folder following the contacts pattern
- **Authentication**: enable Supabase Auth and add `authProvider` to `<Refine>`
- **Deploy**: `npm run build` → deploy the `dist/` folder to Vercel, Netlify, or AWS Amplify
