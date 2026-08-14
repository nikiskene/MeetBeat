import { type ReactNode, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Palette,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageHeader from '../shared/components/PageHeader';
import CommunityMap, {
  type CommunityPoint,
  type LocationCoverage,
} from '../features/admin/components/CommunityMap';
import AdminCmsPage from '../features/admin/cms/pages/AdminCmsPage';
import AdminBroadcastPage from './AdminBroadcastPage';
import AdminDesignPage from './AdminDesignPage';
import AdminModerationPage from './AdminModerationPage';
import AdminSystemHealthPage from './AdminSystemHealthPage';
import AdminUsersPage from './AdminUsersPage';

type Props = { onMessageUser: (userId: string) => void };

type Section =
  | 'users'
  | 'moderation'
  | 'messages'
  | 'health'
  | 'design'
  | 'cms';

type Dashboard = {
  users: {
    total: number;
    new_today: number;
    active_today: number;
    blocked: number;
  };
  activity: {
    matches_today: number;
    messages_today: number;
    reports_total: number;
    reports_today: number;
    blocks_total: number;
  };
  daily_beat: { today: number; failed_jobs: number };
  cases: { open: number; critical: number };
  alerts: { critical_today: number };
  generated_at: string;
};

type LocationSnapshot = {
  coverage: LocationCoverage;
  points: CommunityPoint[];
};

const sections = [
  {
    id: 'users' as const,
    title: 'Users',
    subtitle: 'View and manage registered users.',
    Icon: Users,
  },
  {
    id: 'moderation' as const,
    title: 'Moderation',
    subtitle: 'Review reports, blocks and support cases.',
    Icon: ShieldCheck,
  },
  {
    id: 'messages' as const,
    title: 'Messages',
    subtitle: 'Send announcements and inspect conversations.',
    Icon: MessageSquare,
  },
  {
    id: 'health' as const,
    title: 'System Health',
    navTitle: 'Health',
    subtitle: 'Monitor the health of the BEAT platform.',
    Icon: Activity,
  },
  {
    id: 'design' as const,
    title: 'Design',
    subtitle: 'Manage homepage assets and configuration.',
    Icon: Palette,
  },
  {
    id: 'cms' as const,
    title: 'CMS',
    subtitle: 'Manage platform text, templates and system content.',
    Icon: FileText,
  },
];

export default function AdminPage({ onMessageUser }: Props) {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const goHome = () => setActiveSection(null);

  let content: ReactNode;

  if (activeSection === 'users') {
    content = (
      <AdminUsersPage onBack={goHome} onMessageUser={onMessageUser} />
    );
  } else if (activeSection === 'moderation') {
    content = (
      <AdminModerationPage
        onBack={goHome}
        onOpenConversation={onMessageUser}
      />
    );
  } else if (activeSection === 'messages') {
    content = <AdminBroadcastPage onBack={goHome} />;
  } else if (activeSection === 'health') {
    content = <AdminSystemHealthPage onBack={goHome} />;
  } else if (activeSection === 'design') {
    content = <AdminDesignPage onBack={goHome} />;
  } else if (activeSection === 'cms') {
    content = <AdminCmsPage onBack={goHome} />;
  } else {
    content = <AdminHome onOpen={setActiveSection} />;
  }

  return (
    <div className="min-w-0 space-y-5">
      <nav
        aria-label="Admin sections"
        className="-mx-1 overflow-x-auto overscroll-x-contain px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-max gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={goHome}
            aria-current={activeSection === null ? 'page' : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${
              activeSection === null
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </button>

          {sections.map(({ id, title, navTitle, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              aria-current={activeSection === id ? 'page' : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${
                activeSection === id
                  ? 'bg-pink-600 text-white'
                  : 'text-slate-600 hover:bg-pink-50 hover:text-pink-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {navTitle ?? title}
            </button>
          ))}
        </div>
      </nav>

      {content}
    </div>
  );
}

function AdminHome({ onOpen }: { onOpen: (section: Section) => void }) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [location, setLocation] = useState<LocationSnapshot>({
    coverage: {
      total: 0,
      mapped: 0,
      country_only: 0,
      missing: 0,
      ambiguous: 0,
    },
    points: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([
      supabase.rpc('get_ops_center_dashboard'),
      supabase.rpc('get_admin_location_snapshot'),
    ])
      .then(([dashboardResult, locationResult]) => {
        if (!active) return;
        if (dashboardResult.error) throw dashboardResult.error;
        if (locationResult.error) throw locationResult.error;

        setDashboard(dashboardResult.data as Dashboard);
        setLocation(locationResult.data as LocationSnapshot);
      })
      .catch(err => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load Admin overview.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const metrics = dashboard
    ? [
        {
          label: 'Registered users',
          value: dashboard.users.total,
          detail: `${dashboard.users.new_today} new today`,
          Icon: Users,
          tone: 'text-purple-700 bg-purple-50',
        },
        {
          label: 'Active today',
          value: dashboard.users.active_today,
          detail: 'Based on real sign-ins',
          Icon: Activity,
          tone: 'text-emerald-700 bg-emerald-50',
        },
        {
          label: 'Messages today',
          value: dashboard.activity.messages_today,
          detail: `${dashboard.activity.matches_today} matches today`,
          Icon: MessageSquare,
          tone: 'text-blue-700 bg-blue-50',
        },
        {
          label: 'Open cases',
          value: dashboard.cases.open,
          detail: `${dashboard.cases.critical} critical or urgent`,
          Icon: AlertTriangle,
          tone: dashboard.cases.critical
            ? 'text-red-700 bg-red-50'
            : 'text-amber-700 bg-amber-50',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Live operational overview and production controls."
      />

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading live metrics…
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {dashboard && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, detail, Icon, tone }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span className={`inline-flex rounded-xl p-2 ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-500">
                  {label}
                </p>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{detail}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Operations
              </h2>

              <div className="grid gap-3 sm:grid-cols-2">
                {sections.map(({ id, title, subtitle, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onOpen(id)}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
                  >
                    <span className="mb-3 inline-flex rounded-xl bg-pink-50 p-2 text-pink-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      {subtitle}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <CommunityMap
              points={location.points}
              coverage={location.coverage}
            />
          </div>

          <p className="text-xs text-slate-400">
            Updated{' '}
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(dashboard.generated_at))}
          </p>
        </>
      )}
    </div>
  );
}