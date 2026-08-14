// src/features/admin/cms/components/CmsFilters.tsx

import type {
  CmsContent,
  CmsFiltersState,
} from '../types/cms.types';

type Props = {
  content: CmsContent[];
  filters: CmsFiltersState;
  onChange: (filters: CmsFiltersState) => void;
};

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort();
}

const fieldClassName =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100';

export default function CmsFilters({
  content,
  filters,
  onChange,
}: Props) {
  const namespaces = unique(
    content.map(item => item.namespace),
  );
  const groups = unique(
    content.map(item => item.content_group),
  );
  const locales = unique(
    content.map(item => item.locale),
  );

  function update(
    field: keyof CmsFiltersState,
    value: string,
  ) {
    onChange({
      ...filters,
      [field]: value,
    });
  }

  return (
    <section
      aria-label="Content filters"
      className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Search
        </span>

        <input
          type="search"
          value={filters.search}
          onChange={event =>
            update('search', event.target.value)
          }
          placeholder="Search content"
          className={fieldClassName}
        />
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Namespace
        </span>

        <select
          value={filters.namespace}
          onChange={event =>
            update('namespace', event.target.value)
          }
          className={fieldClassName}
        >
          <option value="">All namespaces</option>

          {namespaces.map(namespace => (
            <option key={namespace} value={namespace}>
              {namespace}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Group
        </span>

        <select
          value={filters.contentGroup}
          onChange={event =>
            update('contentGroup', event.target.value)
          }
          className={fieldClassName}
        >
          <option value="">All groups</option>

          {groups.map(group => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Locale
        </span>

        <select
          value={filters.locale}
          onChange={event =>
            update('locale', event.target.value)
          }
          className={fieldClassName}
        >
          <option value="">All locales</option>

          {locales.map(locale => (
            <option key={locale} value={locale}>
              {locale}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}