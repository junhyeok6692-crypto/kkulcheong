# policy-hub — 정부지원사업/청년정책 모아보기

전국 정부지원사업 공고를 한 곳에서. 분야·지역 필터, 마감임박 정렬, 내 정보 기반 맞춤 검색.

## 기술 스택
- Next.js (App Router) + TypeScript + Tailwind
- 데이터: 기업마당(bizinfo.go.kr) 오픈API — 1시간마다 갱신(ISR)

## 다른 PC(집)에서 개발 이어가기

```bash
git clone <이 저장소 주소>
cd policy-hub
npm install
```

그다음 **`.env.local` 파일을 만들고** 인증키를 넣으세요 (보안상 git에 안 올라감):

```
# .env.local.example 참고
BIZINFO_API_KEY=발급받은키
YOUTH_API_KEY=
```

> 기업마당 키는 신청 시 등록한 **IP에서만** 작동합니다. 집 IP가 다르면
> 기업마당(활용정보 > 정책정보 개방)에서 IP를 추가/변경하세요.
> (현재 공인 IP 확인: https://www.myip.com)

실행:

```bash
npm run dev        # 개발 서버 → http://localhost:3000
npm run test:api   # API 연결 테스트 (응답 원본 확인)
npm run build      # 프로덕션 빌드
```

## 폴더 구조
- `app/page.tsx` — 메인 페이지 (서버에서 API 수집 후 렌더)
- `lib/bizinfo.ts` — 기업마당 API 수집 + 정규화
- `lib/profile.ts` — 내 정보(프로필) 기반 맞춤 매칭 로직
- `components/PolicyList.tsx` — 목록/필터/맞춤/지역별 보기 UI
- `scripts/test-api.mjs` — API 연결 테스트
