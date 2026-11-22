/**
 * GK Studios — Shared Bilingual Terms and Conditions
 * Exact source of truth extracted from client-facing terms modal & i18n
 */

export interface BilingualTerm {
  id: string;
  title?: {
    en: string;
    ta: string;
  };
  en: string; // Exact existing English text from the site
  ta: string; // Accurate Tamil translation matching the English clause
}

export const STUDIO_TERMS_AND_CONDITIONS: BilingualTerm[] = [
  {
    id: 'payment-terms',
    title: {
      en: 'Payment Terms (20% – 60% – 20%)',
      ta: 'கட்டண விதிமுறைகள் (20% – 60% – 20%)',
    },
    en: 'Pay 20% in advance to confirm your booking. Pay 60% during the event or production. Pay the remaining 20% before receiving your final photos, albums and event files.',
    ta: 'முன்பதிவை உறுதிப்படுத்த 20% முன்பணமாகச் செலுத்தவும். நிகழ்வு அல்லது தயாரிப்புப் பணிகளின்போது 60% செலுத்தவும். இறுதிப் புகைப்படங்கள், ஆல்பங்கள் மற்றும் நிகழ்வு கோப்புகளைப் பெறுவதற்கு முன் மீதமுள்ள 20% செலுத்தவும்.',
  },
  {
    id: 'photo-collection',
    title: {
      en: 'Photo & File Collection (120 Days)',
      ta: 'புகைப்படங்கள் மற்றும் கோப்புகளைப் பெறுதல் (120 நாட்கள்)',
    },
    en: 'Please collect your photos and event files within 120 days from your event date or order confirmation.',
    ta: 'உங்கள் நிகழ்வு நடைபெற்ற நாள் அல்லது ஆர்டர் உறுதிப்படுத்தப்பட்ட நாளிலிருந்து 120 நாட்களுக்குள், புகைப்படங்களையும் நிகழ்வு கோப்புகளையும் பெற்றுக்கொள்ளுங்கள்.',
  },
  {
    id: 'uncollected-files',
    title: {
      en: 'Uncollected Photos & Files',
      ta: 'பெறப்படாத புகைப்படங்கள் மற்றும் கோப்புகள்',
    },
    en: 'If you do not collect your photos or files within 120 days, GK Studios cannot guarantee their storage, safety or availability.',
    ta: 'நீங்கள் புகைப்படங்கள் அல்லது கோப்புகளை 120 நாட்களுக்குள் பெற்றுக்கொள்ளாவிட்டால், அவற்றின் சேமிப்பு, பாதுகாப்பு அல்லது கிடைப்பை GK STUDIOS உறுதி செய்ய முடியாது.',
  },
  {
    id: 'photo-selection',
    title: {
      en: 'Photo Selection',
      ta: 'புகைப்படத் தேர்வு',
    },
    en: 'Please select photos according to the number of photos included in your confirmed package.',
    ta: 'உறுதிப்படுத்தப்பட்ட தொகுப்பில் சேர்க்கப்பட்டுள்ள புகைப்படங்களின் எண்ணிக்கைக்கு ஏற்ப புகைப்படங்களைத் தேர்ந்தெடுக்கவும்.',
  },
  {
    id: 'extra-sheets',
    title: {
      en: 'Extra Photo Sheets (₹300/sheet)',
      ta: 'கூடுதல் புகைப்படத் தாள்கள் (தாள் ₹300)',
    },
    en: 'Need extra photo sheets? No problem! Additional sheets will cost ₹300 per sheet.',
    ta: 'கூடுதல் புகைப்படத் தாள்கள் வேண்டுமா? ஏற்பாடு செய்கிறோம். ஒவ்வொரு தாளுக்கும் ₹300 செலுத்த வேண்டும்.',
  },
  {
    id: 'album-delivery',
    title: {
      en: 'Album Delivery Time (2 Months)',
      ta: 'ஆல்பம் வழங்கும் காலம் (2 மாதங்கள்)',
    },
    en: 'After you submit your final photo selection and approve the album design, please allow up to 2 months for us to complete and deliver your album.',
    ta: 'இறுதிப் புகைப்படத் தேர்வைச் சமர்ப்பித்து ஆல்பம் வடிவமைப்பை ஒப்புதல் அளித்த பிறகு, ஆல்பத்தை முடித்து வழங்க 2 மாதங்கள் வரை அவகாசம் அளிக்கவும்.',
  },
  {
    id: 'complimentary-offers',
    title: {
      en: 'Complimentary Offers',
      ta: 'இலவசச் சலுகைகள்',
    },
    en: 'If you need any free prints, services or extra files, please discuss and confirm them with us before finalising your package.',
    ta: 'இலவச அச்சுப் பிரதிகள், சேவைகள் அல்லது கூடுதல் கோப்புகள் தேவைப்பட்டால், தொகுப்பை இறுதி செய்வதற்கு முன் எங்களுடன் பேசி உறுதிப்படுத்தவும்.',
  },
  {
    id: 'package-confirmation',
    title: {
      en: 'Package Confirmation',
      ta: 'தொகுப்பு உறுதிப்படுத்தல்',
    },
    en: 'Only the complimentary items agreed upon before booking confirmation will be included. Additional free items cannot be requested after the package is confirmed.',
    ta: 'முன்பதிவு உறுதிப்படுத்துவதற்கு முன் ஒப்புக்கொண்ட இலவசப் பொருட்கள் மட்டுமே சேர்க்கப்படும். தொகுப்பு உறுதிப்படுத்தப்பட்ட பிறகு கூடுதல் இலவசப் பொருட்களைக் கோர முடியாது.',
  },
  {
    id: 'after-delivery',
    title: {
      en: 'After Receiving Your Photos & Files',
      ta: 'புகைப்படங்கள் மற்றும் கோப்புகளைப் பெற்ற பிறகு',
    },
    en: 'Once we hand over your photos and event files, please keep them safe and maintain backup copies. GK Studios will not be responsible for any loss or damage after delivery.',
    ta: 'புகைப்படங்கள் மற்றும் நிகழ்வு கோப்புகளை ஒப்படைத்த பிறகு, அவற்றைப் பாதுகாப்பாக வைத்துப் பிரதிகளை காப்புப் பிரதி எடுக்கவும். ஒப்படைத்த பின்னர் ஏற்படும் இழப்பு அல்லது சேதத்திற்கு GK STUDIOS பொறுப்பல்ல.',
  },
  {
    id: 'agreement-note',
    title: {
      en: 'Agreement & Confirmation',
      ta: 'ஒப்புதல் மற்றும் உறுதிப்படுத்தல்',
    },
    en: 'By confirming your booking and payment, you agree that you have read, understood and accepted all the above terms and conditions.',
    ta: 'முன்பதிவையும் கட்டணத்தையும் உறுதிப்படுத்துவதன் மூலம், மேலே உள்ள அனைத்து விதிமுறைகளையும் படித்து, புரிந்து, ஏற்றுக்கொண்டதாக ஒப்புக்கொள்கிறீர்கள்.',
  },
];
