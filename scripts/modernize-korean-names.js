#!/usr/bin/env node
/**
 * herbs-data.js의 옛한글/구표기·깨진 글자 korean_name을 현대 한국어로 치환합니다.
 * - 옛 표기: 감뎻불휘 → 호장근, 소나모우희숑낙 → 송라 등
 * - 한글이 깨지는 경우: 한자 표기대로 한글 음으로 씀 (西壁土 → 서벽토)
 *
 * 사용: node scripts/modernize-korean-names.js
 */

const fs = require('fs');
const path = require('path');
const HANJA_READING = require('./hanja-to-hangul.js');

/** 한자명 → 현대어(고정 표현) */
const HANJA_TO_MODERN = {
  '寒泉水': '찬샘물', '屋霤水': '지붕에서 흘러내린 물', '碧海水': '바다물', '千里水': '멀리서 흘러오는 강물',
  '甘爛水': '두드려 거품 난 물', '冷泉': '찬샘물', '潦水': '산에 비와 고인 물', '生熟湯': '뜨거운물과 찬물 섞은 것',
  '熱湯': '끓인 뜨거운 물', '麻沸湯': '마비탕', '繰絲湯': '고치 헹군 물', '甑氣水': '밥 시루 뚜껑에 맺힌 물',
  '銅器上汗': '구리그릇에 맺힌 땀', '炊湯': '데운 물', '伏龍肝': '오래된 솥밑 누른재', '井底沙': '우물 밑 모래',
  '六月河中熱沙': '6월 강가의 뜨거운 모래', '鐺墨': '솥밑 검은 때', '粳米': '멥쌀', '豚卵': '돼지 불알',
  '野猪黃': '멧돼지 담낭', '蝟皮': '고슴도치 가죽', '海㹠': '물개', '魚鮓': '물고기 젓', '魚膾': '물고기 회',
  '蔞蒿': '물쑥', '虎杖根': '호장근',
  '松蘿': '송라',
  '六月河中熱沙': '육월 강가의 뜨거운 모래',
};

/** 현대 한글·허용 문자만 있는지 검사 (가-힣, 공백, ( ) , · - / +) */
function isAllowedChar(c) {
  const code = c.codePointAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return true;
  if (code >= 0x30 && code <= 0x39) return true; // 0-9
  if ([0x20, 0x28, 0x29, 0x2c, 0xb7, 0x2d, 0x2f, 0x2b].includes(code)) return true;
  return false;
}

function hasBadChar(str) {
  if (!str || typeof str !== 'string') return false;
  return [...str].some(c => !isAllowedChar(c));
}

/** 한자 문자열을 한글 음으로 변환 (글자별 읽기) */
function hanjaToHangul(hanjaStr) {
  if (!hanjaStr || typeof hanjaStr !== 'string') return '';
  return [...hanjaStr]
    .map(c => (HANJA_READING[c] != null ? HANJA_READING[c] : c))
    .join('');
}

function loadHerbsData(herbsPath) {
  const content = fs.readFileSync(herbsPath, 'utf8');
  const match = content.match(/window\.DONGUIBOGAM_HERBS\s*=\s*(\[[\s\S]*?\])\s*;/);
  if (!match) throw new Error('DONGUIBOGAM_HERBS 배열을 찾을 수 없습니다.');
  return JSON.parse(match[1]);
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const herbsPath = path.join(projectRoot, 'herbs-data.js');

  const herbs = loadHerbsData(herbsPath);
  let changed = 0;

  for (const h of herbs) {
    const hanja = (h.hanja_name || '').trim();
    const before = h.korean_name;

    let modern = HANJA_TO_MODERN[hanja];
    if (modern) {
      if (before === modern) continue;
      h.korean_name = modern;
      changed++;
      console.log(hanja, '|', before, '→', modern);
      continue;
    }

    if (!hasBadChar(before)) continue;

    modern = hanjaToHangul(hanja);
    if (!modern || /[\u4e00-\u9fff]/.test(modern)) continue;
    h.korean_name = modern;
    changed++;
    console.log(hanja, '|', before, '→', modern);
  }

  const out = `// 동의보감 탕액편 약재 데이터 (엑셀에서 생성 + 동의보감 txt 병합, 현대어 보정)\nwindow.DONGUIBOGAM_HERBS = ${JSON.stringify(herbs)};`;
  fs.writeFileSync(herbsPath, out, 'utf8');
  console.log('\n총', changed, '건 현대어로 보정. herbs-data.js 저장 완료.');
}

main();
