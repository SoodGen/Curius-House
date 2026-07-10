import { createClient } from "@supabase/supabase-js";

// F-6 fix: credentials come exclusively from env vars — no hardcoded fallbacks.
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel → Project Settings → Environment Variables.
// Use the rotated anon key (rotate it in Supabase Dashboard → Settings → API first).
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — set them in Vercel project settings before deploying.");

const supabase = createClient(url, key);

// Drop-in replacement for the previous storage layer.
// Backed by a single `kv` table (key text, value text).
export const storage = {
  async get(k) {
    const { data, error } = await supabase.from("kv").select("value").eq("key", k).maybeSingle();
    if (error) { console.error("storage.get", error); return null; }
    return data ? { value: data.value } : null;
  },
  async set(k, value) {
    const { error } = await supabase.from("kv").upsert({ key: k, value, updated_at: new Date().toISOString() });
    if (error) console.error("storage.set", error);
    return { value };
  },
  async delete(k) {
    const { error } = await supabase.from("kv").delete().eq("key", k);
    if (error) console.error("storage.delete", error);
    return { deleted: true };
  },
};
