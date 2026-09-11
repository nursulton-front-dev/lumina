import { useEffect, useState } from 'react';
import type { TranslationKey } from '../../i18n';
import { GRADES, type Grade } from '../../data/ranks';
import type { RankView } from '../../state/useGamification';
import { useApp } from '../../state/app-context';

/** Цвет медали по ступени: юношеские — синий, взрослые — янтарь, мастерские — зелёный. */
function medalTone(grade: Grade): { fill: string; deep: string } {
  const index = GRADES.indexOf(grade);
  if (index <= 2) return { fill: 'var(--color-blue)', deep: 'var(--color-blue-deep)' };
  if (index <= 5) return { fill: 'var(--color-ochre)', deep: 'var(--color-ochre-deep)' };
  return { fill: 'var(--color-done)', deep: 'var(--color-done-deep)' };
}

/** Круглая медаль с лентой. */
export function Medal({
  grade,
  fresh = false,
  size = 56,
}: {
  grade: Grade;
  /** Разряд только что взят — медаль появляется с пружиной. */
  fresh?: boolean;
  size?: number;
}): React.JSX.Element {
  const { t } = useApp();
  const tone = medalTone(grade);
  return (
    <svg
      viewBox="0 0 64 72"
      width={size}
      height={(size * 72) / 64}
      className={fresh ? 'animate-[medal_250ms_ease-out_both]' : ''}
      role="img"
      aria-label={t(`grade.${grade}` as TranslationKey)}
    >
      <path d="M20 40 14 70l10-5 8 6 3-30z" fill={tone.deep} />
      <path d="M44 40l6 30-10-5-8 6-3-30z" fill={tone.deep} />
      <circle cx="32" cy="28" r="24" fill={tone.fill} />
      <circle
        cx="32"
        cy="28"
        r="18"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="2.5"
      />
      <text
        x="32"
        y="33"
        textAnchor="middle"
        fontFamily="Nunito Variable, system-ui, sans-serif"
        fontWeight="800"
        fontSize="13"
        fill="#fff"
      >
        {t(`grade.short.${grade}` as TranslationKey)}
      </text>
    </svg>
  );
}

export function RankCard({
  rank,
  fresh,
  extra,
}: {
  rank: RankView;
  fresh: boolean;
  /** Ручные счётчики для составных направлений. */
  extra?: React.JSX.Element;
}): React.JSX.Element {
  const { t } = useApp();
  const { spec, status } = rank;
  const [showFresh, setShowFresh] = useState(fresh);

  useEffect(() => {
    if (!fresh) return;
    const id = window.setTimeout(() => setShowFresh(false), 1200);
    return () => window.clearTimeout(id);
  }, [fresh]);

  return (
    <li className="flex flex-col gap-2.5 border-b border-rule px-5 py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[1rem] font-bold text-ink">
            {t(`rank.${spec.id}` as TranslationKey)}
          </p>
          <p className="font-display text-[0.8125rem] tnum text-ink-faint">
            {rank.hasData ? status.value : '—'}
            {rank.hasData && status.second !== null ? ` / ${status.second}` : ''}
            {status.grade ? (
              <span className="ml-2 font-sans font-normal text-ink-soft">
                {t(`grade.${status.grade}` as TranslationKey)}
              </span>
            ) : null}
          </p>
        </div>
        {status.grade ? (
          <Medal grade={status.grade} fresh={showFresh} size={48} />
        ) : (
          <span className="grid size-12 place-items-center rounded-full border-2 border-dashed border-rule text-[0.6875rem] font-extrabold text-ink-faint uppercase">
            —
          </span>
        )}
      </div>

      {status.next ? (
        <div>
          <p className="text-[0.8125rem] tnum text-ink-soft">
            {t('ranks.toNext', {
              grade: t(`grade.${status.next.grade}` as TranslationKey),
              value: status.next.value,
            })}
            {status.next.second
              ? ` ${t('ranks.toNextSecond', { second: status.next.second })}`
              : ''}
          </p>
          <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full rounded-full bg-blue transition-[width] duration-300 ease-out"
              style={{ width: `${(rank.hasData ? status.share : 0) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {extra}
    </li>
  );
}
