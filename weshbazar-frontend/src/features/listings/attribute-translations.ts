/**
 * Dynamic attribute localization (fa-AF) for the listings surface.
 *
 * The frozen v1.0.0 backend ships category attribute definitions with English
 * labels and English SELECT option values (see prisma/seed/taxonomy.data.ts).
 * This module is the single dictionary that turns those raw English key/value
 * strings into natural Dari before they reach the UI, so no raw English leaks
 * into the specification table. Unknown keys/values pass through unchanged so
 * bad or future data never crashes a page (§57).
 */

/** Attribute definition key → Dari label (authoritative, keyed by stable slug). */
const ATTRIBUTE_LABELS: Record<string, string> = {
  // Vehicles
  make: 'شرکت سازنده',
  model: 'مدل',
  year: 'سال ساخت',
  mileage_km: 'مسافت پیموده‌شده (کیلومتر)',
  fuel_type: 'نوع تیل',
  transmission: 'Transmission',
  body_type: 'نوع بدنه',
  color: 'رنگ',
  engine_cc: 'حجم انجن (سی‌سی)',
  bike_type: 'نوع بایسکل',
  wheel_size: 'اندازهٔ چرخ',
  part_type: 'نوع پرزه',
  compatible_make: 'سازگار با شرکت سازنده',
  // Real estate
  property_type: 'نوع جایداد',
  bedrooms: 'تعداد اتاق خواب',
  bathrooms: 'تعداد تشناب',
  area_sqm: 'مساحت (متر مربع)',
  floor_number: 'شمارهٔ منزل',
  furnished: 'مبله',
  parking: 'جای پارک موتر',
  space_type: 'نوع مکان',
  // Electronics
  brand: 'برند',
  storage: 'حافظه',
  ram: 'RAM',
  network: 'شبکه',
  battery_health: 'وضعیت باتری',
  screen_size: 'اندازهٔ صفحه‌نمایش',
  processor: 'پروسسور',
  storage_type: 'نوع حافظه',
  storage_size: 'ظرفیت حافظه',
  screen_type: 'نوع صفحه‌نمایش',
  device_type: 'نوع دستگاه',
  platform: 'پلتفرم',
  // General & goods
  item_type: 'نوع جنس',
  material: 'جنس',
  condition: 'وضعیت',
  appliance_type: 'نوع وسیله',
  energy_rating: 'درجهٔ مصرف انرژی',
  size: 'اندازه',
  // Jobs & services
  job_type: 'نوع وظیفه',
  salary_period: 'دورهٔ پرداخت معاش',
  experience_years: 'تجربهٔ کاری (سال)',
  company_name: 'نام شرکت',
  service_type: 'نوع خدمت',
  service_area: 'ساحهٔ ارائهٔ خدمت',
  // Animals & agriculture
  animal_type: 'نوع حیوان',
  head_count: 'تعداد',
  age_months: 'سن (ماه)',
  breed: 'نوع حیوان',
  tool_type: 'نوع ابزار',
  power_source: 'منبع انرژی',
  // Books & education
  book_type: 'نوع کتاب',
  language: 'زبان',
  author: 'نویسنده',
};

/** English display label → Dari (fallback when a key is missing from above). */
const EN_LABEL_TRANSLATIONS: Record<string, string> = {
  'property type': 'نوع جایداد',
  bedrooms: 'تعداد اتاق خواب',
  bathrooms: 'تعداد تشناب',
  area: 'مساحت (متر مربع)',
  'floor number': 'شمارهٔ منزل',
  furnished: 'مبله',
  parking: 'جای پارک موتر',
  year: 'سال ساخت',
  mileage: 'مسافت پیموده‌شده',
  transmission: 'Transmission',
  condition: 'وضعیت',
  storage: 'حافظه',
  ram: 'RAM',
  make: 'شرکت سازنده',
  model: 'مدل',
  color: 'رنگ',
  brand: 'برند',
  'fuel type': 'نوع تیل',
  'body type': 'نوع بدنه',
  'space type': 'نوع مکان',
  'battery health': 'وضعیت باتری',
  'screen size': 'اندازهٔ صفحه‌نمایش',
  'screen type': 'نوع صفحه‌نمایش',
  'storage type': 'نوع حافظه',
  'storage size': 'ظرفیت حافظه',
  'device type': 'نوع دستگاه',
  'item type': 'نوع جنس',
  material: 'جنس',
  size: 'اندازه',
  language: 'زبان',
  author: 'نویسنده',
  'job type': 'نوع وظیفه',
  'salary period': 'دورهٔ پرداخت معاش',
  'service type': 'نوع خدمت',
  'service area': 'ساحهٔ ارائهٔ خدمت',
  'animal type': 'نوع حیوان',
  'book type': 'نوع کتاب',
  'power source': 'منبع انرژی',
};

/**
 * Localize an attribute label. Resolution order: stable slug key → trimmed
 * English label → the raw label (or key) as a last-resort pass-through.
 */
export function translateAttributeLabel(key: string, fallback?: string): string {
  const slug = key.trim();
  const byKey = ATTRIBUTE_LABELS[slug] ?? ATTRIBUTE_LABELS[slug.toLowerCase()];
  if (byKey) return byKey;
  const enLabel = fallback?.trim();
  if (enLabel) {
    const byEn = EN_LABEL_TRANSLATIONS[enLabel.toLowerCase()];
    if (byEn) return byEn;
    return enLabel;
  }
  return slug;
}

/** SELECT / MULTI_SELECT option value → Dari (keys are the stored slugs). */
const VALUE_TRANSLATIONS: Record<string, string> = {
  yes: 'بله',
  no: 'نخیر',
  // Fuel, transmission, drive
  petrol: 'پترول',
  diesel: 'دیزل',
  hybrid: 'هایبرید',
  electric: 'برقی',
  lpg: 'گاز مایع (LPG)',
  automatic: 'اتومات',
  manual: 'دستی',
  // Colors
  white: 'سفید',
  black: 'سیاه',
  silver: 'نقره‌ای',
  grey: 'خاکستری',
  red: 'سرخ',
  blue: 'آبی',
  green: 'سبز',
  brown: 'نصواری',
  gold: 'طلایی',
  // Storage & RAM sizes
  '16gb': '۱۶ گیگابایت',
  '32gb': '۳۲ گیگابایت',
  '64gb': '۶۴ گیگابایت',
  '128gb': '۱۲۸ گیگابایت',
  '256gb': '۲۵۶ گیگابایت',
  '512gb': '۵۱۲ گیگابایت',
  '1tb': '۱ ترابایت',
  '2tb': '۲ ترابایت',
  '2gb': '۲ گیگابایت',
  '3gb': '۳ گیگابایت',
  '4gb': '۴ گیگابایت',
  '6gb': '۶ گیگابایت',
  '8gb': '۸ گیگابایت',
  '12gb': '۱۲ گیگابایت',
  // Phone brands
  apple: 'اپل',
  samsung: 'سامسونگ',
  xiaomi: 'شیائومی',
  huawei: 'هواوی',
  honor: 'آنر',
  oppo: 'اوپو',
  vivo: 'ویوو',
  realme: 'ریلمی',
  nokia: 'نوکیا',
  infinix: 'اینفینیکس',
  tecno: 'تکنو',
  // Car makes
  toyota: 'تویوتا',
  honda: 'هوندا',
  hyundai: 'هیوندای',
  kia: 'کیا',
  nissan: 'نیسان',
  mitsubishi: 'میتسوبیشی',
  suzuki: 'سوزوکی',
  mazda: 'مزدا',
  'mercedes-benz': 'مرسدس بنز',
  bmw: 'BMW',
  ford: 'فورد',
  chevrolet: 'شورولت',
  // Body & bicycle types
  sedan: 'سدان',
  suv: 'شاسی‌بلند',
  hatchback: 'هاچ‌بک',
  pickup: 'پیکاپ',
  van: 'ون',
  minibus: 'مینی‌بوس',
  truck: 'لاری',
  mountain: 'کوهستانی',
  road: 'جاده‌ای',
  city: 'شهری',
  bmx: 'BMX',
  kids: 'اطفال',
  // Vehicle parts
  engine: 'انجن',
  body: 'بدنه و پنل‌ها',
  electrical: 'سیستم برقی',
  'tires-wheels': 'تایر و چرخ',
  interior: 'داخل موتر',
  accessories: 'لوازم جانبی',
  // Property & space types
  apartment: 'آپارتمان',
  house: 'حویلی / خانه',
  villa: 'ویلا',
  land: 'زمین',
  shop: 'دکان',
  office: 'دفتر',
  warehouse: 'گدام',
  // Devices
  tv: 'تلویزیون',
  speaker: 'اسپیکر',
  'sound-system': 'سیستم صوتی',
  receiver: 'رسیور',
  // Furniture & materials
  sofa: 'مبل',
  bed: 'تخت خواب',
  'dining-set': 'میز و چوکی غذاخوری',
  wardrobe: 'الماری',
  'office-desk': 'میز دفتر',
  table: 'میز',
  chair: 'چوکی',
  wood: 'چوب',
  metal: 'فلز',
  fabric: 'تکه',
  leather: 'چرم',
  glass: 'شیشه',
  steel: 'فولاد',
  // Home appliances
  refrigerator: 'یخچال',
  'washing-machine': 'ماشین لباس‌شویی',
  'air-conditioner': 'ایرکاندیشن',
  heater: 'هیتر',
  microwave: 'مایکروویو',
  'water-dispenser': 'آب‌سردکن',
  stove: 'اجاق',
  'vacuum-cleaner': 'جاروبرقی',
  // Clothing
  'shalwar-kameez': 'شلوار و کامیز',
  shirt: 'پیراهن',
  't-shirt': 'تی‌شرت',
  trousers: 'پتلون',
  jacket: 'جاکت',
  coat: 'کوت',
  shoes: 'کفش',
  sandals: 'چپلی',
  dress: 'لباس',
  chador: 'چادری / عبایه',
  blouse: 'بلوز',
  bag: 'بکس',
  scarf: 'چادر',
  // Watches & jewelry
  wristwatch: 'ساعت دستی',
  necklace: 'گردن‌بند',
  ring: 'انگشتر',
  bracelet: 'دست‌بند',
  earrings: 'گوشواره',
  // Jobs & services
  'full-time': 'تمام‌وقت',
  'part-time': 'نیمه‌وقت',
  contract: 'قراردادی',
  internship: 'کارآموزی',
  remote: 'دورکاری',
  monthly: 'ماهانه',
  daily: 'روزانه',
  hourly: 'ساعتی',
  project: 'پروژه‌ای',
  repair: 'ترمیم و ترمیم‌کاری',
  construction: 'اعمار و ساختمان',
  transport: 'ترانسپورت',
  cleaning: 'پاک‌کاری',
  tutoring: 'تدریس',
  design: 'دیزاین و چاپ',
  it: 'کمپیوتر و IT',
  // Animals
  sheep: 'گوسفند',
  goat: 'بز',
  cow: 'گاو',
  camel: 'شتر',
  horse: 'اسپ',
  donkey: 'خر',
  poultry: 'مرغ و ماکیان',
  cat: 'پشک',
  dog: 'سگ',
  bird: 'پرنده',
  fish: 'ماهی',
  'animal-drawn': 'حیوان‌کش',
  fuel: 'تیل',
  // Books & education
  school: 'مکتب',
  university: 'پوهنتون',
  religious: 'دینی',
  novel: 'رمان و ادبیات',
  dictionary: 'قاموس',
  dari: 'دری',
  pashto: 'پشتو',
  english: 'انگلیسی',
  arabic: 'عربی',
  // Sports & baby gear
  football: 'فوتبال',
  cricket: 'کریکت',
  volleyball: 'والیبال',
  bodybuilding: 'پرورش اندام',
  'martial-arts': 'ورزش‌های رزمی',
  cycling: 'بایسکل‌رانی',
  stroller: 'گادی طفل',
  crib: 'تخت طفل',
  'car-seat': 'چوکی طفل در موتر',
  'high-chair': 'چوکی بلند طفل',
  // Generic
  other: 'سایر',
};

/**
 * Localize an attribute value.
/**
 * Localize an attribute value. Boolean-ish «yes/no» tokens are always mapped;
 * otherwise only SELECT / MULTI_SELECT option slugs are translated so free-text
 * values (brands, model names, prose) always pass through untouched.
 */
export function translateAttributeValue(value: string, type: string | null): string {
  const raw = value.trim();
  if (raw === '') return value;
  const lower = raw.toLowerCase();
  if (lower === 'yes') return 'بله';
  if (lower === 'no') return 'نخیر';
  if (type !== 'SELECT' && type !== 'MULTI_SELECT') return value;
  return VALUE_TRANSLATIONS[raw] ?? VALUE_TRANSLATIONS[lower] ?? value;
}