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
const PAPER = '#f7f8fa';
const CARD = '#ffffff';
const INK = '#1b2333';
const FAINT = '#8b93a3';
const BLUE = '#3d7bf7';
const AMBER = '#f2a33c';

function escape(text: string): string {
  return text.replace(
    /[<>&]/g,
    (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[char] ?? char,
  );
}

function buildSvg(data: SeasonImageData): string {
  const card = `<rect x="40" y="380" width="${WIDTH - 80}" height="${data.lines.length * 74 + 60}" rx="36" fill="${CARD}" stroke="#e6e9ef"/>`;

  const lines = data.lines
    .map(
      (line, index) => `
        <text x="120" y="${520 + index * 74}" font-family="system-ui, sans-serif" font-size="30" fill="${FAINT}">${escape(line.label)}</text>
        <text x="${WIDTH - 120}" y="${520 + index * 74}" text-anchor="end" font-family="system-ui, sans-serif" font-weight="800" font-size="36" fill="${INK}">${escape(line.value)}</text>
        <line x1="80" y1="${544 + index * 74}" x2="${WIDTH - 80}" y2="${544 + index * 74}" stroke="#e6e9ef" stroke-width="2"/>`,
    )
    .join('');

  const ranks = data.ranks
    .map(
      (rank, index) => `
        <g transform="translate(${140 + (index % 4) * 220}, ${data.lines.length * 74 + 540 + Math.floor(index / 4) * 150})">
          <path d="M-22 30l-8 44 14-8 16 12 4-44z" fill="${BLUE}" opacity="0.7"/>
          <path d="M22 30l8 44-14-8-16 12-4-44z" fill="${BLUE}" opacity="0.7"/>
          <circle cx="0" cy="0" r="40" fill="${AMBER}"/>
          <circle cx="0" cy="0" r="30" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="3"/>
          <text x="0" y="8" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="22" fill="#fff">${escape(rank.grade)}</text>
          <text x="0" y="104" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" fill="${INK}">${escape(rank.name)}</text>
        </g>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
  ${card}
  <text x="80" y="180" font-family="system-ui, sans-serif" font-size="72" font-weight="800" fill="${INK}">${escape(data.title)}</text>
  <text x="80" y="240" font-family="system-ui, sans-serif" font-size="30" fill="${FAINT}">${escape(data.period)}</text>
  ${lines}
  ${ranks}
  <text x="80" y="${HEIGHT - 60}" font-family="system-ui, sans-serif" font-size="24" fill="${FAINT}">${escape(data.footer)}</text>
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
