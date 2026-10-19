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
    expect(profile.contact).toMatchObject({
      email: 'moon010103@naver.com',
      github: 'https://github.com/tmdekd',
      velog: 'https://velog.io/@tmdekd/posts',
    });
    expect(Object.keys(profile.contact).sort()).toEqual(['email', 'github', 'portfolioOriginal', 'resume', 'velog']);
    expect(profile).not.toHaveProperty('phone');
    expect(profile).not.toHaveProperty('birthDate');
    expect(profile).not.toHaveProperty('address');
    expect(JSON.stringify(profile)).not.toMatch(/010[- ]?2530[- ]?6958|2001\.01\.03/);
  });

  it('links the resume to the published MiriCanvas page when one is set', () => {
    const resume = profile.contact.resume;
    expect(resume === undefined || /^https:\/\/www\.miricanvas\.com\/v2\/ko\/design2\/v\/[0-9a-f-]+$/.test(resume)).toBe(true);
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
