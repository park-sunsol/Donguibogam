# Donguibogam 프로젝트 지침

## 데이터 빌드

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **`effect.json` → `herbs-data.js` 변환**
   ```bash
   npm run build-herbs-from-effect
   ```

3. **`effect.json` → `effect-data.js` 변환**
   ```bash
   npm run build-effect-data
   ```

4. **페이지 열기** — `index.html`을 브라우저에서 열면 약재 데이터가 반영됩니다.

---

## 구조 변경 이력 관리

파일·폴더의 삭제, 이동, 이름 변경 등 **구조적 변경**을 수행할 때는 반드시 `STRUCTURE_LOG.md`에 이력을 추가한다.

- 기록 양식은 `STRUCTURE_LOG.md` 하단의 "기록 양식" 참조
- 변경과 동시에 기록 — 나중으로 미루지 않는다
