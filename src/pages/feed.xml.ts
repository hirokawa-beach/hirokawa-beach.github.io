import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteMetadata } from '../data/site';

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('blog'))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: `${siteMetadata.name}のブログ`,
    description: '開発やサイト更新について書いています。',
    site: new URL('blog/', site),
    customData: '<language>ja</language>',
    items: posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      categories: post.data.tags,
      link: new URL(`/blog/${post.id}/`, site).href
    }))
  });
};
