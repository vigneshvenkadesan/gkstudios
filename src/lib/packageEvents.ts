import {
  EVENT_CATEGORY_GROUPS,
  StudioEvent,
  StudioPackage,
} from '@/src/types/studio';

interface LegacyEventMetadata {
  name: string;
  category: string;
  sortOrder: number;
}

const LEGACY_EVENT_METADATA: Record<string, LegacyEventMetadata> = {
  wedding: { name: 'Wedding', category: 'wedding', sortOrder: 1 },
  engagement: { name: 'Engagement', category: 'wedding', sortOrder: 2 },
  reception: { name: 'Wedding Reception', category: 'wedding', sortOrder: 3 },
  'pre-wedding': { name: 'Pre & Post Wedding Shoot', category: 'wedding', sortOrder: 4 },
  'valai-kaapu': { name: 'Maternity Ceremony', category: 'baby-maternity', sortOrder: 5 },
  maternity: { name: 'Maternity Portraits', category: 'baby-maternity', sortOrder: 6 },
  'baby-shower': { name: 'Baby Shower & Welcoming', category: 'baby-maternity', sortOrder: 7 },
  newborn: { name: 'Newborn & Infant Portraits', category: 'baby-maternity', sortOrder: 8 },
  birthday: { name: 'Birthday & Milestone Party', category: 'birthday-kids', sortOrder: 9 },
  'first-birthday': { name: 'First Birthday Celebration', category: 'birthday-kids', sortOrder: 10 },
  'naming-ceremony': { name: 'Naming Ceremony', category: 'birthday-kids', sortOrder: 11 },
  'kaathu-kuthi': { name: 'Ear Piercing', category: 'birthday-kids', sortOrder: 12 },
  'puberty-ceremony': { name: 'Puberty Ceremony', category: 'family-traditional', sortOrder: 13 },
  housewarming: { name: 'Housewarming Ceremony', category: 'family-traditional', sortOrder: 14 },
  upanayanam: { name: 'Sacred Thread Ceremony', category: 'family-traditional', sortOrder: 15 },
  sashtiapthapoorthi: { name: 'Milestone Ceremony', category: 'family-traditional', sortOrder: 16 },
  'corporate-event': { name: 'Corporate & Business Summit', category: 'corporate-business', sortOrder: 17 },
  'commercial-shoot': { name: 'Product & Brand Commercial Shoot', category: 'corporate-business', sortOrder: 18 },
};

function normalizeKey(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function humanizeEventId(eventId: string): string {
  return eventId
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function resolveCategory(eventId: string, packages: StudioPackage[]): string {
  for (const pkg of packages) {
    const category = pkg.category?.trim();
    if (!category) continue;

    const normalizedCategory = normalizeKey(category);
    const matchingGroup = EVENT_CATEGORY_GROUPS.find(
      (group) =>
        normalizeKey(group.id) === normalizedCategory ||
        normalizeKey(group.label) === normalizedCategory
    );
    if (matchingGroup) return matchingGroup.id;
  }

  const legacyCategory = LEGACY_EVENT_METADATA[eventId.toLowerCase()]?.category;
  if (legacyCategory) return legacyCategory;

  const explicitCategory = packages.find(
    (pkg) =>
      pkg.category?.trim() &&
      normalizeKey(pkg.category) !== normalizeKey(eventId)
  )?.category;
  return explicitCategory?.trim() || 'wedding';
}

export function getPackageEvents(
  packages: StudioPackage[],
  options: { includeInactive?: boolean; category?: string } = {}
): StudioEvent[] {
  const eventPackages = new Map<string, StudioPackage[]>();

  packages.forEach((pkg) => {
    if (!options.includeInactive && (pkg.status ?? 'active') === 'inactive') return;

    const id = pkg.eventId?.trim() || 'wedding';
    const grouped = eventPackages.get(id) || [];
    grouped.push(pkg);
    eventPackages.set(id, grouped);
  });

  return Array.from(eventPackages.entries())
    .map(([id, groupedPackages]) => {
      const legacy = LEGACY_EVENT_METADATA[id.toLowerCase()];
      const status: StudioEvent['status'] = groupedPackages.some(
        (pkg) => (pkg.status ?? 'active') === 'active'
      )
        ? 'active'
        : 'inactive';
      const orderedValues = groupedPackages
        .map((pkg) => pkg.eventSortOrder)
        .filter((order): order is number => Number.isFinite(order) && order > 0);

      return {
        id,
        name: legacy?.name || humanizeEventId(id),
        category: resolveCategory(id, groupedPackages),
        status,
        sortOrder: orderedValues.length
          ? Math.min(...orderedValues)
          : legacy?.sortOrder ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .filter((event) => {
      if (!options.category) return true;
      return normalizeKey(event.category) === normalizeKey(options.category);
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}
