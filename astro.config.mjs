import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = 'https://hb283.dev';

export default defineConfig({
  site,
  output: 'static',
  compressHTML: true,
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !['/404', '/404/', '/404.html'].includes(new URL(page).pathname),
      customPages: [new URL('/studycopi-guide/', site).href]
    })
  ]
});
