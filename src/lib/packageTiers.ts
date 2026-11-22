import { StudioPackage } from '@/src/types/studio';

export type PackageTier = 'Essential' | 'Signature' | 'Premium';

export interface TierInfo {
  tier: PackageTier;
  sortOrder: number;
  badgeLabel: string;
  badgeClass: string;
}

export function getPackageTierInfo(pkgOrOrder?: StudioPackage | number | null): TierInfo {
  const order =
    typeof pkgOrOrder === 'number'
      ? pkgOrOrder
      : (pkgOrOrder?.sortOrder ?? 2);

  if (order === 1) {
    return {
      tier: 'Essential',
      sortOrder: 1,
      badgeLabel: 'Essential',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    };
  }
  if (order === 3) {
    return {
      tier: 'Premium',
      sortOrder: 3,
      badgeLabel: 'Premium',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    };
  }
  return {
    tier: 'Signature',
    sortOrder: 2,
    badgeLabel: 'Signature',
    badgeClass: 'bg-[#C5B378]/20 text-[#D8C78E] border-[#C5B378]/40',
  };
}
