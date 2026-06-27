# 한의학고전DB(mediclassics.kr) 상세 효능 매핑

[한의학고전DB 탕액편](https://www.mediclassics.kr/books/8/volume/20)에서 `#content_432`처럼 **content_XXX** 번호만 바꾸면 각 약재의 상세 본문으로 이동합니다. 이 번호와 우리 약재(herb id)를 매핑하면 스크래핑한 상세 문구를 아카이브에 쓸 수 있습니다.

## 방법 0: 저장 HTML에서 원문(chinese)/한글(ko) 추출 (권장)

페이지 **Elements 소스**를 그대로 가져와 **chinese·sec_node**(원문), **ko sec_node**(한글) 구조로 팝업에 반영하려면:

1. 브라우저에서 아래 세 권을 각각 연다.
   - [탕액편 권01](https://www.mediclassics.kr/books/8/volume/20)
   - [탕액편 권02](https://www.mediclassics.kr/books/8/volume/21)
   - [탕액편 권03](https://www.mediclassics.kr/books/8/volume/22)
2. **중요**: 각 페이지에서 **끝까지 스크롤**해 본문(원문·한글)이 모두 로드된 뒤에 저장한다. 그렇지 않으면 저장된 HTML에 `content_XXX` 블록이 없어 파싱 결과가 비게 된다.
3. **다른 이름으로 저장** → **"웹페이지, 완전히"** 또는 **"웹페이지, 단일 파일"**로 저장한다.
4. 프로젝트에 `mediclassics-html/` 폴더를 만들고, 저장한 파일을 `volume-20.html`, `volume-21.html`, `volume-22.html`로 둔다.
5. 다음을 실행한다.
   ```bash
   npm run parse-mediclassics-html
   ```
6. 생성되는 `donguibogam-texts.js`는 `{ "PLANT_001": { chinese: "원문", ko: "한글" }, ... }` 형식이다. 이미 `index.html`에서 로드 중이므로, 약재 팝업의 **동의보감 기록**에 원문 위·한글 아래로 표시된다.

## 방법 1: 수동 매핑 후 스크래핑

1. `mediclassics-content-map.example.json`을 복사해 `mediclassics-content-map.json`으로 저장합니다.
2. [탕액편 권01](https://www.mediclassics.kr/books/8/volume/20), 권02(volume/21), 권03(volume/22)에서 각 약재 항목을 열고 URL의 **#content_숫자**를 확인합니다.
3. `mediclassics-content-map.json`에 다음 형식으로 채웁니다.
   ```json
   {
     "PLANT_001": { "volume": 20, "contentId": 432 },
     "PLANT_002": { "volume": 20, "contentId": 433 }
   }
   ```
   - **volume**: 20=탕액편 권01, 21=권02, 22=권03  
   - **contentId**: URL의 `#content_432` 에서 **432** 부분

4. 상세 문구 수집:
   ```bash
   npm run fetch-mediclassics-detail
   ```
   - 출력: 프로젝트 루트의 `donguibogam-texts.js`
   - `index.html`에서 해당 스크립트 주석을 해제하면 약재 상세 모달의 "동의보감 기록"에 반영됩니다.

## 방법 2: 자동 매핑 시도 후 스크래핑

volume HTML에 `id="content_XXX"` 블록이 포함되어 있으면, 한자 제목으로 우리 약재와 매칭해 매핑 파일을 만들 수 있습니다.

```bash
npm run build-mediclassics-map
```

- 생성: `scripts/mediclassics-content-map.json`
- 사이트가 본문을 클라이언트에서 로드하면 블록이 비어 있어 매핑이 안 될 수 있습니다. 그 경우 방법 1처럼 수동으로 매핑을 채운 뒤 `fetch-mediclassics-detail`을 실행하면 됩니다.

## 참고

- **저작권**: 한의학고전DB(KIOM) 자료는 해당 사이트 이용 약관과 저작권 안내를 따릅니다. 스크래핑 결과는 개인/교육용으로만 사용하는 것을 권장합니다.
- **SPA 대응**: 본문이 JavaScript로만 로드되면 일반 fetch로는 수집이 안 됩니다. 그 경우 Puppeteer 등으로 페이지를 띄운 뒤 `#content_XXX` 영역을 추출하는 스크립트를 추가해야 합니다.
