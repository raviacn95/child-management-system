import { officialShopUrl, type ShopSourceId } from '../shopping/sources'

export type GiftItem = { title: string; query: string }

export type GiftGuide = {
  id: string
  title: string
  blurb: string
  months: number[]
  items: GiftItem[]
}

const ALL_MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

export const GIFT_GUIDES: GiftGuide[] = [
  {
    id: 'festive',
    title: 'Diwali & festive gifts',
    blurb: 'Screen-free gifts that keep little hands busy during the holidays.',
    months: [8, 9, 10],
    items: [
      { title: 'Wooden puzzle set', query: 'wooden puzzle kids 3 years' },
      { title: 'Rangoli colour kit', query: 'rangoli colours kids kit' },
      { title: 'Ethnic kurta set', query: 'kids kurta pyjama set' },
      { title: 'Story books pack', query: 'picture story books kids pack' },
    ],
  },
  {
    id: 'monsoon',
    title: 'Monsoon indoor play',
    blurb: 'Rainy-day activities for when parks are off the table.',
    months: [5, 6, 7, 8],
    items: [
      { title: 'Play dough set', query: 'non toxic play dough kids' },
      { title: 'Kids raincoat', query: 'kids raincoat' },
      { title: 'Building blocks', query: 'building blocks kids 3 years' },
      { title: 'Craft kit', query: 'kids craft kit' },
    ],
  },
  {
    id: 'school',
    title: 'Back to school',
    blurb: 'Everything for the first week of term.',
    months: [3, 4, 5],
    items: [
      { title: 'School bag', query: 'kids school bag' },
      { title: 'Steel lunch box', query: 'steel lunch box kids' },
      { title: 'Water bottle', query: 'kids water bottle leak proof' },
      { title: 'Crayons & colours', query: 'crayons kids' },
    ],
  },
  {
    id: 'winter',
    title: 'Winter warmers',
    blurb: 'Cosy layers and indoor games for cold months.',
    months: [11, 0, 1],
    items: [
      { title: 'Woollen sweater', query: 'kids woollen sweater' },
      { title: 'Board games', query: 'board games kids 4 years' },
      { title: 'Cap and mittens', query: 'kids winter cap mittens' },
    ],
  },
  {
    id: 'birthday',
    title: 'Birthday gifts by age',
    blurb: 'Well-reviewed gifts for 1 to 6 year olds.',
    months: ALL_MONTHS,
    items: [
      { title: 'Ride-on toy (1–2 yrs)', query: 'ride on toy toddler' },
      { title: 'Magnetic drawing board (2–4 yrs)', query: 'magnetic drawing board kids' },
      { title: 'Science kit (5–6 yrs)', query: 'science kit kids 6 years' },
    ],
  },
]

export function activeGiftGuides(date = new Date(), limit = 2) {
  const month = date.getMonth()
  const seasonal = GIFT_GUIDES.filter((guide) => guide.months.length < 12 && guide.months.includes(month))
  const evergreen = GIFT_GUIDES.filter((guide) => guide.months.length === 12)
  return [...seasonal, ...evergreen].slice(0, Math.max(1, limit))
}

export const GIFT_SOURCES: ShopSourceId[] = ['amazon', 'flipkart']

export function giftLink(item: GiftItem, source: ShopSourceId) {
  return officialShopUrl(source, item.query)
}
