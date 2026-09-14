import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const directory = join(process.cwd(), 'src', 'content', 'projects');
const projects = readdirSync(directory).map((file) => ({
  file,
  content: readFileSync(join(directory, file), 'utf8'),
}));

describe('project metadata', () => {
  it('has complete, accessible media placeholders', () => {
    for (const project of projects) {
      expect(project.content).toMatch(/heroMedia:\s*\r?\n\s+type: placeholder/);
      expect(project.content).toMatch(/heroMedia:[\s\S]*?alt:\s*.{6,}/);
      expect(project.content).toMatch(/aspectRatio:\s*\d+\s*\/\s*\d+/);
      expect(project.content).toMatch(/media:\s*\r?\n\s+- type: placeholder/);
    }
  });

  it('uses unique ascending order values', () => {
    const orders = projects.map(({ content }) => Number(content.match(/^order:\s*(\d+)$/m)?.[1])).sort();
    expect(orders).toEqual([1, 2, 3, 4]);
  });
});
