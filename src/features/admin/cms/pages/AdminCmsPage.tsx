// src/features/admin/cms/pages/AdminCmsPage.tsx

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import CmsContentList from '../components/CmsContentList';
import CmsEditor from '../components/CmsEditor';
import CmsFilters from '../components/CmsFilters';
import CmsHistory from '../components/CmsHistory';
import { useCms } from '../hooks/useCms';
import type { CmsContent } from '../types/cms.types';

type Props = {
  onBack: () => void;
};

export default function AdminCmsPage({ onBack }: Props) {
  const {
    loading,
    error,
    content,
    allContent,
    filters,
    setFilters,
    save,
    toggle,
  } = useCms();

  const [selected, setSelected] =
    useState<CmsContent | null>(null);

  async function handleToggle(item: CmsContent) {
    await toggle(item);

    if (selected?.id === item.id) {
      setSelected(current =>
        current
          ? { ...current, is_active: !current.is_active }
          : null,
      );
    }
  }

  async function handleSave(
    item: Parameters<typeof save>[0],
  ) {
    await save(item);
    setSelected(null);
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Admin overview"
            className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Admin
            </p>

            <h1 className="mt-1 text-3xl font-semibold text-slate-900">
              Content Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage platform text, templates and system content.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelected(null)}
          className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700"
        >
          New content
        </button>
      </header>

      <CmsFilters
        content={allContent}
        filters={filters}
        onChange={setFilters}
      />

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading content…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="max-h-[75vh] overflow-y-auto pr-1">
            <CmsContentList
              content={content}
              selectedId={selected?.id}
              onSelect={setSelected}
              onToggle={handleToggle}
            />
          </section>

          <section className="space-y-6">
            <CmsEditor
              item={selected}
              onSave={handleSave}
            />

            <CmsHistory item={selected} />
          </section>
        </div>
      )}
    </main>
  );
}