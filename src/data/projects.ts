export interface Project {
  name: string; description: string; category: string; tags: string[];
  href?: string; github?: string; detail?: string; archived?: boolean;
}
export const projects: Project[] = [
  { name: 'StudyCoPi', description: '勉強スケジュールの管理を支援する学習Webアプリ。', category: 'Web App', tags: ['Web', 'PWA'], href: 'https://hirokawa-beach.github.io/StudyCoPi/', github: 'https://github.com/hirokawa-beach/StudyCoPi' },
  { name: 'OkiMAP', description: 'Wplace沖ノ鳥島周辺の記録を閲覧できるLeafletベースのアーカイブマップ。', category: 'Mapping', tags: ['Leaflet', 'Web'], href: 'https://okimap.wplaceoki.com/', github: 'https://github.com/hirokawa-beach/OkiMAP' },
  { name: 'Oki Archive Bot', description: 'Discordからアーカイブの取得や時点間の差分画像生成を行うBot。', category: 'Discord Bot', tags: ['Bot', 'Automation'], detail: '/botinfo.html' },
  { name: 'AviUtl2-IntelliSense', description: 'AviUtl2のカスタムオブジェクト制作を補助するVS Code拡張。現在は更新停止中。', category: 'Developer Tool', tags: ['VS Code', 'Extension'], github: 'https://github.com/hirokawa-beach/AviUtl2-IntelliSense', archived: true }
];
