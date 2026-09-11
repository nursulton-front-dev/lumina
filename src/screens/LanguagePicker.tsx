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
      <p className="font-display text-[0.8125rem] font-extrabold tracking-[0.08em] text-blue uppercase">
        {dict['app.name']}
      </p>
      <h1 className="mt-2 text-[clamp(2rem,9vw,2.75rem)] leading-[1.05] text-ink">
        {dict['lang.pick.title']}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-ink-faint">{dict['lang.pick.hint']}</p>

      <ul className="mt-8 flex flex-col gap-2.5">
        {LANGS.map((code) => (
          <li key={code}>
            <button
              type="button"
              onClick={() => onChoose(code)}
              className="group flex w-full min-h-[60px] items-center justify-between gap-3 rounded-[var(--radius-card)] border-2 border-rule bg-raised px-5 py-4 text-left font-display text-[1.125rem] font-bold text-ink shadow-[0_4px_0_0_var(--color-rule)] transition-[transform,box-shadow] duration-150 hover:border-blue active:translate-y-[4px] active:shadow-none"
            >
              <span>{dictionaries[code][`lang.${code}`]}</span>
              <span className="text-[0.75rem] font-extrabold tracking-[0.1em] text-ink-faint uppercase group-hover:text-blue">
                {code}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
