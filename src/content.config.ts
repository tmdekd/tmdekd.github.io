import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const mediaAsset = z.object({
  type: z.enum(['image', 'video', 'diagram', 'placeholder']),
  src: z.string().optional(),
  poster: z.string().optional(),
  alt: z.string(),
  caption: z.string().optional(),
  aspectRatio: z.string(),
  captionsSrc: z.string().optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    order: z.number(),
    period: z.string(),
    role: z.string(),
    platform: z.string(),
    result: z.string(),
    summary: z.string(),
    tech: z.array(z.string()),
    githubUrl: z.url().optional(),
    demoUrl: z.url().optional(),
    heroMedia: mediaAsset,
    media: z.array(mediaAsset),
    draft: z.boolean(),
    problem: z.array(z.string()),
    goals: z.array(z.string()),
    flow: z.array(z.string()),
    features: z.array(z.object({ title: z.string(), description: z.string() })),
    decisions: z.array(z.object({ title: z.string(), description: z.string() })),
    reflection: z.string(),
  }),
});

export const collections = { projects };
