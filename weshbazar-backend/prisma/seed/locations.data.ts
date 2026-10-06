/**
 * Afghanistan location dataset — all 34 provinces with their principal
 * cities, named in English, Dari (`fa`) and Pashto (`ps`).
 *
 * Codes follow ISO 3166-2:AF. Order defines the default display order.
 */
import type { ProvinceSeed } from './types';

export const PROVINCES: ProvinceSeed[] = [
  {
    code: 'AF-KAB',
    slug: 'kabul',
    names: { en: 'Kabul', fa: 'کابل', ps: 'کابل' },
    cities: [
      { slug: 'kabul', names: { en: 'Kabul', fa: 'کابل', ps: 'کابل' } },
      { slug: 'paghman', names: { en: 'Paghman', fa: 'پغمان', ps: 'پغمان' } },
      { slug: 'chahar-asyab', names: { en: 'Chahar Asyab', fa: 'چهار آسیاب', ps: 'څلور آسیاب' } },
      { slug: 'bagrami', names: { en: 'Bagrami', fa: 'بگرامی', ps: 'بګرامی' } },
    ],
  },
  {
    code: 'AF-HER',
    slug: 'herat',
    names: { en: 'Herat', fa: 'هرات', ps: 'هرات' },
    cities: [
      { slug: 'herat', names: { en: 'Herat', fa: 'هرات', ps: 'هرات' } },
      { slug: 'islam-qala', names: { en: 'Islam Qala', fa: 'اسلام قلعه', ps: 'اسلام قلعه' } },
      { slug: 'torghundi', names: { en: 'Torghundi', fa: 'تورغندي', ps: 'تورغونډۍ' } },
      { slug: 'injil', names: { en: 'Injil', fa: 'انجیل', ps: 'انجیل' } },
      { slug: 'zinda-jan', names: { en: 'Zinda Jan', fa: 'زنده جان', ps: 'زنده جان' } },
      { slug: 'obeh', names: { en: 'Obeh', fa: 'اوبه', ps: 'اوبه' } },
    ],
  },
  {
    code: 'AF-KAN',
    slug: 'kandahar',
    names: { en: 'Kandahar', fa: 'قندهار', ps: 'کندهار' },
    cities: [
      { slug: 'kandahar', names: { en: 'Kandahar', fa: 'قندهار', ps: 'کندهار' } },
      { slug: 'spin-boldak', names: { en: 'Spin Boldak', fa: 'سپین بولدک', ps: 'سپین بولدک' } },
      { slug: 'maiwand', names: { en: 'Maiwand', fa: 'میوند', ps: 'میوند' } },
      { slug: 'panjwayi', names: { en: 'Panjwayi', fa: 'پنجوایی', ps: 'پنجوايي' } },
      { slug: 'arghandab', names: { en: 'Arghandab', fa: 'ارغنداب', ps: 'ارغنداب' } },
    ],
  },
  {
    code: 'AF-BAL',
    slug: 'balkh',
    names: { en: 'Balkh', fa: 'بلخ', ps: 'بلخ' },
    cities: [
      { slug: 'mazar-e-sharif', names: { en: 'Mazar-e-Sharif', fa: 'مزار شریف', ps: 'مزار شریف' } },
      { slug: 'balkh', names: { en: 'Balkh', fa: 'بلخ', ps: 'بلخ' } },
      { slug: 'khulm', names: { en: 'Khulm', fa: 'خلم', ps: 'خلم' } },
      { slug: 'dehdadi', names: { en: 'Dehdadi', fa: 'دهدادی', ps: 'دهدادي' } },
    ],
  },
  {
    code: 'AF-NAN',
    slug: 'nangarhar',
    names: { en: 'Nangarhar', fa: 'ننگرهار', ps: 'ننګرهار' },
    cities: [
      { slug: 'jalalabad', names: { en: 'Jalalabad', fa: 'جلال آباد', ps: 'جلال آباد' } },
      { slug: 'torkham', names: { en: 'Torkham', fa: 'تورخم', ps: 'تورخم' } },
      { slug: 'rodat', names: { en: 'Rodat', fa: 'رودات', ps: 'رودات' } },
      { slug: 'kama', names: { en: 'Kama', fa: 'کاما', ps: 'کامه' } },
    ],
  },
  {
    code: 'AF-KDZ',
    slug: 'kunduz',
    names: { en: 'Kunduz', fa: 'کندز', ps: 'کندز' },
    cities: [
      { slug: 'kunduz', names: { en: 'Kunduz', fa: 'کندز', ps: 'کندز' } },
      { slug: 'khanabad', names: { en: 'Khanabad', fa: 'خان آباد', ps: 'خان آباد' } },
      { slug: 'imam-sahib', names: { en: 'Imam Sahib', fa: 'امام صاحب', ps: 'امام صاحب' } },
    ],
  },
  {
    code: 'AF-BGL',
    slug: 'baghlan',
    names: { en: 'Baghlan', fa: 'بغلان', ps: 'بغلان' },
    cities: [
      { slug: 'puli-khumri', names: { en: 'Puli Khumri', fa: 'پل خمری', ps: 'پل خمري' } },
      { slug: 'baghlan', names: { en: 'Baghlan', fa: 'بغلان', ps: 'بغلان' } },
    ],
  },
  {
    code: 'AF-HEL',
    slug: 'helmand',
    names: { en: 'Helmand', fa: 'هلمند', ps: 'هلمند' },
    cities: [
      { slug: 'lashkar-gah', names: { en: 'Lashkar Gah', fa: 'لشکرگاه', ps: 'لښکرګاه' } },
      { slug: 'gereshk', names: { en: 'Gereshk', fa: 'گرشک', ps: 'ګرشک' } },
      { slug: 'musa-qala', names: { en: 'Musa Qala', fa: 'موسی قلعه', ps: 'موسی کلا' } },
      { slug: 'sangin', names: { en: 'Sangin', fa: 'سنگین', ps: 'سنگین' } },
    ],
  },
  {
    code: 'AF-BDS',
    slug: 'badakhshan',
    names: { en: 'Badakhshan', fa: 'بدخشان', ps: 'بدخشان' },
    cities: [
      { slug: 'fayzabad', names: { en: 'Fayzabad', fa: 'فیض آباد', ps: 'فیض آباد' } },
      { slug: 'baharak', names: { en: 'Baharak', fa: 'بهارک', ps: 'بهارک' } },
      { slug: 'ishkashim', names: { en: 'Ishkashim', fa: 'اشکاشم', ps: 'اشکاشم' } },
      { slug: 'rustaq', names: { en: 'Rustaq', fa: 'رستاق', ps: 'رستاق' } },
    ],
  },
  {
    code: 'AF-TAK',
    slug: 'takhar',
    names: { en: 'Takhar', fa: 'تخار', ps: 'تخار' },
    cities: [
      { slug: 'taloqan', names: { en: 'Taloqan', fa: 'تالقان', ps: 'تالقان' } },
      { slug: 'farkhar', names: { en: 'Farkhar', fa: 'فرخار', ps: 'فرخار' } },
    ],
  },
  {
    code: 'AF-FYB',
    slug: 'faryab',
    names: { en: 'Faryab', fa: 'فاریاب', ps: 'فاریاب' },
    cities: [
      { slug: 'maymana', names: { en: 'Maymana', fa: 'میمنه', ps: 'میمنه' } },
      { slug: 'andkhoy', names: { en: 'Andkhoy', fa: 'اندخوی', ps: 'اندخوی' } },
    ],
  },
  {
    code: 'AF-PIA',
    slug: 'paktia',
    names: { en: 'Paktia', fa: 'پکتیا', ps: 'پکتیا' },
    cities: [
      { slug: 'gardez', names: { en: 'Gardez', fa: 'گردیز', ps: 'ګردیز' } },
      { slug: 'zurmat', names: { en: 'Zurmat', fa: 'زرمت', ps: 'زرمت' } },
    ],
  },
  {
    code: 'AF-PKA',
    slug: 'paktika',
    names: { en: 'Paktika', fa: 'پکتیکا', ps: 'پکتیکا' },
    cities: [
      { slug: 'sharana', names: { en: 'Sharana', fa: 'شرنہ', ps: 'ښرنه' } },
      { slug: 'urgun', names: { en: 'Urgun', fa: 'ارگون', ps: 'ارګون' } },
    ],
  },
  {
    code: 'AF-KHO',
    slug: 'khost',
    names: { en: 'Khost', fa: 'خوست', ps: 'خوست' },
    cities: [{ slug: 'khost', names: { en: 'Khost', fa: 'خوست', ps: 'خوست' } }],
  },
  {
    code: 'AF-LOG',
    slug: 'logar',
    names: { en: 'Logar', fa: 'لوگر', ps: 'لوگر' },
    cities: [{ slug: 'puli-alam', names: { en: 'Puli Alam', fa: 'پل علم', ps: 'پل علم' } }],
  },
  {
    code: 'AF-WAR',
    slug: 'wardak',
    names: { en: 'Maidan Wardak', fa: 'میدان وردک', ps: 'میدان وردګ' },
    cities: [
      { slug: 'maidan-shahr', names: { en: 'Maidan Shahr', fa: 'میدان شهر', ps: 'میدان ښار' } },
    ],
  },
  {
    code: 'AF-GHA',
    slug: 'ghazni',
    names: { en: 'Ghazni', fa: 'غزنی', ps: 'غزني' },
    cities: [
      { slug: 'ghazni', names: { en: 'Ghazni', fa: 'غزنی', ps: 'غزني' } },
      { slug: 'andar', names: { en: 'Andar', fa: 'اندر', ps: 'اندر' } },
    ],
  },
  {
    code: 'AF-PAR',
    slug: 'parwan',
    names: { en: 'Parwan', fa: 'پروان', ps: 'پروان' },
    cities: [
      { slug: 'charikar', names: { en: 'Charikar', fa: 'چاریکار', ps: 'چاریکار' } },
      { slug: 'bagram', names: { en: 'Bagram', fa: 'بگرام', ps: 'بګرام' } },
    ],
  },
  {
    code: 'AF-KAP',
    slug: 'kapisa',
    names: { en: 'Kapisa', fa: 'کاپیسا', ps: 'کاپیسا' },
    cities: [
      { slug: 'mahmud-e-raqi', names: { en: 'Mahmud-e-Raqi', fa: 'محمود راقی', ps: 'محمود راقي' } },
    ],
  },
  {
    code: 'AF-LAG',
    slug: 'laghman',
    names: { en: 'Laghman', fa: 'لغمان', ps: 'لغمان' },
    cities: [{ slug: 'mihtarlam', names: { en: 'Mihtarlam', fa: 'مهترلام', ps: 'مهترلام' } }],
  },
  {
    code: 'AF-KNR',
    slug: 'kunar',
    names: { en: 'Kunar', fa: 'کنر', ps: 'کونړ' },
    cities: [{ slug: 'asadabad', names: { en: 'Asadabad', fa: 'اسعد آباد', ps: 'اسعد آباد' } }],
  },
  {
    code: 'AF-NUR',
    slug: 'nuristan',
    names: { en: 'Nuristan', fa: 'نورستان', ps: 'نورستان' },
    cities: [{ slug: 'parun', names: { en: 'Parun', fa: 'پارون', ps: 'پارون' } }],
  },
  {
    code: 'AF-BAM',
    slug: 'bamyan',
    names: { en: 'Bamyan', fa: 'بامیان', ps: 'بامیان' },
    cities: [{ slug: 'bamyan', names: { en: 'Bamyan', fa: 'بامیان', ps: 'بامیان' } }],
  },
  {
    code: 'AF-DAY',
    slug: 'daykundi',
    names: { en: 'Daykundi', fa: 'دایکندی', ps: 'دایکندی' },
    cities: [{ slug: 'nili', names: { en: 'Nili', fa: 'نیلی', ps: 'نیلی' } }],
  },
  {
    code: 'AF-URU',
    slug: 'uruzgan',
    names: { en: 'Uruzgan', fa: 'ارزگان', ps: 'ارزګان' },
    cities: [{ slug: 'tarinkot', names: { en: 'Tarinkot', fa: 'ترینکوت', ps: 'ترینکوټ' } }],
  },
  {
    code: 'AF-ZAB',
    slug: 'zabul',
    names: { en: 'Zabul', fa: 'زابل', ps: 'زابل' },
    cities: [{ slug: 'qalat', names: { en: 'Qalat', fa: 'قلات', ps: 'قلات' } }],
  },
  {
    code: 'AF-NIM',
    slug: 'nimroz',
    names: { en: 'Nimroz', fa: 'نیمروز', ps: 'نیمروز' },
    cities: [{ slug: 'zaranj', names: { en: 'Zaranj', fa: 'زرنج', ps: 'زرنج' } }],
  },
  {
    code: 'AF-FRA',
    slug: 'farah',
    names: { en: 'Farah', fa: 'فراه', ps: 'فراه' },
    cities: [{ slug: 'farah', names: { en: 'Farah', fa: 'فراه', ps: 'فراه' } }],
  },
  {
    code: 'AF-BDG',
    slug: 'badghis',
    names: { en: 'Badghis', fa: 'بادغیس', ps: 'بادغیس' },
    cities: [{ slug: 'qala-e-naw', names: { en: 'Qala-e-Naw', fa: 'قلعه نو', ps: 'قلعه نو' } }],
  },
  {
    code: 'AF-GHO',
    slug: 'ghor',
    names: { en: 'Ghor', fa: 'غور', ps: 'غور' },
    cities: [{ slug: 'firozkoh', names: { en: 'Firozkoh', fa: 'فیروزکوه', ps: 'فیروزکوه' } }],
  },
  {
    code: 'AF-SAM',
    slug: 'samangan',
    names: { en: 'Samangan', fa: 'سمنگان', ps: 'سمنګان' },
    cities: [{ slug: 'aybak', names: { en: 'Aybak', fa: 'ایبک', ps: 'ایبک' } }],
  },
  {
    code: 'AF-SAR',
    slug: 'sar-e-pol',
    names: { en: 'Sar-e Pol', fa: 'سرپل', ps: 'سرپل' },
    cities: [{ slug: 'sar-e-pol', names: { en: 'Sar-e Pol', fa: 'سرپل', ps: 'سرپل' } }],
  },
  {
    code: 'AF-JOW',
    slug: 'jowzjan',
    names: { en: 'Jowzjan', fa: 'جوزجان', ps: 'جوزجان' },
    cities: [
      { slug: 'sheberghan', names: { en: 'Sheberghan', fa: 'شبرغان', ps: 'شبرغان' } },
      { slug: 'aqcha', names: { en: 'Aqcha', fa: 'آقچه', ps: 'آقچه' } },
    ],
  },
  {
    code: 'AF-PAN',
    slug: 'panjshir',
    names: { en: 'Panjshir', fa: 'پنجشیر', ps: 'پنجشیر' },
    cities: [{ slug: 'bazarak', names: { en: 'Bazarak', fa: 'بازارک', ps: 'بازارک' } }],
  },
];
