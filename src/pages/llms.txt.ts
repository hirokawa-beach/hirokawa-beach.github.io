import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteMetadata } from '../data/site';

export const GET: APIRoute = async ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const posts = (await getCollection('blog'))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const text = [
    `# ${siteMetadata.name} | hb283.dev`,
    '',
    `> ${siteMetadata.description}`,
    '',
    'Web/デスクトップアプリの個人開発や、架空鉄道についてのサイトです。本文は日本語です。',
    '',
    '## 主なページ',
    '',
    `- [ホーム](${url('/')}): サイト紹介とプロフィール。`,
    `- [制作物](${url('/projects/')}): 公開中のアプリ・ツールの紹介とリンク。`,
    `- [ブログ](${url('/blog/')}): 開発記録とサイトの更新。`,
    `- [稼働状況](${url('/status/')}): Raspberry Piの計測状況。表示値は接続状態と時刻に依存します。`,
    `- [Botの説明](${url('/botinfo/')}): Discord Botの利用案内。`,
    `- [StudyCoPi紹介](${url('/studycopi-guide/')}): 学習管理アプリの機能と使い方。`,
    '',
    '## ブログ記事',
    '',
    ...posts.map(post => `- [${post.data.title}](${url(`/blog/${post.id}/`)}): ${post.data.description}`),
    '',
    '## 更新情報',
    '',
    `- [RSS](${url('/feed.xml')}): ブログ記事の更新。`,
    `- [サイトマップ](${url('/sitemap-index.xml')}): 公開ページの一覧。`,
    ''
  ].join('\n');

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
