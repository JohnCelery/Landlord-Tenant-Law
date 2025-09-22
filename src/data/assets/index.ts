export interface AssetSlot {
  key: string
  width: number
  height: number
  aspect: string
  density: '1x' | '2x'
  formatPreferred: string
  notes?: string
}

export const assetCatalog: AssetSlot[] = [
  {
    key: 'ui.map.bg.nj.portrait',
    width: 1440,
    height: 2560,
    aspect: '9:16',
    density: '2x',
    formatPreferred: 'WEBP|PNG',
    notes: 'Keep top 20% clear for HUD.',
  },
  {
    key: 'badge.noticeNinja',
    width: 512,
    height: 512,
    aspect: '1:1',
    density: '2x',
    formatPreferred: 'SVG|PNG',
  },
  {
    key: 'building.noticeCenter',
    width: 1920,
    height: 1080,
    aspect: '16:9',
    density: '1x',
    formatPreferred: 'JPG|PNG',
    notes: 'Use warm, welcoming tones for briefing scenes.',
  },
]
