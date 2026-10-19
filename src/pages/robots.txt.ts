import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  const text = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapURL.href}\n`;
  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
