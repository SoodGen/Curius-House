# Curious House — Founder Tracker

A founder tracking app for Curious Ventures, backed by Supabase.

This README walks you from this folder to a live app at `house.curiousventures.xyz`.

---

## What this is

- React + Vite front end (styled with Tailwind via CDN, no build config to worry about).
- Data, images, and voice notes are stored in your Supabase project.
- Your Supabase Project URL and **publishable** key are already wired in as safe fallbacks,
  so it runs out of the box. You can still override them with environment variables (below).

---

## Stage A — Set up the database (once, ~2 min)

1. Open your Supabase project at https://supabase.com.
2. Go to **SQL Editor -> New query**.
3. Open the file `supabase_setup.sql` from this folder, copy everything, paste it in, and click **Run**.
   You should see "Success". This creates the `kv` table the app reads and writes.

---

## Stage B — Run it locally first (optional, ~3 min)

If you have Node.js installed:

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173). Log in as the team with passcode **1234**,
add a test founder, refresh the page — the data should still be there. That confirms Supabase is connected.

If you don't want to run it locally, skip to Stage C; Vercel will build it for you.

---

## Stage C — Put it on GitHub (~5 min)

1. Create a new repository at https://github.com (private is fine).
2. Upload this entire folder. Easiest no-terminal way: on the new repo page, click
   **uploading an existing file**, then drag in everything EXCEPT `node_modules` (you won't have it
   unless you ran Stage B). The `.gitignore` already excludes it.

---

## Stage D — Deploy to Vercel (~3 min)

1. Go to https://vercel.com -> **Add New -> Project**.
2. Import the GitHub repo you just created.
3. Vercel auto-detects Vite. Leave the build settings as-is.
4. (Optional but recommended) Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = `https://lhkklgqlgvpmylimyxdo.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_1ZetxxdVnvLWSnFigurocg_mOWPds1C`
   (These are also baked in as fallbacks, so it works even if you skip this.)
5. Click **Deploy**. In ~2 minutes you get a live `something.vercel.app` URL. Open it and confirm it loads.

---

## Stage E — Point your subdomain at it (~5 min + DNS wait)

1. In this new Vercel project: **Settings -> Domains**.
2. Add `house.curiousventures.xyz`.
3. Because `curiousventures.xyz` is already on Vercel, it will either auto-configure the DNS or
   show you a single CNAME record to add. Follow the on-screen instruction.
4. Wait a few minutes for it to verify. Done — the app is live with HTTPS at your subdomain.

---

## Security note (please read)

This V1 uses one shared data table with an open access policy. That means the app works without
per-user login plumbing, but anyone who has the site can technically reach the underlying data via
the publishable key. For a small, trusted cohort this is a normal V1 trade-off.

Concretely:
- Founder passwords are stored as plain text. Use throwaway passwords, not ones reused elsewhere.
- Don't store anything in here you'd be unwilling to have leak.

When you're ready to make it properly private (each founder sees only their own data, hashed
passwords, real auth), that's the "Supabase Auth + Row Level Security" upgrade — ask Claude to do it.

---

## Resetting the team passcode

The team passcode defaults to `1234`. To change it, open the app, and in the code you can later
ask Claude to set a different default, or wire up a proper admin login during the Auth upgrade.
