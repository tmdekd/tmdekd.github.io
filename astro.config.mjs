import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';

/** 서체 전략 시안 비교용(2026-10-19): FONT_STRATEGY=current|a|b 로 src/styles/fonts/<전략>.css 를 global.css 에 꽂는다. 결정 후 제거 예정 */
const fontStrategy = process.env.FONT_STRATEGY ?? 'current';

export default defineConfig({
  site: 'https://tmdekd.github.io',
  integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/lab/') })],
  output: 'static',
  trailingSlash: 'always',
  vite: {
    resolve: {
      alias: {
        '@font-strategy': fileURLToPath(new URL(`./src/styles/fonts/${fontStrategy}.css`, import.meta.url)),
      },
    },
  },
});
