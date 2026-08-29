import { AppStateProvider } from '@/src/context/AppStateContext';
import { WorkstationShell } from '@/src/components/WorkstationShell';

export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppStateProvider>
      <WorkstationShell>{children}</WorkstationShell>
    </AppStateProvider>
  );
}
