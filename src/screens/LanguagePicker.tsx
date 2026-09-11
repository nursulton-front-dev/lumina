import type { Lang } from '../types';
import { dictionaries, LANGS } from '../i18n';

/**
 * Первый и единственный экран настройки: язык тетради.
 * Каждая кнопка подписана на своём языке, поэтому выбор не зависит от угадывания.
 */
export function LanguagePicker({
  lang,
  onChoose,
}: {
  lang: Lang;
  onChoose: (lang: Lang) => void;
}): React.JSX.Element {
  const dict = dictionaries[lang];

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ink-faint">
        {dict['app.name']}
      </p>
      <h1 className="mt-2 text-[clamp(2rem,9vw,2.75rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-ink">
        {dict['lang.pick.title']}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-ink-faint">{dict['lang.pick.hint']}</p>

      <ul className="mt-8 flex flex-col gap-2.5">
        {LANGS.map((code) => (
          <li key={code}>
            <button
              type="button"
              onClick={() => onChoose(code)}
              className="group flex w-full items-baseline justify-between gap-3 border border-rule bg-[color-mix(in_oklab,var(--color-raised)_75%,transparent)] px-4 py-4 text-left transition-all duration-150 ease-[var(--ease-paper)] hover:-translate-y-px hover:border-ink hover:shadow-[3px_3px_0_0_var(--color-rule)] active:translate-y-0 active:shadow-none"
            >
              <span className="text-[1.125rem] text-ink">{dictionaries[code][`lang.${code}`]}</span>
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint group-hover:text-ochre">
                {code}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
