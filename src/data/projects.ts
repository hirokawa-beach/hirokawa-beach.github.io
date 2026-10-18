export interface Project {
  name: string; description: string; category: string; tags: string[];
  image: { src: string; alt: string; width: number; height: number };
  href?: string; github?: string; detail?: string; archived?: boolean;
}
export const projects: Project[] = [
  { name: 'StudyCoPi', description: '勉強スケジュールの管理を支援する学習Webアプリ。', category: 'Web App', tags: ['Web', 'PWA'], image: { src: '/studycopi-guide/assets/timetable.webp', alt: 'StudyCoPiの週間予定画面', width: 2048, height: 1536 }, href: 'https://hirokawa-beach.github.io/StudyCoPi/', github: 'https://github.com/hirokawa-beach/StudyCoPi' },
  { name: 'OkiMAP', description: 'Wplace沖ノ鳥島周辺の記録を閲覧できるLeafletベースのアーカイブマップ。', category: 'Mapping', tags: ['Leaflet', 'Web'], image: { src: '/images/projects/okimap.png', alt: 'OkiMAPのロゴと地図のイラスト', width: 2172, height: 724 }, href: 'https://okimap.wplaceoki.com/', github: 'https://github.com/hirokawa-beach/OkiMAP' },
  { name: 'Oki Archive Bot', description: 'Discordからアーカイブの取得や時点間の差分画像生成を行うBot。', category: 'Discord Bot', tags: ['Bot', 'Automation'], image: { src: '/img/botimg1.png', alt: 'Discordで表示したOki Archive Botのコマンド一覧', width: 1501, height: 551 }, detail: '/botinfo.html' },
  { name: 'AviUtl2-IntelliSense', description: 'AviUtl2のカスタムオブジェクト制作を補助するVS Code拡張。現在は更新停止中。', category: 'Developer Tool', tags: ['VS Code', 'Extension'], image: { src: '/images/projects/aviutl2.png', alt: 'AviUtl2-IntelliSenseによるコードの構文色分け', width: 990, height: 302 }, github: 'https://github.com/hirokawa-beach/AviUtl2-IntelliSense', archived: true }
];
