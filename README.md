# Moon Seung Gi Portfolio

문승기의 AI 엔지니어 포트폴리오입니다. Astro와 MDX로 구성되며 `main` 브랜치 반영 시 GitHub Actions가 `https://tmdekd.github.io`에 배포합니다.

## Local development

```bash
npm install
npm run dev
```

검증 명령:

```bash
npm test
npm run build
npm run test:e2e
```

## Project content

- 메타데이터: `src/data/projects.ts`
- 상세 콘텐츠: `src/content/projects/*.mdx`
- 공통 상세 레이아웃: `src/layouts/ProjectLayout.astro`
- 디자인 토큰: `src/styles/tokens.css`

## Replacing media placeholders

프로젝트별 이미지는 `public/media/projects/<project-slug>/`에 저장합니다. 상세 MDX의 `heroMedia` 또는 `media`에서 아래 항목만 교체하면 기존 비율과 레이아웃이 유지됩니다.

```yaml
type: image
src: /media/projects/neurocare/example.webp
alt: 화면의 내용과 목적을 설명하는 대체 텍스트
caption: 이미지 설명
aspectRatio: 16 / 10
```

영상 파일이 크면 저장소에 직접 추가하지 않고 외부 스트리밍 URL을 사용합니다.
직접 재생하는 영상에는 한국어 WebVTT 자막 파일을 함께 두고 `captionsSrc`에 경로를 지정합니다.
