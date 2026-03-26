export type City = {
  id: string;
  name_ru: string;
  name_kk: string;
  lat: number;
  lon: number;
};

// MVP list (expandable). Coordinates are city centers.
export const KZ_CITIES: City[] = [
  { id: 'almaty', name_ru: 'Алматы', name_kk: 'Алматы', lat: 43.238949, lon: 76.889709 },
  { id: 'astana', name_ru: 'Астана', name_kk: 'Астана', lat: 51.169392, lon: 71.449074 },
  { id: 'shymkent', name_ru: 'Шымкент', name_kk: 'Шымкент', lat: 42.3417, lon: 69.5901 },
  { id: 'aktobe', name_ru: 'Актобе', name_kk: 'Ақтөбе', lat: 50.2839, lon: 57.166 },
  { id: 'atyrau', name_ru: 'Атырау', name_kk: 'Атырау', lat: 47.0945, lon: 51.9237 },
  { id: 'aktau', name_ru: 'Актау', name_kk: 'Ақтау', lat: 43.651, lon: 51.1975 },
  { id: 'acsu', name_ru: 'Аксу', name_kk: 'Ақсу', lat: 52.041, lon: 76.927 },
  { id: 'alga', name_ru: 'Алга', name_kk: 'Алға', lat: 49.903, lon: 57.334 },
  { id: 'arkalyk', name_ru: 'Аркалык', name_kk: 'Арқалық', lat: 50.248, lon: 66.92 },
  { id: 'arys', name_ru: 'Арыс', name_kk: 'Арыс', lat: 42.43, lon: 68.8 },
  { id: 'ayagoz', name_ru: 'Аягоз', name_kk: 'Аягөз', lat: 47.964, lon: 80.439 },
  { id: 'baikonur', name_ru: 'Байконур', name_kk: 'Байқоңыр', lat: 45.616, lon: 63.317 },
  { id: 'balqash', name_ru: 'Балхаш', name_kk: 'Балқаш', lat: 46.848, lon: 74.995 },
  { id: 'beyneu', name_ru: 'Бейнеу', name_kk: 'Бейнеу', lat: 45.316, lon: 55.19 },
  { id: 'borovoe', name_ru: 'Бурабай', name_kk: 'Бурабай', lat: 53.084, lon: 70.313 },
  { id: 'ekibastuz', name_ru: 'Экибастуз', name_kk: 'Екібастұз', lat: 51.723, lon: 75.322 },
  { id: 'esik', name_ru: 'Иссык', name_kk: 'Есік', lat: 43.355, lon: 77.453 },
  { id: 'kapchagay', name_ru: 'Конаев', name_kk: 'Қонаев', lat: 43.884, lon: 77.067 },
  { id: 'kentau', name_ru: 'Кентау', name_kk: 'Кентау', lat: 43.516, lon: 68.505 },
  { id: 'karaganda', name_ru: 'Караганда', name_kk: 'Қарағанды', lat: 49.8064, lon: 73.0855 },
  { id: 'kaskelen', name_ru: 'Каскелен', name_kk: 'Қаскелең', lat: 43.207, lon: 76.624 },
  { id: 'kulsary', name_ru: 'Кульсары', name_kk: 'Құлсары', lat: 46.953, lon: 54.02 },
  { id: 'kurchatov', name_ru: 'Курчатов', name_kk: 'Курчатов', lat: 50.756, lon: 78.541 },
  { id: 'kostanay', name_ru: 'Костанай', name_kk: 'Қостанай', lat: 53.2144, lon: 63.6246 },
  { id: 'kyzylorda', name_ru: 'Кызылорда', name_kk: 'Қызылорда', lat: 44.8488, lon: 65.4823 },
  { id: 'lisakovsk', name_ru: 'Лисаковск', name_kk: 'Лисаков', lat: 52.536, lon: 62.493 },
  { id: 'ridder', name_ru: 'Риддер', name_kk: 'Риддер', lat: 50.344, lon: 83.512 },
  { id: 'rudny', name_ru: 'Рудный', name_kk: 'Рудный', lat: 52.972, lon: 63.116 },
  { id: 'saran', name_ru: 'Сарань', name_kk: 'Саран', lat: 49.8, lon: 72.85 },
  { id: 'pavlodar', name_ru: 'Павлодар', name_kk: 'Павлодар', lat: 52.2871, lon: 76.9674 },
  { id: 'petropavl', name_ru: 'Петропавл', name_kk: 'Петропавл', lat: 54.8753, lon: 69.1628 },
  { id: 'kokshetau', name_ru: 'Кокшетау', name_kk: 'Көкшетау', lat: 53.2833, lon: 69.3833 },
  { id: 'oral', name_ru: 'Уральск', name_kk: 'Орал', lat: 51.2278, lon: 51.3865 },
  { id: 'oskemen', name_ru: 'Усть-Каменогорск', name_kk: 'Өскемен', lat: 49.9483, lon: 82.6285 },
  { id: 'semei', name_ru: 'Семей', name_kk: 'Семей', lat: 50.4111, lon: 80.2275 },
  { id: 'taraz', name_ru: 'Тараз', name_kk: 'Тараз', lat: 42.9, lon: 71.3667 },
  { id: 'taldykorgan', name_ru: 'Талдыкорган', name_kk: 'Талдықорған', lat: 45.0156, lon: 78.3739 },
  { id: 'temirtau', name_ru: 'Темиртау', name_kk: 'Теміртау', lat: 50.0549, lon: 72.9647 },
  { id: 'urzhar', name_ru: 'Урджар', name_kk: 'Ұржар', lat: 47.091, lon: 81.63 },
  { id: 'turkistan', name_ru: 'Туркестан', name_kk: 'Түркістан', lat: 43.297, lon: 68.251 },
  { id: 'zhanaozen', name_ru: 'Жанаозен', name_kk: 'Жаңаөзен', lat: 43.337, lon: 52.861 },
  { id: 'zharkent', name_ru: 'Жаркент', name_kk: 'Жаркент', lat: 44.166, lon: 79.98 },
  { id: 'zhezkazgan', name_ru: 'Жезказган', name_kk: 'Жезқазған', lat: 47.783, lon: 67.766 },
  { id: 'turan', name_ru: 'Туркестан обл. (Турар Рыскулов)', name_kk: 'Тұрар Рысқұлов', lat: 42.533, lon: 70.35 }
];

