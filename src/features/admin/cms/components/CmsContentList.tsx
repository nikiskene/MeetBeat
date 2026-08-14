// src/features/admin/cms/components/CmsContentList.tsx

import type { CmsContent } from '../types/cms.types';

type Props = {
  content: CmsContent[];
  selectedId?: string;
  onSelect: (item: CmsContent) => void;
  onToggle: (item: CmsContent) => void;
};

export default function CmsContentList({
  content,
  selectedId,
  onSelect,
  onToggle,
}: Props) {
  if (content.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        No content found.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {content.map(item => {
        const selected = item.id === selectedId;

        return (
          <article
            key={item.id}
            className={`rounded-2xl border p-4 shadow-sm transition ${
              selected
                ? 'border-pink-300 bg-pink-50 ring-2 ring-pink-100'
                : 'border-slate-200 bg-white hover:border-pink-200'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(item)}
              aria-pressed={selected}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-900">
                    {item.content_key}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.namespace} · {item.content_group} · {item.locale}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.is_active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="mt-3 line-clamp-2 break-words text-sm leading-5 text-slate-600">
                {item.value}
              </p>
            </button>

            <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => onToggle(item)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  item.is_active
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {item.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}