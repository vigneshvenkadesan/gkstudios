export interface CeremonyPhotoPool {
  keywords: string[];
  photos: string[];
}

export const CURATED_STUDIO_PHOTOS = {
  iyerWedding: '/images/portfolio/iyer_wedding_muhurtham_1794972484653.jpg',
  templeWedding: '/images/portfolio/temple_wedding_gopuram_1794972485937.jpg',
  multifaithWedding: '/images/portfolio/multifaith_south_wedding_1794972486248.jpg',
  outdoorCouple: '/images/portfolio/outdoor_couple_shoot_1794972488329.jpg',
  kaathuKuthi: '/images/portfolio/kaathu_kuthi_ceremony_1794972491963.jpg',
  birthday: '/images/portfolio/birthday_milestone_celebration_1794972489472.jpg',
  traditionalStage: '/images/guide/traditional-photo-stage.jpg',
  candidEmotion: '/images/guide/candid-photo-emotion.jpg',
  outdoorSunset: '/images/guide/outdoor-couple-sunset.jpg',
  droneMandapam: '/images/guide/drone-aerial-mandapam.jpg',
  droneProcession: '/images/guide/drone-aerial-procession.jpg',
  ledWall: '/images/guide/led-wall-hall.jpg',
  albumSpread: '/images/guide/album-spread-panoramic.jpg',
  albumVelvet: '/images/guide/album-cover-velvet.jpg',
  albumAcrylic: '/images/guide/album-acrylic-box.jpg',
  cinemaReel: '/images/guide/candid-cinema-reel.jpg',
  cinemaGimbal: '/images/guide/candid-cinema-gimbal.jpg',
  traditionalVideo: '/images/guide/traditional-video-camcorder.jpg',
} as const;

const CEREMONY_PHOTO_POOLS: CeremonyPhotoPool[] = [
  {
    keywords: ['wedding', 'muhurtham', 'marriage', 'kalyanam', 'bridal'],
    photos: [
      CURATED_STUDIO_PHOTOS.iyerWedding,
      CURATED_STUDIO_PHOTOS.templeWedding,
      CURATED_STUDIO_PHOTOS.multifaithWedding,
      CURATED_STUDIO_PHOTOS.droneMandapam,
    ],
  },
  {
    keywords: ['reception', 'sangeet', 'haldi', 'mehndi', 'dinner'],
    photos: [
      CURATED_STUDIO_PHOTOS.ledWall,
      CURATED_STUDIO_PHOTOS.cinemaGimbal,
      CURATED_STUDIO_PHOTOS.traditionalStage,
      CURATED_STUDIO_PHOTOS.droneProcession,
    ],
  },
  {
    keywords: ['engagement', 'betrothal', 'ring', 'nichayathartham'],
    photos: [
      CURATED_STUDIO_PHOTOS.candidEmotion,
      CURATED_STUDIO_PHOTOS.outdoorCouple,
      CURATED_STUDIO_PHOTOS.traditionalStage,
      CURATED_STUDIO_PHOTOS.albumVelvet,
    ],
  },
  {
    keywords: ['outdoor', 'pre-wedding', 'post-wedding', 'couple', 'maternity', 'portrait'],
    photos: [
      CURATED_STUDIO_PHOTOS.outdoorCouple,
      CURATED_STUDIO_PHOTOS.outdoorSunset,
      CURATED_STUDIO_PHOTOS.candidEmotion,
      CURATED_STUDIO_PHOTOS.cinemaReel,
    ],
  },
  {
    keywords: ['puberty', 'half saree', 'ruthu', 'sadanku', 'manjal'],
    photos: [
      CURATED_STUDIO_PHOTOS.kaathuKuthi,
      CURATED_STUDIO_PHOTOS.templeWedding,
      CURATED_STUDIO_PHOTOS.candidEmotion,
      CURATED_STUDIO_PHOTOS.albumSpread,
    ],
  },
  {
    keywords: [
      'ear',
      'kaathu',
      'naming',
      'cradle',
      'baby',
      'seemandham',
      'shower',
      'birthday',
      'first',
      'ayush',
    ],
    photos: [
      CURATED_STUDIO_PHOTOS.birthday,
      CURATED_STUDIO_PHOTOS.kaathuKuthi,
      CURATED_STUDIO_PHOTOS.candidEmotion,
      CURATED_STUDIO_PHOTOS.albumAcrylic,
    ],
  },
  {
    keywords: [
      'house',
      'grihapravesam',
      'corporate',
      'inauguration',
      'anniversary',
      '60th',
      'sashti',
    ],
    photos: [
      CURATED_STUDIO_PHOTOS.droneProcession,
      CURATED_STUDIO_PHOTOS.traditionalStage,
      CURATED_STUDIO_PHOTOS.ledWall,
      CURATED_STUDIO_PHOTOS.multifaithWedding,
    ],
  },
];

const DEFAULT_PHOTO_POOL = [
  CURATED_STUDIO_PHOTOS.iyerWedding,
  CURATED_STUDIO_PHOTOS.templeWedding,
  CURATED_STUDIO_PHOTOS.multifaithWedding,
  CURATED_STUDIO_PHOTOS.outdoorSunset,
];

export interface EventPhotoRef {
  id?: string;
  name?: string;
  category?: string;
}

export interface PortfolioPhotoRef {
  category?: string;
  title?: string;
  imageUrl?: string;
  visible?: boolean;
  isVisible?: boolean;
  featured?: boolean;
}

export function getCeremonyPhotoPool(event?: EventPhotoRef): string[] {
  const haystack = `${event?.id || ''} ${event?.name || ''} ${event?.category || ''}`.toLowerCase();
  const matched = CEREMONY_PHOTO_POOLS.find((entry) =>
    entry.keywords.some((keyword) => haystack.includes(keyword))
  );
  return matched ? matched.photos : DEFAULT_PHOTO_POOL;
}

export function resolveEventPhoto(
  event?: EventPhotoRef,
  portfolio: PortfolioPhotoRef[] = [],
  indexOffset = 0
): string {
  const haystack = `${event?.id || ''} ${event?.name || ''} ${event?.category || ''}`.toLowerCase();
  const terms = haystack.split(/[^a-z0-9]+/).filter((word) => word.length >= 4);

  const visiblePortfolio = portfolio.filter(
    (item) => item.visible !== false && item.isVisible !== false && Boolean(item.imageUrl)
  );
  const portfolioMatch = visiblePortfolio.find((item) => {
    const itemMeta = `${item.category || ''} ${item.title || ''}`.toLowerCase();
    return terms.some((term) => itemMeta.includes(term));
  });

  if (portfolioMatch?.imageUrl) {
    return portfolioMatch.imageUrl;
  }

  const pool = getCeremonyPhotoPool(event);
  return pool[indexOffset % pool.length];
}

export function resolveEventBackdropPhoto(
  event: EventPhotoRef | undefined,
  portfolio: PortfolioPhotoRef[] = [],
  matchingPackages: Array<{ imageUrl?: string; image?: string }> = []
): string {
  const pkgHero = matchingPackages.find((item) => Boolean(item.imageUrl || item.image));
  if (pkgHero?.imageUrl || pkgHero?.image) {
    return (pkgHero.imageUrl || pkgHero.image)!;
  }
  return resolveEventPhoto(event, portfolio, 0);
}

export function resolvePackageCardPhoto(
  event: EventPhotoRef | undefined,
  index: number
): string {
  const pool = getCeremonyPhotoPool(event);
  return pool[index % pool.length];
}

export const STUDIO_CRAFT_HIGHLIGHTS = [
  {
    id: 'stills',
    title: 'Editorial Stills & Candids',
    caption: 'Timeless ritual coverage & natural emotions',
    image: CURATED_STUDIO_PHOTOS.traditionalStage,
  },
  {
    id: 'cinema-drone',
    title: '4K Cinema & Aerial Drone',
    caption: 'Stabilized film rigs & mandapam aerial views',
    image: CURATED_STUDIO_PHOTOS.droneMandapam,
  },
  {
    id: 'led-venue',
    title: 'Live Venue LED Walls',
    caption: 'Crisp live feeds for large reception halls',
    image: CURATED_STUDIO_PHOTOS.ledWall,
  },
  {
    id: 'heirloom-albums',
    title: 'Karizma Heirloom Albums',
    caption: 'Velvet, acrylic & panoramic layflat prints',
    image: CURATED_STUDIO_PHOTOS.albumVelvet,
  },
] as const;

export const PROMISE_PROCESS_FRAMES = [
  {
    image: CURATED_STUDIO_PHOTOS.candidEmotion,
    alt: 'Candid bridal and family emotion captured on wedding day',
  },
  {
    image: CURATED_STUDIO_PHOTOS.cinemaGimbal,
    alt: '4K stabilized cinema gimbal filming celebratory wedding rituals',
  },
  {
    image: CURATED_STUDIO_PHOTOS.albumAcrylic,
    alt: 'Handcrafted heirloom wedding photo album in bespoke acrylic keepsake box',
  },
] as const;

export const FOOTER_LOOKBOOK_FRAMES = [
  {
    src: CURATED_STUDIO_PHOTOS.iyerWedding,
    label: 'Sacred Muhurtham',
    category: 'Weddings',
  },
  {
    src: CURATED_STUDIO_PHOTOS.outdoorCouple,
    label: 'Golden Hour Portraits',
    category: 'Portraits & Outdoor Shoots',
  },
  {
    src: CURATED_STUDIO_PHOTOS.kaathuKuthi,
    label: 'Heritage Rites',
    category: 'Traditional Ceremonies',
  },
  {
    src: CURATED_STUDIO_PHOTOS.birthday,
    label: 'Family Milestones',
    category: 'Family Celebrations',
  },
  {
    src: CURATED_STUDIO_PHOTOS.droneProcession,
    label: 'Grand Gatherings',
    category: 'Weddings',
  },
] as const;
