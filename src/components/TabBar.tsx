import type { TranslationKey } from '../i18n';
import { useT } from '../state/app-context';
import { navigate, type TabName } from '../state/router';

interface Tab {
  name: TabName;
  labelKey: TranslationKey;
  icon: React.JSX.Element;
}

/** Залитые иконки: активный пункт синим, остальные третичным цветом. */
const TABS: Tab[] = [
  {
    name: 'today',
    labelKey: 'nav.today',
    icon: (
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5zM7 8h10v2H7zm0 4h6v2H7z" />
    ),
  },
  {
    name: 'week',
    labelKey: 'nav.week',
    icon: (
      <path d="M6 3h2v2h8V3h2v2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zm-1 7v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8zm2 2h3v3H7zm5 0h3v3h-3z" />
    ),
  },
  {
    name: 'progress',
    labelKey: 'nav.progress',
    icon: (
      <path d="M4 19a1 1 0 0 1 0-2h16a1 1 0 0 1 0 2zM5 14.5l4.2-5.2 3.6 2.9 4.6-6.4 1.6 1.2-5.8 8-3.6-2.9-3 3.7z" />
    ),
  },
  {
    name: 'schedule',
    labelKey: 'nav.schedule',
    icon: (
      <path d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 0 2H5a1 1 0 0 1-1-1zm0 6a1 1 0 0 1 1-1h14a1 1 0 0 1 0 2H5a1 1 0 0 1-1-1zm0 6a1 1 0 0 1 1-1h9a1 1 0 0 1 0 2H5a1 1 0 0 1-1-1z" />
    ),
  },
  {
    name: 'profile',
    labelKey: 'nav.profile',
    icon: (
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm-8 8.2c.6-4 4-6.2 8-6.2s7.4 2.2 8 6.2a1 1 0 0 1-1 .8H5a1 1 0 0 1-1-.8z" />
    ),
  },
];

export function TabBar({ active }: { active: TabName }): React.JSX.Element {
  const t = useT();

  return (
    <nav
      aria-label={t('app.name')}
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-raised"
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
                  'flex w-full flex-col items-center gap-0.5 px-1 pt-2 pb-1.5 transition-colors duration-150',
                  isActive ? 'text-blue' : 'text-ink-faint hover:text-ink-soft',
                ].join(' ')}
              >
                <span
                  className={[
                    'grid h-8 w-12 place-items-center rounded-full transition-colors duration-150',
                    isActive ? 'bg-blue-wash' : '',
                  ].join(' ')}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-6"
                    fill="currentColor"
                    fillRule="evenodd"
                    aria-hidden="true"
                  >
                    {tab.icon}
                  </svg>
                </span>
                <span
                  className={['text-[0.6875rem]', isActive ? 'font-extrabold' : 'font-bold'].join(
                    ' ',
                  )}
                >
                  {t(tab.labelKey)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
