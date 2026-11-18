import React from 'react';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { buildWhatsAppUrl } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';

export function StudioAboutSection() {
  const whatsappHref = buildWhatsAppUrl(
    STUDIO_INFO.phone,
    'Vanakkam GK Studios! We would like to discuss photography & videography for our upcoming family ceremony.'
  );

  return (
    <section
      id="studio-story"
      className="bg-[#072421] py-16 sm:py-20 border-b border-[#C5B378]/20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Studio Brand Visual Showcase using attached official studio cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-[#C5B378]/30 bg-[#092E2B]">
              <img
                src="/assets/aistudio/image_777005f0.png"
                alt="GK STUDIOS — Creating Memories official studio emblem"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-xl border border-[#C5B378]/25 bg-[#092E2B]">
                <img
                  src="/assets/aistudio/image_42fcb044.png"
                  alt="G Krishna — Professional Photographer studio card"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center rounded-xl border border-[#C5B378]/20 bg-[#0E423E] p-4 space-y-2">
                <p className="text-xs font-semibold tracking-[0.16em] text-[#D8C78E]">
                  STUDIO DESK
                </p>
                <p className="text-base font-semibold text-white">
                  {STUDIO_INFO.leadPhotographer}
                </p>
                <p className="text-xs text-[#E6ECEB]/75 leading-relaxed">
                  {STUDIO_INFO.leadRole} · Available for on-location consultations across Tamil
                  Nadu.
                </p>
              </div>
            </div>
          </div>

          {/* Right Editorial Narrative & Direct Contact */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#D8C78E]">
                OUR CRAFT &amp; HERITAGE
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Documenting Sacred South Indian Traditions With Quiet Precision
              </h2>
              <p className="text-base leading-relaxed text-[#E6ECEB]/85">
                Based along <strong className="font-semibold text-white">{STUDIO_INFO.address}</strong>,
                GK Studios brings together documentary patience and contemporary 4K cinema craft.
                Led by <strong className="font-semibold text-white">{STUDIO_INFO.leadPhotographer}</strong>,
                our crew understands the cadence of every ritual—from pre-dawn temple Nadaswaram
                and Iyer Oonjal verses to intimate Kaathu Kuthi blessings and multi-faith wedding
                celebrations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-y border-[#C5B378]/20 py-5 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-[#D8C78E]">Studio Phone</p>
                <a
                  href={`tel:+91${STUDIO_INFO.phone}`}
                  className="inline-flex items-center gap-1.5 font-mono tabular-nums font-medium text-white hover:text-[#D8C78E]"
                >
                  <Phone className="h-3.5 w-3.5 text-[#D8C78E]" />
                  {STUDIO_INFO.phoneFormatted}
                </a>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[#D8C78E]">Studio Email</p>
                <a
                  href={`mailto:${STUDIO_INFO.email}`}
                  className="inline-flex items-center gap-1.5 font-medium text-white hover:text-[#D8C78E] break-all"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[#D8C78E]" />
                  {STUDIO_INFO.email}
                </a>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[#D8C78E]">Studio Address</p>
                <p className="inline-flex items-center gap-1.5 font-medium text-white">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#D8C78E]" />
                  {STUDIO_INFO.addressShort}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a href={`tel:+91${STUDIO_INFO.phone}`}>
                <Button variant="default">
                  <Phone className="h-4 w-4" />
                  Call {STUDIO_INFO.phone}
                </Button>
              </a>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
