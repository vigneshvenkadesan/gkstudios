import { EventCategory, StudioPackage } from '@/src/types/studio';

export type PublicLocale = 'en' | 'ta';
export type PublicTheme = 'dark' | 'light';

const translations = {
  'nav.home': { en: 'Home', ta: 'முகப்பு' },
  'nav.work': { en: 'Our Work', ta: 'எங்கள் படைப்புகள்' },
  'nav.packages': { en: 'Packages', ta: 'தொகுப்புகள்' },
  'nav.about': { en: 'About', ta: 'எங்களைப் பற்றி' },
  'nav.contact': { en: 'Contact', ta: 'தொடர்பு' },
  'nav.checkAvailability': { en: 'Check Availability', ta: 'தேதியைச் சரிபார்க்கவும்' },
  'nav.openMenu': { en: 'Open navigation menu', ta: 'வழிசெலுத்தல் பட்டியைத் திறக்கவும்' },
  'nav.closeMenu': { en: 'Close navigation menu', ta: 'வழிசெலுத்தல் பட்டியை மூடவும்' },
  'nav.switchToLight': { en: 'Switch to light mode', ta: 'ஒளி பயன்முறைக்கு மாற்றவும்' },
  'nav.switchToDark': { en: 'Switch to dark mode', ta: 'இருள் பயன்முறைக்கு மாற்றவும்' },
  'nav.language': { en: 'Language', ta: 'மொழி' },
  'nav.primary': { en: 'Primary navigation', ta: 'முதன்மை வழிசெலுத்தல்' },
  'nav.mobile': { en: 'Mobile navigation', ta: 'கைபேசி வழிசெலுத்தல்' },
  'hero.heading': { en: 'Creating Memories', ta: 'நினைவுகளை உருவாக்குகிறோம்' },
  'hero.subtitle': {
    en: 'Timeless Wedding Photography & Cinematic Films.',
    ta: 'காலம் கடந்தும் நிலைக்கும் திருமணப் புகைப்படங்களும் திரைக்காவியங்களும்.',
  },
  'hero.explore': { en: 'Explore Stories', ta: 'கதைகளைக் காணுங்கள்' },
  'hero.scroll': { en: 'Scroll', ta: 'கீழே காண்க' },
  'hero.previous': { en: 'Previous hero photograph', ta: 'முந்தைய முகப்புப் படம்' },
  'hero.next': { en: 'Next hero photograph', ta: 'அடுத்த முகப்புப் படம்' },
  'portfolio.eyebrow': { en: 'THE ART OF CELEBRATION', ta: 'கொண்டாட்டக் கலையின் அழகு' },
  'portfolio.heading': { en: 'Stories Worth Remembering.', ta: 'நினைவில் நிற்கும் கதைகள்.' },
  'portfolio.subtitle': {
    en: 'Every tradition. Every emotion. Beautifully preserved.',
    ta: 'ஒவ்வொரு மரபும். ஒவ்வொரு உணர்வும். அழகாகப் பதிவாகும்.',
  },
  'portfolio.all': { en: 'All', ta: 'அனைத்தும்' },
  'portfolio.weddings': { en: 'Weddings', ta: 'திருமணங்கள்' },
  'portfolio.ceremonies': { en: 'Ceremonies', ta: 'சடங்குகள்' },
  'portfolio.family': { en: 'Family', ta: 'குடும்பம்' },
  'portfolio.outdoor': { en: 'Outdoor', ta: 'வெளிப்புறம்' },
  'portfolio.corporate': { en: 'Corporate', ta: 'நிறுவன நிகழ்வுகள்' },
  'portfolio.filterLabel': { en: 'Filter portfolio by event category', ta: 'நிகழ்வு வகையின்படி படைப்புகளைத் தேர்ந்தெடுக்கவும்' },
  'common.close': { en: 'Close dialog', ta: 'சாளரத்தை மூடவும்' },
  'portfolio.empty': { en: 'No stories published in {category} yet.', ta: '{category} பிரிவில் கதைகள் இன்னும் வெளியிடப்படவில்லை.' },
  'portfolio.viewAll': { en: 'View All', ta: 'அனைத்தையும் காண்க' },
  'portfolio.inquire': { en: 'Inquire Now', ta: 'விவரம் கேளுங்கள்' },
  'portfolio.previous': { en: 'Previous photograph', ta: 'முந்தைய படம்' },
  'portfolio.next': { en: 'Next photograph', ta: 'அடுத்த படம்' },
  'portfolio.bookSimilar': { en: 'Book Similar Shoot', ta: 'இதேபோன்ற படப்பிடிப்பை முன்பதிவு செய்யுங்கள்' },
  'portfolio.location': { en: 'Location', ta: 'இடம்' },
  'packages.eyebrow': { en: 'COLLECTIONS', ta: 'புகைப்படத் தொகுப்புகள்' },
  'packages.heading': { en: 'Photography & Film Packages', ta: 'புகைப்படம் மற்றும் திரைப்படத் தொகுப்புகள்' },
  'packages.included': {
    en: 'Color grading, Karizma albums & raw footage included.',
    ta: 'வண்ணச் சீரமைப்பு, கரிஸ்மா ஆல்பங்கள் மற்றும் முழுப் பதிவு காணொளி அடங்கும்.',
  },
  'packages.flagship': { en: 'Flagship', ta: 'சிறப்புத் தொகுப்பு' },
  'packages.popular': { en: 'Popular', ta: 'பிரபலமானது' },
  'packages.starting': { en: 'starting', ta: 'தொடக்கம்' },
  'packages.selected': { en: 'Selected', ta: 'தேர்ந்தெடுக்கப்பட்டது' },
  'packages.select': { en: 'Select Package', ta: 'தொகுப்பைத் தேர்ந்தெடுக்கவும்' },
  'packages.selectedToast': { en: '{name} selected — complete your date inquiry below.', ta: '{name} தேர்ந்தெடுக்கப்பட்டது — கீழே உங்கள் தேதி விசாரணையை நிறைவு செய்யுங்கள்.' },
  'portfolio.eventTypeToast': { en: 'Event type set to {category}. Choose an open date below.', ta: 'நிகழ்வு வகை {category} எனத் தேர்ந்தெடுக்கப்பட்டது. கீழே காலியாக உள்ள தேதியைத் தேர்ந்தெடுக்கவும்.' },
  'about.eyebrow': { en: 'OUR STORY', ta: 'எங்கள் கதை' },
  'about.heading': { en: 'Every Ritual. Every Emotion. Every Forever.', ta: 'ஒவ்வொரு சடங்கும். ஒவ்வொரு உணர்வும். என்றும் நிலைக்கும் நினைவுகளும்.' },
  'about.description': {
    en: 'Rooted in South Indian tradition, we preserve the rituals and quiet in-between moments that make each celebration yours.',
    ta: 'தென்னிந்திய மரபின் வேர்களுடன், உங்கள் விழாவைத் தனித்துவமாக்கும் சடங்குகளையும் மனம் பேசும் தருணங்களையும் அழகாகப் பதிவு செய்கிறோம்.',
  },
  'about.celebrations': { en: 'Celebrations', ta: 'விழாக்கள்' },
  'about.experience': { en: 'Experience', ta: 'அனுபவம்' },
  'about.photography': { en: 'Photography', ta: 'புகைப்படம்' },
  'about.cinema': { en: '& 4K Cinema', ta: 'மற்றும் 4K திரைக்காட்சி' },
  'about.photographer': { en: 'Photographer & Filmmaker', ta: 'புகைப்படக் கலைஞர் மற்றும் திரைப்பட இயக்குநர்' },
  'about.signature': { en: 'Behind every frame, a story.', ta: 'ஒவ்வொரு காட்சிக்குப் பின்னும் ஒரு கதை.' },
  'about.meet': { en: 'Meet Our Studio', ta: 'எங்கள் ஸ்டுடியோவை அறியுங்கள்' },
  'about.photoAlt': { en: 'Sacred South Indian temple wedding captured by G Krishna', ta: 'G Krishna பதிவு செய்த தென்னிந்தியக் கோவில் திருமணத்தின் புனிதத் தருணம்' },
  'about.emblemAlt': { en: 'GK STUDIOS emblem', ta: 'GK STUDIOS சின்னம்' },
  'booking.eyebrow': { en: "LET'S CREATE SOMETHING TIMELESS", ta: 'காலம் கடந்தும் நிலைக்கும் நினைவுகளை உருவாக்குவோம்' },
  'booking.heading': { en: 'Your Date. Our Frames.', ta: 'உங்கள் நாள். எங்கள் காட்சிகள்.' },
  'booking.subtitle': { en: "Tell us about your celebration. Let's make it unforgettable.", ta: 'உங்கள் விழாவைப் பற்றிச் சொல்லுங்கள். மறக்க முடியாத நினைவுகளாக மாற்றுவோம்.' },
  'booking.calendar': { en: 'Live Calendar', ta: 'நேரடி நாட்காட்டி' },
  'booking.calendarHelp': { en: 'Select an open or limited date below.', ta: 'கீழே உள்ள காலியாக உள்ள அல்லது குறைந்த இடமுள்ள தேதியைத் தேர்ந்தெடுக்கவும்.' },
  'booking.selectedDate': { en: 'Selected Date', ta: 'தேர்ந்தெடுத்த தேதி' },
  'booking.openMessage': { en: 'Open — Full studio photography & 4K cinema crew available on this date.', ta: 'காலியாக உள்ளது — இந்தத் தேதியில் முழு புகைப்படம் மற்றும் 4K சினிமா குழுவும் கிடைக்கும்.' },
  'booking.inquiry': { en: 'Booking Inquiry', ta: 'முன்பதிவு விசாரணை' },
  'booking.confirmationHelp': { en: "We'll confirm availability directly on WhatsApp.", ta: 'WhatsApp மூலம் தேதியின் கிடைப்பை உறுதிப்படுத்துகிறோம்.' },
  'booking.submitted': { en: 'Booking Request Submitted · Reference {reference}', ta: 'முன்பதிவு கோரிக்கை அனுப்பப்பட்டது · குறிப்பு எண் {reference}' },
  'booking.thankYou': { en: 'Thank you, {name}. Your request for {event} on {date} has been recorded for studio confirmation.', ta: 'நன்றி, {name}. {date} அன்று நடைபெறும் {event} நிகழ்வுக்கான உங்கள் கோரிக்கை ஸ்டுடியோ உறுதிப்படுத்தலுக்காகப் பதிவு செய்யப்பட்டது.' },
  'booking.sendReference': { en: 'Send reference {reference} directly on WhatsApp', ta: 'குறிப்பு எண் {reference}-ஐ WhatsApp-ல் அனுப்புங்கள்' },
  'booking.name': { en: 'Client Name', ta: 'உங்கள் பெயர்' },
  'booking.phone': { en: 'Phone / WhatsApp Number', ta: 'தொலைபேசி / WhatsApp எண்' },
  'booking.eventType': { en: 'Ceremony / Event Type', ta: 'சடங்கு / நிகழ்வு வகை' },
  'booking.package': { en: 'Selected Package', ta: 'தேர்ந்தெடுத்த தொகுப்பு' },
  'booking.startDate': { en: 'Preferred Start Date', ta: 'விரும்பும் தொடக்கத் தேதி' },
  'booking.endDate': { en: 'End Date', ta: 'முடிவுத் தேதி' },
  'booking.optionalMultiDay': { en: '(Optional Multi-Day)', ta: '(பல நாள் நிகழ்வுக்கு விருப்பத்தேர்வு)' },
  'booking.venue': { en: 'Venue / Mandapam / City', ta: 'நிகழ்விடம் / மண்டபம் / நகரம்' },
  'booking.notes': { en: 'Ceremony Notes & Custom Requests', ta: 'சடங்கு விவரங்கள் மற்றும் சிறப்பு கோரிக்கைகள்' },
  'booking.namePlaceholder': { en: 'e.g., Karthikeyan & Revathi', ta: 'எ.கா., கார்த்திகேயன் & ரேவதி' },
  'booking.phonePlaceholder': { en: 'e.g., 98401 23456', ta: 'எ.கா., 98401 23456' },
  'booking.venuePlaceholder': { en: 'e.g., Sri Lakshmi Mahal, Chennai Highway, Villupuram', ta: 'எ.கா., ஸ்ரீ லட்சுமி மஹால், சென்னை நெடுஞ்சாலை, விழுப்புரம்' },
  'booking.notesPlaceholder': { en: 'Share Muhurtham timings, specific rituals (Oonjal, Kashi Yatra, Drone coverage), or Karizma album preferences...', ta: 'முகூர்த்த நேரம், ஊஞ்சல், காசி யாத்திரை, ட்ரோன் பதிவு அல்லது கரிஸ்மா ஆல்பம் விருப்பங்களைப் பகிருங்கள்...' },
  'booking.collection': { en: 'Collection:', ta: 'தொகுப்பு:' },
  'booking.submitting': { en: 'Submitting Inquiry...', ta: 'கோரிக்கை அனுப்பப்படுகிறது...' },
  'booking.submit': { en: 'Submit Booking Inquiry', ta: 'முன்பதிவு கோரிக்கையை அனுப்பவும்' },
  'booking.validationRequired': { en: 'Please fill in your name, phone number, preferred date, and venue.', ta: 'பெயர், தொலைபேசி எண், விரும்பும் தேதி மற்றும் நிகழ்விடத்தை நிரப்பவும்.' },
  'booking.validationPhone': { en: 'Please enter a valid 10-digit phone or WhatsApp number.', ta: 'சரியான 10 இலக்க தொலைபேசி அல்லது WhatsApp எண்ணை உள்ளிடவும்.' },
  'booking.dateBooked': { en: '{date} is already fully booked. Please pick an Open or Limited date.', ta: '{date} ஏற்கெனவே முழுமையாக முன்பதிவு செய்யப்பட்டுள்ளது. காலியாக உள்ள அல்லது குறைந்த இடமுள்ள தேதியைத் தேர்ந்தெடுக்கவும்.' },
  'booking.limitedDate': { en: '{date} has Limited availability — {title}', ta: '{date}-க்கு குறைந்த இடங்களே உள்ளன — {title}' },
  'booking.saved': { en: 'Inquiry {reference} saved! G Krishna will confirm shortly.', ta: 'கோரிக்கை {reference} பதிவு செய்யப்பட்டது! G Krishna விரைவில் உறுதிப்படுத்துவார்.' },
  'booking.submitError': { en: 'Unable to submit inquiry.', ta: 'கோரிக்கையை அனுப்ப முடியவில்லை.' },
  'calendar.previousMonth': { en: 'Previous month', ta: 'முந்தைய மாதம்' },
  'calendar.nextMonth': { en: 'Next month', ta: 'அடுத்த மாதம்' },
  'calendar.today': { en: 'Today', ta: 'இன்று' },
  'calendar.currentMonth': { en: 'Current Month', ta: 'இந்த மாதம்' },
  'calendar.pastDate': { en: 'Past date', ta: 'கடந்த தேதி' },
  'calendar.booked': { en: 'Booked', ta: 'முன்பதிவு செய்யப்பட்டது' },
  'calendar.limited': { en: 'Limited', ta: 'குறைந்த இடங்கள்' },
  'calendar.open': { en: 'Open', ta: 'காலியாக உள்ளது' },
  'calendar.available': { en: 'Available', ta: 'கிடைக்கிறது' },
  'calendar.more': { en: 'more', ta: 'மேலும்' },
  'calendar.openAvailable': { en: 'Open · Available', ta: 'காலி · கிடைக்கிறது' },
  'calendar.limitedSlot': { en: 'Limited · 1 Crew Slot', ta: 'குறைந்த இடங்கள் · 1 குழு இடம்' },
  'calendar.bookedUnavailable': { en: 'Booked · Unavailable', ta: 'முன்பதிவு · கிடைக்காது' },
  'calendar.selected': { en: 'Selected', ta: 'தேர்ந்தெடுக்கப்பட்டது' },
  'calendar.clickToBlock': { en: 'Click to block', ta: 'தடுக்கத் தேர்ந்தெடுக்கவும்' },
  'footer.brandContact': { en: 'BRAND & CONTACT', ta: 'அடையாளம் மற்றும் தொடர்பு' },
  'footer.explore': { en: 'EXPLORE', ta: 'பார்வையிடுங்கள்' },
  'footer.celebrations': { en: 'CELEBRATIONS', ta: 'கொண்டாட்டங்கள்' },
  'footer.stories': { en: 'Our Stories', ta: 'எங்கள் கதைகள்' },
  'footer.about': { en: 'About', ta: 'எங்களைப் பற்றி' },
  'footer.availability': { en: 'Availability', ta: 'தேதி கிடைப்பது' },
  'footer.whatsapp': { en: 'WhatsApp', ta: 'WhatsApp' },
  'footer.tagline': { en: 'Creating Memories.', ta: 'நினைவுகளை உருவாக்குகிறோம்.' },
  'footer.copyright': { en: '© 2026 GK STUDIOS. All rights reserved.', ta: '© 2026 GK STUDIOS. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.' },
  'footer.credit': { en: 'Designed with passion. Creating memories.', ta: 'அன்புடன் வடிவமைக்கப்பட்டது. நினைவுகளை உருவாக்குகிறோம்.' },
  'footer.admin': { en: 'Admin', ta: 'நிர்வாகம்' },
  'stats.celebrations': { en: 'Celebrations', ta: 'விழாக்கள்' },
  'stats.years': { en: 'Years', ta: 'ஆண்டுகள்' },
  'stats.cinema': { en: 'Cinema', ta: 'சினிமா' },
  'stats.albums': { en: 'Albums', ta: 'ஆல்பங்கள்' },
  'stats.aria': { en: 'Studio highlights', ta: 'ஸ்டுடியோ சிறப்பம்சங்கள்' },
} as const;

export type TranslationKey = keyof typeof translations;

export function translate(
  locale: PublicLocale,
  key: TranslationKey,
  params: Record<string, string | number> = {}
): string {
  let value: string = translations[key][locale];
  for (const [name, replacement] of Object.entries(params)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}

const categoryKeys: Partial<Record<EventCategory, TranslationKey>> = {
  Weddings: 'portfolio.weddings',
  'Iyer Weddings': 'portfolio.weddings',
  'Temple Weddings': 'portfolio.weddings',
  'Hindu, Christian & Muslim Weddings': 'portfolio.weddings',
  'Traditional Ceremonies': 'portfolio.ceremonies',
  'Kaathu Kuthi': 'portfolio.ceremonies',
  'Seemantham / Baby Shower': 'portfolio.ceremonies',
  'Puberty Ceremony': 'portfolio.ceremonies',
  'Nool Punal / Upanayanam': 'portfolio.ceremonies',
  'Griha Pravesam (Housewarming)': 'portfolio.ceremonies',
  'Family Celebrations': 'portfolio.family',
  'Birthdays & Milestones': 'portfolio.family',
  'Maternity & Newborn Shoots': 'portfolio.family',
  'Portraits & Outdoor Shoots': 'portfolio.outdoor',
  'Pre-Wedding & Engagement Shoots': 'portfolio.outdoor',
  'Outdoor Shoots': 'portfolio.outdoor',
  'Corporate Events': 'portfolio.corporate',
  'Corporate & Social Events': 'portfolio.corporate',
};

export function translateCategory(locale: PublicLocale, category: EventCategory): string {
  const key = categoryKeys[category];
  return key ? translate(locale, key) : category;
}

export function formatLocalizedDate(isoDate: string, locale: PublicLocale): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat(locale === 'ta' ? 'ta-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
  }).format(new Date(year, month - 1, day));
}

export function formatLocalizedMonthLabel(monthLabel: string, locale: PublicLocale): string {
  if (locale === 'en') return monthLabel;
  const parsed = new Date(`${monthLabel} 1`);
  if (Number.isNaN(parsed.getTime())) return monthLabel;
  return new Intl.DateTimeFormat('ta-IN', {
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
  }).format(parsed);
}

const packageCopy: Record<string, { name: string; audience: string; duration: string; deliverables: string[] }> = {
  'pkg-essential': {
    name: 'முக்கியச் சடங்கு',
    audience: 'கோவில் திருமணங்கள் மற்றும் காதுகுத்து விழாக்களுக்கு',
    duration: 'ஒரு நாள் · அதிகபட்சம் 6 மணி நேரம்',
    deliverables: [
      '1 முன்னணி கேண்டிட் புகைப்படக் கலைஞர் + 1 பாரம்பரியப் புகைப்படக் கலைஞர்',
      '1 முழு HD பாரம்பரிய வீடியோ ஒளிப்பதிவாளர்',
      'வண்ணச் சீரமைப்புடன் 250+ உயர்தர டிஜிட்டல் புகைப்படங்கள்',
      '30 தாள்கள் கொண்ட லேஃப்லாட் கரிஸ்மா புகைப்பட ஆல்பம்',
      'முழு நிகழ்வின் திருத்தப்பட்ட வீடியோ + முழுப் பதிவு காட்சிகள்',
    ],
  },
  'pkg-grand': {
    name: 'பாரம்பரியப் பிரம்மாண்டத் திருமணம்',
    audience: 'முகூர்த்தம் மற்றும் வரவேற்பு நிகழ்வுகளுக்கு',
    duration: '1.5 நாட்கள் · மாலை மற்றும் முகூர்த்தம்',
    deliverables: [
      '2 கேண்டிட் புகைப்படக் கலைஞர்கள் + 1 பாரம்பரியப் புகைப்படக் கலைஞர்',
      '1 பாரம்பரிய வீடியோ ஒளிப்பதிவாளர் + 1 சினிமா கிம்பல் இயக்குநர்',
      '4K சினிமா திருமண முன்னோட்டம் (3–4 நிமிடங்கள்)',
      '50 தாள்கள் கொண்ட மெட்டாலிக் கரிஸ்மா ஆல்பம் + 2 சிறு ஆல்பங்கள்',
      '500+ தேர்ந்தெடுத்த டிஜிட்டல் புகைப்படங்கள் + முழுப் பதிவு காட்சிகள்',
    ],
  },
  'pkg-royal': {
    name: 'ராயல் சினிமா முழுத் தொகுப்பு',
    audience: 'முழு 2 நாள் ஐயர் மற்றும் பிரம்மாண்டத் திருமணங்களுக்கு',
    duration: '2 முழு நாட்கள் + திருமணத்திற்கு முந்தைய படப்பிடிப்பு',
    deliverables: [
      'ஜனவாசம், விரதம், காசி யாத்திரை, ஊஞ்சல், முகூர்த்தம் உள்ளிட்ட முழுச் சடங்கு பதிவு',
      '2 கேண்டிட் புகைப்படக் கலைஞர்கள் + 2 பாரம்பரியப் புகைப்படக் கலைஞர்கள்',
      '4K இரட்டை கேமரா சினிமா குழு + உரிமம் பெற்ற வான்வழி ட்ரோன் பதிவு',
      'அரை நாள் வெளிப்புற ஜோடி படப்பிடிப்பு இலவசம்',
      '70 தாள்கள் கொண்ட வெல்வெட் பெட்டி கரிஸ்மா ஆல்பம் + 4K சிறப்புத் திரைப்படம்',
    ],
  },
  'pkg-custom': {
    name: 'வெளிப்புறம் மற்றும் மைல்கல் விழாக்கள்',
    audience: 'திருமணத்திற்கு முந்தைய படப்பிடிப்பு, பிறந்தநாள் மற்றும் உருவப்படங்களுக்கு',
    duration: 'அரை நாள் · 4 மணி நேரப் படப்பிடிப்பு',
    deliverables: [
      '1 உருவப்படம் மற்றும் கேண்டிட் புகைப்படக் கலைஞர்',
      '120+ சிறப்பாகத் திருத்தப்பட்ட உயர் தெளிவுத்திறன் புகைப்படங்கள்',
      '90 விநாடி செங்குத்து வீடியோ மற்றும் 4K பகிர்வு ரீல்',
      '20 தாள்கள் கொண்ட சிறு நினைவு ஆல்பம் (விருப்ப மேம்பாடு)',
      'அதே வாரத்தில் விரைவு கிளவுட் முன்னோட்ட இணைப்பு',
    ],
  },
};

export function localizePackage(
  locale: PublicLocale,
  pkg: StudioPackage
): { name: string; audience: string; duration: string; deliverables: string[] } {
  if (locale === 'en') {
    return {
      name: pkg.name,
      audience: pkg.audience,
      duration: pkg.duration,
      deliverables: pkg.deliverables,
    };
  }
  const localized = packageCopy[pkg.id];
  return localized
    ? { ...localized, deliverables: localized.deliverables }
    : { name: pkg.name, audience: pkg.audience, duration: pkg.duration, deliverables: pkg.deliverables };
}

const portfolioCopy: Record<string, { title: string; location: string; notes: string }> = {
  'pf-iyer-oonjal': {
    title: 'காவேரி & சுப்பிரமணியன் — ஊஞ்சல் மற்றும் முகூர்த்தம்',
    location: 'கும்பகோணம் மற்றும் கண்டரக்கோட்டை மண்டபம்',
    notes: 'விரதம், காசி யாத்திரை, ஊஞ்சல் பாடல்கள், அதிகாலை முகூர்த்தம் உள்ளிட்ட இரண்டு நாள் ஐயர் திருமணப் பதிவுகள். இரட்டை கேண்டிட் கேமராக்களும் குத்துவிளக்கின் மென்மையான ஒளியும் பயன்படுத்தப்பட்டன.',
  },
  'pf-temple-wedding': {
    title: 'மீனாட்சி & கார்த்திக் — கோவில் மண்டபத் திருமணம்',
    location: 'திருவக்கரை பழமையான கல் கோவில்',
    notes: 'காலைப் பொழுதில் செதுக்கப்பட்ட கிரானைட் தூண்களுக்கு இடையே நடைபெற்ற புனிதத் திருமணம். கோவிலின் அமைதியை மதித்து, கடுமையான விளக்குகள் இன்றி இயற்கையான பொன்னொளியில் பதிவு செய்யப்பட்டது.',
  },
  'pf-multifaith-heritage': {
    title: 'அனன்யா & சித்தார்த் — பாரம்பரிய முற்றத்தில் இணைந்த இதயங்கள்',
    location: 'சென்னை கிழக்குக் கடற்கரை பாரம்பரிய முற்றம்',
    notes: 'தேவாலய ஆசீர்வாதங்களையும் பாரம்பரிய பட்டுப் புடவை உருவப்படங்களையும் இணைத்த தென்னிந்தியக் கொண்டாட்டம். 4K சினிமா காட்சிகளுடன் இதமான வண்ணச் சீரமைப்பு.',
  },
  'pf-kaathu-kuthi': {
    title: 'குட்டி ஆராத்யா — காதுகுத்து விழா',
    location: 'விழுப்புரம் பூர்வீக இல்லம்',
    notes: 'பாரம்பரிய காதுகுத்து ஆசீர்வாதத்தின் அன்பான தருணங்கள்: தாயின் புன்னகை, பட்டுப் பாவாடை விவரங்கள், வாழையிலைச் சடங்குகள் அனைத்தும் இயல்பாகப் பதிவு செய்யப்பட்டன.',
  },
  'pf-birthday-milestone': {
    title: 'விஹான் முதல் பிறந்தநாள் — குடும்ப மைல்கல்',
    location: 'கண்டரக்கோட்டை கொண்டாட்ட அரங்கம்',
    notes: 'சாமந்தி மலர் அலங்காரங்களும் மின்னும் விளக்குகளும் நிறைந்த முதல் பிறந்தநாள் விழா. குடும்பத்தின் இயல்பான மகிழ்ச்சியை மையமாகக் கொண்ட கேண்டிட் புகைப்படங்கள்.',
  },
  'pf-outdoor-couple': {
    title: 'திவ்யா & பிரவீன் — மாலைநேரத் தென்னைத் தோப்பு',
    location: 'புதுச்சேரி கடற்கரைப் பாரம்பரியப் பாதை',
    notes: 'பொன்னான மாலை ஒளியில், மரபுக் கல் மண்டபங்களையும் தென்னைத் தோப்புகளையும் பின்னணியாகக் கொண்டு நடைபெற்ற ஜோடி முன்படப்பிடிப்பு.',
  },
};

export function localizePortfolioText(
  locale: PublicLocale,
  id: string,
  field: 'title' | 'location' | 'notes',
  fallback: string
): string {
  return locale === 'ta' ? portfolioCopy[id]?.[field] ?? fallback : fallback;
}

export const PUBLIC_PREFERENCE_STORAGE_KEY = 'gk-studios-public-preferences';
