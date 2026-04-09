import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { ChatWidget } from "@/components/chat/ChatWidget";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "משתמש";
  const avatarUrl = user?.user_metadata?.avatar_url || null;

  return (
    <AppShell userName={displayName} avatarUrl={avatarUrl}>
      {children}
      <ChatWidget />
    </AppShell>
  );
}
