#!/usr/bin/env node
/**
 * 한의학고전DB(mediclassics.kr) 페이지를 "다른 이름으로 저장"한 HTML에서
 * 원문(한자)·한글(성질이 평하고 맛은 달며...)을 추출해 약재별로 매핑하고
 * donguibogam-texts.js를 생성합니다.
 *
 * 사용:
 *   1. 브라우저에서 탕액편 권01·02·03을 열고, 페이지를 끝까지 스크롤해 모든 본문이 로드된 뒤
 *   2. "다른 이름으로 저장" → "웹페이지, 완전히" 또는 "웹페이지, 단일 파일"
 *   3. mediclassics-html/volume-20.html, volume-21.html, volume-22.html 로 저장
 *   4. node scripts/parse-mediclassics-html.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML_DIR = path.join(ROOT, 'mediclassics-html');
const HERBS_DATA_PATH = path.join(ROOT, 'herbs-data.js');
const OUT_PATH = path.join(ROOT, 'donguibogam-texts.js');

const VOLUMES = [20, 21, 22];

function loadHerbs() {
  const content = fs.readFileSync(HERBS_DATA_PATH, 'utf8');
  const match = content.match(/window\.DONGUIBOGAM_HERBS\s*=\s*(\[[\s\S]*?\])\s*;/);
  if (!match) throw new Error('DONGUIBOGAM_HERBS 배열을 찾을 수 없습니다.');
  return JSON.parse(match[1]);
}

function normalizeHanja(s) {
  if (!s || typeof s !== 'string') return '';
  return s.replace(/\s+/g, '').replace(/參/g, '蔘').trim();
}

function findHerbForEntry(herbs, entry) {
  const fullText = (entry.chinese || '') + '\n' + (entry.ko || '');
  const firstLine = (entry.chinese || entry.ko || '').split('\n')[0].trim();
  const firstHanja = (firstLine.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g) || [])[0];

  let herb = findHerbByHanja(herbs, firstHanja || firstLine.slice(0, 30));
  if (herb) return herb;

  const byKorean = herbs
    .filter((h) => {
      const name = (h.korean_name || '').trim();
      if (name.length < 2) return false;
      return fullText.indexOf(name) >= 0;
    })
    .sort((a, b) => (b.korean_name || '').length - (a.korean_name || '').length);
  if (byKorean.length > 0) return byKorean[0];

  if (firstHanja) {
    const byHanja = herbs.find((h) => fullText.indexOf(h.hanja_name || '') >= 0);
    if (byHanja) return byHanja;
  }
  return null;
}

function findHerbByHanja(herbs, hanjaText) {
  if (!hanjaText) return null;
  const norm = normalizeHanja(hanjaText);
  const exact = herbs.find((h) => normalizeHanja(h.hanja_name) === norm);
  if (exact) return exact;
  const firstWord = (hanjaText.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g) || [])[0];
  if (firstWord) {
    const fwNorm = normalizeHanja(firstWord);
    const partial = herbs.find((h) => {
      const hNorm = normalizeHanja(h.hanja_name);
      return hNorm && (hNorm === fwNorm || hNorm.startsWith(fwNorm) || fwNorm.startsWith(hNorm));
    });
    if (partial) return partial;
  }
  return null;
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 블록 HTML에서 원문·한글 텍스트 추출 (여러 패턴 시도) */
function extractChineseKo(blockHtml) {
  let chinese = '';
  let ko = '';

  const chineseRegex = /<[^>]*class=["'][^"']*chinese[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi;
  let cm = chineseRegex.exec(blockHtml);
  if (cm) chinese = stripHtml(cm[1]).trim();

  const koRegex = /<[^>]*class=["'][^"']*\bko\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi;
  let km = koRegex.exec(blockHtml);
  if (km) ko = stripHtml(km[1]).trim();

  if (!chinese && !ko) {
    const secNodes = [];
    const secRegex = /<[^>]*class=["'][^"']*sec_node[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi;
    let sm;
    while ((sm = secRegex.exec(blockHtml)) !== null) secNodes.push(stripHtml(sm[1]).trim());
    if (secNodes.length >= 2) {
      chinese = secNodes[0];
      ko = secNodes.slice(1).join('\n');
    } else if (secNodes.length === 1) {
      const text = secNodes[0];
      const openParen = text.indexOf('(');
      if (openParen > 0) {
        chinese = text.slice(0, openParen).trim();
        ko = text.slice(openParen).replace(/^\(|\)$/g, '').trim();
      } else {
        chinese = text;
      }
    }
  }

  if (!chinese && !ko) {
    const plain = blockHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '');
    const plainText = stripHtml(plain).replace(/\s+/g, ' ').trim();
    if (plainText) {
      const openParen = plainText.indexOf('(');
      if (openParen > 0) {
        chinese = plainText.slice(0, openParen).trim();
        const closeParen = plainText.indexOf(')', openParen);
        ko = closeParen > openParen
          ? plainText.slice(openParen + 1, closeParen).trim()
          : plainText.slice(openParen + 1).replace(/^\(/, '').trim();
      } else {
        chinese = plainText;
      }
    }
  }
  return { chinese, ko };
}

/** 1) id="content_XXX" 블록 추출 */
function extractByContentId(html) {
  const entries = [];
  const blockRegex = /<[^>]+\bid=["']?content_(\d+)["']?[^>]*>([\s\S]*?)(?=<[^>]+\bid=["']?content_\d+["']?|<\/body|$)/gi;
  let m;
  while ((m = blockRegex.exec(html)) !== null) {
    const blockHtml = m[2];
    const { chinese, ko } = extractChineseKo(blockHtml);
    if (chinese || ko) entries.push({ chinese, ko });
  }
  return entries;
}

/** 2) 본문 전체에서 "한자 원문 (한글)" 패턴으로 블록 추출 (content_ 없을 때) */
function extractByPattern(html) {
  const entries = [];
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const bodyMatch = noScript.match(/<body[^>]*>([\s\S]*)<\/body>/i) || noScript.match(/<div[^>]*id=["']?container["']?[^>]*>([\s\S]*?)(?:<\/div>\s*<\/div>|$)/i);
  const body = bodyMatch ? bodyMatch[1] : noScript;
  const text = stripHtml(body).replace(/\s+/g, ' ');
  const blockCandidates = text.split(/(?=[\u4e00-\u9fff\u3400-\u4dbf]{2,8}\s+[^\s])/);
  for (const block of blockCandidates) {
    const trimmed = block.trim();
    if (trimmed.length < 10) continue;
    const openParen = trimmed.indexOf('(');
    let chinese = '';
    let ko = '';
    if (openParen > 5) {
      chinese = trimmed.slice(0, openParen).trim();
      const closeParen = trimmed.indexOf(')', openParen);
      ko = closeParen > openParen ? trimmed.slice(openParen + 1, closeParen).trim() : trimmed.slice(openParen + 1).trim();
    } else {
      if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(trimmed)) chinese = trimmed;
    }
    if ((chinese || ko) && (chinese.length > 2 || ko.length > 5)) entries.push({ chinese, ko });
  }
  return entries;
}

function extractEntriesFromHtml(html) {
  let entries = extractByContentId(html);
  if (entries.length === 0) entries = extractByPattern(html);
  return entries;
}

function main() {
  if (!fs.existsSync(HTML_DIR)) {
    fs.mkdirSync(HTML_DIR, { recursive: true });
    console.error('mediclassics-html/ 폴더를 만들었습니다. 다음을 진행하세요:');
    console.error('  1. 브라우저에서 탕액편 권01·02·03을 열고, 페이지를 끝까지 스크롤해 본문이 모두 로드된 뒤');
    console.error('  2. "다른 이름으로 저장" → "웹페이지, 완전히"로 저장');
    console.error('     권01: https://www.mediclassics.kr/books/8/volume/20 → mediclassics-html/volume-20.html');
    console.error('     권02: https://www.mediclassics.kr/books/8/volume/21 → mediclassics-html/volume-21.html');
    console.error('     권03: https://www.mediclassics.kr/books/8/volume/22 → mediclassics-html/volume-22.html');
    console.error('  3. node scripts/parse-mediclassics-html.js');
    process.exit(1);
  }

  const herbs = loadHerbs();
  const byHerbId = {};

  function volumeFromFilename(name) {
    const n = name.toLowerCase();
    if (/volume[_\-\/]?20|volume20|books[_\-]8[_\-]volume[_\-]20/.test(n)) return 20;
    if (/volume[_\-\/]?21|volume21|books[_\-]8[_\-]volume[_\-]21/.test(n)) return 21;
    if (/volume[_\-\/]?22|volume22|books[_\-]8[_\-]volume[_\-]22/.test(n)) return 22;
    return null;
  }

  const files = fs.readdirSync(HTML_DIR).filter((f) => f.endsWith('.html'));
  const toProcess = [];
  for (const f of files) {
    const vol = volumeFromFilename(f);
    toProcess.push({ path: path.join(HTML_DIR, f), volume: vol !== null ? vol : 20, name: f });
  }
  if (toProcess.length === 0) {
    for (const volume of VOLUMES) {
      const filePath = path.join(HTML_DIR, `volume-${volume}.html`);
      if (fs.existsSync(filePath)) toProcess.push({ path: filePath, volume, name: `volume-${volume}.html` });
    }
  }

  for (const { path: filePath, volume, name } of toProcess) {
    const html = fs.readFileSync(filePath, 'utf8');
    const entries = extractEntriesFromHtml(html);
    console.error(`${name}: ${entries.length}개 블록 추출`);

    if (entries.length === 0) {
      const hasContentId = /content_\d+/.test(html);
      console.error(`  → content_ 블록 없음. (content_ 포함: ${hasContentId})`);
    }

    for (const entry of entries) {
      const herb = findHerbForEntry(herbs, entry);
      if (herb) {
        if (!byHerbId[herb.id] || (entry.ko && entry.ko.length > (byHerbId[herb.id].ko || '').length)) {
          byHerbId[herb.id] = { chinese: entry.chinese || '', ko: entry.ko || '' };
        }
      }
    }
  }

  const out = `// 한의학고전DB 저장 HTML에서 추출 (parse-mediclassics-html.js). chinese=원문, ko=한글.
// 팝업 "동의보감 기록"에서 원문/한글 구조로 표시됩니다.
window.DONGUIBOGAM_TEXTS = ${JSON.stringify(byHerbId, null, 2)};
`;
  fs.writeFileSync(OUT_PATH, out, 'utf8');
  console.log('총', Object.keys(byHerbId).length, '개 약재 →', OUT_PATH);
  if (Object.keys(byHerbId).length === 0) {
    console.error('매칭된 약재가 없습니다. mediclassics-html/*.html에 content_XXX 블록이 있어야 합니다. 페이지를 끝까지 스크롤한 뒤 "다른 이름으로 저장"하세요.');
  }
}

main();
