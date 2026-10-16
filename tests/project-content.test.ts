import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const directory = join(process.cwd(), 'src', 'content', 'projects');
const projects = readdirSync(directory).map((file) => ({
  file,
  content: readFileSync(join(directory, file), 'utf8'),
}));

describe('project metadata', () => {
  it('uses real, accessible hero media that exists in public/', () => {
    for (const project of projects) {
      const hero = project.content.match(/heroMedia:\s*\r?\n\s+type: image\s*\r?\n\s+src: (\S+)\s*\r?\n\s+alt: (.+)/);
      expect(hero, `${project.file} heroMedia`).not.toBeNull();
      expect(existsSync(join(process.cwd(), 'public', hero![1])), `${project.file} ${hero![1]}`).toBe(true);
      expect(hero![2].trim().length).toBeGreaterThanOrEqual(6);
    }
  });

  it('references only media files that exist and are listed in the manifest', () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'media-manifest.json'), 'utf8')) as Record<string, unknown>;
    for (const project of projects) {
      const refs = Array.from(project.content.matchAll(/(?:src|poster): (\/media\/[^\s,}]+)/g)).map((match) => match[1]);
      expect(refs.length).toBeGreaterThan(3);
      for (const ref of refs) {
        expect(existsSync(join(process.cwd(), 'public', ref)), `${project.file} ${ref}`).toBe(true);
        expect(manifest[ref], `${project.file} ${ref} not in manifest`).toBeDefined();
      }
    }
  });

  it('carries every original portfolio section', () => {
    for (const project of projects) {
      for (const key of ['background:', 'intent:', 'featureGroups:', 'considerations:', 'demo:', 'retrospective:']) {
        expect(project.content, `${project.file} ${key}`).toContain(`\n${key}`);
      }
      expect(/\n(architecture|flowDesign):/.test(project.content), `${project.file} structure`).toBe(true);
    }
  });

  it('uses unique ascending order values', () => {
    const orders = projects.map(({ content }) => Number(content.match(/^order:\s*(\d+)$/m)?.[1])).sort();
    expect(orders).toEqual([1, 2, 3, 4]);
  });
});
