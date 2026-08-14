// src/features/admin/cms/components/CmsEditor.tsx

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type {
  CmsContent,
  CmsContentInput,
} from '../types/cms.types';

type Props = {
  item: CmsContent | null;
  onSave: (item: CmsContentInput) => Promise<void>;
};

const emptyItem: CmsContentInput = {
  content_key: '',
  namespace: 'app',
  content_group: 'general',
  locale: 'en',
  title: null,
  value: '',
  description: null,
  metadata: {},
  content_version: 1,
  is_active: true,
  tags: [],
  platform: 'all',
  sort_order: 0,
};

const fieldClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100';

export default function CmsEditor({ item, onSave }: Props) {
  const [form, setForm] = useState<CmsContentInput>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(item ? { ...item } : { ...emptyItem });
    setError('');
  }, [item]);

  function update<K extends keyof CmsContentInput>(
    key: K,
    value: CmsContentInput[K],
  ) {
    setForm(current => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await onSave(form);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save content.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {item ? 'Edit content' : 'New content'}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {item
            ? 'Update this content entry and its availability.'
            : 'Create a new reusable platform content entry.'}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Content key">
          <input
            value={form.content_key}
            onChange={event =>
              update('content_key', event.target.value)
            }
            placeholder="onboarding.welcome.title"
            required
            className={fieldClassName}
          />
        </Field>

        <Field label="Locale">
          <input
            value={form.locale}
            onChange={event => update('locale', event.target.value)}
            placeholder="en"
            required
            className={fieldClassName}
          />
        </Field>

        <Field label="Namespace">
          <input
            value={form.namespace}
            onChange={event =>
              update('namespace', event.target.value)
            }
            placeholder="app"
            required
            className={fieldClassName}
          />
        </Field>

        <Field label="Content group">
          <input
            value={form.content_group}
            onChange={event =>
              update('content_group', event.target.value)
            }
            placeholder="onboarding"
            required
            className={fieldClassName}
          />
        </Field>
      </div>

      <Field label="Title" optional>
        <input
          value={form.title ?? ''}
          onChange={event =>
            update('title', event.target.value || null)
          }
          placeholder="Internal or display title"
          className={fieldClassName}
        />
      </Field>

      <Field label="Content value">
        <textarea
          value={form.value}
          onChange={event => update('value', event.target.value)}
          placeholder="Enter the content shown to users"
          rows={6}
          required
          className={fieldClassName}
        />
      </Field>

      <Field label="Internal description" optional>
        <textarea
          value={form.description ?? ''}
          onChange={event =>
            update('description', event.target.value || null)
          }
          placeholder="Explain where and how this content is used"
          rows={3}
          className={fieldClassName}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Platform">
          <select
            value={form.platform}
            onChange={event =>
              update('platform', event.target.value)
            }
            className={fieldClassName}
          >
            <option value="all">All platforms</option>
            <option value="web">Web</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
        </Field>

        <Field label="Sort order">
          <input
            type="number"
            value={form.sort_order}
            onChange={event =>
              update('sort_order', Number(event.target.value))
            }
            className={fieldClassName}
          />
        </Field>

        <Field label="Version">
          <input
            type="number"
            min={1}
            value={form.content_version}
            onChange={event =>
              update('content_version', Number(event.target.value))
            }
            className={fieldClassName}
          />
        </Field>
      </div>

      <Field label="Tags" optional>
        <input
          value={form.tags.join(', ')}
          onChange={event =>
            update(
              'tags',
              event.target.value
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean),
            )
          }
          placeholder="onboarding, welcome, headline"
          className={fieldClassName}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={event =>
              update('is_active', event.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
          />
          Active
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save content'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {optional && (
          <span className="ml-1 font-normal normal-case">
            (optional)
          </span>
        )}
      </span>

      {children}
    </label>
  );
}