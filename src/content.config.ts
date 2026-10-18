import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** 시연·대표 미디어 (MediaFrame). aspectRatio가 없으면 media-manifest.json의 폭·높이로 계산한다. */
const mediaAsset = z.object({
  type: z.enum(['image', 'video', 'diagram']),
  src: z.string().optional(),
  poster: z.string().optional(),
  alt: z.string(),
  caption: z.string().optional(),
  aspectRatio: z.string().optional(),
  captionsSrc: z.string().optional(),
});

/** 본문 이미지 참조. alt·caption을 생략하면 media-manifest.json의 값을 쓴다. */
const mediaRef = z.object({
  src: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    // 표지
    title: z.string(),
    subtitle: z.string(),
    order: z.number(),
    period: z.string(),
    role: z.string(),
    platform: z.string(),
    result: z.string(),
    summary: z.string(),
    tech: z.array(z.string()), // 홈 카드 칩(최대 3개 노출)
    skills: z.array(z.string()), // 원본 "My Skills" 전체
    githubUrl: z.url().optional(),
    demoUrl: z.url().optional(),
    heroMedia: mediaAsset,
    /** 홈 카드에 2장을 나란히 보일 때(세로 휴대폰 화면 등). 없으면 heroMedia 1장 */
    cardMedia: z.array(mediaAsset).max(2).optional(),
    draft: z.boolean(),

    // 제안 배경: 근거 카드
    background: z.array(z.object({ media: mediaRef.optional(), heading: z.string().optional(), points: z.array(z.string()) })),

    // 기획 의도: 인용문 + 문제 → 해결 쌍
    intent: z.object({ quote: z.string(), pairs: z.array(z.object({ before: z.string(), after: z.string() })) }),

    // 구조: 시스템 아키텍처(스택 그룹) 또는 서비스 흐름 설계(원칙)
    architecture: z.object({ media: mediaRef, stack: z.array(z.object({ label: z.string(), items: z.array(z.string()) })) }).optional(),
    flowDesign: z.object({ media: mediaRef, principles: z.array(z.object({ title: z.string(), note: z.string() })) }).optional(),

    // 주요 기능: 대상(또는 기능명)별 그룹
    featureGroups: z.array(z.object({ audience: z.string(), points: z.array(z.string()), media: z.array(mediaRef).default([]) })),

    // 주요 고려사항: 질문형 제목 + 기존 문제점 / 접근 방식
    considerations: z.array(z.object({
      question: z.string(),
      /** wide: 이미지 전폭 → 문제/접근 2열(글이 든 도식·비교). side: 화면·일러스트를 왼쪽에, 문제/접근을 오른쪽에 */
      layout: z.enum(['wide', 'side']).default('wide'),
      quote: z.string().optional(),
      media: z.array(mediaRef).default([]),
      problemsTitle: z.string().optional(),
      problems: z.array(z.string()).default([]),
      approachTitle: z.string().optional(),
      approach: z.array(z.string()).default([]),
      table: z.array(z.object({ label: z.string(), items: z.array(z.string()) })).optional(),
    })),

    // 시연
    /** 시연 영상이 없는 프로젝트(VINO·요리왕 좌룡)는 생략 → 시연 섹션을 렌더하지 않는다 */
    demo: z.object({ media: z.array(mediaAsset), note: z.string().optional() }).optional(),

    // 회고
    retrospective: z.object({
      sections: z.array(z.object({ title: z.string(), body: z.string() })),
      links: z.object({ velog: z.url().optional(), github: z.url().optional() }),
    }),
  }),
});

export const collections = { projects };
