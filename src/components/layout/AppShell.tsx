import { TopAppBar } from "./TopAppBar";
import { BottomNav } from "./BottomNav";
import { CameraFAB } from "./CameraFAB";
import { OfflineIndicator } from "./OfflineIndicator";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  avatarUrl?: string;
}

export function AppShell({ children, userName, avatarUrl }: AppShellProps) {
  return (
    <>
      <OfflineIndicator />
      <TopAppBar userName={userName} avatarUrl={avatarUrl} />
      <main className="max-w-5xl mx-auto px-6 pt-6 pb-32 space-y-8">
        {children}
      </main>
      <CameraFAB />
      <BottomNav />
    </>
  );
}
