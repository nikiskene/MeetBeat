// src/components/AppShell.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Zap,
  Heart,
  MessageCircle,
  User,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import LegalFooter from '../features/legal/components/LegalFooter';

const BLACK_LOGO =
  'https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/beatlogo%20blk.png';

export type AppTab =
  | 'today'
  | 'matches'
  | 'messages'
  | 'profile'
  | 'settings'
  | 'admin';

interface AppShellProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: React.ReactNode;
  showAdmin?: boolean;
  onboarding?: boolean;
}

const NAV_ITEMS: {
  tab: AppTab;
  label: string;
  Icon: LucideIcon;
}[] = [
  { tab: 'today', label: 'Today', Icon: Zap },
  { tab: 'matches', label: 'Matches', Icon: Heart },
  { tab: 'messages', label: 'Messages', Icon: MessageCircle },
  { tab: 'profile', label: 'Profile', Icon: User },
  { tab: 'settings', label: 'Settings', Icon: Settings },
  { tab: 'admin', label: 'Admin', Icon: LayoutDashboard },
];

export default function AppShell({
  activeTab,
  onTabChange,
  children,
  showAdmin = false,
  onboarding = false,
}: AppShellProps) {
  const available = showAdmin ? NAV_ITEMS : NAV_ITEMS.filter(item => item.tab !== 'admin');
  const items = onboarding ? available.filter(item => item.tab === 'profile') : available;
  return (
    <div className="flex min-h-screen flex-col bg-[#fdfcf9]">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#e8e0d0] bg-[#fdfcf9]/90 px-6 py-4 backdrop-blur-sm md:px-12">
        <img src={BLACK_LOGO} alt="BEAT" className="h-6" />

        <nav className="hidden items-center gap-1 lg:flex">
          {items.map(({ tab, label, Icon }) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-[#141414] text-[#fdfcf9]'
                  : 'text-[#333333]/60 hover:bg-[#f2ede3] hover:text-[#141414]'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8">
        {children}
        <LegalFooter />
      </main>

      <nav aria-label="Primary" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }} className="fixed bottom-0 left-0 right-0 z-40 grid border-t border-[#e8e0d0] bg-[#fdfcf9]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
        {items.map(({ tab, label, Icon }) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`flex min-w-0 flex-col items-center gap-1 pb-2 pt-3 text-[11px] font-medium transition-colors ${
              activeTab === tab
                ? 'text-[#141414]'
                : 'text-[#333333]/40 hover:text-[#141414]'
            }`}
          >
            <Icon size={19} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
