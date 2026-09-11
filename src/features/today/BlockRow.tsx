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
        'relative flex items-start gap-3 border-b border-dashed px-3 py-2.5 transition-colors duration-200',
        'border-[color-mix(in_oklab,var(--color-rule)_55%,transparent)]',
        state === 'current'
          ? 'border-l-[3px] border-l-ochre bg-[color-mix(in_oklab,var(--color-ochre-wash)_55%,transparent)]'
          : 'border-l-[3px] border-l-transparent',
        checked ? 'bg-[color-mix(in_oklab,var(--color-done-wash)_35%,transparent)]' : '',
      ].join(' ')}
    >
      {state === 'current' ? (
        <span
          aria-hidden="true"
          className="absolute top-[1.1rem] left-[4.1rem] size-[7px] rotate-45 bg-ochre"
        />
      ) : null}

      <time
        className={[
          'w-[3.25rem] shrink-0 pt-[0.2rem] font-mono text-[0.75rem] tnum',
          missed ? 'text-terracotta' : state === 'current' ? 'text-ink' : 'text-ink-faint',
        ].join(' ')}
      >
        {fromMinutes(block.start)}
      </time>

      <div className="min-w-0 flex-1">
        <p
          className={[
            'text-[0.9375rem] leading-snug',
            state === 'current' ? 'font-semibold text-ink' : 'text-ink',
            checked ? 'text-ink-faint line-through decoration-done decoration-1' : '',
          ].join(' ')}
        >
          {title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-faint">
          <span>{t(`category.${block.category}` as TranslationKey)}</span>
          <span aria-hidden="true">·</span>
          <span className="tnum">
            {formatDuration(block.end - block.start, { hour: t('unit.hour'), min: t('unit.min') })}
          </span>
          {block.isCore ? <span className="text-ochre">{t('today.minimum')}</span> : null}
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
