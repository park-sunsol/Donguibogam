# /map-images

`asset/img/`에 새로 추가된 이미지를 `js/herb-viewer.js`의 `THUMBNAIL_BY_ID`에 매핑합니다.

## 실행 방법

### 1. 미매핑 이미지 탐지

```bash
# 현재 매핑된 파일명 추출
grep -oP "asset/Img/\K[^']+" js/herb-viewer.js | sort > /tmp/mapped.txt

# asset/img 전체 파일 목록 (NO_*.png 제외)
ls asset/img/*.png | xargs -I{} basename {} | grep -v '^NO_' | sort > /tmp/all_images.txt

# 미매핑 목록
comm -23 /tmp/all_images.txt /tmp/mapped.txt > /tmp/unmapped.txt
cat /tmp/unmapped.txt
```

### 2. 영어명 자동 매핑 (주요 경로)

PNG 파일명을 `data/herb-data.js`의 `HERB_ENGLISH_SUPPLEMENT` 영어명과 대조해 herb ID를 자동 추출합니다. 파일명의 하이픈·언더스코어·공백은 동일하게 취급합니다.

```bash
python3 - <<'EOF'
import re, json, os

with open('data/herb-data.js') as f:
    content = f.read()

match = re.search(r'window\.HERB_ENGLISH_SUPPLEMENT\s*=\s*(\{.*?\});', content, re.DOTALL)
sup = json.loads(match.group(1))

def normalize(s):
    return re.sub(r'[-_\s]+', ' ', s).strip().lower()

# 역방향 맵: 정규화된 영어명 → herb ID
rev = {normalize(v): k for k, v in sup.items()}

with open('/tmp/unmapped.txt') as f:
    unmapped = [line.strip() for line in f if line.strip()]

matched = []
not_matched = []
for fname in unmapped:
    stem = fname[:-4]  # .png 제거
    herb_id = rev.get(normalize(stem))
    if herb_id:
        matched.append((herb_id, fname))
    else:
        not_matched.append(fname)

print('=== 자동 매핑 가능 ===')
for herb_id, fname in matched:
    print(f"  '{herb_id}': 'asset/Img/{fname}',")

print()
print('=== 수동 확인 필요 ===')
for fname in not_matched:
    print(f"  {fname}")
EOF
```

### 3. 수동 확인 필요한 파일 — herb ID 조회

자동 매핑 안된 파일은 한국어명·한자명으로 검색합니다.

```bash
python3 -c "
import json, re
with open('data/herb-data.js') as f:
    content = f.read()
match = re.search(r'window\.DONGUIBOGAM_HERBS\s*=\s*(\[.*\])', content, re.DOTALL)
herbs = json.loads(match.group(1))
keywords = ['<검색어1>', '<검색어2>']
for h in herbs:
    name = h.get('korean_name','') + h.get('hanja_name','') + ' '.join(h.get('aliases',[]))
    if any(k in name for k in keywords):
        print(h['id'], h['korean_name'], h.get('hanja_name',''))
"
```

### 4. THUMBNAIL_BY_ID에 엔트리 추가

`js/herb-viewer.js`의 `THUMBNAIL_BY_ID` 끝 (`};` 직전)에 추가:

```js
'HERB_ID': 'asset/Img/Filename.png',
```

### 5. THUMBNAIL_REFERENCE.md 업데이트

새로 매핑된 항목을 반영합니다.

## 매핑 원칙

- **1이미지-1약재**: PNG 한 개는 **한 약재 ID에만** 매핑한다
- **전용 파일이 없으면**: `THUMBNAIL_BY_ID`에 넣지 않는다. 다른 PNG를 복사해 이름만 맞추거나 비슷한 이미지로 억지 매핑하지 않는다
- **기준: 화면에 노출된 영어학문명** — `HERB_ENGLISH_SUPPLEMENT`의 영어명이 목록 화면에 표시되는 값이며, 이 영어명과 PNG 파일명이 일치하는 것을 기준으로 매핑한다
- 파일명의 하이픈·언더스코어·공백·대소문자 차이는 무시하고 정규화해서 비교
- 동일 영어명을 가진 herb가 여럿일 경우, 역방향 맵의 충돌을 인식하고 SUPPLEMENT의 영어명이 파일명과 정확히 대응하는 herb ID를 우선한다
- 식물학적 판단이나 한국어명 기준으로 임의 결정하지 말 것 — 반드시 SUPPLEMENT 영어명이 근거

## 확인 필수 사항

아래 경우 사용자에게 먼저 확인을 받은 뒤 진행한다:
- 동일 PNG에 이미 매핑된 약재가 있는데 **추가**로 다른 약재를 매핑하려 할 때
- 이미 다른 약재에 쓰인 PNG를 **재사용**하려 할 때

매핑 변경 전에 `THUMBNAIL_BY_ID` 전체를 검사해 **역방향 중복**(같은 경로가 여러 ID에 연결됨)이 없는지 확인한다.

## 기타 규칙

- `data/herb-data.js` 전체를 Read 도구로 읽지 말 것 (단일 라인 JSON, shell python3 one-liner만 사용)
- `THUMBNAIL_REFERENCE.md`를 Read 도구로 읽지 말 것 (1130줄 이상) — shell grep으로 대체
- `herb-viewer.js`는 수정 시 1회만 Read (4~320줄 범위)
- `NO_*.png` 파일은 매핑 대상 아님 (단, `PLANT_292` 등 이미 매핑된 NO_ 항목은 유지)

## 파일 구조 참고

- 매핑 오브젝트: `js/herb-viewer.js` 4~320줄 `var THUMBNAIL_BY_ID = { ... };`
- 경로 형식: `'HERB_ID': 'asset/Img/Filename.png'`
- herb ID 형식: `PLANT_xxx`, `ANIMAL_xxx`, `MINERAL_xxx`, `OTHER_xxx`
- 영어명 출처: `data/herb-data.js`의 `window.HERB_ENGLISH_SUPPLEMENT` (약 641개)
