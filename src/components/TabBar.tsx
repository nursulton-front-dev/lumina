import type { TranslationKey } from '../i18n';
import { useT } from '../state/app-context';
import { navigate, type TabName } from '../state/router';

interface Tab {
  name: TabName;
  labelKey: TranslationKey;
  icon: React.JSX.Element;
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 } as const;

const TABS: Tab[] = [
  {
    name: 'today',
    labelKey: 'nav.today',
    icon: (
      <>
        <path d="M4 4h16v16H4z" {...stroke} />
        <path d="M4 9h16M9 4v16" {...stroke} />
      </>
    ),
  },
  {
    name: 'week',
    labelKey: 'nav.week',
    icon: (
      <>
        <path d="M4 5h16v15H4z" {...stroke} />
        <path d="M4 10h16M9.5 10v10M15 10v10" {...stroke} />
      </>
    ),
  },
  {
    name: 'progress',
    labelKey: 'nav.progress',
    icon: (
      <>
        <path d="M4 19h16" {...stroke} />
        <path d="M5 15l4-5 4 3 6-8" {...stroke} />
      </>
    ),
  },
  {
    name: 'schedule',
    labelKey: 'nav.schedule',
    icon: (
      <>
        <path d="M4 6h16M4 12h16M4 18h10" {...stroke} />
        <path d="M4 6v12" {...stroke} />
      </>
    ),
  },
  {
    name: 'profile',
    labelKey: 'nav.profile',
    icon: (
      <>
        <circle cx="12" cy="8.5" r="3.5" {...stroke} />
        <path d="M5 20c1.6-3.6 4-5.4 7-5.4s5.4 1.8 7 5.4" {...stroke} />
      </>
    ),
  },
];

/** Нижняя навигация: корешки закладок в тетради, в зоне большого пальца. */
export function TabBar({ active }: { active: TabName }): React.JSX.Element {
  const t = useT();

  return (
    <nav
      aria-label={t('app.name')}
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-[color-mix(in_oklab,var(--color-paper)_92%,transparent)] backdrop-blur-sm"
    >
      <ul className="mx-auto flex max-w-3xl">
        {TABS.map((tab) => {
          const isActive = tab.name === active;
          return (
            <li key={tab.name} className="flex-1">
              <button
                type="button"
                onClick={() => navigate({ name: tab.name })}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'relative flex w-full flex-col items-center gap-1 px-2 pt-2.5 pb-2 transition-colors duration-150',
                  isActive ? 'text-ink' : 'text-ink-faint hover:text-ink-soft',
                ].join(' ')}
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                  {tab.icon}
                </svg>
                <span className="text-[0.6875rem] tracking-wide">{t(tab.labelKey)}</span>
                <span
                  className={[
                    'absolute inset-x-5 top-0 h-[2px] transition-opacity duration-200',
                    isActive ? 'bg-ochre opacity-100' : 'opacity-0',
                  ].join(' ')}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
