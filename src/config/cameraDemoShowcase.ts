export interface ShowcaseMediaItem {
  id: string;
  type: 'image' | 'video' | 'pdf';
  title: string;
  thumbnailUrl: string;
  mediaUrl: string; // Full-res image URL, MP4/YouTube/Vimeo embed URL, or sample Album PDF URL
  caption?: string; // Short 1-line demo note (e.g., "18×24 Lay-Flat Velvet Finish Cover")
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
  badge?: string; // e.g. "Essential Base" | "Heirloom" | "Cinema 4K"
  gearUsed?: string;
  bestFor?: string;
  media: ShowcaseMediaItem[]; // Multiple photos, videos, or album PDFs
}

export const CAMERA_CREW_DEMO_ITEMS: CameraCrewDemoItem[] = [
  {
    id: 'traditional-photo',
    enTitle: 'Traditional Photography',
    taSubtitle: 'பாரம்பரியப் புகைப்படம்',
    shortTagline: 'Every Ritual & Every Guest',
    description:
      'Ensures every sacred blessing, holy thali tying, and family stage portrait is captured with crisp, even flash lighting and direct eye contact—so no elder or relative is missed in the family keepsake album.',
    badge: 'Essential Base',
    gearUsed: 'Sony A7 IV with on-camera TTL softbox flash & 24-70mm f/2.8 G-Master lenses',
    bestFor: 'Stage group photos, thali tying, garlands exchange, elder blessings & complete attendance archive',
    media: [
      {
        id: 'trad-stage-group',
        type: 'image',
        title: 'Grand Stage Family Portrait',
        thumbnailUrl: '/images/guide/traditional-photo-stage.jpg',
        mediaUrl: '/images/guide/traditional-photo-stage.jpg',
        caption: 'Even flash lighting across the entire family with razor-sharp focus from front to back rows.',
        aspectRatio: '16:9',
        details: {
          resolution: '33 MP High-Res Print File',
          dimensions: 'Ultra-Sharp Stage Archive',
        },
      },
      {
        id: 'trad-muhurtham-ritual',
        type: 'image',
        title: 'Sacred Mangalya Dharanam Ritual',
        thumbnailUrl: '/images/portfolio/iyer_wedding_muhurtham_1794972484653.jpg',
        mediaUrl: '/images/portfolio/iyer_wedding_muhurtham_1794972484653.jpg',
        caption: 'Auspicious thali tying moment with bright, clean exposure capturing all elders and family blessings.',
        aspectRatio: '16:9',
        details: {
          resolution: '33 MP Print Ready',
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
          resolution: '33 MP High-Res Print File',
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
      'Captures unscripted tears of joy, stolen glances, playful laughter, and editorial couple portraits with creamy shallow depth-of-field without interrupting sacred rites.',
    badge: 'Signature Style',
    gearUsed: 'Sony A1 & A7R V with ultra-fast 35mm, 50mm & 85mm f/1.2–f/1.4 prime portrait lenses',
    bestFor: 'Tearful joy during vidai, laughing candid moments, couple chemistry & delicate jewelry details',
    media: [
      {
        id: 'candid-bride-tears',
        type: 'image',
        title: 'Heartfelt Tears & Joy of the Bride',
        thumbnailUrl: '/images/guide/candid-photo-emotion.jpg',
        mediaUrl: '/images/guide/candid-photo-emotion.jpg',
        caption: 'Captured with creamy f/1.4 background bokeh—pure authentic emotion without posed interruption.',
        aspectRatio: '16:9',
        details: {
          resolution: '50 MP Ultra-Detail',
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
          resolution: '50 MP Master RAW',
          dimensions: 'Hero Wall Art Enlargeable',
        },
      },
      {
        id: 'candid-celebration-details',
        type: 'image',
        title: 'Intimate Ceremony & Decor Details',
        thumbnailUrl: '/images/portfolio/birthday_milestone_celebration_1794972489472.jpg',
        mediaUrl: '/images/portfolio/birthday_milestone_celebration_1794972489472.jpg',
        caption: 'Delicate jasmine flower strings, sacred kumkum, and golden silks caught in cinematic light.',
        aspectRatio: '16:9',
        details: {
          resolution: '50 MP Fine Art Macro',
          dimensions: 'Album Accent Spread',
        },
      },
    ],
  },
  {
    id: 'traditional-video',
    enTitle: 'Traditional Video (Full Ceremony)',
    taSubtitle: 'பாரம்பரிய வீடியோ',
    shortTagline: 'Your Complete Ceremony Archive',
    description:
      'Continuous, uninterrupted Full HD broadcast-grade recording of the entire ceremony with directional lapel audio so distant relatives and future generations can re-watch every mantra, speech, and greeting.',
    badge: 'Full Archive',
    gearUsed: 'Broadcast-grade 4K camcorders with Sennheiser wireless lapel microphones & continuous soft lights',
    bestFor: 'Complete ritual recording, stage speeches, welcoming entries & TV playback for family abroad',
    media: [
      {
        id: 'trad-video-camcorder-rig',
        type: 'video',
        title: 'Broadcast Camcorder Continuous Coverage',
        thumbnailUrl: '/images/guide/traditional-video-camcorder.jpg',
        mediaUrl: '/images/guide/traditional-video-camcorder.jpg',
        caption: 'Continuous live documentation on broadcast-grade video rigs with dual-slot audio backup.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Full HD 1080p 50fps',
          fps: '50 FPS Broadcast Standard',
          audioNote: 'Sennheiser Wireless Lapel Mantras',
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
        caption: 'Uncut chronological recording tailored for living room TV playback with crisp mantra audio.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Full HD 1080p Crystal Clear',
          fps: '50 FPS Uninterrupted',
          audioNote: 'Priest Microphone & Live Ambience',
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
          fps: '50 FPS Continuous',
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
    shortTagline: 'Your Movie Trailer & Instagram Reels',
    description:
      'Filmed on 3-axis motorized gimbals in 4K 120fps slow motion, color-graded into a 3–5 minute emotional music film plus 60-second vertical reels for Instagram & WhatsApp.',
    badge: 'Cinema 4K',
    gearUsed: 'Sony FX3 Cinema Line on DJI Ronin motorized gimbals with anamorphic wide glass',
    bestFor: 'Slow-motion cinematic cuts, cinematic music teaser, emotional story-driven film & social media reels',
    media: [
      {
        id: 'cinema-gimbal-teaser',
        type: 'video',
        title: '3-Axis Motorized Gimbal Cinema Trailer',
        thumbnailUrl: '/images/guide/candid-cinema-gimbal.jpg',
        mediaUrl: '/images/guide/candid-cinema-gimbal.jpg',
        caption: '2.39:1 widescreen anamorphic framing with silky motorized gimbal motion and film grade.',
        aspectRatio: '2.39:1',
        details: {
          resolution: 'Cinema 4K UHD 120fps',
          fps: '120 FPS Slow Motion',
          audioNote: 'Custom Instrumental Soundtrack + Vows Voiceover',
          timecode: '03:45 Wedding Film Trailer',
          deliveryFormat: 'Master 4K ProRes + Master Web Stream',
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
          resolution: '4K Vertical (2160×3840)',
          fps: '60 FPS Ultra-Smooth',
          audioNote: 'Trending Audio Teaser Sync',
          timecode: '00:58 Vertical Reel',
          deliveryFormat: 'Instagram Reel & WhatsApp Ready MP4',
        },
      },
      {
        id: 'cinema-slowmo-emotions',
        type: 'video',
        title: '4K 120fps Slow-Motion Garland Drop',
        thumbnailUrl: '/images/guide/candid-photo-emotion.jpg',
        mediaUrl: '/images/guide/candid-photo-emotion.jpg',
        caption: 'Flower petals floating in ultra slow motion as the bride and groom exchange playful smiles.',
        aspectRatio: '2.39:1',
        details: {
          resolution: '4K Slow-Motion 120fps',
          fps: '120 FPS Dramatic Motion',
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
    shortTagline: 'Grand Venue & Crowd Scale',
    description:
      "Sweeping bird's-eye views revealing majestic Dravidian temple gopurams, grand arrival processions, illuminated wedding halls, and the breathtaking scale of your celebrations.",
    badge: 'Grand Scale',
    gearUsed: 'Licensed 4K DJI Drone with omnidirectional obstacle sensing & dual optical zoom',
    bestFor: 'Temple gopurams, outdoor mandapam arrivals, car processions & sweeping guest views',
    media: [
      {
        id: 'drone-mandapam-gopuram',
        type: 'video',
        title: 'Bird’s-Eye Mandapam & Gopuram Flyover',
        thumbnailUrl: '/images/guide/drone-aerial-mandapam.jpg',
        mediaUrl: '/images/guide/drone-aerial-mandapam.jpg',
        caption: 'Majestic bird’s-eye perspective from 50 meters altitude showcasing venue scale and floral entrance.',
        aspectRatio: '16:9',
        details: {
          resolution: '4K Aerial 60fps',
          fps: '60 FPS Cinematic Flight',
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
          fps: '60 FPS Smooth Fly-by',
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
        caption: 'Golden dusk aerial illumination of the mandapam architecture impossible from ground cameras.',
        aspectRatio: '16:9',
        details: {
          resolution: '4K Low-Light Sensor',
          fps: '30 FPS Night Flight',
          audioNote: 'Evening Evening Sky Drone Feed',
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
      'Handcrafted 18×24 panoramic seamless lay-flat photo books on tear-proof Fuji pearl photographic paper, with custom velvet / crystal acrylic glass covers and wooden keepsake boxes.',
    badge: 'Heirloom Print',
    gearUsed: 'Fuji Crystal Archive HD Photographic Paper, Italian Velvet & High-Density Acrylic Glass',
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
        title: '18×24 Seamless Panoramic Lay-Flat Spreads',
        thumbnailUrl: '/images/guide/album-spread-panoramic.jpg',
        mediaUrl: '/images/guide/album-spread-panoramic.jpg',
        caption: '100% borderless panoramic lay-flat spread with zero center cut line across the couple portraits.',
        aspectRatio: '16:9',
        details: {
          dimensions: '36×12 Inch Open Spread View',
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
    shortTagline: 'Everyone Sees Every Ritual Live',
    description:
      'Ultra-bright P2.9 multi-camera live video broadcast across dining and hall back rows, ensuring elderly relatives witness the thali tying with razor-sharp clarity without stage crowding.',
    badge: 'Live Production',
    gearUsed: 'P2.9 Ultra-Bright Indoor LED panels with 4-channel video switcher & SDI stage runs',
    bestFor: 'Large wedding halls with 300+ guests where the mandapam stage is far from back seating',
    media: [
      {
        id: 'led-wall-stage-broadcast',
        type: 'video',
        title: 'Stage P2.9 Live Multi-Camera Broadcast',
        thumbnailUrl: '/images/guide/led-wall-hall.jpg',
        mediaUrl: '/images/guide/led-wall-hall.jpg',
        caption: 'Real-time zero latency feed so guests in every corner see the sacred thali tying in high definition.',
        aspectRatio: '16:9',
        details: {
          resolution: 'P2.9 Ultra-High Brightness',
          fps: 'Real-Time Low Latency (0.01s)',
          audioNote: 'Hall PA System Balanced Audio',
          timecode: 'LIVE MULTI-CAM FEED',
          deliveryFormat: 'Onsite Live Video Mixer Production',
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
          resolution: '1080p Stage Feed Extension',
          dimensions: 'Auxiliary Banquet Screen',
        },
      },
      {
        id: 'led-wall-switcher-console',
        type: 'image',
        title: 'Professional Multi-Camera Switcher Desk',
        thumbnailUrl: '/images/guide/traditional-photo-stage.jpg',
        mediaUrl: '/images/guide/traditional-photo-stage.jpg',
        caption: 'Live video engineer switching between wide stage, priest close-up, and family reactions.',
        aspectRatio: '16:9',
        details: {
          resolution: 'Multi-Camera Switcher Console',
          dimensions: '4-Channel SDI Production',
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
    gearUsed: 'Sony A7R V with 50mm f/1.2 GM prime and portable battery strobe light with diffusion umbrella',
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
          resolution: '61 MP Ultra-High Resolution',
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
          resolution: '61 MP Master Portrait',
          dimensions: 'Regal South Indian Architecture',
        },
      },
      {
        id: 'outdoor-editorial-romance',
        type: 'image',
        title: 'Intimate Storytelling & Welcoming Frames',
        thumbnailUrl: '/images/portfolio/multifaith_south_wedding_1794972486248.jpg',
        mediaUrl: '/images/portfolio/multifaith_south_wedding_1794972486248.jpg',
        caption: 'Magazine-style couple portraits perfect for reception entry LED screens and invitation covers.',
        aspectRatio: '16:9',
        details: {
          resolution: '61 MP Fine Art',
          dimensions: 'Invitation & Welcome Display',
        },
      },
    ],
  },
];
