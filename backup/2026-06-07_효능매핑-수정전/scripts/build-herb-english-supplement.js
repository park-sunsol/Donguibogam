/**
 * herbs-data.js + effect.json에서 영문명 보충
 * 1순위: effect.json herb_hanja/herb_korean → 공식 영문명(scripts/effect-herb-official-english-map.js)
 * 2순위: MANUAL_MAP (TCM 표준명)
 * 3순위: latin_name 기반 추론
 * 4순위: 한글 조합 번역 / 로마자 변환
 * 출력: herb-english-supplement.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HERBS_JS = path.join(ROOT, 'herbs-data.js');
const EFFECT_JSON = path.join(ROOT, 'effect.json');
const OUT_JS = path.join(ROOT, 'herb-english-supplement.js');

const herbsJs = fs.readFileSync(HERBS_JS, 'utf8');
const match = herbsJs.match(/window\.DONGUIBOGAM_HERBS\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
if (!match) throw new Error('DONGUIBOGAM_HERBS 파싱 실패');
const herbs = JSON.parse(match[1]);

const effectData = JSON.parse(fs.readFileSync(EFFECT_JSON, 'utf8'));
const OFFICIAL_MAP = require('./effect-herb-official-english-map.js');

// latin → 영어 유추 (일부 공통)
const LATIN_TO_EN = {
  'panax ginseng': 'Korean ginseng',
  'astragalus': 'Astragalus root',
  'angelica': 'Angelica root',
  'atractylodes': 'Atractylodes',
  'glycyrrhiza': 'Licorice',
  'cinnamomum': 'Cinnamon',
  'ziziphus': 'Jujube',
  'lycium': 'Wolfberry',
  'rehmannia': 'Rehmannia',
  'paeonia': 'Peony',
  'poria': 'Poria',
  'ophiopogon': 'Ophiopogon',
  'schisandra': 'Magnolia vine',
  'prunus persica': 'Peach kernel',
  'prunus armeniaca': 'Apricot kernel',
  'coix': 'Job\'s tears',
  'pueraria': 'Kudzu',
  'platycodon': 'Platycodon',
  'scutellaria': 'Skullcap',
  'coptis': 'Coptis',
  'phellodendron': 'Phellodendron',
  'cnidium': 'Cnidium',
  'lonicera': 'Honeysuckle',
  'carthamus': 'Safflower',
  'sophora': 'Pagoda tree',
  'chrysanthemum': 'Chrysanthemum',
  'cornus': 'Cornelian cherry',
  'lithospermum': 'Gromwell',
  'arctium': 'Burdock',
  'cassia': 'Cassia',
  'imperata': 'Cogon grass',
  'pinellia': 'Pinellia',
  'zingiber': 'Ginger',
  'allium': 'Garlic/Scallion',
  'ephedra': 'Ephedra',
  'mentha': 'Mint',
  'acorus': 'Calamus',
  'gastrodia': 'Gastrodia',
  'eucommia': 'Eucommia bark',
  'morus': 'Mulberry',
  'camellia': 'Tea',
  'santalum': 'Sandalwood',
  'aquilaria': 'Agarwood',
  'aurantium': 'Bitter orange',
  'citrus': 'Citrus',
  'citrullus': 'Watermelon',
  'trichosanthes': 'Snake gourd',
  'amomum': 'Amomum',
  'alpinia': 'Galangal',
  'curcuma': 'Turmeric',
  'cyperus': 'Cyperus',
  'aucklandia': 'Aucklandia',
  'saussurea': 'Saussurea',
  'dolichos': 'Hyacinth bean',
  'phaseolus': 'Bean',
  'vigna': 'Mung bean',
  'oryza': 'Rice',
  'hordeum': 'Barley',
  'triticum': 'Wheat',
  'zea': 'Corn',
  'sesamum': 'Sesame',
  'panax quinquefolius': 'American ginseng',
  'rhinoceros': 'Rhinoceros horn',
  'moschus': 'Musk',
  'cornu cervi': 'Deer antler',
  'margarita': 'Pearl',
  'gypsum': 'Gypsum',
  'talc': 'Talc',
  'realgar': 'Realgar',
  'orpiment': 'Orpiment',
  'sulfur': 'Sulfur',
  'niter': 'Niter',
  'chalcanthite': 'Chalcanthite',
  'malachite': 'Malachite',
  'azurite': 'Azurite',
  'hematite': 'Hematite',
  'magnetite': 'Magnetite',
  'amber': 'Amber',
  'cinnabar': 'Cinnabar',
  'mica': 'Mica',
  'fluorite': 'Fluorite',
  'obsidian': 'Obsidian',
  'carnelian': 'Carnelian',
  'lapis lazuli': 'Lapis lazuli',
  'jade': 'Jade',
  'coturnix': 'Quail',
  'gallus': 'Chicken',
  'sus': 'Pork',
  'capra': 'Goat',
  'ovis': 'Sheep',
  'bos': 'Cattle',
  'ursus': 'Bear',
  'mustela': 'Weasel',
  'homo': 'Human',
  'apis': 'Honeybee',
  'bombyx': 'Silkworm',
  'haliotis': 'Abalone',
  'trionyx': 'Softshell turtle',
  'gecko': 'Gecko',
  'bufo': 'Toad',
  'elaphe': 'Rat snake',
  'python': 'Python'
};

// 한글/한자 → 영문 수동 매핑 (effect에 없는 주요 항목)
const MANUAL_MAP = {
  '두충': 'Eucommia bark', '杜仲': 'Eucommia bark',
  '상백피': 'Mulberry root bark', '桑白皮': 'Mulberry root bark',
  '상엽': 'Mulberry leaf', '桑葉': 'Mulberry leaf',
  '차엽': 'Tea leaf', '茶葉': 'Tea leaf',
  '금은화': 'Honeysuckle flower', '金銀花': 'Honeysuckle flower',
  '홍화': 'Safflower', '紅花': 'Safflower',
  '괴화': 'Pagoda tree flower', '槐花': 'Pagoda tree flower',
  '산국': 'Wild chrysanthemum', '山菊': 'Wild chrysanthemum',
  '산수유': 'Cornelian cherry', '山茱萸': 'Cornelian cherry',
  '행인': 'Apricot kernel', '杏仁': 'Apricot kernel',
  '연자육': 'Lotus seed', '蓮子肉': 'Lotus seed',
  '의이인': 'Job\'s tears', '율무': 'Job\'s tears', '薏苡仁': 'Job\'s tears',
  '녹각': 'Deer antler', '鹿角': 'Deer antler',
  '우담즙': 'Ox gall', '牛膽汁': 'Ox gall',
  '우골': 'Ox bone', '牛骨': 'Ox bone',
  '웅담': 'Bear gall', '熊膽': 'Bear gall',
  '사향': 'Musk', '麝香': 'Musk',
  '봉밀': 'Honey', '蜂蜜': 'Honey',
  '봉독': 'Bee venom', '蜂毒': 'Bee venom',
  '지룡': 'Earthworm', '地龍': 'Earthworm',
  '어교': 'Fish glue', '魚膠': 'Fish glue',
  '별갑': 'Turtle shell', '鼈甲': 'Turtle shell',
  '구판': 'Tortoise plastron', '龜板': 'Tortoise plastron',
  '계란황': 'Egg yolk', '雞卵黃': 'Egg yolk',
  '계골': 'Chicken bone', '鷄骨': 'Chicken bone',
  '아교': 'Donkey-hide gelatin', '阿膠': 'Donkey-hide gelatin',
  '자하거': 'Human placenta', '紫河車': 'Human placenta',
  '광물분말': 'Mineral powder', '석분': 'Stone powder', '石粉': 'Stone powder',
  '금박': 'Gold leaf', '金箔': 'Gold leaf',
  '자연동': 'Native copper', '自然銅': 'Native copper',
  '모려': 'Oyster shell', '牡蠣': 'Oyster shell',
  '용골': 'Dragon bone', '龍骨': 'Dragon bone',
  '건강': 'Dried ginger', '乾薑': 'Dried ginger',
  '창출': 'Atractylodes', '蒼朮': 'Atractylodes',
  '황백': 'Phellodendron', '黃柏': 'Phellodendron',
  '숙지황': 'Prepared rehmannia', '熟地黃': 'Prepared rehmannia',
  '연근': 'Lotus root', '蓮根': 'Lotus root',
  '荷葉': 'Lotus leaf', '연꽃잎': 'Lotus leaf',
  '홍삼': 'Red ginseng', '紅蔘': 'Red ginseng',
  '청피': 'Green tangerine peel', '靑皮': 'Green tangerine peel',
  '복숭아씨': 'Peach kernel', '도인': 'Peach kernel', '桃仁': 'Peach kernel',
  '참깨': 'Sesame', '흑지마': 'Black sesame', '黑芝麻': 'Black sesame',
  '우수': 'Rainwater', '雨水': 'Rainwater',
  '설수': 'Snow water', '雪水': 'Snow water',
  '상수': 'Frost water', '霜水': 'Frost water',
  '정천수': 'Well water', '井泉水': 'Well water',
  '유수': 'Running water', '流水': 'Running water',
  '염': 'Salt', '鹽': 'Salt',
  '옥': 'Jade', '옥석': 'Jade stone', '玉': 'Jade',
  '백토': 'White clay', '백분': 'White powder', '白土': 'White clay',
  '진름미': 'Aged rice', '陳廩米': 'Aged rice',
  '청량미': 'Blue millet', '靑粱米': 'Blue millet',
  '서미': 'Foxtail millet', '黍米': 'Foxtail millet',
  '술미': 'Sorghum', '秫米': 'Sorghum',
  '밀': 'Wheat', '小麥': 'Wheat',
  '대맥': 'Barley', '大麥': 'Barley',
  '모밀': 'Buckwheat', '蕎麥': 'Buckwheat',
  '변두콩': 'Hyacinth bean', '藊豆': 'Hyacinth bean',
  '녹두': 'Mung bean', '菉豆': 'Mung bean',
  '원두': 'Pea', '豌豆': 'Pea',
  '참깨': 'Sesame', '黑芝麻': 'Black sesame',
  '곰의기름': 'Bear fat', '熊脂': 'Bear fat',
  '염소고기': 'Goat meat', '山羊肉': 'Goat meat',
  '양고기': 'Lamb', '羊肉': 'Lamb',
  '돼지족': 'Pig trotter', '족발': 'Pig trotter', '豬蹄': 'Pig trotter',
  '닭발': 'Chicken feet', '鷄爪': 'Chicken feet',
  '돼지간': 'Pig liver', '豬肝': 'Pig liver',
  '계란흰자': 'Egg white', '雞卵白': 'Egg white',
  '닭기름': 'Chicken fat', '鷄脂': 'Chicken fat',
  '돼지비계': 'Lard', '豬脂': 'Lard',
  '돼지피': 'Pig blood', '豬血': 'Pig blood',
  '치즈': 'Cheese', '乳酪': 'Cheese',
  '요거트': 'Yogurt', '發酵乳': 'Fermented milk',
  '말고기': 'Horse meat', '馬肉': 'Horse meat',
  '토끼고기': 'Rabbit meat', '兔肉': 'Rabbit meat',
  '해삼': 'Sea cucumber', '海蔘': 'Sea cucumber',
  '황철광': 'Pyrite', '黃鐵鑛': 'Pyrite',
  '형석': 'Fluorite', '螢石': 'Fluorite',
  '홍옥수': 'Carnelian', '紅玉髓': 'Carnelian',
  '흑요석': 'Obsidian', '黑曜石': 'Obsidian',
  '남동석': 'Azurite', '藍銅鑛': 'Azurite',
  '청금석': 'Lapis lazuli', '靑金石': 'Lapis lazuli',
  '우수': 'Rainwater', '雨水': 'Rainwater',
  '설수': 'Snow water', '雪水': 'Snow water',
  '상수': 'Frost water', '霜水': 'Frost water',
  '정천수': 'Well water', '井泉水': 'Well water',
  '유수': 'Running water', '流水': 'Running water',
  '산암천수': 'Mountain spring', '山岩泉水': 'Mountain spring',
  '해수': 'Seawater', '염담수': 'Brine', '海水': 'Seawater',
  '광천수': 'Mineral water', '鑛泉水': 'Mineral water',
  '호수물': 'Lake water', '湖水': 'Lake water',
  '폭포물': 'Waterfall water', '瀑布水': 'Waterfall water',
  '연못수': 'Pond water', '池水': 'Pond water',
  '당': 'Tang dynasty origin', '唐': 'Tang',
  /* 禽部 - 조류 (분류로 동음이의어 구분) */
  '丹雄雞肉': 'Chicken meat (red rooster)', '단웅계육': 'Chicken meat (red rooster)',
  '白雄雞肉': 'Chicken meat (white rooster)', '백웅계육': 'Chicken meat (white rooster)',
  '烏雄雞肉': 'Chicken meat (black rooster)', '오웅계육': 'Chicken meat (black rooster)',
  '烏雌雞肉': 'Chicken meat (black hen)', '오자계육': 'Chicken meat (black hen)',
  '黃雌雞肉': 'Chicken meat (yellow hen)', '황자계육': 'Chicken meat (yellow hen)',
  '雞子': 'Chicken egg', '계자': 'Chicken egg',
  '白鵝肉': 'Goose meat', '백아육': 'Goose meat', '鵝肉': 'Goose meat', '거위고기': 'Goose meat',
  '鶩肪': 'Duck fat', '목방': 'Duck fat', '野鴨肉': 'Wild duck meat',
  /* 獸部 - 포유류 */
  '羊肉': 'Mutton', '양고기': 'Mutton',
  '山羊肉': 'Goat meat', '염소고기': 'Goat meat',
  '馬肉': 'Horse meat', '말고기': 'Horse meat',
  '兔肉': 'Rabbit meat', '토끼고기': 'Rabbit meat',
  '兔頭骨': 'Rabbit skull',
  '獐肉': 'Roe deer meat', '노루고기': 'Roe deer meat',
  '雉肉': 'Pheasant meat', '꿩고기': 'Pheasant meat',
  '蟒肉': 'Python meat', '비단뱀고기': 'Python meat',
  '震肉': 'Lightning-struck meat', '벼락맞은고기': 'Lightning-struck meat',
  /* 金部 - 금속 */
  '金屑': 'Gold dust', '銀屑': 'Silver dust', '銀': 'Silver', '은': 'Silver',
  '魚鮮': 'Fish jeotgal', '어자': 'Fish jeotgal',
  '魚鱠': 'Fish sashimi', '물회': 'Fish sashimi',
  /* 麻子 동음이의:  hemp seed vs lightning-struck */
  '麻子': 'Hemp seed', '마자': 'Hemp seed'
};

// 옛글자→현대한글 (script.js MODERN_KOREAN와 동일)
const MODERN_KOREAN = {
  '가듁나모불휫겁질': '가죽나무뿌리껍질', '등겁질': '등껍질', '겁질': '껍질', '불휫': '뿌리', '불휘': '뿌리',
  '나모여름': '나무열매', '여름': '열매', '나모': '나무', '나못': '나무', '조팝나못불휘': '조팝나무뿌리',
  '회초밋불휘': '회초밑뿌리', '느릅나모겁질': '느릅나무껍질', '황벽나못겁질': '황벽나무껍질',
  '수유나모여름': '수유나무열매', '쵸피나모여름': '초피나무열매',   '가죽나무': '가죽나무', '남셩의등겁질': '남성의 등껍질', '야긔겁질': '야계껍질'
};

// 한글 부위/성분 → 영어 (조합 번역용, 긴 키 우선)
const COMPONENT_MAP = {
  '가죽나무뿌리껍질': 'Cork tree root bark', '가죽나무': 'Cork tree', '뿌리껍질': 'Root bark',
  '뿌리': 'root', '껍질': 'bark', '잎': 'leaf', '씨': 'seed', '열매': 'fruit', '나무': 'tree',
  '꽃': 'flower', '줄기': 'stem', '뿌리줄기': 'rhizome', '전체': 'whole plant',
  '고기': 'meat', '기름': 'oil', '피': 'blood', '뼈': 'bone', '쓸개': 'gall', '간': 'liver',
  '물': 'water', '수': 'water', '동상': 'winter frost', '어름': 'ice', '무뤼': 'hail',
  '찬샘물': 'Cold spring water', '바다물': 'Seawater', '강물': 'River water',
  '우물': 'Well', '밑': 'bottom', '모래': 'sand', '흙': 'soil', '재': 'ash',
  '멥쌀': 'Polished rice', '속미': 'Millet', '나미': 'Glutinous rice', '술': 'Alcohol',
  '두부': 'Tofu', '초': 'Vinegar', '쟝': 'Soy sauce', '당': 'Sugar', '이당': 'Malt sugar',
  '흰콩': 'White bean', '적소두': 'Red small bean', '마자': 'Hemp seed', '호마': 'Sesame',
  '직미': 'Hemp', '란발': 'Rotten hair', '발피': 'Foot skin', '날옷': 'Raw skin',
  '두구': 'Cardamom', '귀여지': 'Long pepper', '아치': 'Galangal', '입에춤': 'Saliva',
  '천령개': 'Sweet flag', '오좀': 'Nail', '인시': 'Human stool', '인곤당': 'Human placenta',
  '손톱발톱': 'Fingernail', '겨지븨월경슈': 'Menstrual blood', '부인포의': 'Afterbirth',
  '屋霤水': 'Roof runoff water', '方諸水': 'Mirror condensation',
  '千里水': 'Distant river water', '甘爛水': 'Stirred water', '冷泉': 'Cold spring',
  '潦水': 'Rainwater pond', '生熟湯': 'Mixed hot-cold water', '熱湯': 'Hot water',
  '麻沸湯': 'Anesthetic decoction', '繰絲湯': 'Silk rinsing water', '甑氣水': 'Steamer vapor',
  '銅器上汗': 'Copper vessel sweat', '炊湯': 'Boiled water', '六天氣': 'Six heavens qi',
  '伏龍肝': 'Hearth ash', '동벽토': 'East wall soil', '서벽토': 'West wall soil',
  '백악': 'Chalk', '우물 밑 모래': 'Well bottom sand', '도중열진토': 'Road center soil',
  '토봉와상토': 'Earthen jar soil', '가철조중회': 'Iron rust', '동회': 'Copper ash',
  '상시회': 'Lime', '백초회': 'Plant ash', '백초상': 'Plant frost', '들보우희듣글': 'Beam dust',
  '호마': 'Sesame', '백유마': 'White oil hemp', '마자': 'Hemp seed', '흰콩': 'White bean',
  '적소두': 'Red bean', '슈슈': 'Sugarcane', '秫薥': 'Sugarcane', '패자미': 'Barnyard millet',
  '稗子米': 'Barnyard millet', '앙자속': 'Poppy seed', '甖子粟': 'Poppy seed',
  '약젼국': 'Fermented beans', '豉': 'Fermented beans', '쟝': 'Soy sauce', '醬': 'Soy sauce',
  '방핫고애무든겨': 'Rice bran', '舂杵頭細糠': 'Rice bran',
  '나귀': 'donkey', '노새': 'mule', '담뷔': 'otter', '수쥐': 'squirrel', '일희': 'weasel',
  '표버믜': 'leopard cat', '나귀고기': 'Donkey meat', '노새고기': 'Mule meat', '담뷔고기': 'Otter meat',
  '표버믜고기': 'Leopard cat meat', '수쥐고기': 'Squirrel meat', '일희고기': 'Weasel meat',
  '물고기': 'fish', '물회': 'Fish sashimi', '젓': 'salted seafood', '물젓': 'Fish jeotgal',
  '돼지고기': 'Pork', '소고기': 'Beef', '닭고기': 'Chicken', '오리고기': 'Duck',
  '벼락마자주근즘승의고기': 'Lightning-struck meat', '물고기 젓': 'Fish jeotgal',
  '물고기 회': 'Fish sashimi', '남셩의등겁질': 'Male tortoise shell', '남성의등껍질': 'Male tortoise shell',
  '남성의 등껍질': 'Male tortoise shell', '야긔겁질': 'Hawksbill shell', '瑇瑁': 'Hawksbill shell',
  '곰의기름': 'Bear fat', '바닷반달피': 'Sea otter', '벼락': 'lightning', '주근즘승의': 'struck',
  '표버믜': 'Leopard cat', '주근': 'struck'
};

function modernize(str) {
  if (!str) return '';
  let s = String(str);
  const keys = Object.keys(MODERN_KOREAN).sort((a, b) => b.length - a.length);
  for (const k of keys) s = s.split(k).join(MODERN_KOREAN[k]);
  return s;
}

function translateByComponents(korean) {
  if (!korean) return '';
  const modern = modernize(korean.replace(/\s*\([^)]*\)\s*$/, '').trim());
  if (COMPONENT_MAP[modern]) return COMPONENT_MAP[modern];
  for (const [key, en] of Object.entries(COMPONENT_MAP).sort((a, b) => b[0].length - a[0].length)) {
    if (modern.includes(key) && key.length >= 2) {
      const rest = modern.replace(key, ' ').replace(/\s+/g, ' ').trim();
      if (!rest) return en;
      const restEn = COMPONENT_MAP[rest] || translateByComponents(rest);
      const suffix = restEn || (rest && /[a-zA-Z]/.test(rest) ? toTitleCase(rest) : toTitleCase(romanize(rest)));
      return suffix ? en + ' ' + suffix : en;
    }
  }
  return '';
}

function toTitleCase(str) {
  if (!str) return '';
  return String(str).replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

function romanize(str) {
  const map = { ㅏ: 'a', ㅐ: 'ae', ㅑ: 'ya', ㅒ: 'yae', ㅓ: 'eo', ㅔ: 'e', ㅕ: 'yeo', ㅖ: 'ye', ㅗ: 'o', ㅘ: 'wa', ㅙ: 'wae', ㅚ: 'oe', ㅛ: 'yo', ㅜ: 'u', ㅝ: 'wo', ㅞ: 'we', ㅟ: 'wi', ㅠ: 'yu', ㅡ: 'eu', ㅢ: 'ui', ㅣ: 'i', ㄱ: 'g', ㄲ: 'kk', ㄴ: 'n', ㄷ: 'd', ㄸ: 'tt', ㄹ: 'r', ㅁ: 'm', ㅂ: 'b', ㅃ: 'pp', ㅅ: 's', ㅆ: 'ss', ㅇ: '', ㅈ: 'j', ㅉ: 'jj', ㅊ: 'ch', ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 'h' };
  let out = '';
  for (const c of str) {
    const code = c.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const offset = code - 0xAC00;
      const cho = Math.floor(offset / 588), jung = Math.floor((offset % 588) / 28), jong = offset % 28;
      const choArr = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'; const jungArr = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'; const jongArr = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';
      out += (choArr[cho] ? map[choArr[cho]] || '' : '') + (jungArr[jung] ? map[jungArr[jung]] || '' : '') + (jongArr[jong] && map[jongArr[jong]] ? map[jongArr[jong]] : '');
    } else out += c;
  }
  return out.replace(/([a-z])([A-Za-z])/g, (m, a, b) => a + (b === b.toUpperCase() ? ' ' : '') + b).replace(/\s+/g, ' ').trim();
}

function deriveFromLatin(latin) {
  if (!latin || typeof latin !== 'string') return '';
  const l = latin.toLowerCase().trim();
  for (const [key, en] of Object.entries(LATIN_TO_EN)) {
    if (l.includes(key)) return en;
  }
  const first = l.split(/\s+/)[0];
  if (first && first.length > 2) {
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  return '';
}

const supplement = {};
let added = 0;
herbs.forEach((h, i) => {
  const mainKorean = (h.korean_name || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  const normHanja = (h.hanja_name || '').replace(/\s/g, '').replace(/^唐\s*/, '').trim();
  const effect = effectData[i];
  const effHanja = effect && (effect.herb_hanja || '').replace(/\s/g, '').replace(/^唐\s*/, '').trim();
  const effKorean = effect && (effect.herb_korean || '').replace(/\s*\([^)]*\)\s*$/, '').trim();

  let en = null;
  if (effHanja && OFFICIAL_MAP[effHanja]) en = OFFICIAL_MAP[effHanja];
  else if (normHanja && OFFICIAL_MAP[normHanja]) en = OFFICIAL_MAP[normHanja];
  else if (effKorean && OFFICIAL_MAP[effKorean]) en = OFFICIAL_MAP[effKorean];
  else if (mainKorean && OFFICIAL_MAP[mainKorean]) en = OFFICIAL_MAP[mainKorean];

  if (!en) {
    en = MANUAL_MAP[h.hanja_name] || MANUAL_MAP[normHanja] || MANUAL_MAP[h.korean_name] || MANUAL_MAP[mainKorean];
  }
  if (!en && (!h.english_name || !h.english_name.trim())) {
    en = deriveFromLatin(h.latin_name);
  }
  if (!en && (!h.english_name || !h.english_name.trim()) && h.korean_name) {
    en = translateByComponents(h.korean_name);
  }
  if (!en && (!h.english_name || !h.english_name.trim()) && mainKorean) {
    en = translateByComponents(mainKorean);
  }
  if (!en && (!h.english_name || !h.english_name.trim()) && h.korean_name) {
    const clean = modernize(h.korean_name.replace(/\s*\([^)]*\)\s*$/, '').trim());
    const rom = romanize(clean);
    en = rom && /^[a-zA-Z\s\-]+$/.test(rom) ? toTitleCase(rom) : '';
  }
  if (en) {
    supplement[h.id] = en;
    added++;
  }
});

const js = '// 영문 보충 (build-herb-english-supplement.js로 생성)\n' +
  'window.HERB_ENGLISH_SUPPLEMENT = ' + JSON.stringify(supplement, null, 2) + ';\n';
fs.writeFileSync(OUT_JS, js, 'utf8');
console.log('herb-english-supplement.js 저장. 보충된 항목:', added, '/ 영문 없음:', herbs.filter(h => !h.english_name || !h.english_name.trim()).length);