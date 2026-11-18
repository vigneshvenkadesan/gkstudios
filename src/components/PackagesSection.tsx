'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useStudio } from '@/src/context/StudioContext';
import { StudioPackage } from '@/src/types/studio';
import { formatINR } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';

interface PackagesSectionProps {
  selectedPackageId: string;
  onSelectPackage: (pkg: StudioPackage) => void;
}

export function PackagesSection({ selectedPackageId, onSelectPackage }: PackagesSectionProps) {
  const { packages } = useStudio();

  return (
    <section id="packages" className="bg-[#092E2B] py-16 sm:py-20 border-b border-[#C5B378]/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#D8C78E]">
              TRANSPARENT COLLECTIONS
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Photography &amp; 4K Videography Packages
            </h2>
            <p className="text-base text-[#E6ECEB]/80">
              Every collection includes full color grading, archival Karizma album craftsmanship,
              and complete raw footage handover. Select a package to pre-fill your date inquiry.
            </p>
          </div>
          <p className="text-xs sm:text-sm text-[#D8C78E]">
            Custom multi-day quotes available on request
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((pkg) => {
            const isSelected = selectedPackageId === pkg.id;
            return (
              <Card
                key={pkg.id}
                className={`flex flex-col justify-between transition-colors ${
                  pkg.highlighted || isSelected
                    ? 'border-[#D8C78E] bg-[#114A45]'
                    : 'border-[#C5B378]/25 bg-[#0E423E]'
                }`}
              >
                <div>
                  <CardHeader className="space-y-2 pb-4">
                    <p className="text-xs font-medium text-[#D8C78E]">{pkg.audience}</p>
                    <CardTitle className="text-xl text-white">{pkg.name}</CardTitle>
                    <div className="pt-2 flex items-baseline gap-2">
                      <span className="font-mono text-3xl font-bold text-white tabular-nums">
                        {formatINR(pkg.price)}
                      </span>
                      <span className="text-xs text-[#E6ECEB]/70">starting</span>
                    </div>
                    <p className="text-xs text-[#E6ECEB]/75">{pkg.duration}</p>
                  </CardHeader>

                  <CardContent className="border-t border-[#C5B378]/15 pt-5">
                    <ul className="space-y-3">
                      {pkg.deliverables.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-[#E6ECEB]/90">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D8C78E]" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>

                <CardFooter className="pt-4">
                  <Button
                    className="w-full"
                    variant={pkg.highlighted || isSelected ? 'default' : 'outline'}
                    onClick={() => onSelectPackage(pkg)}
                  >
                    {isSelected ? 'Selected — Complete Inquiry' : 'Select Package'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
