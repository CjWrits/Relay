import type { Metadata } from 'next';
import './globals.css';
import { RelayProvider } from '@/context/RelayContext';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'RELAY — Evidence-Backed Project Continuity & Intelligent Handover',
  description: 'Reconstructs actual project state from fragmented activity into evidence-backed, permission-aware handovers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <body className="h-full flex text-slate-900 bg-slate-50">
        <RelayProvider>
          <div className="flex w-full h-full min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
              {children}
            </div>
          </div>
        </RelayProvider>
      </body>
    </html>
  );
}
