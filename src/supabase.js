import { createClient } from "@supabase/supabase-js";

// Publishable key is safe to expose in client code (protected by Row Level Security).
// These fall back to the project values so the app works even before env vars are set.
const url = import.meta.env.VITE_SUPABASE_URL || "https://lhkklgqlgvpmylimyxdo.supabase.co";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_1ZetxxdVnvLWSnFigurocg_mOWPds1C";

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
