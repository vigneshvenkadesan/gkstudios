const TAMIL_TEXT = /[\u0B80-\u0BFF]/;
const TAMIL_CHARACTERS = /[\u0B80-\u0BFF]+/g;
const TRANSLITERATED_NAMES =
  '(?:nitchayathartham|nichayathartham|nischayathartham|seemantham|valai\\s*kaapu|ayush\\s*homam|thottil|kaathu\\s*kuthi|manjal\\s*neerattu|griha\\s*pravesam|muhurtham)';

const ENGLISH_EVENT_NAMES: Record<string, string> = {
  'valai kaapu': 'Maternity Ceremony',
  seemantham: 'Maternity Ceremony',
  upanayanam: 'Sacred Thread Ceremony',
  sashtiapthapoorthi: 'Milestone Ceremony',
};

export function englishOnlyName(value?: string | null): string {
  if (!value) return '';

  let name = value.trim();
  const hasTamilText = TAMIL_TEXT.test(name);

  name = name
    .replace(
      new RegExp(`\\s*\\/\\s*${TRANSLITERATED_NAMES}\\b[^•·]*`, 'gi'),
      ''
    )
    .replace(
      new RegExp(`\\s*\\(\\s*${TRANSLITERATED_NAMES}\\b[^)]*\\)`, 'gi'),
      ''
    );

  if (hasTamilText) {
    name = name.replace(/\s*[•·]\s*[\u0B80-\u0BFF].*$/, '');
    name = name.replace(/\([^)]*[\u0B80-\u0BFF][^)]*\)/g, '');
  }

  name = name
    .replace(TAMIL_CHARACTERS, ' ')
    .replace(/\(\s*\)/g, ' ')
    .replace(/[•·]+/g, ' ')
    .replace(/\s*[/|]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return ENGLISH_EVENT_NAMES[name.toLowerCase()] || name;
}
