import type { Block } from '../../types';
import type { TranslationKey } from '../../i18n';
import { blockTitle } from '../../domain/blockTitle';
import { formatDuration, fromMinutes } from '../../domain/time';
import { Checkbox } from '../../components/ui/Checkbox';
import { useApp } from '../../state/app-context';

export type RowState = 'past' | 'current' | 'future';

/** Блоки, которые нет смысла подсвечивать как «провалено». */
const PASSIVE = new Set(['rest', 'free', 'sleep', 'commute', 'school', 'routine']);

export function BlockRow({
  block,
  state,
  checked,
  onToggle,
  action,
}: {
  block: Block;
  state: RowState;
  checked: boolean;
  onToggle: () => void;
  action?: React.JSX.Element;
}): React.JSX.Element {
  const { t } = useApp();
  const title = blockTitle(block, t);
  const missed = state === 'past' && !checked && !PASSIVE.has(block.category);

  return (
    <li
      className={[
        'relative flex items-start gap-3 border-b border-rule px-4 py-3 transition-colors duration-200',
        state === 'current' ? 'bg-ochre-wash' : '',
        checked ? 'bg-[color-mix(in_oklab,var(--color-done-wash)_60%,transparent)]' : '',
      ].join(' ')}
    >
      <time
        className={[
          'w-[3.25rem] shrink-0 pt-[0.2rem] font-display text-[0.8125rem] tnum',
          missed ? 'text-terracotta' : state === 'current' ? 'text-ochre-deep' : 'text-ink-faint',
        ].join(' ')}
      >
        {fromMinutes(block.start)}
      </time>

      <div className="min-w-0 flex-1">
        <p
          className={[
            'text-[1rem] leading-snug',
            state === 'current' ? 'font-display font-extrabold text-ink' : 'text-ink',
            checked ? 'text-ink-faint line-through decoration-done decoration-1' : '',
          ].join(' ')}
        >
          {title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.8125rem] text-ink-faint">
          <span>{t(`category.${block.category}` as TranslationKey)}</span>
          <span aria-hidden="true">·</span>
          <span className="tnum">
            {formatDuration(block.end - block.start, { hour: t('unit.hour'), min: t('unit.min') })}
          </span>
          {block.isCore ? (
            <span className="rounded-full bg-ochre-wash px-2 py-0.5 text-[0.6875rem] font-bold text-ochre-deep">
              {t('today.minimum')}
            </span>
          ) : null}
        </p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>

      <Checkbox
        checked={checked}
        onChange={onToggle}
        label={checked ? t('today.markUndone') : t('today.markDone')}
      />
    </li>
  );
}
