/**
 * build-herb-origin.js
 * --------------------------------------------------------------------------
 * 동의보감 탕액편 효능 원문(effect.json)에 담긴 동의보감 자체의 기록을 근거로
 * 각 약재를 다음 4등급으로 분류한다.
 *
 *   native      향약(鄕藥)   — 조선 땅에서 나거나 재배·자생한다고 명시된 약재
 *   naturalized 토착화 노력  — 해외(중국 등)에서 들여와 조선에서 기르려 시도/정착시킨 약재
 *   imported    당약/외래약  — 중국·서양에서 수입해 들여온 약재(자생 신호 없는 동·식물)
 *   general     일반         — 물·흙·돌·쇠·옥·인체 유래처럼 자생 구분이 적용되지 않는 약재
 *
 * imported / general 은 모두 "자생 신호가 없는" 약재이지만, 자생 구분 자체가
 * 적용되는 동·식물(수입 가능)이면 imported, 자생 구분이 무의미한 광물·물·인체
 * 유래이면 general 로 가른다. 가르는 기준은 약재의 분류(category)다.
 *
 * 분류는 허준이 남긴 원문 서술(자생지·향명·이종移種 기록)을 신호어로 추출한 것이며,
 * 결과물(data/herb-origin.js)은 사람이 직접 손볼 수 있도록 herb_id 키로 저장한다.
 *
 * 사용법:  node scripts/build-herb-origin.js
 * --------------------------------------------------------------------------
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'data', 'effect.json');
const OUT = path.join(__dirname, '..', 'data', 'herb-origin.js');

function han(e) {
  return [e.efficacy_hanja_1, e.efficacy_hanja_2, e.efficacy_hanja_3, e.efficacy_hanja_4, e.efficacy_hanja_5]
    .filter(Boolean).join(' ');
}
function kor(e) {
  return [e.efficacy_korean_1, e.efficacy_korean_2, e.efficacy_korean_3, e.efficacy_korean_4, e.efficacy_korean_5]
    .filter(Boolean).join(' ');
}

// ── 신호어 사전 ────────────────────────────────────────────────────────────
// 토착화(naturalized): 해외 원산 + 조선으로의 이식/도입/재배 시도 기록
const NATURALIZED = [
  /옮겨\s*심/, /옮겨심/, /移種/, /移栽/, /移植/,
  /중국에서\s*(들어온|들여온|전해진|가져온)/, /중원에서/, /당(唐)?에서\s*들여/,
  /들여와\s*심/, /들여다\s*심/, /씨를?\s*가져와/, /종자를?\s*가져/,
  /傳入/, /自中國/, /從中國/,
];

// 향약(native) — 강신호: 조선을 명시한 자생/재배·향명 기록 (모호 지명 제외)
// ※ "영남·호남·관동" 등은 중국 영남(嶺南)·호남(湖南)과 겹쳐 오분류를 부르므로 제외.
//   조선임이 분명한 '우리나라/도(道) 단위 지명/제주·전주·충주·한양·경기'만 사용.
const NATIVE_STRONG_KOR = [
  /우리나라[^.。]{0,40}(난다|나는|난\b|자란다|자라|자생|생산|심는다|심어|재배|있다|있는|많이\s*난)/,
  /향명/,
  /(제주|전주|충주|한양|경기|개성|송도)[^.。]{0,18}(난다|나는|난\b|있다|생산|자란다|많이|심)/,
  /(강원도|경상도|전라도|충청도|함경도|평안도|황해도)[^.。]{0,18}(난다|나는|난\b|있다|생산|자란다|많이|심)/,
];
const NATIVE_STRONG_HAN = [/鄕名/, /我國/, /東國/, /本國/, /東人/];

// 향약 — 약신호: 자생을 뜻하는 일반 표현 (외래 veto에 의해 무효화될 수 있음)
const NATIVE_WEAK_KOR = [
  /곳곳에[^.。]{0,12}(있다|난다|자란다|흔하다|심는다)/, /어디에나\s*있다/, /흔하다/,
  /(산과\s*들|들과\s*밭|산\s*속|들|밭|못|연못|개울|냇가|논|언덕)에[^.。]{0,12}(자란다|난다|있다|심는다|산다)/,
];
const NATIVE_WEAK_HAN = [/處處有之/, /所在皆有/, /在處有之/, /處處有/, /處處種之/, /田野/, /園圃/, /山野/];

// 외래 전용 산지 — 조선 언급이 없는데 이 표현이 있으면 '약신호 향약'을 무효화하고 일반으로
const FOREIGN_ONLY_KOR = [/남방/, /페르시아/, /서역/, /천축/, /회회/, /파사/, /안남/, /교지/, /광동/, /광서/];
const FOREIGN_ONLY_HAN = [/南方/, /波斯/, /西域/, /天竺/, /嶺南/, /廣[東南西]/, /蜀\b/, /交趾/, /安南/, /大食/, /回回/];

function matchFirst(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

// ── 일반(general) 전용 분류군 ────────────────────────────────────────────────
// 자생 구분(향약/외래)이 적용되지 않는 약재 분류(category). 물·흙·돌·옥·쇠·
// 인체 유래는 "어디서 나는가"를 따질 대상이 아니므로 자생 신호가 없어도 일반에
// 남긴다. 그 밖의 동·식물 분류에서 자생 신호가 없으면 수입(당약/외래약)으로 본다.
const GENERAL_CATEGORIES = new Set(['수부(水)', '토부', '석부', '옥부', '금부(金)', '인부']);

// 동·식물 분류에 속하지만 '수입(당약/외래약)'이 아니라 일반(general)으로 남길 약재.
// 인체에서 나온 것(회충·고충)과 사람이 만든 가공품·기물(술·식초·엿·두부·먹·북가죽
// 등)은 "어디서 나는가(자생/수입)"를 따질 대상이 아니므로 일반에 둔다.
// ⚠ 개별 판단이 어긋나면 이 목록만 손보면 된다.
const GENERAL_OVERRIDE = new Set([
  // 인체 유래
  'ANIMAL_065', // 회충 (사람의 목에서 나온 회충)
  'ANIMAL_066', // 고충 (고독환자에게서 나온 충)
  // 가공품 — 발효·조리·정제물
  'ANIMAL_029', // 어자 (물고기 젓)
  'ANIMAL_030', // 어회 (물고기 회)
  'PLANT_020',  // 유당 (우유즙에 설탕을 타서 끓인 것)
  'PLANT_137',  // 주 (술)
  'PLANT_138',  // 초 (식초)
  'PLANT_139',  // 이당 (엿)
  'PLANT_140',  // 두부
  'PLANT_328',  // 송연묵 (소나무 그을음으로 만든 먹)
  // 기물·특수 — 사람이 쓰던 물건 또는 특수 상태
  'ANIMAL_164', // 패고피 (오래된 북 가죽)
  'ANIMAL_167', // 필두회 (오래 쓴 붓을 태운 재)
  'ANIMAL_168', // 진육 (벼락맞아 죽은 짐승의 고기)
  'PLANT_277',  // 패천공 (오래 쓰던 패랭이)
  'PLANT_286',  // 극섭비승 (나막신·짚신의 앞코)
]);

// ── 자생 분류군 보정(큐레이션) ───────────────────────────────────────────────
// 효능 원문에는 산지·서식 정보가 거의 없어, 신호어가 없으면 무조건 '일반'으로
// 떨어진다. 그러나 토종 어류·곤충·새·짐승과 재배 작물처럼 한반도 자생이 명백한
// 약재가 다수 '일반'에 섞인다. 아래는 그런 약재를 향약(native)으로 끌어올리는
// 수작업 보정 목록(herb_id). 수입·외래(코뿔소·낙타·원숭이·정향·침향·후추·
// 알로에 등)와 가공품(술·식초·먹·북가죽 등), 그리고 자생 개념이 모호한
// 물·흙·돌·쇠·옥·인부(人部)는 의도적으로 제외하여 일반으로 남긴다.
// ⚠ 개별 약재 판단이 어긋난다고 보이면 이 목록만 손보면 된다.
const NATIVE_OVERRIDE = new Set([
  // 어부 — 토종 민물·연안 어류 및 해산물 (가공품 어자/어회 제외)
  'ANIMAL_001','ANIMAL_003','ANIMAL_006','ANIMAL_007','ANIMAL_009','ANIMAL_010',
  'ANIMAL_011','ANIMAL_014','ANIMAL_015','ANIMAL_016','ANIMAL_017','ANIMAL_018',
  'ANIMAL_019','ANIMAL_020','ANIMAL_021','ANIMAL_022','ANIMAL_023','ANIMAL_024',
  'ANIMAL_025','ANIMAL_026','ANIMAL_027','ANIMAL_028',
  // 충부 — 토종 곤충·양서·파충류·연체류 (전갈·천산갑·도마뱀붙이·인체기생충 제외)
  'ANIMAL_031','ANIMAL_032','ANIMAL_033','ANIMAL_034','ANIMAL_035','ANIMAL_036',
  'ANIMAL_037','ANIMAL_038','ANIMAL_039','ANIMAL_040','ANIMAL_041','ANIMAL_042',
  'ANIMAL_043','ANIMAL_044','ANIMAL_045','ANIMAL_046','ANIMAL_047','ANIMAL_048',
  'ANIMAL_049','ANIMAL_051','ANIMAL_052','ANIMAL_053','ANIMAL_054','ANIMAL_055',
  'ANIMAL_057','ANIMAL_059','ANIMAL_060','ANIMAL_061','ANIMAL_062','ANIMAL_063',
  'ANIMAL_064',
  // 금부 — 토종 새 및 사육 가금 (구관조·사다새·자고·촉옥 등 외래/불명 제외)
  'ANIMAL_083','ANIMAL_084','ANIMAL_085','ANIMAL_086','ANIMAL_087','ANIMAL_088',
  'ANIMAL_089','ANIMAL_090','ANIMAL_091','ANIMAL_092','ANIMAL_093','ANIMAL_094',
  'ANIMAL_095','ANIMAL_096','ANIMAL_097','ANIMAL_098','ANIMAL_099','ANIMAL_100',
  'ANIMAL_101','ANIMAL_102','ANIMAL_103','ANIMAL_104','ANIMAL_105','ANIMAL_106',
  'ANIMAL_107','ANIMAL_108','ANIMAL_110','ANIMAL_111','ANIMAL_112','ANIMAL_113',
  'ANIMAL_114','ANIMAL_115','ANIMAL_116','ANIMAL_118','ANIMAL_120','ANIMAL_121',
  'ANIMAL_122','ANIMAL_123','ANIMAL_124','ANIMAL_125','ANIMAL_126','ANIMAL_127',
  'ANIMAL_128','ANIMAL_129','ANIMAL_130','ANIMAL_131','ANIMAL_132',
  // 수부 — 토종 짐승 및 가축 (코뿔소·영양·낙타·원숭이·노새·나귀·물개·가공품 제외)
  'ANIMAL_134','ANIMAL_135','ANIMAL_136','ANIMAL_137','ANIMAL_138','ANIMAL_141',
  'ANIMAL_142','ANIMAL_143','ANIMAL_144','ANIMAL_145','ANIMAL_146','ANIMAL_147',
  'ANIMAL_150','ANIMAL_151','ANIMAL_152','ANIMAL_153','ANIMAL_154','ANIMAL_156',
  'ANIMAL_157','ANIMAL_161','ANIMAL_162','ANIMAL_165','ANIMAL_166',
  // 과부 — 토종·재배 과실 (여지·용안·야자 등 열대 수입, 유당 가공품 제외)
  'PLANT_003','PLANT_004','PLANT_005','PLANT_007','PLANT_011','PLANT_012',
  'PLANT_013','PLANT_014','PLANT_015','PLANT_016','PLANT_017','PLANT_023',
  'PLANT_027','PLANT_032',
  // 채부 — 재배 채소 (전부 한반도 재배)
  'PLANT_040','PLANT_042','PLANT_045','PLANT_047','PLANT_048','PLANT_051',
  'PLANT_052','PLANT_054','PLANT_055','PLANT_056','PLANT_068','PLANT_069',
  'PLANT_071','PLANT_073',
  // 곡부 — 재배 곡물 (술·식초·엿·두부 등 가공품 제외)
  'PLANT_129','PLANT_130','PLANT_131','PLANT_132','PLANT_133','PLANT_134',
  'PLANT_135','PLANT_136','PLANT_141',
  // 초부 — 토종·재배 풀 약재 (감초·목향·아위·강황·노회·육두구 등 수입 제외)
  'PLANT_077','PLANT_080','PLANT_093','PLANT_097','PLANT_098','PLANT_105',
  'PLANT_107','PLANT_109','PLANT_110','PLANT_111','PLANT_119','PLANT_120',
  'PLANT_128','PLANT_151','PLANT_159','PLANT_165','PLANT_172','PLANT_175',
  'PLANT_178','PLANT_184','PLANT_191','PLANT_205','PLANT_209','PLANT_210',
  'PLANT_215','PLANT_216','PLANT_217','PLANT_221','PLANT_229','PLANT_230',
  'PLANT_231','PLANT_233','PLANT_234','PLANT_236','PLANT_239','PLANT_243',
  'PLANT_245','PLANT_247','PLANT_248','PLANT_252','PLANT_254','PLANT_255',
  'PLANT_258','PLANT_261','PLANT_263','PLANT_269','PLANT_271','PLANT_272',
  'PLANT_273','PLANT_274','PLANT_275','PLANT_282','PLANT_284',
  // 목부 — 토종 나무 약재 (정향·침향·유향·후추·빈랑·소목 등 수입 제외)
  'PLANT_288','PLANT_289','PLANT_291','PLANT_298','PLANT_300','PLANT_301',
  'PLANT_302','PLANT_303','PLANT_304','PLANT_317','PLANT_319','PLANT_320',
  'PLANT_322','PLANT_323','PLANT_324','PLANT_329','PLANT_330','PLANT_334',
  'PLANT_337','PLANT_344','PLANT_345','PLANT_346','PLANT_353','PLANT_357',
  'PLANT_359','PLANT_362','PLANT_364','PLANT_366',
]);

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const result = {};   // herb_id -> { origin, reason }
const stats = { native: 0, naturalized: 0, imported: 0, general: 0 };

data.forEach(function (e) {
  if (!e.herb_id) return;
  const h = han(e);
  const k = kor(e);

  let origin = 'general';
  let reason = '';

  // 1) 토착화 우선 — 해외 도입/이식 기록이 가장 구체적인 신호
  const natz = matchFirst(k, NATURALIZED) || matchFirst(h, NATURALIZED);
  if (natz) {
    origin = 'naturalized';
    reason = pickSentence(k, natz) || natz;
  } else {
    // 2) 향약 강신호 — 조선을 명시한 자생/재배/향명 기록
    const strongK = matchFirst(k, NATIVE_STRONG_KOR);
    const strongH = matchFirst(h, NATIVE_STRONG_HAN);
    if (strongK || strongH) {
      origin = 'native';
      reason = (strongK ? pickSentence(k, strongK) : null) || strongK || strongH || '';
    } else {
      // 3) 향약 약신호 — 단, 외래 전용 산지가 함께 있으면 무효(일반)
      const weakK = matchFirst(k, NATIVE_WEAK_KOR);
      const weakH = matchFirst(h, NATIVE_WEAK_HAN);
      const foreign = matchFirst(k, FOREIGN_ONLY_KOR) || matchFirst(h, FOREIGN_ONLY_HAN);
      if ((weakK || weakH) && !foreign) {
        origin = 'native';
        reason = (weakK ? pickSentence(k, weakK) : null) || weakK || weakH || '';
      }
    }
  }

  // 자생 분류군 보정 — 신호어가 없어 '일반'으로 떨어졌으나 한반도 자생이
  // 명백한 약재는 향약(native)으로 끌어올린다.
  if (origin === 'general' && NATIVE_OVERRIDE.has(e.herb_id)) {
    origin = 'native';
    reason = '한반도 자생 분류군 — 효능 원문에 산지 미기재(수작업 보정)';
  }

  // 일반(general) 세분화 — 자생 신호 없는 약재 중, 자생 구분이 적용되는
  // 동·식물 분류는 수입(당약/외래약)으로, 물·흙·돌·옥·쇠·인체 유래는 일반으로.
  // 단 인체 유래·가공품·기물(GENERAL_OVERRIDE)은 동·식물 분류라도 일반에 남긴다.
  if (origin === 'general' && !GENERAL_CATEGORIES.has(e.category) && !GENERAL_OVERRIDE.has(e.herb_id)) {
    origin = 'imported';
    reason = '자생 기록 없음 — 중국·서양 수입(당약/외래약)으로 분류';
  }

  result[e.herb_id] = { origin: origin, reason: reason };
  stats[origin]++;
});

// 신호어가 들어간 문장 한 토막을 근거로 잘라낸다(툴팁·검증용)
function pickSentence(text, needle) {
  if (!needle) return '';
  const idx = text.indexOf(needle);
  if (idx < 0) return '';
  let start = text.lastIndexOf('.', idx);
  let start2 = text.lastIndexOf('。', idx);
  start = Math.max(start, start2);
  let end = idx + needle.length;
  let e1 = text.indexOf('.', end);
  let e2 = text.indexOf('。', end);
  if (e1 < 0) e1 = text.length;
  if (e2 < 0) e2 = text.length;
  end = Math.min(e1, e2);
  return text.slice(start + 1, end + 1).trim().slice(0, 80);
}

// ── 파일 출력 ──────────────────────────────────────────────────────────────
const lines = [];
lines.push('// 동의보감 약재 출신 분류 (향약 / 토착화 / 당약·외래약 / 일반)');
lines.push('// 자동 생성: node scripts/build-herb-origin.js — effect.json 원문 신호어 기반');
lines.push('// origin: "native"(향약·조선자생) | "naturalized"(토착화 노력) | "imported"(당약·외래약·수입) | "general"(일반·광물/물/인체)');
lines.push('// reason: 분류 근거가 된 동의보감 원문 한 토막 (수작업 보정 시 참고)');
lines.push('// ⚠ 직접 수정 가능. 단 build 스크립트를 다시 돌리면 덮어쓰여진다.');
lines.push('window.HERB_ORIGIN = {');
data.forEach(function (e) {
  if (!e.herb_id) return;
  const r = result[e.herb_id];
  const name = (e.herb_korean || e.herb_hanja || '').replace(/"/g, '\\"');
  const reason = (r.reason || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim();
  lines.push('  "' + e.herb_id + '": { "origin": "' + r.origin + '", "name": "' + name + '", "reason": "' + reason + '" },');
});
lines.push('};');
lines.push('');

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');

console.log('분류 완료 →', path.relative(path.join(__dirname, '..'), OUT));
console.log('  향약(native)         :', stats.native);
console.log('  토착화(naturalized)  :', stats.naturalized);
console.log('  당약/외래약(imported):', stats.imported);
console.log('  일반(general)        :', stats.general);
console.log('  합계                 :', data.length);
