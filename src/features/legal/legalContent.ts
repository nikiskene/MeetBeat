export const COMPANY = {
  name: 'IACy International FZCO',
  address: 'Dubai Airport Free Zone Building 9W Block C Office 523 - 68 9WC 523',
  website: 'https://www.iacy.com',
  email: 'beat@iacy.com',
} as const;

export const LEGAL_EFFECTIVE_DATE = '23 July 2026';

export type LegalPageId = 'legal' | 'privacy' | 'imprint' | 'eula';

export const LEGAL_LINKS: { id: LegalPageId; label: string }[] = [
  { id: 'legal', label: 'Legal' },
  { id: 'privacy', label: 'Privacy & GDPR' },
  { id: 'imprint', label: 'Imprint' },
  { id: 'eula', label: 'EULA' },
];

export function legalPath(id: LegalPageId) {
  return `#/${id}`;
}

export function legalPageFromHash(hash: string): LegalPageId | null {
  const page = hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return LEGAL_LINKS.some(link => link.id === page)
    ? (page as LegalPageId)
    : null;
}
