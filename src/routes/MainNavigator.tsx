// src/routes/MainNavigator.tsx
import { useEffect, useState } from 'react';
import AppShell, { AppTab } from '../components/AppShell';
import TodayPage from '../pages/TodayPage';
import MatchesPage from '../pages/MatchesPage';
import MessagesPage from '../pages/MessagesPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import AdminPage from '../pages/AdminPage';
import { supabase } from '../lib/supabase';

type Props = {
  onSignOut: () => void;
  initialTab?: AppTab;
};

export function MainNavigator({ onSignOut, initialTab = 'today' }: Props) {
  const [activeTab, setActiveTab] = useState<AppTab>(initialTab);
  const [openConversationWith, setOpenConversationWith] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    supabase.rpc('is_super_admin').then(({ data, error }) => setShowAdmin(!error && data === true));
  }, []);

  const openConversation = (userId: string) => {
    setOpenConversationWith(userId);
    setActiveTab('messages');
  };

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab} showAdmin={showAdmin}>
      {activeTab === 'today' && <TodayPage onOpenConversation={openConversation} />}
      {activeTab === 'matches' && <MatchesPage onOpenConversation={openConversation} />}
      {activeTab === 'messages' && (
        <MessagesPage
          openConversationWith={openConversationWith}
          onClearOpen={() => setOpenConversationWith(null)}
        />
      )}
      {activeTab === 'profile' && <ProfilePage onSignOut={onSignOut} />}
      {activeTab === 'settings' && <SettingsPage />}
      {activeTab === 'admin' && showAdmin && <AdminPage onMessageUser={openConversation} />}
    </AppShell>
  );
}
