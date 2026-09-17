import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { profile } from '../src/data/profile';

const projectDirectory = join(process.cwd(), 'src', 'content', 'projects');
const projects = readdirSync(projectDirectory).map((file) => {
  const content = readFileSync(join(projectDirectory, file), 'utf8');
  return {
    slug: file.replace(/\.mdx$/, ''),
    title: content.match(/^title:\s*(.+)$/m)?.[1]?.trim(),
    order: Number(content.match(/^order:\s*(\d+)$/m)?.[1]),
  };
}).sort((a, b) => a.order - b.order);

describe('public portfolio content', () => {
  it('keeps the approved project order and routes', () => {
    expect(projects.map(({ slug, title }) => ({ slug, title }))).toEqual([
      { slug: 'neurocare', title: 'NeuroCare' },
      { slug: 'lawmate', title: 'LAWMATE' },
      { slug: 'vino', title: 'VINO' },
      { slug: 'yoriwang-jwaryong', title: '요리왕 좌룡' },
    ]);
  });

  it('contains only public contact fields', () => {
    expect(profile.contact).toEqual({
      email: 'moon010103@naver.com',
      github: 'https://github.com/tmdekd',
      velog: 'https://velog.io/@tmdekd/posts',
    });
    expect(profile).not.toHaveProperty('phone');
    expect(profile).not.toHaveProperty('birthDate');
    expect(profile).not.toHaveProperty('address');
  });

  it('marks the public resume as not yet available', () => {
    expect(profile.resume.status).toBe('preparing');
  });

  it('keeps card video previews poster-only and detailed videos controllable', () => {
    const mediaFrame = readFileSync(join(process.cwd(), 'src', 'components', 'MediaFrame.astro'), 'utf8');

    expect(mediaFrame).toContain("mode = 'detail'");
    expect(mediaFrame).toContain("mode === 'card' && asset.type === 'video'");
    expect(mediaFrame).toContain('class="video-poster"');
    expect(mediaFrame).toContain('class="video-poster__fallback"');
    expect(mediaFrame).not.toContain('isCardVideo && asset.poster');
    expect(mediaFrame).toContain('<video controls preload="metadata"');
    expect(mediaFrame).not.toContain('autoplay');
  });
});
