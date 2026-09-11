/** Страница итогов сезона в картинку: SVG собирается вручную и переносится на canvas. */
export interface SeasonImageData {
  title: string;
  period: string;
  lines: { label: string; value: string }[];
  ranks: { name: string; grade: string }[];
  footer: string;
}

const WIDTH = 1080;
const HEIGHT = 1350;
const PAPER = '#f6f2e8';
const INK = '#1f3a68';
const FAINT = '#8b94a8';
const TERRACOTTA = '#a8452f';

function escape(text: string): string {
  return text.replace(
    /[<>&]/g,
    (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[char] ?? char,
  );
}

function buildSvg(data: SeasonImageData): string {
  const grid: string[] = [];
  for (let x = 60; x < WIDTH; x += 60) {
    grid.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${HEIGHT}" stroke="#c3cfe0" stroke-width="1"/>`,
    );
  }
  for (let y = 60; y < HEIGHT; y += 60) {
    grid.push(`<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}" stroke="#c3cfe0" stroke-width="1"/>`);
  }

  const lines = data.lines
    .map(
      (line, index) => `
        <text x="80" y="${520 + index * 74}" font-family="system-ui, sans-serif" font-size="30" fill="${FAINT}">${escape(line.label)}</text>
        <text x="${WIDTH - 80}" y="${520 + index * 74}" text-anchor="end" font-family="ui-monospace, monospace" font-size="38" fill="${INK}">${escape(line.value)}</text>
        <line x1="80" y1="${540 + index * 74}" x2="${WIDTH - 80}" y2="${540 + index * 74}" stroke="#c3cfe0" stroke-width="1" stroke-dasharray="4 6"/>`,
    )
    .join('');

  const ranks = data.ranks
    .map(
      (rank, index) => `
        <g transform="translate(${90 + (index % 3) * 320}, ${900 + Math.floor(index / 3) * 130}) rotate(-3)">
          <rect x="0" y="0" width="270" height="92" fill="none" stroke="${TERRACOTTA}" stroke-width="3"/>
          <rect x="6" y="6" width="258" height="80" fill="none" stroke="${TERRACOTTA}" stroke-width="1"/>
          <text x="135" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="${INK}">${escape(rank.name)}</text>
          <text x="135" y="74" text-anchor="middle" font-family="ui-monospace, monospace" font-size="26" fill="${TERRACOTTA}">${escape(rank.grade)}</text>
        </g>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
  <g opacity="0.5">${grid.join('')}</g>
  <rect x="140" y="0" width="4" height="${HEIGHT}" fill="${TERRACOTTA}" opacity="0.5"/>
  <text x="80" y="180" font-family="system-ui, sans-serif" font-size="72" font-weight="700" fill="${INK}">${escape(data.title)}</text>
  <text x="80" y="240" font-family="ui-monospace, monospace" font-size="30" fill="${FAINT}">${escape(data.period)}</text>
  ${lines}
  ${ranks}
  <text x="80" y="${HEIGHT - 60}" font-family="ui-monospace, monospace" font-size="24" fill="${FAINT}">${escape(data.footer)}</text>
</svg>`;
}

/** Рисует SVG на canvas и отдаёт PNG файлом. */
export async function saveSeasonImage(data: SeasonImageData, fileName: string): Promise<void> {
  const svg = buildSvg(data);
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const image = new Image();
  image.decoding = 'sync';
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('svg'));
    image.src = source;
  });

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas');
  context.drawImage(image, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('png');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
