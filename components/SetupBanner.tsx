import { hasPublicEnv } from "@/lib/supabase";

export function SetupBanner() {
  if (hasPublicEnv()) return null;
  return (
    <div className="border-b border-gold/30 bg-gold/10 px-5 py-3 text-center text-sm text-gold">
      Connect Supabase to go live. Add env vars from <code>.env.example</code>, then run <code>supabase/schema.sql</code> in the SQL editor.
    </div>
  );
}
