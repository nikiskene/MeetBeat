import { COMPANY, LEGAL_LINKS, legalPath } from '../legalContent';

type Props = {
  variant?: 'light' | 'dark';
};

export default function LegalFooter({ variant = 'light' }: Props) {
  const dark = variant === 'dark';
  return (
    <footer
      className={`border-t px-6 py-8 md:px-12 ${
        dark
          ? 'border-white/10 bg-[#141414] text-white/50'
          : 'border-[#e8e0d0] bg-[#fdfcf9] text-[#333333]/55'
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <p className={dark ? 'text-white/75' : 'text-[#141414]/75'}>
            © {new Date().getFullYear()} BEAT · {COMPANY.name}
          </p>
          <p className="max-w-xl text-xs leading-relaxed">{COMPANY.address}</p>
        </div>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-3">
          {LEGAL_LINKS.map(link => (
            <a
              key={link.id}
              href={legalPath(link.id)}
              className={`transition-colors ${
                dark ? 'hover:text-white' : 'hover:text-[#141414]'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
