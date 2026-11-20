import { EventCategory, StudioPackage } from '@/src/types/studio';

export type PublicLocale = 'en' | 'ta';
export type PublicTheme = 'dark' | 'light';

const translations = {
  'nav.home': { en: 'Home', ta: 'முகப்பு' },
  'nav.work': { en: 'Our Work', ta: 'எங்கள் படைப்புகள்' },
  'nav.packages': { en: 'Packages', ta: 'தொகுப்புகள்' },
  'nav.about': { en: 'About', ta: 'எங்களைப் பற்றி' },
  'nav.contact': { en: 'Contact', ta: 'தொடர்பு' },
  'nav.checkAvailability': { en: 'Reserve Your Date', ta: 'உங்கள் தேதியை முன்பதிவு செய்யுங்கள்' },
  'nav.openMenu': { en: 'Open navigation menu', ta: 'மெனுவைத் திற' },
  'nav.closeMenu': { en: 'Close navigation menu', ta: 'மெனுவை மூடு' },
  'nav.switchToLight': { en: 'Switch to light mode', ta: 'வெளிச்சப் தீமுக்கு மாறு' },
  'nav.switchToDark': { en: 'Switch to dark mode', ta: 'இருட்டுத் தீமுக்கு மாறு' },
  'nav.language': { en: 'Language', ta: 'மொழி' },
  'nav.primary': { en: 'Primary navigation', ta: 'முக்கிய மெனு' },
  'nav.mobile': { en: 'Mobile navigation', ta: 'கைபேசி மெனு' },
  'hero.heading': { en: 'Creating Memories', ta: 'நினைவுகளைக் காப்போம்' },
  'hero.subtitle': {
    en: 'Timeless Wedding Photography & Cinematic Films.',
    ta: 'அழகு நிறைந்த திருமணப் புகைப்படங்களும் சினிமா நிமிடங்களும்.',
  },
  'hero.explore': { en: 'Explore Stories', ta: 'கதைகளைப் பாருங்கள்' },
  'hero.scroll': { en: 'Scroll', ta: 'கீழே செல்ல' },
  'hero.previous': { en: 'Previous hero photograph', ta: 'முந்தைய படம்' },
  'hero.next': { en: 'Next hero photograph', ta: 'அடுத்த படம்' },
  'portfolio.eyebrow': { en: 'THE ART OF CELEBRATION', ta: 'கொண்டாட்டத்தின் அழகு' },
  'portfolio.heading': { en: 'Stories Worth Remembering.', ta: 'நெஞ்சில் நிற்கும் கதைகள்.' },
  'portfolio.subtitle': {
    en: 'Every tradition. Every emotion. Beautifully preserved.',
    ta: 'மரபும் உணர்வும் — அழகாகப் பதிந்த நிமிடங்கள்.',
  },
  'portfolio.all': { en: 'All', ta: 'அனைத்தும்' },
  'portfolio.weddings': { en: 'Weddings', ta: 'திருமணங்கள்' },
  'portfolio.ceremonies': { en: 'Ceremeonies', ta: 'சடங்குகள்' },
  'portfolio.family': { en: 'Family', ta: 'குடும்பம்' },
  'portfolio.outdoor': { en: 'Outdoor Shoots', ta: 'வெளிப்புறப் படப்பிடிப்பு' },
  'portfolio.corporate': { en: 'Corporate', ta: 'நிறுவன நிகழ்வுகள்' },
  'portfolio.filterLabel': { en: 'Filter portfolio by event category', ta: 'நிகழ்வு வகையால் படைப்புகளைத் தேர்வு செய்' },
  'common.close': { en: 'Close dialog', ta: 'சாளரத்தை மூடு' },
  'portfolio.empty': { en: 'No stories published in {category} yet.', ta: '{category} வகையில் இன்னும் கதைகள் இல்லை.' },
  'portfolio.viewAll': { en: 'View All', ta: 'எல்லாவற்றையும் பார்' },
  'portfolio.inquire': { en: 'Inquire Now', ta: 'இப்போதே கேளுங்கள்' },
  'portfolio.previous': { en: 'Previous photograph', ta: 'முந்தைய படம்' },
  'portfolio.next': { en: 'Next photograph', ta: 'அடுத்த படம்' },
  'portfolio.bookSimilar': { en: 'Book Similar Shoot', ta: 'இதே மாதிரி படமெடுக்க முன்பதிவு செய்' },
  'portfolio.location': { en: 'Location', ta: 'இடம்' },
  'packages.eyebrow': { en: 'COLLECTIONS', ta: 'எங்கள் தொகுப்புகள்' },
  'packages.heading': { en: 'Find the Perfect Collection for Your Celebration', ta: 'உங்கள் விழாவிற்கான சரியான தொகுப்பைத் தேர்ந்தெடுங்கள்' },
  'packages.included': {
    en: 'Beautiful photography, cinematic films and timeless albums — thoughtfully created for every occasion.',
    ta: 'அழகிய புகைப்படங்கள், சினிமா படங்கள், என்றும் நிலைக்கும் ஆல்பங்கள் — ஒவ்வொரு நிகழ்விற்கும் அக்கறையுடன்.',
  },
  'packages.guidanceHeading': { en: 'Not Sure Which Package to Choose?', ta: 'எந்தத் தொகுப்பைத் தேர்வு செய்வது எனத் தெரியவில்லையா?' },
  'packages.guidanceDescription': { en: "Every celebration is unique. Tell us about your special day, and we'll help you find the right collection.", ta: 'ஒவ்வொரு விழாவும் தனித்துவமானது. உங்கள் சிறப்பு நாளைப் பற்றி சொல்லுங்கள்; சரியான தொகுப்பைத் தேர்வு செய்ய உதவுகிறோம்.' },
  'packages.call': { en: 'Call GK Studios', ta: 'GK Studios-ஐ அழைக்கவும்' },
  'packages.whatsapp': { en: 'WhatsApp Us', ta: 'WhatsApp-ல் பேசுங்கள்' },
  'packages.flagship': { en: 'Flagship', ta: 'சிறப்பு தொகுப்பு' },
  'packages.popular': { en: 'Most Popular', ta: 'மிகவும் பிரபலமானது' },
  'packages.starting': { en: 'starting', ta: 'இருந்து தொடக்கம்' },
  'packages.selected': { en: 'Selected', ta: 'தேர்ந்தெடுக்கப்பட்டது' },
  'packages.select': { en: 'Choose This Package', ta: 'இந்தத் தொகுப்பைத் தேர்வு செய்' },
  'packages.selectedToast': { en: '{name} selected — complete your date inquiry below.', ta: '{name} தேர்ந்தெடுக்கப்பட்டது — கீழே தேதி விவரத்தைச் சொல்லுங்கள்.' },
  'portfolio.eventTypeToast': { en: 'Event type set to {category}. Choose an open date below.', ta: 'நிகழ்வு {category} எனச் சேர்க்கப்பட்டது. கீழே ஒரு நாள் தேர்வு செய்யுங்கள்.' },
  'about.eyebrow': { en: 'OUR STORY', ta: 'எங்கள் கதை' },
  'about.heading': {
    en: 'Every Ritual. Every Emotion. Every Forever.',
    ta: 'கடந்து போகும் தருணங்கள்; காலமெல்லாம் பேசும் நினைவுகள்.',
  },
  'about.description': {
    en: 'Rooted in South Indian tradition, we preserve the rituals and quiet in-between moments that make each celebration yours.',
    ta: 'தென்னிந்திய மரபோடு, விழாவைச் சிறப்பாக்கும் சடங்குகளையும் சொல்லாத நிமிடங்களையும் காதலுடன் படமாகப் பதிக்கிறோம்.',
  },
  'about.celebrations': { en: 'Celebrations', ta: 'விழாக்கள்' },
  'about.experience': { en: 'Experience', ta: 'அனுபவம்' },
  'about.photography': { en: 'Photography', ta: 'புகைப்படம்' },
  'about.cinema': { en: '& 4K Cinema', ta: '& 4K சினிமா' },
  'about.photographer': { en: 'Photographer & Filmmaker', ta: 'புகைப்படக்கலைஞர் & திரைப்பட இயக்குநர்' },
  'about.signature': { en: 'Behind every frame, a story.', ta: 'ஒவ்வொரு காட்சிக்கும் பின்னால் ஒரு அழகான கதை.' },
  'about.meet': { en: 'Meet Our Studio', ta: 'எங்கள் ஸ்டுடியோவைச் சந்தியுங்கள்' },
  'about.photoAlt': { en: 'Sacred South Indian temple wedding captured by G Krishna', ta: 'G Krishna எடுத்த தென்னிந்திய கோவில் திருமண நிமிடம்' },
  'about.emblemAlt': { en: 'GK STUDIOS emblem', ta: 'GK STUDIOS முத்திரை' },
  'booking.eyebrow': { en: "LET'S CREATE SOMETHING TIMELESS", ta: 'காலத்தைக் கடக்கும் நினைவுகளை உருவாக்கலாம்' },
  'booking.heading': { en: 'Your Date. Our Frames.', ta: 'உங்கள் நாள். எங்கள் காட்சிகள்.' },
  'booking.subtitle': { en: "Tell us about your celebration. Let's make it unforgettable.", ta: 'உங்கள் விழாவைப் பகிருங்கள். மறக்காத நினைவாக மாற்றுவோம்.' },
  'booking.calendar': { en: 'Live Calendar', ta: 'நேரலை நாட்காட்டி' },
  'booking.calendarHelp': { en: 'Select an open or limited date below.', ta: 'கீழே காலியாக உள்ளதே அல்லது ஓரளவு இடம் உள்ள தேதியைத் தேர்வு செய்யுங்கள்.' },
  'booking.selectedDate': { en: 'Selected Date', ta: 'தேர்ந்தெடுத்த தேதி' },
  'booking.openMessage': { en: 'Open — Full studio photography & 4K cinema crew available on this date.', ta: 'காலி — இந்த நாளில் முழுப் புகைப்படம் மற்றும் 4K சினிமா குழு தயாராக இருக்கும்.' },
  'booking.inquiry': { en: 'Booking Inquiry', ta: 'முன்பதிவு விவரம்' },
  'booking.confirmationHelp': { en: "We'll confirm availability directly on WhatsApp.", ta: 'தேதி கிடைப்பதை WhatsApp-ல் நிச்சயமாகச் சொல்கிறோம்.' },
  'booking.submitted': { en: 'Booking Request Submitted · Reference {reference}', ta: 'முன்பதிவு கோரிக்கை வந்தது · குறிப்பு எண் {reference}' },
  'booking.thankYou': { en: 'Thank you, {name}. Your request for {event} on {date} has been recorded for studio confirmation.', ta: 'நன்றி {name}. {date} அன்று நடைபெறும் {event} நிகழ்வுக்கான கோரிக்கை உறுதிப்படுத்தலுக்கு அனுப்பப்பட்டது.' },
  'booking.sendReference': { en: 'Send reference {reference} directly on WhatsApp', ta: 'குறிப்பு எண் {reference}-ஐ நேரடியாக WhatsApp-ல் அனுப்புங்கள்' },
  'booking.name': { en: 'Client Name', ta: 'உங்கள் பெயர்' },
  'booking.phone': { en: 'Phone / WhatsApp Number', ta: 'தொலைபேசி / WhatsApp எண்' },
  'booking.eventType': { en: 'Ceremony / Event Type', ta: 'சடங்கு / நிகழ்வு வகை' },
  'booking.package': { en: 'Selected Package', ta: 'தேர்ந்தெடுத்த தொகுப்பு' },
  'booking.customPackage': { en: 'Custom Package — let’s plan it together', ta: 'தனிப்பயன் தொகுப்பு — சேர்ந்து திட்டமிடலாம்' },
  'booking.customPackageName': { en: 'Custom Package', ta: 'தனிப்பயன் தொகுப்பு' },
  'booking.customQuote': { en: 'Custom quote after discussion', ta: 'விவாதத்திற்குப் பிறகு விலை தெரிவிக்கப்படும்' },
  'booking.startDate': { en: 'Preferred Start Date', ta: 'விரும்பும் தேதி' },
  'booking.dateAndTime': { en: 'Preferred Date & Time', ta: 'விரும்பும் தேதி மற்றும் நேரம்' },
  'booking.timeOptional': { en: '(time optional)', ta: '(நேரம் விருப்பம்)' },
  'booking.endDate': { en: 'End Date', ta: 'முடிவு தேதி' },
  'booking.optionalMultiDay': { en: '(Optional Multi-Day)', ta: '(பல நாள் நிகழ்வா? தேர்வு செய்யலாம்)' },
  'booking.eventTime': { en: 'Event / Ceremony Time', ta: 'நிகழ்வு / சடங்கு நேரம்' },
  'booking.servicePreferences': { en: 'Service preferences', ta: 'விருப்பச் சேவைகள்' },
  'booking.packageServicesHelp': { en: 'Included services are preselected. Adjust them to suit your event.', ta: 'தொகுப்பில் உள்ள சேவைகள் முன்கூட்டியே தேர்ந்தெடுக்கப்பட்டுள்ளன. உங்கள் நிகழ்வுக்கு ஏற்ப மாற்றலாம்.' },
  'booking.customPackageHelp': { en: 'Choose what you need; we’ll discuss a custom quote together.', ta: 'உங்களுக்குத் தேவையானவற்றைத் தேர்ந்தெடுங்கள்; விலையைப் பின்னர் பேசித் தீர்மானிக்கலாம்.' },
  'booking.service.traditionalCamera': { en: 'Traditional Camera', ta: 'பாரம்பரிய கேமரா' },
  'booking.service.candidCamera': { en: 'Candid Camera', ta: 'கேண்டிட் கேமரா' },
  'booking.service.candidVideo': { en: 'Candid Video', ta: 'கேண்டிட் வீடியோ' },
  'booking.service.traditionalVideo': { en: 'Traditional Video', ta: 'பாரம்பரிய வீடியோ' },
  'booking.service.drone': { en: 'Drone Coverage', ta: 'ட்ரோன் பதிவு' },
  'booking.service.tv': { en: 'TV', ta: 'டிவி' },
  'booking.service.ledWall': { en: 'LED Wall', ta: 'LED திரை' },
  'booking.whatsappEventTime': { en: 'Event time: {time}.', ta: 'நிகழ்வு நேரம்: {time}.' },
  'booking.whatsappServices': { en: 'Requested services: {services}.', ta: 'விரும்பிய சேவைகள்: {services}.' },
  'booking.venue': { en: 'Venue / Mandapam / City', ta: 'நிகழ்விடம் / மண்டபம் / நகரம்' },
  'booking.notes': { en: 'Ceremony Notes & Custom Requests', ta: 'சடங்கு விவரங்கள் & சிறப்பு கோரிக்கைகள்' },
  'booking.namePlaceholder': { en: 'e.g., Karthikeyan & Revathi', ta: 'எ.கா., கார்த்திகேயன் & ரேவதி' },
  'booking.phonePlaceholder': { en: 'e.g., 98401 23456', ta: 'எ.கா., 98401 23456' },
  'booking.venuePlaceholder': { en: 'e.g., Sri Lakshmi Mahal, Chennai Highway, Villupuram', ta: 'எ.கா., ஸ்ரீ லட்சுமி மஹால், சென்னை நெடுஞ்சாலை, விழுப்புரம்' },
  'booking.notesPlaceholder': { en: 'Share Muhurtham timings, specific rituals (Oonjal, Kashi Yatra, Drone coverage), or Karizma album preferences...', ta: 'முகூர்த்த நேரம், ஊஞ்சல், காசி யாத்திரை, drone படப்பிடிப்பு அல்லது Karizma ஆல்பம் விருப்பங்களைச் சொல்லுங்கள்...' },
  'booking.collection': { en: 'Collection:', ta: 'தொகுப்பு:' },
  'booking.submitting': { en: 'Submitting Inquiry...', ta: 'கோரிக்கை அனுப்பப்படுகிறது...' },
  'booking.submit': { en: 'Submit Booking Inquiry', ta: 'முன்பதிவு கோரிக்கையை அனுப்பு' },
  'booking.validationRequired': { en: 'Please fill in your name, phone number, preferred date, and venue.', ta: 'பெயர், தொலைபேசி எண், விரும்பும் தேதி மற்றும் நிகழ்விடம் ஆகியவற்றை நிரப்புங்கள்.' },
  'booking.validationPhone': { en: 'Please enter a valid 10-digit phone or WhatsApp number.', ta: 'சரியான 10 இலக்க தொலைபேசி அல்லது WhatsApp எண்ணை எழுதுங்கள்.' },
  'booking.dateBooked': { en: '{date} is already fully booked. Please pick an Open or Limited date.', ta: '{date} முழுமையாக முன்பதிவு செய்யப்பட்டுள்ளது. காலி அல்லது ஓரளவு இடம் உள்ள தேதியைத் தேர்வு செய்யுங்கள்.' },
  'booking.limitedDate': { en: '{date} has Limited availability — {title}', ta: '{date}-க்கு ஓரளவு இடமே உள்ளது — {title}' },
  'booking.saved': { en: 'Inquiry {reference} saved! G Krishna will confirm shortly.', ta: 'கோரிக்கை {reference} வந்தது! G Krishna விரைவில் உறுதி செய்வார்.' },
  'booking.submitError': { en: 'Unable to submit inquiry.', ta: 'கோரிக்கையை அனுப்ப முடியவில்லை.' },
  'calendar.previousMonth': { en: 'Previous month', ta: 'முந்தைய மாதம்' },
  'calendar.nextMonth': { en: 'Next month', ta: 'அடுத்த மாதம்' },
  'calendar.today': { en: 'Today', ta: 'இன்று' },
  'calendar.currentMonth': { en: 'Current Month', ta: 'இந்த மாதம்' },
  'calendar.pastDate': { en: 'Past date', ta: 'கடந்த தேதி' },
  'calendar.booked': { en: 'Booked', ta: 'முன்பதிவு' },
  'calendar.limited': { en: 'Limited', ta: 'குறைந்த இடம்' },
  'calendar.open': { en: 'Open', ta: 'காலி' },
  'calendar.available': { en: 'Available', ta: 'கிடைக்கும்' },
  'calendar.more': { en: 'more', ta: 'மேலும்' },
  'calendar.openAvailable': { en: 'Open · Available', ta: 'காலி · கிடைக்கும்' },
  'calendar.limitedSlot': { en: 'Limited · 1 Crew Slot', ta: 'குறைந்த இடம் · 1 குழு இடம்' },
  'calendar.bookedUnavailable': { en: 'Booked · Unavailable', ta: 'முன்பதிவு · கிடைக்காது' },
  'calendar.selected': { en: 'Selected', ta: 'தேர்ந்தெடுக்கப்பட்டது' },
  'calendar.clickToBlock': { en: 'Click to block', ta: 'மூடுவதற்கு தட்டுங்கள்' },
  'footer.brandContact': { en: 'BRAND & CONTACT', ta: 'அடையாளம் & தொடர்பு' },
  'footer.explore': { en: 'EXPLORE', ta: 'மேலும் அறிய' },
  'footer.celebrations': { en: 'CELEBRATIONS', ta: 'விழாக்கள்' },
  'footer.stories': { en: 'Our Stories', ta: 'எங்கள் கதைகள்' },
  'footer.about': { en: 'About', ta: 'எங்களைப் பற்றி' },
  'footer.availability': { en: 'Availability', ta: 'கிடைக்கும் தேதிகள்' },
  'footer.terms': { en: 'Terms & Conditions', ta: 'விதிமுறைகள் & நிபந்தனைகள்' },
  'terms.guidelines': { en: 'GK STUDIOS · GUIDELINES', ta: 'GK STUDIOS · வழிகாட்டுதல்கள்' },
  'terms.title': { en: 'TERMS & CONDITIONS', ta: 'விதிமுறைகள் மற்றும் நிபந்தனைகள்' },
  'terms.description': {
    en: 'A few simple guidelines to make your experience smooth and hassle-free.',
    ta: 'உங்கள் அனுபவம் எளிதாகவும் சிரமமின்றியும் அமைய சில எளிய வழிகாட்டுதல்கள்.',
  },
  'terms.bookingInquiry': { en: 'Booking Inquiry:', ta: 'முன்பதிவு கோரிக்கை:' },
  'terms.intro': {
    en: 'To make sure everything goes smoothly, please take a moment to read our simple booking guidelines.',
    ta: 'எல்லாம் சீராக நடைபெற, எங்கள் முன்பதிவு வழிகாட்டுதல்களைச் சிறிது நேரம் ஒதுக்கிப் படிக்கவும்.',
  },
  'terms.payment.title': { en: 'PAYMENT TERMS', ta: 'கட்டண விதிமுறைகள்' },
  'terms.payment.advance': { en: 'Advance', ta: 'முன்பணம்' },
  'terms.payment.advanceDescription': {
    en: 'Pay 20% in advance to confirm your booking.',
    ta: 'முன்பதிவை உறுதிப்படுத்த 20% முன்பணமாகச் செலுத்தவும்.',
  },
  'terms.payment.duringEvent': { en: 'During the Event', ta: 'நிகழ்வின்போது' },
  'terms.payment.duringEventDescription': {
    en: 'Pay 60% during the event or production.',
    ta: 'நிகழ்வு அல்லது தயாரிப்புப் பணிகளின்போது 60% செலுத்தவும்.',
  },
  'terms.payment.final': { en: 'Final Payment', ta: 'இறுதித் தொகை' },
  'terms.payment.finalDescription': {
    en: 'Pay the remaining 20% before receiving your final photos, albums and event files.',
    ta: 'இறுதிப் புகைப்படங்கள், ஆல்பங்கள் மற்றும் நிகழ்வு கோப்புகளைப் பெறுவதற்கு முன் மீதமுள்ள 20% செலுத்தவும்.',
  },
  'terms.collection.title': { en: 'PHOTO & FILE COLLECTION', ta: 'புகைப்படங்கள் மற்றும் கோப்புகளைப் பெறுதல்' },
  'terms.collection.before': {
    en: 'Please collect your photos and event files within',
    ta: 'உங்கள் நிகழ்வு நடைபெற்ற நாள் அல்லது ஆர்டர் உறுதிப்படுத்தப்பட்ட நாளிலிருந்து',
  },
  'terms.collection.after': {
    en: ' from your event date or order confirmation.',
    ta: ', புகைப்படங்களையும் நிகழ்வு கோப்புகளையும் பெற்றுக்கொள்ளுங்கள்.',
  },
  'terms.days120': { en: '120 days', ta: '120 நாட்களுக்குள்' },
  'terms.uncollected.title': { en: 'UNCOLLECTED PHOTOS & FILES', ta: 'பெறப்படாத புகைப்படங்கள் மற்றும் கோப்புகள்' },
  'terms.uncollected.before': {
    en: 'If you do not collect your photos or files within',
    ta: 'நீங்கள் புகைப்படங்கள் அல்லது கோப்புகளை',
  },
  'terms.uncollected.after': {
    en: ', GK Studios cannot guarantee their storage, safety or availability.',
    ta: ' பெற்றுக்கொள்ளாவிட்டால், அவற்றின் சேமிப்பு, பாதுகாப்பு அல்லது கிடைப்பை GK STUDIOS உறுதி செய்ய முடியாது.',
  },
  'terms.selection.title': { en: 'PHOTO SELECTION', ta: 'புகைப்படத் தேர்வு' },
  'terms.selection.description': {
    en: 'Please select photos according to the number of photos included in your confirmed package.',
    ta: 'உறுதிப்படுத்தப்பட்ட தொகுப்பில் சேர்க்கப்பட்டுள்ள புகைப்படங்களின் எண்ணிக்கைக்கு ஏற்ப புகைப்படங்களைத் தேர்ந்தெடுக்கவும்.',
  },
  'terms.sheets.title': { en: 'EXTRA PHOTO SHEETS', ta: 'கூடுதல் புகைப்படத் தாள்கள்' },
  'terms.sheets.before': {
    en: 'Need extra photo sheets? No problem! Additional sheets will cost',
    ta: 'கூடுதல் புகைப்படத் தாள்கள் வேண்டுமா? ஏற்பாடு செய்கிறோம். ஒவ்வொரு தாளுக்கும்',
  },
  'terms.sheets.price': { en: '₹300', ta: '₹300' },
  'terms.sheets.after': { en: 'per sheet.', ta: 'செலுத்த வேண்டும்.' },
  'terms.delivery.title': { en: 'ALBUM DELIVERY TIME', ta: 'ஆல்பம் வழங்கும் காலம்' },
  'terms.delivery.before': {
    en: 'After you submit your final photo selection and approve the album design, please allow up to',
    ta: 'இறுதிப் புகைப்படத் தேர்வைச் சமர்ப்பித்து ஆல்பம் வடிவமைப்பை ஒப்புதல் அளித்த பிறகு, ஆல்பத்தை முடித்து வழங்க',
  },
  'terms.delivery.duration': { en: '2 months', ta: '2 மாதங்கள்' },
  'terms.delivery.after': {
    en: 'for us to complete and deliver your album.',
    ta: 'வரை அவகாசம் அளிக்கவும்.',
  },
  'terms.complimentary.title': { en: 'COMPLIMENTARY OFFERS', ta: 'இலவசச் சலுகைகள்' },
  'terms.complimentary.description': {
    en: 'If you need any free prints, services or extra files, please discuss and confirm them with us before finalising your package.',
    ta: 'இலவச அச்சுப் பிரதிகள், சேவைகள் அல்லது கூடுதல் கோப்புகள் தேவைப்பட்டால், தொகுப்பை இறுதி செய்வதற்கு முன் எங்களுடன் பேசி உறுதிப்படுத்தவும்.',
  },
  'terms.confirmation.title': { en: 'PACKAGE CONFIRMATION', ta: 'தொகுப்பு உறுதிப்படுத்தல்' },
  'terms.confirmation.description': {
    en: 'Only the complimentary items agreed upon before booking confirmation will be included. Additional free items cannot be requested after the package is confirmed.',
    ta: 'முன்பதிவு உறுதிப்படுத்துவதற்கு முன் ஒப்புக்கொண்ட இலவசப் பொருட்கள் மட்டுமே சேர்க்கப்படும். தொகுப்பு உறுதிப்படுத்தப்பட்ட பிறகு கூடுதல் இலவசப் பொருட்களைக் கோர முடியாது.',
  },
  'terms.afterDelivery.title': {
    en: 'AFTER RECEIVING YOUR PHOTOS & FILES',
    ta: 'புகைப்படங்கள் மற்றும் கோப்புகளைப் பெற்ற பிறகு',
  },
  'terms.afterDelivery.description': {
    en: 'Once we hand over your photos and event files, please keep them safe and maintain backup copies. GK Studios will not be responsible for any loss or damage after delivery.',
    ta: 'புகைப்படங்கள் மற்றும் நிகழ்வு கோப்புகளை ஒப்படைத்த பிறகு, அவற்றைப் பாதுகாப்பாக வைத்துப் பிரதிகளை காப்புப் பிரதி எடுக்கவும். ஒப்படைத்த பின்னர் ஏற்படும் இழப்பு அல்லது சேதத்திற்கு GK STUDIOS பொறுப்பல்ல.',
  },
  'terms.agreement.title': { en: 'AGREEMENT', ta: 'ஒப்புதல்' },
  'terms.agreement.description': {
    en: 'By confirming your booking, you agree that you have read, understood and accepted all the above terms and conditions.',
    ta: 'முன்பதிவை உறுதிப்படுத்துவதன் மூலம், மேலே உள்ள அனைத்து விதிமுறைகளையும் படித்து, புரிந்து, ஏற்றுக்கொண்டதாக ஒப்புக்கொள்கிறீர்கள்.',
  },
  'terms.important.title': { en: 'IMPORTANT NOTE', ta: 'முக்கிய குறிப்பு' },
  'terms.important.description': {
    en: 'To avoid any confusion later, please discuss all your requirements, package details, complimentary offers and additional services with us before confirming your booking.',
    ta: 'பின்னர் குழப்பம் ஏற்படாமல் இருக்க, முன்பதிவை உறுதிப்படுத்துவதற்கு முன் உங்கள் தேவைகள், தொகுப்பு விவரங்கள், இலவசச் சலுகைகள் மற்றும் கூடுதல் சேவைகள் குறித்து எங்களுடன் பேசுங்கள்.',
  },
  'terms.important.confirmed': {
    en: 'Once your package is confirmed, the agreed terms and conditions will apply.',
    ta: 'உங்கள் தொகுப்பு உறுதிப்படுத்தப்பட்டதும், ஒப்புக்கொண்ட விதிமுறைகள் மற்றும் நிபந்தனைகள் பொருந்தும்.',
  },
  'terms.thankYou': {
    en: 'THANK YOU FOR CHOOSING GK STUDIOS!',
    ta: 'GK STUDIOS-ஐத் தேர்ந்தெடுத்ததற்கு நன்றி!',
  },
  'terms.tagline': {
    en: 'Your Memories, Our Responsibility.',
    ta: 'உங்கள் நினைவுகள், எங்கள் பொறுப்பு.',
  },
  'terms.acceptance': {
    en: 'I have read and understood the above terms and agree to them.',
    ta: 'மேலே உள்ள விதிமுறைகளைப் படித்து புரிந்துகொண்டேன்; அவற்றை ஏற்கிறேன்.',
  },
  'terms.goBack': { en: 'Go Back', ta: 'திரும்பிச் செல்ல' },
  'terms.confirming': { en: 'Confirming...', ta: 'உறுதிப்படுத்தப்படுகிறது...' },
  'terms.acceptContinue': { en: 'Accept & Continue', ta: 'ஏற்று தொடரவும்' },
  'terms.close': { en: 'Close', ta: 'மூடு' },
  'footer.whatsapp': { en: 'WhatsApp', ta: 'WhatsApp' },
  'footer.tagline': { en: 'Creating Memories.', ta: 'என்றென்றும் நிலைக்கும் நினைவுகள்.' },
  'footer.copyright': { en: '© 2026 GK STUDIOS. All rights reserved.', ta: '© 2026 GK STUDIOS. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.' },
  'footer.credit': { en: 'Designed with passion. Creating memories.', ta: 'அன்பால் வடிவமைத்தது. நினைவுகளை உருவாக்குகிறது.' },
  'footer.admin': { en: 'Admin', ta: 'நிர்வாகம்' },
  'stats.celebrations': { en: 'Celebrations', ta: 'விழாக்கள்' },
  'stats.years': { en: 'Years', ta: 'ஆண்டுகள்' },
  'stats.cinema': { en: 'Cinema', ta: 'சினிமா' },
  'stats.albums': { en: 'Albums', ta: 'ஆல்பங்கள்' },
  'stats.aria': { en: 'Studio highlights', ta: 'ஸ்டுடியோ சிறப்புகள்' },
  'promise.eyebrow': { en: 'OUR PROMISE', ta: 'எங்கள் உறுதி' },
  'promise.heading': { en: 'Memories, Delivered with Care.', ta: 'அக்கறையுடன் வழங்கப்படும் நினைவுகள்.' },
  'promise.subtitle': {
    en: 'From your special day to your hands, every step matters.',
    ta: 'உங்கள் சிறப்பு நாளிலிருந்து உங்கள் கைகளுக்கு வரும் வரை, ஒவ்வொரு படியும் முக்கியம்.',
  },
  'promise.selectionTimeframe': { en: 'NEXT DAY', ta: 'அடுத்த நாள்' },
  'promise.deliveryTimeframe': { en: 'WITHIN 90 DAYS', ta: '90 நாட்களுக்குள்' },
  'promise.selectionTitle': { en: 'Home Photo Selection', ta: 'வீட்டில் புகைப்படத் தேர்வு' },
  'promise.deliveryTitle': { en: 'Album & Film Delivery', ta: 'ஆல்பம் & திரைப்பட வழங்கல்' },
  'promise.selectionDescription': {
    en: 'The next day after your event is captured, we visit your home to help you select your favourite photos.',
    ta: 'நிகழ்வு படம்பிடிக்கப்பட்ட மறுநாள், உங்களுக்கு விருப்பமான புகைப்படங்களைத் தேர்வு செய்ய உங்கள் வீட்டிற்கு வருவோம்.',
  },
  'promise.homeVisit': {
    en: 'Home visit',
    ta: 'வீட்டு வருகை',
  },
  'promise.deliveryDescription': {
    en: 'Your wedding album and film, beautifully finished and delivered within 90 days of your event.',
    ta: 'உங்கள் திருமண ஆல்பமும் திரைப்படமும் அழகாக நிறைவுசெய்யப்பட்டு, நிகழ்வுக்கு 90 நாட்களுக்குள் வழங்கப்படும்.',
  },
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

export function getPackageCopy(
  pkg: StudioPackage
): { name: string; audience: string; duration: string; deliverables: string[] } {
  return {
    name: pkg.name,
    audience: pkg.audience,
    duration: pkg.duration,
    deliverables: pkg.deliverables,
  };
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
