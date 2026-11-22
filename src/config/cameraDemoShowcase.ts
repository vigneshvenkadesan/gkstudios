export interface ShowcaseMediaItem {
  id: string;
  type: 'image' | 'video' | 'pdf';
  title: string;
  thumbnailUrl: string;
  mediaUrl: string; // Full-res image URL, MP4/YouTube/Vimeo embed URL, or sample Album PDF URL
  caption?: string; // Short 1-line demo note
  aspectRatio?: '16:9' | '2.39:1' | '9:16' | '4:3' | '1:1';
  details?: {
    resolution?: string;
    fps?: string;
    audioNote?: string;
    deliveryFormat?: string;
    timecode?: string;
    spreadsCount?: number;
    pagesCount?: number;
    dimensions?: string;
  };
}

export interface CameraCrewDemoItem {
  id: string;
  enTitle: string;
  taSubtitle: string;
  shortTagline: string; // 3–5 word collapsed preview
  description: string; // Collapsed by default; expands on tap
  badge?: string; // e.g. "Essential Base" | "Signature Style" | "Cinema 4K"
  bestFor?: string;
  media: ShowcaseMediaItem[]; // Multiple photos, videos, or album PDFs
}

export const CAMERA_CREW_DEMO_ITEMS: CameraCrewDemoItem[] = [
  {
    id: 'traditional-photo',
    enTitle: 'Traditional Photography',
    taSubtitle: 'பாரம்பரியப் புகைப்படம்',
    shortTagline: 'Every Sacred Ritual & Every Family Guest',
    description:
      'Ensures every sacred blessing, holy thali tying, and family stage portrait is captured with crisp, balanced lighting and direct eye contact—so no elder, relative, or arriving guest is missed in your keepsake album.',
    badge: 'Essential Base',
    bestFor: 'Stage group portraits, thali tying, garland exchange, elder blessings & complete guest attendance archive',
    media: [
      {
        id: 'trad-stage-group',
        type: 'image',
        title: 'Grand Stage Family Portrait',
        thumbnailUrl: '/images/guide/traditional-photo-stage.jpg',
        mediaUrl: '/images/guide/traditional-photo-stage.jpg',
        caption: 'Even, bright illumination across the entire family with crystal-clear focus from front to back rows.',
        aspectRatio: '16:9',
        details: {
          resolution: 'High-Res Print Master',
          dimensions: 'Ultra-Sharp Stage Archive',
        },
      },
      {
        id: 'trad-muhurtham-ritual',
        type: 'image',
        title: 'Sacred Mangalya Dharanam Ritual',
        thumbnailUrl: '/images/portfolio/iyer_wedding_muhurtham_1794972484653.jpg',
        mediaUrl: '/images/portfolio/iyer_wedding_muhurtham_1794972484653.jpg',
        caption: 'Auspicious thali tying moment with bright, clean framing capturing all elders and family blessings.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Print Ready High-Res',
          dimensions: 'Keepsake Family Memory',
        },
      },
      {
        id: 'trad-garlands-stage',
        type: 'image',
        title: 'Garland Exchange & Blessings',
        thumbnailUrl: '/images/portfolio/multifaith_south_wedding_1794972486248.jpg',
        mediaUrl: '/images/portfolio/multifaith_south_wedding_1794972486248.jpg',
        caption: 'Stage rituals, flower shower, and cheerful family attendance captured in high clarity.',
        aspectRatio: '16:9',
        details: {
          resolution: 'High-Res Print File',
          dimensions: 'Stage Ceremony Documentation',
        },
      },
    ],
  },
  {
    id: 'candid-photo',
    enTitle: 'Candid Photography',
    taSubtitle: 'கேன்டிட் புகைப்படம்',
    shortTagline: 'Unscripted Emotions & Magazine Portraits',
    description:
      'Captures spontaneous tears of joy, stolen glances, playful laughter, and elegant couple portraits with soft dreamy backgrounds without interrupting sacred ceremonies.',
    badge: 'Signature Style',
    bestFor: 'Tears of joy during vidai, laughing candid moments, couple chemistry & delicate jewelry details',
    media: [
      {
        id: 'candid-bride-tears',
        type: 'image',
        title: 'Heartfelt Tears & Joy of the Bride',
        thumbnailUrl: '/images/guide/candid-photo-emotion.jpg',
        mediaUrl: '/images/guide/candid-photo-emotion.jpg',
        caption: 'Soft, cinematic natural background focus—pure authentic emotion captured without posed interruption.',
        aspectRatio: '16:9',
        details: {
          resolution: 'High-Resolution Art Master',
          dimensions: 'Magazine Editorial Quality',
        },
      },
      {
        id: 'candid-couple-chemistry',
        type: 'image',
        title: 'Unscripted Golden Hour Chemistry',
        thumbnailUrl: '/images/portfolio/outdoor_couple_shoot_1794972488329.jpg',
        mediaUrl: '/images/portfolio/outdoor_couple_shoot_1794972488329.jpg',
        caption: 'Natural, unposed romantic connection framed against warm South Indian architecture.',
        aspectRatio: '16:9',
        details: {
          resolution: 'High-Resolution Master File',
          dimensions: 'Hero Wall Art Enlargeable',
        },
      },
      {
        id: 'candid-celebration-details',
        type: 'image',
        title: 'Intimate Ceremony & Decor Details',
        thumbnailUrl: '/images/portfolio/birthday_milestone_celebration_1794972489472.jpg',
        mediaUrl: '/images/portfolio/birthday_milestone_celebration_1794972489472.jpg',
        caption: 'Delicate jasmine flower strings, sacred kumkum, and golden silks caught in warm ambient lighting.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Fine Art Macro Detail',
          dimensions: 'Album Accent Spread',
        },
      },
    ],
  },
  {
    id: 'traditional-video',
    enTitle: 'Traditional Video (Full Ceremony)',
    taSubtitle: 'பாரம்பரிய வீடியோ',
    shortTagline: 'Complete Chronological Ceremony Archive',
    description:
      'Continuous, uninterrupted Full HD recording of the entire ceremony with crystal-clear audio so family members abroad and future generations can re-live every mantra, speech, and greeting on their living room TV.',
    badge: 'Full Archive',
    bestFor: 'Complete ritual recording, stage speeches, welcoming entries & TV playback for family abroad',
    media: [
      {
        id: 'trad-video-camcorder-rig',
        type: 'video',
        title: 'Uninterrupted Stage Ceremony Coverage',
        thumbnailUrl: '/images/guide/traditional-video-camcorder.jpg',
        mediaUrl: '/images/guide/traditional-video-camcorder.jpg',
        caption: 'Continuous live documentation ensuring every sacred ritual and greeting is archived seamlessly.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Full HD 1080p',
          fps: 'Broadcast Standard Motion',
          audioNote: 'Crystal-Clear Mantra & Stage Audio',
          timecode: 'REC 01:42:15',
          deliveryFormat: 'Complete edited ceremony on USB drive & cloud backup',
        },
      },
      {
        id: 'trad-video-ceremony-playback',
        type: 'video',
        title: 'Full Ceremony Archive & Mantras Playback',
        thumbnailUrl: '/images/portfolio/temple_wedding_gopuram_1794972485937.jpg',
        mediaUrl: '/images/portfolio/temple_wedding_gopuram_1794972485937.jpg',
        caption: 'Uncut chronological recording tailored for living room TV playback with pristine mantra audio.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Full HD 1080p Crystal Clear',
          fps: 'Smooth Uninterrupted Playback',
          audioNote: 'Priest Mantras & Live Ambience',
          timecode: '02:15:30 Full Video',
          deliveryFormat: 'Pen drive + 10-Year Cloud Storage',
        },
      },
      {
        id: 'trad-video-stage-greetings',
        type: 'video',
        title: 'Stage Greetings & Elder Speeches',
        thumbnailUrl: '/images/portfolio/iyer_wedding_muhurtham_1794972484653.jpg',
        mediaUrl: '/images/portfolio/iyer_wedding_muhurtham_1794972484653.jpg',
        caption: 'All relatives and guests greeting the couple on stage recorded chronologically.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Full HD 1080p',
          fps: 'Continuous Recording',
          audioNote: 'Clear Hall Audio Feed',
          timecode: 'REC 03:04:12',
          deliveryFormat: 'High-Bitrate MP4 Archive',
        },
      },
    ],
  },
  {
    id: 'candid-cinema',
    enTitle: 'Candid Cinematography & Reels',
    taSubtitle: 'சினிமாடிக் வீடியோ & ரீல்ஸ்',
    shortTagline: 'Emotional Movie Trailer & Instagram Reels',
    description:
      'Silky-smooth cinematic gliding shots and dramatic slow motion, color-graded into an emotional 3–5 minute music film trailer plus 60-second vertical reels for Instagram & WhatsApp.',
    badge: 'Cinema 4K',
    bestFor: 'Slow-motion cinematic cuts, musical teaser highlights, story-driven wedding film & social media reels',
    media: [
      {
        id: 'cinema-gimbal-teaser',
        type: 'video',
        title: 'Cinematic Wedding Teaser & Film',
        thumbnailUrl: '/images/guide/candid-cinema-gimbal.jpg',
        mediaUrl: '/images/guide/candid-cinema-gimbal.jpg',
        caption: 'Widescreen cinematic framing with silky-smooth gliding motion and emotive color grading.',
        aspectRatio: '2.39:1',
        details: {
          resolution: 'Cinema 4K UHD',
          fps: 'Cinematic Slow Motion',
          audioNote: 'Custom Instrumental Soundtrack + Vows Voiceover',
          timecode: '03:45 Wedding Film Trailer',
          deliveryFormat: 'Master 4K Video + Web Streaming Link',
        },
      },
      {
        id: 'cinema-vertical-reel',
        type: 'video',
        title: 'Vertical Highlight Reel for Instagram & WhatsApp',
        thumbnailUrl: '/images/guide/candid-cinema-reel.jpg',
        mediaUrl: '/images/guide/candid-cinema-reel.jpg',
        caption: 'Fast-paced, emotive 9:16 vertical cuts formatted specifically for viral social media sharing.',
        aspectRatio: '9:16',
        details: {
          resolution: '4K Vertical Ultra HD',
          fps: 'Ultra-Smooth Motion',
          audioNote: 'Trending Audio Teaser Sync',
          timecode: '00:58 Vertical Reel',
          deliveryFormat: 'Instagram Reel & WhatsApp Ready MP4',
        },
      },
      {
        id: 'cinema-slowmo-emotions',
        type: 'video',
        title: 'Slow-Motion Garland Exchange & Smiles',
        thumbnailUrl: '/images/guide/candid-photo-emotion.jpg',
        mediaUrl: '/images/guide/candid-photo-emotion.jpg',
        caption: 'Flower petals floating in dramatic slow motion as the couple exchanges playful, joyful smiles.',
        aspectRatio: '2.39:1',
        details: {
          resolution: 'Cinema 4K Slow-Motion',
          fps: 'Dramatic Emotional Pace',
          audioNote: 'Atmospheric Reverb & Temple Chants',
          timecode: '01:15 Slow-Mo Cut',
          deliveryFormat: 'Integrated in Master Wedding Teaser',
        },
      },
    ],
  },
  {
    id: 'drone-aerial',
    enTitle: 'Drone Aerial Coverage',
    taSubtitle: 'ட்ரோன் வான்வழிப் படப்பிடிப்பு',
    shortTagline: 'Grand Venue Architecture & Celebration Scale',
    description:
      "Sweeping bird's-eye views revealing majestic Dravidian temple gopurams, grand arrival processions, illuminated wedding halls, and the breathtaking scale of your gathering.",
    badge: 'Grand Scale',
    bestFor: 'Temple gopurams, outdoor mandapam arrivals, car processions & sweeping guest views',
    media: [
      {
        id: 'drone-mandapam-gopuram',
        type: 'video',
        title: 'Bird’s-Eye Mandapam & Gopuram Flyover',
        thumbnailUrl: '/images/guide/drone-aerial-mandapam.jpg',
        mediaUrl: '/images/guide/drone-aerial-mandapam.jpg',
        caption: 'Majestic bird’s-eye perspective showcasing venue scale, grand temple architecture, and floral entrance.',
        aspectRatio: '16:9',
        details: {
          resolution: '4K Aerial Ultra HD',
          fps: 'Cinematic Flight Motion',
          audioNote: 'Ambient Temple Bells & Procession Beats',
          timecode: 'ALT 48m · 4K AERIAL',
          deliveryFormat: 'Raw 4K flight footage + integrated film cuts',
        },
      },
      {
        id: 'drone-procession-entry',
        type: 'video',
        title: 'Grand Baraat / Car Procession from Above',
        thumbnailUrl: '/images/guide/drone-aerial-procession.jpg',
        mediaUrl: '/images/guide/drone-aerial-procession.jpg',
        caption: 'Sweeping flyover capturing the arriving wedding motorcade and vibrant celebratory crowds.',
        aspectRatio: '16:9',
        details: {
          resolution: '4K High Dynamic Range',
          fps: 'Smooth Panoramic Flyover',
          audioNote: 'Procession Nadaswaram Sync',
          timecode: 'ALT 35m · PROCESSION',
          deliveryFormat: 'High-Res Cinematic Drone Cut',
        },
      },
      {
        id: 'drone-venue-dusk',
        type: 'video',
        title: 'Illuminated Mandapam Grounds at Twilight',
        thumbnailUrl: '/images/portfolio/temple_wedding_gopuram_1794972485937.jpg',
        mediaUrl: '/images/portfolio/temple_wedding_gopuram_1794972485937.jpg',
        caption: 'Golden dusk aerial illumination of the mandapam architecture impossible from ground angles.',
        aspectRatio: '16:9',
        details: {
          resolution: '4K Twilight Flight',
          fps: 'Cinematic Twilight Flight',
          audioNote: 'Evening Sky Ambience',
          timecode: 'ALT 60m · TWILIGHT',
          deliveryFormat: 'Stunning Opener for Master Film',
        },
      },
    ],
  },
  {
    id: 'printed-albums',
    enTitle: 'Printed Albums & Spreads',
    taSubtitle: 'புகைப்பட ஆல்பம் & கவர்',
    shortTagline: 'Heirloom Velvet, Acrylic & Lay-Flat Spreads',
    description:
      'Handcrafted panoramic seamless lay-flat photo books on tear-proof archival photographic paper, paired with personalized royal velvet or crystal acrylic glass covers and wooden keepsake boxes.',
    badge: 'Heirloom Print',
    bestFor: 'Living room centerpiece heirloom, multigenerational keepsake, and touch-and-feel luxury memories',
    media: [
      {
        id: 'album-velvet-foil-cover',
        type: 'image',
        title: 'Emerald Velvet & Gold Foil Heirloom Cover',
        thumbnailUrl: '/images/guide/album-cover-velvet.jpg',
        mediaUrl: '/images/guide/album-cover-velvet.jpg',
        caption: 'Deep royal velvet cover with personalized gold foil calligraphy and brass protective corners.',
        aspectRatio: '16:9',
        details: {
          dimensions: '18×24 Inch / 12×18 Inch',
          pagesCount: 60,
          spreadsCount: 30,
          deliveryFormat: 'Handcrafted Velvet Heirloom Book',
        },
      },
      {
        id: 'album-panoramic-layflat-spread',
        type: 'pdf',
        title: 'Seamless Panoramic Lay-Flat Spreads',
        thumbnailUrl: '/images/guide/album-spread-panoramic.jpg',
        mediaUrl: '/images/guide/album-spread-panoramic.jpg',
        caption: '100% borderless panoramic lay-flat spread with zero center cut line across couple portraits.',
        aspectRatio: '16:9',
        details: {
          dimensions: 'Panoramic Open Spread View',
          pagesCount: 60,
          spreadsCount: 30,
          deliveryFormat: 'Archival Matte Tear-Proof Photographic Paper',
        },
      },
      {
        id: 'album-acrylic-luxury-box',
        type: 'image',
        title: 'Crystal Acrylic Glass Cover & Luxury Box',
        thumbnailUrl: '/images/guide/album-acrylic-box.jpg',
        mediaUrl: '/images/guide/album-acrylic-box.jpg',
        caption: 'High-gloss diamond acrylic glass faceplate paired with handcrafted wooden presentation box.',
        aspectRatio: '16:9',
        details: {
          dimensions: 'Ultra-Gloss Acrylic Faceplate',
          pagesCount: 60,
          spreadsCount: 30,
          deliveryFormat: 'Hardwood Keepsake Box + Silk Ribbon Pull',
        },
      },
    ],
  },
  {
    id: 'led-wall',
    enTitle: 'Live LED Wall',
    taSubtitle: 'நேரடி எல்.ஈ.டி திரை',
    shortTagline: 'Everyone Sees Every Sacred Ritual Live',
    description:
      'Ultra-bright stage broadcast across dining and hall seating rows, ensuring elderly relatives witness the thali tying with razor-sharp clarity without stage crowding.',
    badge: 'Live Broadcast',
    bestFor: 'Large wedding halls with 300+ guests where the mandapam stage is far from back seating',
    media: [
      {
        id: 'led-wall-stage-broadcast',
        type: 'video',
        title: 'Stage Live Multi-Camera Broadcast',
        thumbnailUrl: '/images/guide/led-wall-hall.jpg',
        mediaUrl: '/images/guide/led-wall-hall.jpg',
        caption: 'Real-time zero latency feed so guests in every corner see the sacred thali tying in high definition.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Ultra-Bright Broadcast Clarity',
          fps: 'Real-Time Low Latency (0.01s)',
          audioNote: 'Hall PA System Balanced Audio',
          timecode: 'LIVE MULTI-CAM FEED',
          deliveryFormat: 'Onsite Live Video Screen Setup',
        },
      },
      {
        id: 'led-wall-dining-crowd',
        type: 'image',
        title: 'Dining Hall Guest Live Stream',
        thumbnailUrl: '/images/guide/led-wall-hall.jpg',
        mediaUrl: '/images/guide/led-wall-hall.jpg',
        caption: 'Banquet and dining area screens enable elders to enjoy the feast without missing any stage ritual.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Stage Feed Extension',
          dimensions: 'Auxiliary Banquet Screen',
        },
      },
      {
        id: 'led-wall-switcher-console',
        type: 'image',
        title: 'Multi-Angle Live Stage Production',
        thumbnailUrl: '/images/guide/traditional-photo-stage.jpg',
        mediaUrl: '/images/guide/traditional-photo-stage.jpg',
        caption: 'Live production switching between wide stage coverage, sacred ritual close-ups, and family reactions.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Multi-Angle Live Mixing',
          dimensions: 'Complete Stage Ritual Production',
        },
      },
    ],
  },
  {
    id: 'outdoor-shoot',
    enTitle: 'Outdoor Couple Shoot',
    taSubtitle: 'வெளிப்புற ஜோடி படப்பிடிப்பு',
    shortTagline: 'Pre/Post-Wedding Romance & Sunset Frames',
    description:
      'Scenic location photography at beach shores, temple lakes, and royal heritage pillars capturing timeless romantic chemistry before or after your wedding day.',
    badge: 'Couple Special',
    bestFor: 'Pre-wedding invitations, reception stage welcome displays, and couple chemistry in silk & casuals',
    media: [
      {
        id: 'outdoor-sunset-golden',
        type: 'image',
        title: 'Sunset Golden Hour Beach Romance',
        thumbnailUrl: '/images/guide/outdoor-couple-sunset.jpg',
        mediaUrl: '/images/guide/outdoor-couple-sunset.jpg',
        caption: 'Warm golden sunset framing couple silhouettes with gentle ocean reflections.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Ultra-High Resolution Art Master',
          dimensions: 'Hero Canvas Print File',
        },
      },
      {
        id: 'outdoor-temple-pillars',
        type: 'image',
        title: 'Ancient Heritage Mandapam Pillars',
        thumbnailUrl: '/images/portfolio/outdoor_couple_shoot_1794972488329.jpg',
        mediaUrl: '/images/portfolio/outdoor_couple_shoot_1794972488329.jpg',
        caption: 'Dravidian carved stone pillars creating an eternal, regal frame for South Indian couple silk attire.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Master Portrait File',
          dimensions: 'Regal South Indian Architecture',
        },
      },
      {
        id: 'outdoor-editorial-romance',
        type: 'image',
        title: 'Intimate Storytelling & Welcoming Frames',
        thumbnailUrl: '/images/portfolio/multifaith_south_wedding_1794972486248.jpg',
        mediaUrl: '/images/portfolio/multifaith_south_wedding_1794972486248.jpg',
        caption: 'Magazine-style couple portraits perfect for reception entry screens and digital invitation covers.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Fine Art Master Quality',
          dimensions: 'Invitation & Welcome Display',
        },
      },
    ],
  },
];
