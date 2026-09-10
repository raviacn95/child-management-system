import { convertInr, packOf, type CountryPack } from './country'
import { ageMonths, clothingSize } from '../lib'
import type { Child, CountryCode, ShopItem, ShopNeed } from '../types'

type CatalogRow = Omit<ShopItem, 'mrp' | 'price'> & { mrpInr: number; priceInr: number }

const BASE: CatalogRow[] = [
  { id: 'fc-onesie', name: 'Organic snap onesie 3-pack', brand: 'WillowHug', category: 'fashion', minMonths: 0, maxMonths: 24, sizes: ['0–3M', '3–6M', '6–12M', '12–18M', '18–24M'], stock: 48, tags: ['cotton', 'onesie', 'spare', 'easy-wash'], why: 'Fast changes after bottles and reflux spit-up.', emoji: '👶', rating: 4.6, sold: 12840, codOk: true, gstRate: 0.05, comboWith: ['fc-bib', 'fc-diaper'], deliveryDays: 2, badge: 'Bestseller', mrpInr: 999, priceInr: 699 },
  { id: 'fc-frock', name: 'Printed cotton frock', brand: 'Pine Kids', category: 'fashion', minMonths: 12, maxMonths: 84, sizes: ['12–18M', '18–24M', '2–3Y', '3–4Y', '4–5Y', '5–6Y'], stock: 36, tags: ['cotton', 'ethnic', 'spare'], why: 'Picture day and festival mornings.', emoji: '👗', rating: 4.4, sold: 5620, codOk: true, gstRate: 0.05, comboWith: ['fc-legging', 'fc-clip'], deliveryDays: 2, badge: 'Festive', mrpInr: 1299, priceInr: 849 },
  { id: 'fc-kurta', name: 'Boys cotton kurta set', brand: 'WillowHug', category: 'fashion', minMonths: 12, maxMonths: 84, sizes: ['12–18M', '18–24M', '2–3Y', '3–4Y', '4–5Y', '5–6Y', '6–7Y'], stock: 28, tags: ['ethnic', 'festival', 'cotton'], why: 'Diwali, Eid, and annual-day ethnic wear.', emoji: '🥻', rating: 4.5, sold: 4310, codOk: true, gstRate: 0.12, comboWith: ['fc-mojari', 'fc-diya'], deliveryDays: 3, badge: 'Diwali pick', mrpInr: 1899, priceInr: 1299 },
  { id: 'fc-night', name: 'Soft night suit set', brand: 'NestCare', category: 'fashion', minMonths: 6, maxMonths: 84, sizes: ['6–12M', '12–18M', '18–24M', '2–3Y', '3–4Y', '4–5Y', '5–6Y'], stock: 40, tags: ['cotton', 'sleep', 'spare'], why: 'AC nap rooms and overnight at dadi’s.', emoji: '🛌', rating: 4.3, sold: 8900, codOk: true, gstRate: 0.05, comboWith: ['fc-sleepsack'], deliveryDays: 2, mrpInr: 899, priceInr: 599 },
  { id: 'fc-tee', name: 'Everyday cotton tee 2-pack', brand: 'Pine Kids', category: 'fashion', minMonths: 6, maxMonths: 84, sizes: ['6–12M', '12–18M', '18–24M', '2–3Y', '3–4Y', '4–5Y', '5–6Y', '6–7Y'], stock: 60, tags: ['cotton', 'spare', 'sensitive', 'labeled'], why: 'Cubby spare in breathable cotton.', emoji: '👕', rating: 4.7, sold: 21004, codOk: true, gstRate: 0.05, comboWith: ['fc-legging', 'fc-socks'], deliveryDays: 1, badge: 'For you', mrpInr: 799, priceInr: 499 },
  { id: 'fc-legging', name: 'Stretch joggers / leggings', brand: 'Pine Kids', category: 'fashion', minMonths: 6, maxMonths: 84, sizes: ['6–12M', '12–18M', '18–24M', '2–3Y', '3–4Y', '4–5Y', '5–6Y'], stock: 44, tags: ['easy-on', 'spare', 'cotton', 'potty'], why: 'Elastic waist for potty and independent dressing.', emoji: '👖', rating: 4.5, sold: 15400, codOk: true, gstRate: 0.05, comboWith: ['fc-tee', 'fc-velcro'], deliveryDays: 2, mrpInr: 899, priceInr: 549 },
  { id: 'fc-uniform', name: 'Centre house tee (Willow)', brand: 'Willow', category: 'uniform', minMonths: 12, maxMonths: 84, sizes: ['12–18M', '18–24M', '2–3Y', '3–4Y', '4–5Y', '5–6Y', '6–7Y'], stock: 80, tags: ['uniform', 'spare', 'labeled'], why: 'Annual day, trips, and picture day.', emoji: '🏫', rating: 4.8, sold: 3200, codOk: true, gstRate: 0.05, comboWith: ['fc-bag', 'fc-bottle'], deliveryDays: 2, badge: 'Centre kit', mrpInr: 699, priceInr: 499 },
  { id: 'fc-rain', name: 'Packable rain jacket', brand: 'LittlePine', category: 'fashion', minMonths: 12, maxMonths: 84, sizes: ['12–18M', '18–24M', '2–3Y', '3–4Y', '4–5Y', '5–6Y'], stock: 22, tags: ['outdoor', 'monsoon', 'easy-wash'], why: 'Bengaluru / Mumbai monsoon pickup.', emoji: '🌧️', rating: 4.2, sold: 2100, codOk: true, gstRate: 0.12, comboWith: ['fc-clogs', 'fc-bag'], deliveryDays: 3, mrpInr: 1499, priceInr: 999 },
  { id: 'fc-booties', name: 'Soft-sole booties', brand: 'SoftStep', category: 'footwear', minMonths: 0, maxMonths: 18, sizes: ['0–3M', '3–6M', '6–12M', '12–18M'], stock: 30, tags: ['onesie', 'indoor'], why: 'Keep infant feet covered without stiff soles.', emoji: '🧦', rating: 4.4, sold: 6400, codOk: true, gstRate: 0.05, comboWith: ['fc-onesie'], deliveryDays: 2, mrpInr: 449, priceInr: 299 },
  { id: 'fc-velcro', name: 'Velcro school sneakers', brand: 'SoftStep', category: 'footwear', minMonths: 12, maxMonths: 84, sizes: ['18–24M', '2–3Y', '3–4Y', '4–5Y', '5–6Y', '6–7Y'], stock: 26, tags: ['easy-on', 'outdoor', 'school'], why: 'No laces — kids put them on for PE and van line.', emoji: '👟', rating: 4.6, sold: 9800, codOk: true, gstRate: 0.12, comboWith: ['fc-socks', 'fc-uniform'], deliveryDays: 2, badge: 'COD pick', mrpInr: 1299, priceInr: 899 },
  { id: 'fc-clogs', name: 'Garden clogs', brand: 'SoftStep', category: 'footwear', minMonths: 18, maxMonths: 84, sizes: ['2–3Y', '3–4Y', '4–5Y', '5–6Y'], stock: 34, tags: ['outdoor', 'easy-on', 'monsoon'], why: 'Wet play and monsoon van drop.', emoji: '🩴', rating: 4.5, sold: 11200, codOk: true, gstRate: 0.12, comboWith: ['fc-rain'], deliveryDays: 2, mrpInr: 799, priceInr: 549 },
  { id: 'fc-mojari', name: 'Festive mojari / jutti', brand: 'WillowHug', category: 'footwear', minMonths: 12, maxMonths: 84, sizes: ['12–18M', '18–24M', '2–3Y', '3–4Y', '4–5Y'], stock: 16, tags: ['ethnic', 'festival'], why: 'Pairs with the kurta set for annual day.', emoji: '🥿', rating: 4.1, sold: 980, codOk: true, gstRate: 0.12, comboWith: ['fc-kurta'], deliveryDays: 4, mrpInr: 899, priceInr: 649 },
  { id: 'fc-socks', name: 'Anti-skid sock 5-pack', brand: 'NestCare', category: 'footwear', minMonths: 0, maxMonths: 84, sizes: ['0–3M', '6–12M', '12–18M', '2–3Y', '3–4Y', '4–5Y', '5–6Y'], stock: 90, tags: ['spare', 'easy-on', 'indoor'], why: 'Indoor backup when shoes come off.', emoji: '🧦', rating: 4.6, sold: 24000, codOk: true, gstRate: 0.05, comboWith: ['fc-tee'], deliveryDays: 1, mrpInr: 399, priceInr: 249 },
  { id: 'fc-diaper', name: 'Pants-style diaper jumbo pack', brand: 'DryNest', category: 'diapering', minMonths: 0, maxMonths: 36, sizes: ['S', 'M', 'L', 'XL'], stock: 70, tags: ['diaper', 'spare', 'easy-wash'], why: 'Daycare cubby pack — pants style for active toddlers.', emoji: '🧷', rating: 4.7, sold: 54000, codOk: true, gstRate: 0.18, comboWith: ['fc-wipes', 'fc-rash'], deliveryDays: 1, badge: 'Subscribe & save', mrpInr: 1299, priceInr: 899 },
  { id: 'fc-wipes', name: 'Sensitive wet wipes (6×80)', brand: 'NestCare', category: 'diapering', minMonths: 0, maxMonths: 84, sizes: ['one size'], stock: 100, tags: ['wipes', 'sensitive', 'easy-wash'], why: 'Classroom and van bag essential.', emoji: '🧻', rating: 4.8, sold: 67000, codOk: true, gstRate: 0.18, comboWith: ['fc-diaper'], deliveryDays: 1, badge: 'Bestseller', mrpInr: 699, priceInr: 449 },
  { id: 'fc-rash', name: 'Diaper rash cream', brand: 'BabyDerma', category: 'diapering', minMonths: 0, maxMonths: 36, sizes: ['one size'], stock: 40, tags: ['sensitive', 'health'], why: 'Staff can apply only with parent consent on file.', emoji: '🧴', rating: 4.5, sold: 8900, codOk: true, gstRate: 0.12, comboWith: ['fc-diaper'], deliveryDays: 2, mrpInr: 299, priceInr: 199 },
  { id: 'fc-bib', name: 'Waterproof bib 4-pack', brand: 'NestCare', category: 'feeding', minMonths: 4, maxMonths: 36, sizes: ['one size'], stock: 55, tags: ['bib', 'easy-wash', 'tiffin'], why: 'Khichdi, curd rice, and teething mess.', emoji: '🍽️', rating: 4.6, sold: 19000, codOk: true, gstRate: 0.12, comboWith: ['fc-tiffin', 'fc-onesie'], deliveryDays: 2, mrpInr: 499, priceInr: 329 },
  { id: 'fc-bottle', name: 'Anti-colic feeding bottle 250ml', brand: 'FeedWell', category: 'feeding', minMonths: 0, maxMonths: 18, sizes: ['one size'], stock: 32, tags: ['bottle', 'reflux'], why: 'Centre emergency feed kit + home.', emoji: '🍼', rating: 4.4, sold: 7200, codOk: true, gstRate: 0.12, comboWith: ['fc-sterile'], deliveryDays: 2, mrpInr: 599, priceInr: 399 },
  { id: 'fc-sipper', name: 'Steel sipper 400ml', brand: 'TiffinPal', category: 'feeding', minMonths: 12, maxMonths: 84, sizes: ['one size'], stock: 48, tags: ['tiffin', 'school', 'outdoor'], why: 'UKG van + playground. No plastic taste.', emoji: '🥤', rating: 4.7, sold: 16000, codOk: true, gstRate: 0.12, comboWith: ['fc-tiffin', 'fc-bag'], deliveryDays: 2, badge: 'COD pick', mrpInr: 799, priceInr: 549 },
  { id: 'fc-tiffin', name: 'Steel 3-container tiffin', brand: 'TiffinPal', category: 'feeding', minMonths: 18, maxMonths: 84, sizes: ['one size'], stock: 38, tags: ['tiffin', 'school', 'veg'], why: 'Dal, roti, sabzi without leaks on the van.', emoji: '🍱', rating: 4.6, sold: 11000, codOk: true, gstRate: 0.12, comboWith: ['fc-sipper', 'fc-bag'], deliveryDays: 2, mrpInr: 1299, priceInr: 899 },
  { id: 'fc-cereal', name: 'Ragi / rice cereal 300g', brand: 'Annapurna Baby', category: 'feeding', minMonths: 6, maxMonths: 24, sizes: ['one size'], stock: 50, tags: ['cereal', 'indian', 'iron'], why: 'IAP complementary feeding — iron-rich grain.', emoji: '🥣', rating: 4.5, sold: 9400, codOk: true, gstRate: 0.05, comboWith: ['fc-bib'], deliveryDays: 2, mrpInr: 349, priceInr: 249 },
  { id: 'fc-sterile', name: 'Bottle steriliser tongs + basket', brand: 'FeedWell', category: 'feeding', minMonths: 0, maxMonths: 24, sizes: ['one size'], stock: 18, tags: ['bottle', 'hygiene'], why: 'Home hygiene for expressed milk.', emoji: '♨️', rating: 4.2, sold: 2100, codOk: true, gstRate: 0.18, comboWith: ['fc-bottle'], deliveryDays: 3, mrpInr: 899, priceInr: 649 },
  { id: 'fc-soap', name: 'Gentle baby soap + wash', brand: 'BabyDerma', category: 'bath', minMonths: 0, maxMonths: 84, sizes: ['one size'], stock: 60, tags: ['sensitive', 'bath'], why: 'Fragrance-light for eczema-prone skin.', emoji: '🧼', rating: 4.6, sold: 22000, codOk: true, gstRate: 0.18, comboWith: ['fc-oil', 'fc-lotion'], deliveryDays: 1, mrpInr: 299, priceInr: 199 },
  { id: 'fc-oil', name: 'Cold-pressed coconut baby oil', brand: 'BabyDerma', category: 'bath', minMonths: 0, maxMonths: 84, sizes: ['one size'], stock: 42, tags: ['massage', 'indian', 'sensitive'], why: 'Traditional massage before bath — skip if eczema flares.', emoji: '🫒', rating: 4.4, sold: 15000, codOk: true, gstRate: 0.18, comboWith: ['fc-soap'], deliveryDays: 2, mrpInr: 399, priceInr: 279 },
  { id: 'fc-lotion', name: 'Daily moisturising lotion', brand: 'BabyDerma', category: 'bath', minMonths: 0, maxMonths: 84, sizes: ['one size'], stock: 36, tags: ['sensitive', 'cotton'], why: 'After-bath barrier in AC classrooms.', emoji: '💧', rating: 4.5, sold: 10200, codOk: true, gstRate: 0.18, comboWith: ['fc-soap'], deliveryDays: 2, mrpInr: 449, priceInr: 329 },
  { id: 'fc-rings', name: 'Stacking rings', brand: 'FunNest', category: 'toys', minMonths: 6, maxMonths: 24, sizes: ['one size'], stock: 24, tags: ['motor', 'focus'], why: 'Fine motor + colour names in mother tongue.', emoji: '🌈', rating: 4.6, sold: 8000, codOk: true, gstRate: 0.12, comboWith: ['fc-rattle'], deliveryDays: 2, mrpInr: 499, priceInr: 349 },
  { id: 'fc-rattle', name: 'Soft rattle set', brand: 'FunNest', category: 'toys', minMonths: 0, maxMonths: 12, sizes: ['one size'], stock: 28, tags: ['infant', 'motor'], why: 'Tummy-time treasure.', emoji: '🔔', rating: 4.3, sold: 4500, codOk: true, gstRate: 0.12, comboWith: ['fc-rings'], deliveryDays: 2, mrpInr: 399, priceInr: 249 },
  { id: 'fc-puzzle', name: 'Wooden alphabet puzzle (EN+HI)', brand: 'Pathshala Play', category: 'toys', minMonths: 24, maxMonths: 84, sizes: ['one size'], stock: 22, tags: ['language', 'numeracy', 'nep'], why: 'NEP ECCE literacy — English + Hindi akshara.', emoji: '🧩', rating: 4.7, sold: 6100, codOk: true, gstRate: 0.12, comboWith: ['fc-panch'], deliveryDays: 3, badge: 'Learning', mrpInr: 899, priceInr: 649 },
  { id: 'fc-cricket', name: 'Foam cricket set', brand: 'FunNest', category: 'toys', minMonths: 36, maxMonths: 84, sizes: ['one size'], stock: 20, tags: ['outdoor', 'motor', 'sport'], why: 'UKG PE and Sunday park.', emoji: '🏏', rating: 4.5, sold: 3800, codOk: true, gstRate: 0.12, comboWith: ['fc-velcro'], deliveryDays: 3, mrpInr: 799, priceInr: 549 },
  { id: 'fc-stroller', name: 'Compact stroller', brand: 'GearNest', category: 'gear', minMonths: 0, maxMonths: 48, sizes: ['one size'], stock: 8, tags: ['gear', 'travel'], why: 'Metro mall runs and airport.', emoji: '🚼', rating: 4.4, sold: 920, codOk: false, gstRate: 0.18, comboWith: ['fc-mosquito'], deliveryDays: 5, badge: 'Prepaid only', mrpInr: 12999, priceInr: 8999 },
  { id: 'fc-carrier', name: 'Soft baby carrier', brand: 'GearNest', category: 'gear', minMonths: 0, maxMonths: 18, sizes: ['one size'], stock: 12, tags: ['gear', 'infant'], why: 'Hands-free for sibling school run.', emoji: '🤱', rating: 4.3, sold: 1400, codOk: true, gstRate: 0.18, comboWith: ['fc-onesie'], deliveryDays: 3, mrpInr: 2499, priceInr: 1799 },
  { id: 'fc-mosquito', name: 'Cot mosquito net', brand: 'NestCare', category: 'nursery', minMonths: 0, maxMonths: 36, sizes: ['one size'], stock: 20, tags: ['sleep', 'monsoon'], why: 'Monsoon + dengue season at home.', emoji: '🦟', rating: 4.2, sold: 2700, codOk: true, gstRate: 0.12, comboWith: ['fc-sleepsack'], deliveryDays: 3, mrpInr: 699, priceInr: 449 },
  { id: 'fc-sleepsack', name: 'TOG 1.0 sleep sack', brand: 'NestCare', category: 'nursery', minMonths: 0, maxMonths: 18, sizes: ['0–3M', '3–6M', '6–12M', '12–18M'], stock: 14, tags: ['sleep', 'cotton'], why: 'Safe rest-time layer — no loose blanket.', emoji: '🌙', rating: 4.5, sold: 1900, codOk: true, gstRate: 0.12, comboWith: ['fc-night'], deliveryDays: 3, mrpInr: 1299, priceInr: 899 },
  { id: 'fc-bag', name: 'Ergo preschool backpack', brand: 'Pathshala Play', category: 'school', minMonths: 24, maxMonths: 84, sizes: ['one size'], stock: 30, tags: ['school', 'labeled', 'outdoor'], why: 'LKG/UKG bag that fits tiffin + diary.', emoji: '🎒', rating: 4.6, sold: 7400, codOk: true, gstRate: 0.12, comboWith: ['fc-tiffin', 'fc-bottle', 'fc-uniform'], deliveryDays: 2, badge: 'School kit', mrpInr: 1599, priceInr: 1099 },
  { id: 'fc-lunchbox', name: 'Insulated lunch bag', brand: 'TiffinPal', category: 'school', minMonths: 24, maxMonths: 84, sizes: ['one size'], stock: 26, tags: ['tiffin', 'school'], why: 'Keeps curd cool till 12:30 tiffin.', emoji: '🎒', rating: 4.4, sold: 4100, codOk: true, gstRate: 0.12, comboWith: ['fc-tiffin'], deliveryDays: 2, mrpInr: 699, priceInr: 449 },
  { id: 'fc-panch', name: 'Panchatantra picture book', brand: 'Katha Nest', category: 'books', minMonths: 24, maxMonths: 84, sizes: ['one size'], stock: 40, tags: ['language', 'indian', 'nep'], why: 'Stories + values for NEP character goals.', emoji: '📚', rating: 4.8, sold: 9800, codOk: true, gstRate: 0, comboWith: ['fc-akshar'], deliveryDays: 3, mrpInr: 299, priceInr: 199 },
  { id: 'fc-akshar', name: 'Akshara + ABC board book', brand: 'Katha Nest', category: 'books', minMonths: 12, maxMonths: 60, sizes: ['one size'], stock: 44, tags: ['language', 'hindi', 'english'], why: 'Bilingual first letters.', emoji: '🔤', rating: 4.7, sold: 12000, codOk: true, gstRate: 0, comboWith: ['fc-puzzle'], deliveryDays: 2, badge: 'For you', mrpInr: 249, priceInr: 179 },
  { id: 'fc-diya', name: 'Clay diya painting kit', brand: 'FunNest', category: 'toys', minMonths: 36, maxMonths: 84, sizes: ['one size'], stock: 18, tags: ['art', 'festival', 'fineMotor'], why: 'Diwali fine-motor project with the family.', emoji: '🪔', rating: 4.4, sold: 2200, codOk: true, gstRate: 0.12, comboWith: ['fc-kurta'], deliveryDays: 4, badge: 'Festive', mrpInr: 449, priceInr: 299 },
  { id: 'fc-clip', name: 'Soft hair clips 8-pack', brand: 'Pine Kids', category: 'fashion', minMonths: 12, maxMonths: 84, sizes: ['one size'], stock: 50, tags: ['accessories'], why: 'Keeps hair off the face at meals.', emoji: '🎀', rating: 4.3, sold: 6700, codOk: true, gstRate: 0.05, comboWith: ['fc-frock'], deliveryDays: 2, mrpInr: 249, priceInr: 149 },
  { id: 'fc-nursing', name: 'Nursing pillow', brand: 'MamaNest', category: 'moms', minMonths: 0, maxMonths: 12, sizes: ['one size'], stock: 10, tags: ['feeding', 'infant'], why: 'For Mira-age night feeds at home.', emoji: '🛋️', rating: 4.5, sold: 1600, codOk: true, gstRate: 0.12, comboWith: ['fc-bottle'], deliveryDays: 4, mrpInr: 1999, priceInr: 1399 },
  { id: 'fc-hat', name: 'Sun hat with chin strap', brand: 'LittlePine', category: 'fashion', minMonths: 4, maxMonths: 72, sizes: ['0–3M', '6–12M', '12–18M', '2–3Y', '3–4Y', '4–5Y'], stock: 24, tags: ['outdoor', 'glasses'], why: 'Playground shade; strap stays off glasses.', emoji: '👒', rating: 4.4, sold: 3300, codOk: true, gstRate: 0.05, comboWith: ['fc-clogs'], deliveryDays: 2, mrpInr: 499, priceInr: 329 },
  { id: 'fc-smock', name: 'Art smock', brand: 'Pathshala Play', category: 'school', minMonths: 18, maxMonths: 84, sizes: ['2–3Y', '3–4Y', '4–5Y', '5–6Y'], stock: 20, tags: ['easy-wash', 'art', 'spare'], why: 'Rangoli, paint, and cooking club.', emoji: '🎨', rating: 4.3, sold: 1800, codOk: true, gstRate: 0.05, comboWith: ['fc-diya'], deliveryDays: 3, mrpInr: 599, priceInr: 399 },
]

export const SHOP_CATS: { id: ShopItem['category'] | 'for-you' | 'all' | 'cod'; label: string }[] = [
  { id: 'for-you', label: 'For this child' },
  { id: 'cod', label: 'Buy on COD' },
  { id: 'all', label: 'All' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'footwear', label: 'Footwear' },
  { id: 'diapering', label: 'Diapering' },
  { id: 'feeding', label: 'Feeding' },
  { id: 'bath', label: 'Bath & skin' },
  { id: 'toys', label: 'Toys' },
  { id: 'gear', label: 'Baby gear' },
  { id: 'nursery', label: 'Nursery' },
  { id: 'school', label: 'School' },
  { id: 'books', label: 'Books' },
  { id: 'moms', label: 'Mom' },
  { id: 'uniform', label: 'Uniform' },
]

export function createShopCatalog(country?: CountryCode | CountryPack): ShopItem[] {
  const pack = typeof country === 'object' && country ? country : packOf(country)
  return BASE.map((row) => {
    const { mrpInr, priceInr, ...rest } = row
    return {
      ...rest,
      mrp: convertInr(mrpInr, pack),
      price: convertInr(priceInr, pack),
      codOk: rest.codOk && pack.cod.enabled && convertInr(priceInr, pack) <= pack.cod.max,
    }
  })
}

export function clothingNeeds(child: Child): ShopNeed[] {
  const m = ageMonths(child.dob)
  const needs: ShopNeed[] = [
    { id: 'spare', label: 'Spare cubby set', reason: 'Every enrolled child needs a labeled extra outfit at the centre.', tags: ['spare', 'labeled'] },
  ]
  if (m < 24) {
    needs.push({
      id: 'wash',
      label: 'Easy-wash meal layers',
      reason: 'Bottles, khichdi, and drool at this age.',
      tags: ['bib', 'onesie', 'easy-wash', 'tiffin'],
    })
  }
  if (m < 18) {
    needs.push({
      id: 'sleep',
      label: 'Safe rest layers',
      reason: 'Infant nap — no loose blankets (IAP safe-sleep).',
      tags: ['sleep', 'onesie'],
    })
  }
  if (m >= 18 && m < 48) {
    needs.push({
      id: 'potty',
      label: 'Easy-on bottoms',
      reason: 'Potty practice and independent dressing.',
      tags: ['easy-on', 'potty'],
    })
  }
  if (m >= 24) {
    needs.push({
      id: 'school',
      label: 'School / van kit',
      reason: 'Bag, tiffin, sipper, and velcro shoes for LKG–UKG.',
      tags: ['school', 'tiffin', 'outdoor'],
    })
  }
  if (child.allergies.length || child.medicalNotes.toLowerCase().includes('reflux')) {
    needs.push({
      id: 'skin',
      label: 'Sensitive / extra changes',
      reason: child.allergies.length
        ? `Allergy profile (${child.allergies.map((a) => a.name).join(', ')}) — prefer soft cotton and extras.`
        : 'Reflux — extra onesies and bibs after feeds.',
      tags: ['cotton', 'sensitive', 'bib', 'onesie', 'easy-wash'],
    })
  }
  if (child.medicalNotes.toLowerCase().includes('glasses')) {
    needs.push({
      id: 'glasses',
      label: 'Glasses-friendly hat',
      reason: 'Soft brim and strap that does not knock glasses.',
      tags: ['glasses', 'outdoor'],
    })
  }
  if (child.custodyNotes) {
    needs.push({
      id: 'label',
      label: 'Name-tape everything',
      reason: child.custodyNotes,
      tags: ['labeled'],
    })
  }
  if (child.dietType?.toLowerCase().includes('jain') || child.foodPreferences.toLowerCase().includes('vegetarian')) {
    needs.push({
      id: 'tiffin',
      label: 'Leak-proof tiffin',
      reason: 'Veg / Jain tiffin travels better in steel boxes.',
      tags: ['tiffin', 'veg'],
    })
  }
  return needs
}

export function fitsChild(item: ShopItem, child: Child) {
  const m = ageMonths(child.dob)
  return m >= item.minMonths && m <= item.maxMonths
}

export function recommendedItems(catalog: ShopItem[], child: Child) {
  const needs = clothingNeeds(child)
  const tags = new Set(needs.flatMap((n) => n.tags))
  const size = clothingSize(child.dob)
  return catalog
    .filter((item) => fitsChild(item, child))
    .map((item) => ({
      item,
      score:
        item.tags.reduce((n, t) => n + (tags.has(t) ? 2 : 0), 0) +
        (item.sizes.includes(size) || item.sizes.includes('one size') ? 1 : 0) +
        (item.badge ? 1 : 0) +
        (item.codOk ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
}

export function sizeForChild(item: ShopItem, child: Child) {
  const size = clothingSize(child.dob)
  if (item.sizes.includes(size)) return size
  if (item.sizes.includes('one size')) return 'one size'
  const m = ageMonths(child.dob)
  if (m < 18 && item.sizes.includes('M')) return 'M'
  if (m < 30 && item.sizes.includes('L')) return 'L'
  return item.sizes[Math.floor(item.sizes.length / 2)] ?? item.sizes[0]
}

export function pctOff(item: ShopItem) {
  if (!item.mrp || item.mrp <= item.price) return 0
  return Math.round(((item.mrp - item.price) / item.mrp) * 100)
}

export function combosFor(catalog: ShopItem[], item: ShopItem) {
  return item.comboWith.map((id) => catalog.find((c) => c.id === id)).filter(Boolean) as ShopItem[]
}

export function codPicks(catalog: ShopItem[], child: Child) {
  return recommendedItems(catalog, child)
    .filter((r) => r.item.codOk && r.item.price >= 99)
    .slice(0, 8)
}

export function itemGst(item: ShopItem, qty: number) {
  return Math.round(item.price * qty * item.gstRate)
}
