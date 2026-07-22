# 꿀청 (Kkulcheong)

청년을 위한 정부·지자체 지원 정책 정보를 한곳에 모아 보여주는 정적(static) 웹사이트입니다.
주거·취업·창업·자산형성·교육·문화 6개 카테고리로 정책을 분류하고, 검색/필터 기능을 제공합니다.

## 폴더 구조

```
꿀청/
├─ index.html          # 메인 페이지 (정책/공고 목록, 검색, 분야·대상·지역 필터, 페이지네이션)
├─ about.html          # 사이트 소개
├─ privacy.html        # 개인정보처리방침 (애드센스 필수)
├─ terms.html          # 이용약관
├─ css/style.css       # 전체 스타일 (허니 톤 디자인)
├─ js/main.js          # 검색/필터/정렬/페이지네이션/데이터 렌더링 로직
├─ js/nav.js           # 서브페이지 모바일 메뉴 토글
├─ data/policies.json  # (더 이상 사이트에서 사용 안 함) 예전 청년정책 샘플 데이터
├─ data/youthpolicy.json  # 온통청년 실시간 청년정책 데이터 (자동 생성, 아래 2번 참고)
├─ data/bizinfo.json   # 기업마당 실시간 공고/행사 데이터 (자동 생성, 아래 2번 참고)
├─ scripts/fetch-bizinfo.js  # 기업마당 오픈API 호출 스크립트
├─ scripts/fetch-youthpolicy.js  # 온통청년 청년정책 오픈API 호출 스크립트
├─ .github/workflows/update-bizinfo.yml  # 매일 자동으로 공고를 갱신하는 GitHub Actions
├─ .github/workflows/update-youthpolicy.yml  # 매일 자동으로 청년정책을 갱신하는 GitHub Actions
├─ .env.example         # 환경변수(API 키) 템플릿 - 실제 값은 .env(gitignore)에 저장
├─ assets/logo.svg      # 로고 (헤더용 워드마크)
├─ assets/favicon.svg   # 파비콘
├─ ads.txt              # 애드센스 연동용 (승인 후 값 채우기)
├─ robots.txt / sitemap.xml
└─ ADSENSE_GUIDE.md     # 애드센스 가입~승인 단계별 가이드
```

## 1. 로컬에서 미리보기

`index.html`을 더블클릭해서 바로 열면 `fetch('data/policies.json')`이
브라우저 보안 정책(CORS)에 막혀 정책 목록이 안 보일 수 있습니다.
반드시 로컬 웹서버를 띄워서 확인하세요.

```powershell
# 이 폴더에서 실행 (Python이 설치되어 있는 경우)
python -m http.server 5500

# 또는 Node.js가 있는 경우
npx serve .
```

브라우저에서 `http://localhost:5500` 접속.

## 2. 기업마당(bizinfo.go.kr) 실시간 공고 연동

`data/youthpolicy.json`(청년정책, 아래 참고)과 별도로, `data/bizinfo.json`에는 **기업마당 오픈API**에서
실시간으로 수집한 지원사업 공고/행사 정보가 들어갑니다. `js/main.js`가 두 파일을 자동으로
합쳐서 보여주며, 마감이 임박한(D-5 이내) 공고를 우선 정렬해 상단에 노출합니다.

### 로컬에서 최신 데이터로 갱신하기

1. `.env.example`을 복사해 `.env` 파일을 만들고 발급받은 인증키를 입력합니다.
   ```
   BIZINFO_API_KEY=발급받은_지원사업정보_인증키
   BIZINFO_EVENT_API_KEY=발급받은_행사정보_인증키
   ```
   `.env` 파일은 `.gitignore`에 등록되어 있어 깃에 올라가지 않습니다.
2. Node.js가 설치되어 있다면 아래 명령으로 직접 실행할 수 있습니다.
   ```powershell
   node scripts/fetch-bizinfo.js
   ```
   실행하면 `data/bizinfo.json`이 최신 공고로 갱신됩니다.

### GitHub Actions로 매일 자동 갱신하기 (배포 후 권장)

저장소를 GitHub에 올린 뒤, 아래 두 가지만 설정하면 매일 자동으로 공고가 갱신됩니다.

1. 저장소 **Settings → Secrets and variables → Actions → New repository secret**에서
   `BIZINFO_API_KEY`, `BIZINFO_EVENT_API_KEY`를 각각 등록합니다. (`.env`에 적은 것과 동일한 값)
2. `.github/workflows/update-bizinfo.yml` 워크플로가 매일 한국시간 06:00에 자동 실행되어
   `data/bizinfo.json`을 갱신하고 커밋/푸시합니다. 바로 한 번 실행해보고 싶다면 저장소의
   **Actions 탭 → "기업마당 공고 자동 갱신" → Run workflow** 버튼을 눌러 수동 실행할 수도 있습니다.

### 청년정책(`youthpolicy.json`) 실시간 연동 (온통청년 오픈API)

`data/policies.json`(예시 샘플, 더 이상 사이트에서 로드하지 않음) 대신 `data/youthpolicy.json`이
실제 정책 데이터를 담당합니다. [온통청년](https://www.youthcenter.go.kr) 오픈API(`청년정책` 목록 조회,
엔드포인트 `https://www.youthcenter.go.kr/go/ythip/getPlcy`)에서 실시간으로 수집합니다.

1. `.env`에 아래 키를 추가합니다.
   ```
   YOUTH_POLICY_API_KEY=발급받은_청년정책_인증키
   ```
2. 로컬에서 갱신: `node scripts/fetch-youthpolicy.js` (Node.js 필요)
3. GitHub Actions 자동 갱신: 저장소 Secrets에 `YOUTH_POLICY_API_KEY`를 등록하면
   `.github/workflows/update-youthpolicy.yml`이 매일 한국시간 06:05에 자동 실행되어
   `data/youthpolicy.json`을 갱신하고 커밋/푸시합니다.

카테고리는 온통청년의 대분류(`lclsfNm`)/중분류(`mclsfNm`)를 꿀청 6개 카테고리(주거/취업/창업/자산·금융/교육/문화·생활)로
매핑해서 분류합니다(`scripts/fetch-youthpolicy.js`의 `mapCategory` 참고, 정확도는 계속 다듬을 수 있음).
지역(`region`) 필드는 API 응답의 `zipCd`가 우편번호 목록 형태라 지역명으로 정확히 매핑하기 어려워
현재는 전부 "전국"으로 표시합니다.

> **청년컨텐츠 API는 아직 연동 전입니다.** 인증키는 발급받았지만 정확한 엔드포인트 URL을
> 확인하지 못했습니다 — 온통청년 [마이페이지 → 오픈API 신청내역](https://www.youthcenter.go.kr/myPage/openapi)에서
> 요청 URL 샘플을 확인해서 알려주시면 `fetch-bizinfo.js`/`fetch-youthpolicy.js`와 같은 패턴으로 추가하겠습니다.

## 3. GitHub Pages 무료 배포 방법

1. https://github.com 에서 계정 생성 (이미 있다면 생략)
2. 새 저장소 생성 (예: `kkulcheong`), Public으로 설정
3. 이 폴더 전체를 저장소에 업로드 (GitHub Desktop을 쓰면 GUI로 쉽게 가능)
   ```powershell
   git init
   git add .
   git commit -m "init: 꿀청 사이트 초기 버전"
   git branch -M main
   git remote add origin https://github.com/<본인계정>/kkulcheong.git
   git push -u origin main
   ```
4. 저장소 Settings → Pages → Source에서 `main` 브랜치 / `/ (root)` 선택 후 저장
5. 몇 분 후 `https://<본인계정>.github.io/kkulcheong/` 주소로 접속 가능
6. `robots.txt`, `sitemap.xml` 안의 `YOUR-DOMAIN-HERE`를 실제 주소로 교체

### (선택) 커스텀 도메인 연결
도메인을 구매하셨다면(가비아, 후이즈 등) 저장소에 `CNAME` 파일을 추가하고 도메인 DNS에
GitHub Pages용 A 레코드/CNAME 레코드를 설정하면 `www.kkulcheong.co.kr` 같은 주소를 쓸 수 있습니다.
필요하시면 도메인 이름을 알려주시면 CNAME 파일과 DNS 설정값을 만들어드릴게요.

## 4. 애드센스(AdSense) 등록

애드센스 가입~승인까지의 상세 절차는 **[ADSENSE_GUIDE.md](ADSENSE_GUIDE.md)** 를 참고하세요.
가입 자체는 본인 명의 구글 계정으로 직접 진행해야 하는 단계이지만, 사이트 쪽에서 준비해야 할
모든 부분(개인정보처리방침, ads.txt, 광고 삽입 위치 등)은 이미 준비되어 있습니다.
