# Moon Seung Gi Portfolio

문승기의 AI 엔지니어 포트폴리오 사이트입니다. Astro 7 + MDX 정적 사이트이며, `main` 브랜치에 반영되면 GitHub Actions가 테스트 → 빌드 → GitHub Pages 배포를 수행합니다. https://tmdekd.github.io

## 로컬 개발

```bash
npm install
npm run dev
```

검증(모든 변경은 세 가지를 통과해야 합니다):

```bash
npm test            # vitest: 콘텐츠·프로필 규칙(비공개 정보 없음, 미디어 참조 유효성 등)
npm run build       # astro check + 정적 빌드
npm run test:e2e    # Playwright: axe(wcag2a/2aa), 반응형 오버플로, 모션, 섹션 배치, 원본 대조
```

e2e는 설치된 Chrome(`channel: 'chrome'`)을 사용합니다.

## 구조

- 홈 섹션 순서: 히어로 → 프로젝트(4건 + 인턴 프로젝트 제목 목록) → 일하는 방식 → 경력 → 이력 사항 → 기술 역량 → Contact
- 프로젝트 상세: 배경 → 기획 의도 → 구조 → 주요 기능 → 고려사항 → (시연: 영상이 있을 때만) → 회고
- 콘텐츠
  - 프로젝트 상세: `src/content/projects/*.mdx` (스키마 `src/content.config.ts`)
  - 프로필·경력·이력·기술: `src/data/profile.ts`
  - 미디어 폭·높이·대체 텍스트: `src/data/media-manifest.json` (자동 생성, `src/data/media.ts`로 조회)
- 레이아웃·컴포넌트
  - 홈: `src/pages/index.astro`, `src/components/Hero.astro`, `ProjectCard.astro`, `Footer.astro`
  - 상세: `src/layouts/ProjectLayout.astro`, `src/components/project/*` (MediaImage, ShiftPairs, MediaLightbox)
  - 미디어 프레임(이미지·영상): `src/components/MediaFrame.astro`
- 디자인 토큰: `src/styles/tokens.css` — 색·간격·서체는 토큰으로만 관리합니다(컴포넌트에 하드코딩 금지).
- 모션: `motion/mini` + `src/scripts/motion/reduced.ts` 게이트. `prefers-reduced-motion`이면 완성 화면을 즉시 보여 줍니다. 인라인 스크립트는 CSP(`script-src 'self'`) 때문에 쓰지 않습니다.

## 콘텐츠 규칙

- 프로젝트 본문은 원본 포트폴리오(PDF)의 문구를 그대로 옮깁니다. 요약·과장·근거 없는 수치 추가 금지, 오탈자와 기술명 공식 표기(FastAPI, RunPod, PyTorch 등)만 교정합니다.
- 전화번호·생년월일은 게시하지 않습니다(`npm test`와 e2e가 역단언). 증명사진은 게시합니다.
- 재직 중인 회사 업무는 익명화해 기술 구조만 적습니다.
- 고려사항 이미지 배치는 MDX의 `layout: wide | side`로 정합니다. 글이 든 도식은 `wide`(전폭), 화면 캡처·일러스트는 `side`(문제/접근과 나란히).

## 미디어 파이프라인

원본 이미지·영상은 저장소에 넣지 않고, 변환본(`public/media/**`: WebP 최대 폭 2000·품질 85, H.264 720p + 포스터)만 커밋합니다.

```bash
# 매핑표 scripts/media/portfolio-media.map.json 을 읽어 public/media 와 media-manifest.json 생성
FFMPEG=<ffmpeg 실행 파일 경로> npm run media:import

# 변환 전 원본을 images_videos/ 에 함께 보관(git 제외)
FFMPEG=... KEEP_ORIGINALS=images_videos npm run media:import
```

본문 이미지는 `MediaImage`가 매니페스트의 폭·높이를 `<img width height>`로 넣어 레이아웃 이동(CLS)을 막고, 클릭하면 `MediaLightbox`에서 크게 봅니다. 영상은 `preload="metadata"` + 포스터이며 자동 재생하지 않습니다.

## 검증·캡처 도구 (`scripts/lab/`)

```bash
npm run lab:lighthouse                 # 데스크톱 Lighthouse (홈·LAWMATE). LH_FORM=mobile, LH_ROUTES=home,vino, LH_RUNS=5 지원
npm run lab:palettes                   # 풀페이지 캡처 1440/768/390 + axe. LAB_ROUTES="home:/,vino:/projects/vino/" 로 라우트 지정
npm run lab:section                    # 섹션 요소 캡처. LAB_SECTION="#project-structure" LAB_SLUGS=lawmate
npm run lab:motion                     # 히어로 모션 프레임 캡처
npm run lab:og                         # public/og-default.png 재생성 (표지 문장, Pretendard)
npm run lab:font-metrics               # Pretendard 대체 폰트(맑은 고딕) 메트릭 맞춤값 계산 → global.css 의 'Pretendard Fallback'
```

결과는 `lab-results/`(git 제외)에 저장됩니다.

## 배포

`.github/workflows/deploy.yml`: `npm test` → `npm run build` → `npm run test:e2e`(Playwright Chromium) 통과 시 `dist/`를 GitHub Pages에 배포합니다.
