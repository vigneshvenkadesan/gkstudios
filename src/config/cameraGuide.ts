export interface VideoMockupDetails {
  aspectRatio: '16:9' | '2.39:1' | '9:16';
  resolution: string;
  fps: string;
  audioNote: string;
  timecode: string;
  sampleVideoTitle: string;
  deliveryFormat: string;
}

export interface CameraTeamMemberGuide {
  id: string;
  title: string;
  tagline: string;
  tamilTitle: string;
  howItLightsUp: string;
  bestFor: string;
  gearUsed: string;
  previewImage: string;
  sampleType: 'photo' | 'candid-photo' | 'traditional-video' | 'cinema-video' | 'drone' | 'led-wall';
  comparisonNote?: string;
  keyDifferences: string[];
  videoMockup?: VideoMockupDetails;
  pairedCounterpartId?: string;
}

export const CAMERA_TEAM_GUIDES: CameraTeamMemberGuide[] = [
  {
    id: 'traditional-photo',
    title: 'Traditional Photography',
    tagline: 'Every Ritual & Every Guest',
    tamilTitle: 'பாரம்பரியப் புகைப்படம் (அனைத்து சடங்குகள் & விருந்தினர்கள்)',
    howItLightsUp:
      'Ensures every blessing on stage, sacred ritual, and family group photo is captured brightly with everyone looking at the camera—so no relative is ever left out of the family album.',
    bestFor: 'Stage group photos, thali tying, garlands exchange, elder blessings & complete attendance archive',
    gearUsed: 'Full-frame cameras with on-camera TTL flash, diffusion softboxes & 24-70mm f/2.8 zoom lenses',
    previewImage: '/images/guide/traditional-photo-stage.jpg',
    sampleType: 'photo',
    pairedCounterpartId: 'candid-photo',
    comparisonNote:
      'Traditional photography uses crisp, even lighting and direct eye-contact poses so grandparents and extended families can be clearly identified in albums.',
    keyDifferences: [
      'Subject looks directly at the lens with formal smile',
      'Even flash lighting across the entire group without harsh shadows',
      'Deep depth of field keeps both front and back rows razor sharp',
      'Essential for family keepsake albums & elder identification',
    ],
  },
  {
    id: 'candid-photo',
    title: 'Candid Photography',
    tagline: 'Unscripted Emotions & Magazine Portraits',
    tamilTitle: 'கேண்டிட் புகைப்படம் (இயற்கையான உணர்வுகள் & போர்ட்ரெய்ட்ஸ்)',
    howItLightsUp:
      'Captures natural laughter, emotional tears, stolen glances, and intricate decor details with artistic depth and soft background blur—perfect for wall frames and luxury album covers.',
    bestFor: 'Bride getting ready, tears during vidai, laughing candid moments, couple chemistry & floral decor',
    gearUsed: 'Ultra-fast 35mm, 50mm & 85mm f/1.2 - f/1.4 prime portrait lenses with natural ambient lighting',
    previewImage: '/images/guide/candid-photo-emotion.jpg',
    sampleType: 'candid-photo',
    pairedCounterpartId: 'traditional-photo',
    comparisonNote:
      'While Traditional captures everyone looking at the lens, Candid captures authentic emotion when you are completely lost in the moment without posing.',
    keyDifferences: [
      'Unposed and spontaneous—captured without interrupting the ceremony',
      'Dreamy background blur (bokeh) that isolates the bride and groom',
      'Artistic color grading styled like high-fashion bridal editorials',
      'Signature hero shots for living room wall canvas enlargements',
    ],
  },
  {
    id: 'traditional-video',
    title: 'Traditional Video (Full Ceremony)',
    tagline: 'Your Complete Ceremony Archive',
    tamilTitle: 'முழு நீள வீடியோ பதிவு (சடங்குகளின் ஆவணம்)',
    howItLightsUp:
      'Records the entire event from start to finish in crisp Full HD with clear live audio so elders and out-of-town family can relive every sacred mantra, song, and conversation without cuts.',
    bestFor: 'Complete ritual recording, stage speeches, welcoming entries & playback for family abroad',
    gearUsed: 'Broadcast-grade video camcorders with directional wireless lapel microphones & continuous lighting',
    previewImage: '/images/portfolio/iyer_wedding_muhurtham_1794972484653.jpg',
    sampleType: 'traditional-video',
    pairedCounterpartId: 'candid-cinema',
    comparisonNote:
      'Continuous real-time documentation ensuring no portion of the ceremony or stage reception is skipped.',
    keyDifferences: [
      'Full uninterrupted chronological recording of all rites',
      'Direct microphone audio captures sacred Sanskrit / Tamil mantras',
      '16:9 standard TV viewing format for home living room playback',
      'Ideal for relatives living abroad who could not attend in person',
    ],
    videoMockup: {
      aspectRatio: '16:9',
      resolution: 'Full HD 1080p 50fps',
      fps: '50 FPS Broadcast',
      audioNote: 'Live Ambient & Lapel Mic Mantras',
      timecode: 'REC 01:24:18',
      sampleVideoTitle: 'Full Ceremony Archive & Stage Documentation',
      deliveryFormat: 'Complete edited video on USB drive & cloud archive',
    },
  },
  {
    id: 'candid-cinema',
    title: 'Candid Cinematography & Reels',
    tagline: 'Your Movie Trailer & Instagram Reels',
    tamilTitle: 'சினிமாட்டிக் வீடியோ (திரைப்பட பாணி & ரீல்ஸ்)',
    howItLightsUp:
      'Filmed on cinema 3-axis motorized stabilizers and edited to music into a 3–5 minute emotional highlight film + 60-second vertical Reels ready to share on WhatsApp & Instagram.',
    bestFor: 'Slow-motion cinematic cuts, cinematic music teaser, emotional story-driven film & social media reels',
    gearUsed: 'Sony FX3 cinema cameras on DJI Ronin 3-axis motorized gimbals with 4K 120fps slow-motion',
    previewImage: '/images/guide/candid-photo-emotion.jpg',
    sampleType: 'cinema-video',
    pairedCounterpartId: 'traditional-video',
    comparisonNote:
      'Cinematic films are crafted like high-end movie trailers with color grading, emotive sound design, and drone cuts rather than continuous documentary footage.',
    keyDifferences: [
      'Silky smooth camera motion on 3-axis cinema gimbals',
      '4K 120fps slow motion that dramatizes rice pouring, thali tying & garland throws',
      'Curated musical score and poetic voiceover audio mixing',
      'Includes 9:16 vertical cuts formatted specifically for Instagram & WhatsApp status',
    ],
    videoMockup: {
      aspectRatio: '2.39:1',
      resolution: 'Cinema 4K UHD 120fps',
      fps: '120 FPS Slow Motion',
      audioNote: 'Emotive Instrumental Score + Live Vows & Mantras',
      timecode: '03:42 Cinema Highlight Cut',
      sampleVideoTitle: 'Cinematic 3–5 Min Wedding Trailer & Vertical Reels',
      deliveryFormat: '4K Cinema File + 60s Vertical Social Reels',
    },
  },
  {
    id: 'drone-aerial',
    title: 'Drone Aerial Coverage',
    tagline: 'Grand Venue & Crowd Scale',
    tamilTitle: 'ட்ரோன் வான்வழி படப்பிடிப்பு (மண்டபம் & பிரம்மாண்டம்)',
    howItLightsUp:
      'Sweeping aerial shots of the mandapam/venue, grand baraat or welcoming entries, and bird’s-eye crowd energy that ground cameras simply cannot capture.',
    bestFor: 'Temple gopurams, outdoor mandapam arrivals, car processions & sweeping guest views',
    gearUsed: 'Licensed 4K DJI Aerial Drone with ultra-high dynamic range sensor & omnidirectional obstacle sensing',
    previewImage: '/images/guide/drone-aerial-mandapam.jpg',
    sampleType: 'drone',
    comparisonNote:
      'Adds cinematic production scale and grandeur, revealing the majestic venue architecture and massive attendance.',
    keyDifferences: [
      'Unobstructed bird’s-eye perspective from 30 to 60 meters altitude',
      'Captures grand temple gopurams, coconut groves & wedding hall exterior',
      'Document arrival processions, car entries & fireworks with cinematic motion',
      'Intercut into the cinematic trailer for breathtaking movie-like scale',
    ],
    videoMockup: {
      aspectRatio: '16:9',
      resolution: '4K Aerial 60fps',
      fps: '60 FPS Smooth Flight',
      audioNote: 'Ambient Temple Bells & Procession Beats',
      timecode: 'ALT 48m · 4K AERIAL',
      sampleVideoTitle: 'Sweeping Bird’s-Eye Mandapam & Gopuram Flyover',
      deliveryFormat: 'Raw 4K flight footage + integrated highlight trailer cuts',
    },
  },
  {
    id: 'led-wall',
    title: 'Live LED Wall Setup',
    tagline: 'Everyone Sees Every Ritual Live',
    tamilTitle: 'லைவ் எல்இடி திரை அமைப்பு (நேரலை ஒளிபரப்பு)',
    howItLightsUp:
      'Streams close-up stage rituals live to the entire hall so guests seated in the back feel right in the front row without crowding around the stage.',
    bestFor: 'Large wedding halls with 300+ guests where the mandapam stage is far from back seating',
    gearUsed: 'High-brightness P2.9 Indoor LED Wall panel with multi-camera live video mixer setup',
    previewImage: '/images/guide/led-wall-hall.jpg',
    sampleType: 'led-wall',
    comparisonNote:
      'Prevents stage congestion by giving every dining and banquet guest an unobstructed, razor-sharp view of the thali tying.',
    keyDifferences: [
      'Real-time low-latency video broadcast from stage cameras to large screens',
      'Enables elders and families in dining or back rows to witness the thali tying clearly',
      'Keeps the mandapam stage peaceful and prevents guests crowding around the priests',
      'Customized border with couple’s names, wedding logo & auspicious motifs',
    ],
    videoMockup: {
      aspectRatio: '16:9',
      resolution: 'Live P2.9 Ultra-Bright Display',
      fps: 'Live Real-time Low Latency',
      audioNote: 'Hall PA System Sync',
      timecode: 'LIVE MULTI-CAM FEED',
      sampleVideoTitle: 'Live Multi-Camera Stage Broadcast',
      deliveryFormat: 'Live onsite production with technical video switcher operator',
    },
  },
];
