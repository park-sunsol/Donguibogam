#!/usr/bin/env node
/**
 * 한의학고전DB volume 페이지에서 id="content_XXX" 블록을 파싱해
 * 각 블록의 제목(한자)과 우리 약재 목록의 hanja_name을 매칭하여
 * mediclassics-content-map.json 을 자동 생성합니다.
 *
 * 사용: node scripts/build-mediclassics-map.js
 *
 * 전제: volume HTML에 content_XXX 블록이 포함되어 있어야 함.
 *       SPA로 본문을 나중에 로드하면 이 스크립트로는 수집 불가 → 매핑을 수동으로 작성하거나 Puppeteer 사용.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const HERBS_DATA_PATH = path.join(ROOT, 'herbs-data.js');
const MAP_OUT = path.join(__dirname, 'mediclassics-content-map.json');

const BASE_URL = 'https://www.mediclassics.kr/books/8/volume';
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

function fetchHtml(volume) {
  return new Promise((resolve, reject) => {
    https.get(`${BASE_URL}/${volume}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * HTML에서 id="content_XXX" 블록을 찾고, 각 블록에서 제목으로 쓸 한자 추출.
 * 패턴: id="content_432" 다음에 오는 텍스트 중 한자로 시작하는 부분.
 */
function extractContentTitles(html) {
  const entries = [];
  const regex = /id=["']content_(\d+)["'][^>]*>([\s\S]*?)(?=<[^>]+id=["']content_\d+["']|<\/div>\s*<\/div>|$)/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const contentId = parseInt(m[1], 10);
    let block = m[2];
    block = block.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
    const text = block.replace(/<[^>]+>/g, '\n').replace(/\s+/g, ' ').trim();
    const hanjaMatch = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/);
    const title = hanjaMatch ? hanjaMatch[0].trim() : '';
    if (contentId && title) entries.push({ contentId, title });
  }
  if (entries.length === 0) {
    const simple = /id=["']content_(\d+)["'][^>]*>[\s\S]*?([\u4e00-\u9fff\u3400-\u4dbf]{2,10})/gi;
    while ((m = simple.exec(html)) !== null) entries.push({ contentId: parseInt(m[1], 10), title: m[2].trim() });
  }
  return entries;
}

function findBestHerb(herbs, hanjaTitle) {
  const norm = normalizeHanja(hanjaTitle);
  const exact = herbs.find((h) => normalizeHanja(h.hanja_name) === norm);
  if (exact) return exact;
  const partial = herbs.find((h) => {
    const hNorm = normalizeHanja(h.hanja_name);
    return hNorm && (hNorm === norm || norm.startsWith(hNorm) || hNorm.startsWith(norm));
  });
  return partial || null;
}

async function main() {
  const herbs = loadHerbs();
  const map = { comment: '한의학고전DB content_XXX ↔ 약재 id. fetch-mediclassics-detail.js 가 사용.' };

  for (const volume of VOLUMES) {
    process.stderr.write(`volume ${volume} ... `);
    const html = await fetchHtml(volume);
    const entries = extractContentTitles(html);
    process.stderr.write(`${entries.length} blocks\n`);

    for (const { contentId, title } of entries) {
      const herb = findBestHerb(herbs, title);
      if (herb && !map[herb.id]) map[herb.id] = { volume, contentId };
    }
  }

  fs.writeFileSync(MAP_OUT, JSON.stringify(map, null, 2), 'utf8');
  const count = Object.keys(map).filter((k) => k !== 'comment').length;
  console.log('매핑', count, '개 →', MAP_OUT);
  console.log('필요 시 수동으로 contentId를 보정한 뒤 node scripts/fetch-mediclassics-detail.js 를 실행하세요.');
}

main().catch((e) => { console.error(e); process.exit(1); });
