import type { APIRoute } from 'astro';
import { siteMetadata } from '../../data/site';

export const GET: APIRoute = ({ site }) => {
  // No public AI agents or tool endpoints are offered by this site.
  const catalog = {
    specVersion: '1.0',
    host: {
      displayName: siteMetadata.name,
      documentationUrl: new URL('/', site).href
    },
    entries: []
  };

  return new Response(JSON.stringify(catalog, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
};
