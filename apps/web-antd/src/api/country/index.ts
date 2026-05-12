/**
 * 国家区号
 */
export interface CountryCode {
  /** 国家名称和区号 */
  label: string;
  /** 区号值 */
  value: string;
}

/**
 * 获取手机号国家码列表
 */
export async function getCountryListApi() {
  // 使用从区号.txt文件中解析的数据
  const countryData = [
    {
      code: '+1',
      country: 'U.S. / Canada',
    },
    {
      code: '+20',
      country: 'مصر',
    },
    {
      code: '+212',
      country: 'المغرب',
    },
    {
      code: '+27',
      country: 'Suid-Afrika',
    },
    {
      code: '+30',
      country: 'Ελλάδα',
    },
    {
      code: '+31',
      country: 'Nederland',
    },
    {
      code: '+32',
      country: 'Belgique',
    },
    {
      code: '+33',
      country: 'France',
    },
    {
      code: '+34',
      country: 'España',
    },
    {
      code: '+350',
      country: 'Gibraltar',
    },
    {
      code: '+351',
      country: 'Portugal',
    },
    {
      code: '+352',
      country: 'Lëtzebuerg',
    },
    {
      code: '+353',
      country: 'Éire',
    },
    {
      code: '+354',
      country: 'Ísland',
    },
    {
      code: '+355',
      country: 'Shqipëria',
    },
    {
      code: '+356',
      country: 'Malta',
    },
    {
      code: '+357',
      country: 'Κύπρος',
    },
    {
      code: '+358',
      country: 'Suomi',
    },
    {
      code: '+359',
      country: 'България',
    },
    {
      code: '+36',
      country: 'Magyarország',
    },
    {
      code: '+370',
      country: 'Lietuva',
    },
    {
      code: '+371',
      country: 'Latvija',
    },
    {
      code: '+372',
      country: 'Eesti',
    },
    {
      code: '+373',
      country: 'Moldova',
    },
    {
      code: '+374',
      country: 'Հայաստան',
    },
    {
      code: '+375',
      country: 'Беларусь',
    },
    {
      code: '+376',
      country: 'Andorra',
    },
    {
      code: '+377',
      country: 'Monaco',
    },
    {
      code: '+378',
      country: 'San Marino',
    },
    {
      code: '+379',
      country: 'Città del Vaticano',
    },
    {
      code: '+380',
      country: 'Украина',
    },
    {
      code: '+381',
      country: 'Србија',
    },
    {
      code: '+382',
      country: 'Crna Gora',
    },
    {
      code: '+385',
      country: 'Hrvatska',
    },
    {
      code: '+386',
      country: 'Slovenija',
    },
    {
      code: '+387',
      country: 'Bosna i Hercegovina',
    },
    {
      code: '+389',
      country: 'Северна Македонија',
    },
    {
      code: '+39',
      country: 'Italia',
    },
    {
      code: '+40',
      country: 'România',
    },
    {
      code: '+41',
      country: 'Schweiz',
    },
    {
      code: '+420',
      country: 'Česko',
    },
    {
      code: '+421',
      country: 'Slovensko',
    },
    {
      code: '+43',
      country: 'Österreich',
    },
    {
      code: '+44',
      country: 'United Kingdom',
    },
    {
      code: '+45',
      country: 'Danmark',
    },
    {
      code: '+46',
      country: 'Sverige',
    },
    {
      code: '+47',
      country: 'Norge',
    },
    {
      code: '+48',
      country: 'Polska',
    },
    {
      code: '+49',
      country: 'Deutschland',
    },
    {
      code: '+51',
      country: 'Perú',
    },
    {
      code: '+52',
      country: 'México',
    },
    {
      code: '+53',
      country: 'Cuba',
    },
    {
      code: '+54',
      country: 'Argentina',
    },
    {
      code: '+55',
      country: 'Brasil',
    },
    {
      code: '+56',
      country: 'Chile',
    },
    {
      code: '+57',
      country: 'Colombia',
    },
    {
      code: '+58',
      country: 'Venezuela',
    },
    {
      code: '+590',
      country: 'Guadeloupe',
    },
    {
      code: '+591',
      country: 'Bolivia',
    },
    {
      code: '+592',
      country: 'Guyana',
    },
    {
      code: '+593',
      country: 'Ecuador',
    },
    {
      code: '+594',
      country: 'Guyane française',
    },
    {
      code: '+595',
      country: 'Paraguay',
    },
    {
      code: '+596',
      country: 'Martinique',
    },
    {
      code: '+597',
      country: 'Suriname',
    },
    {
      code: '+598',
      country: 'Uruguay',
    },
    {
      code: '+60',
      country: 'Malaysia',
    },
    {
      code: '+61',
      country: 'Australia',
    },
    {
      code: '+62',
      country: 'Indonesia',
    },
    {
      code: '+63',
      country: 'Pilipinas',
    },
    {
      code: '+64',
      country: 'New Zealand',
    },
    {
      code: '+65',
      country: 'Singapore',
    },
    {
      code: '+66',
      country: 'ไทย',
    },
    {
      code: '+7',
      country: 'Россия、Казахстан',
    },
    {
      code: '+81',
      country: '日本',
    },
    {
      code: '+82',
      country: '대한민국',
    },
    {
      code: '+84',
      country: 'Việt Nam',
    },
    {
      code: '+850',
      country: '조선민주주의인민공화국',
    },
    {
      code: '+852',
      country: '中国香港',
    },
    {
      code: '+853',
      country: '中国澳門',
    },
    {
      code: '+855',
      country: 'កម្ពុជា',
    },
    {
      code: '+856',
      country: 'ລາວ',
    },
    {
      code: '+86',
      country: '中国',
    },
    {
      code: '+886',
      country: '台湾',
    },
    {
      code: '+90',
      country: 'Türkiye',
    },
    {
      code: '+91',
      country: 'भारत',
    },
    {
      code: '+92',
      country: 'پاکستان',
    },
    {
      code: '+93',
      country: 'افغانستان',
    },
    {
      code: '+94',
      country: 'ශ්‍රී ලංකාව',
    },
    {
      code: '+95',
      country: 'မြန်မာ',
    },
    {
      code: '+960',
      country: 'ދިވެހިރާއްޖެ',
    },
    {
      code: '+961',
      country: 'لبنان',
    },
    {
      code: '+962',
      country: 'الاردن',
    },
    {
      code: '+963',
      country: 'سوريا',
    },
    {
      code: '+964',
      country: 'العراق',
    },
    {
      code: '+965',
      country: 'الكويت',
    },
    {
      code: '+966',
      country: 'السعودية',
    },
    {
      code: '+967',
      country: 'اليمن',
    },
    {
      code: '+968',
      country: 'عُمان',
    },
    {
      code: '+970',
      country: 'فلسطين',
    },
    {
      code: '+971',
      country: 'الإمارات',
    },
    {
      code: '+972',
      country: 'ישראל',
    },
    {
      code: '+973',
      country: 'البحرين',
    },
    {
      code: '+974',
      country: 'قطر',
    },
    {
      code: '+975',
      country: 'འབྲུག་ཡུལ',
    },
    {
      code: '+976',
      country: 'Монгол Улс',
    },
    {
      code: '+977',
      country: 'नेपाल',
    },
    {
      code: '+98',
      country: 'ایران',
    },
  ];

  return countryData.map((item) => {
    // 构建label，使用固定宽度的格式，确保国家名称和区号分成两列等宽显示
    const label = `${item.code} - ${item.country}`;
    return { label, value: item.code };
  });
}
