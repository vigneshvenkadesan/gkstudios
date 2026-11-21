import { StudioPackage } from '../types/studio';

export interface ProposalAddon {
  id: string;
  name: string;
  shortTitle: string;
  tamilName?: string;
  priceDelta: number;
  type: 'add' | 'upgrade' | 'remove';
  description: string;
  badge: string;
  category: 'camera' | 'album' | 'frame' | 'display';
  applicableIf?: (pkg: StudioPackage) => boolean;
}

function hasKeyword(pkg: StudioPackage, keywords: string[]): boolean {
  const check = (str: string) => {
    const l = str.toLowerCase();
    return keywords.some((k) => l.includes(k.toLowerCase()));
  };

  if (Array.isArray(pkg.deliverables)) {
    return pkg.deliverables.some((d) => check(String(d)));
  }

  if (pkg.deliverables && typeof pkg.deliverables === 'object') {
    return Object.values(pkg.deliverables).some((v) => (v ? check(String(v)) : false));
  }

  return false;
}

export const PROPOSAL_ADDONS: ProposalAddon[] = [
  {
    id: 'candid-cinema',
    name: '+ Candid Cinematography & 3-Min Highlight Film',
    shortTitle: 'Candid Cinema & 3-Min Film',
    tamilName: 'கேண்டிட் சினிமா & 3 நிமிட ஹைலைட்ஸ் படம்',
    priceDelta: 12000,
    type: 'add',
    category: 'camera',
    description: 'Cinematic gimbal operator dedicated to slow-mo emotion cuts, teaser & 4K vertical Reels.',
    badge: '+₹12,000',
    applicableIf: (pkg) =>
      !hasKeyword(pkg, ['candid video', 'cinema team', 'gimbal operator', 'cinematic wedding teaser', '4k dual-camera']),
  },
  {
    id: 'drone-aerial',
    name: '+ Drone Aerial Coverage',
    shortTitle: 'Drone Aerial Coverage',
    tamilName: 'ட்ரோன் வான்வழி படப்பிடிப்பு',
    priceDelta: 8000,
    type: 'add',
    category: 'camera',
    description: 'Licensed 4K drone capturing grand venue gopuram arrivals, processions, and bird’s-eye crowd scale.',
    badge: '+₹8,000',
    applicableIf: (pkg) => !hasKeyword(pkg, ['drone', 'aerial']),
  },
  {
    id: 'outdoor-shoot',
    name: '+ Half-Day Pre/Post-Event Outdoor Shoot',
    shortTitle: 'Half-Day Outdoor Shoot',
    tamilName: 'அவுட்டோர் ஜோடி போட்டோஷூட் (அரை நாள்)',
    priceDelta: 10000,
    type: 'add',
    category: 'camera',
    description: 'Unrushed couple portrait session in Kanjeevaram silks or modern attire at a beach, temple, or scenic grove.',
    badge: '+₹10,000',
    applicableIf: (pkg) => !hasKeyword(pkg, ['complimentary half-day outdoor', 'pre-wedding couple shoot']),
  },
  {
    id: 'led-wall',
    name: '+ Live LED Wall Setup',
    shortTitle: 'Live LED Wall',
    tamilName: 'லைவ் எல்இடி திரை நேரலை அமைப்பு',
    priceDelta: 15000,
    type: 'add',
    category: 'display',
    description: 'High-brightness live stage stream across the mandapam so guests in distant seating don’t miss rituals.',
    badge: '+₹15,000',
  },
  {
    id: 'luxury-album',
    name: '+ Upgrade to 50-Sheet (18×24) Luxury Album with Box',
    shortTitle: '50-Sheet (18×24) Luxury Album',
    tamilName: '50-தாள் லக்ஸரி ஆல்பம் மற்றும் பெட்டி',
    priceDelta: 6000,
    type: 'upgrade',
    category: 'album',
    description: 'Oversized metallic/velvet layflat pages with handcrafted acrylic cover and presentation case.',
    badge: '+₹6,000',
    applicableIf: (pkg) =>
      hasKeyword(pkg, ['album', 'karizma', 'layflat']) && !hasKeyword(pkg, ['70-sheet', 'signature velvet']),
  },
  {
    id: 'wall-frame',
    name: '+ Extra 16×24 Wall Frame',
    shortTitle: 'Extra 16×24 Wall Frame',
    tamilName: '16×24 பெரிய சுவர் போட்டோ பிரேம்',
    priceDelta: 2500,
    type: 'add',
    category: 'frame',
    description: 'Museum-grade framed canvas-finish portrait enlargement ready for living room display.',
    badge: '+₹2,500',
  },
  {
    id: 'digital-only',
    name: 'Switch to Digital-Only (Remove Printed Album)',
    shortTitle: 'Digital-Only (No Album)',
    tamilName: 'டிஜிட்டல் மட்டும் (ஆல்பம் வேண்டாம்)',
    priceDelta: -5000,
    type: 'remove',
    category: 'album',
    description: 'Opt out of physical print and receive the full curated high-res digital gallery and cloud drive.',
    badge: '-₹5,000',
    applicableIf: (pkg) => hasKeyword(pkg, ['album', 'karizma', 'book']),
  },
];
