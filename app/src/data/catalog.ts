import { ageMonths, clothingSize } from '../lib'
import type { Child, ShopItem, ShopNeed } from '../types'

export function createShopCatalog(): ShopItem[] {
  return [
    { id: 'cl-onesie', name: 'Organic snap onesie (3-pack)', category: 'care', minMonths: 0, maxMonths: 24, sizes: ['0–6M', '6–12M', '12–18M', '18–24M'], price: 28, stock: 24, tags: ['onesie', 'cotton', 'easy-wash', 'spare'], why: 'Fast changes after bottles and reflux spit-up.' },
    { id: 'cl-sleepsack', name: 'TOG 1.0 sleep sack', category: 'care', minMonths: 0, maxMonths: 18, sizes: ['0–6M', '6–12M', '12–18M'], price: 36, stock: 10, tags: ['sleep', 'cotton'], why: 'Safe rest-time layer with no loose blanket.' },
    { id: 'cl-bib', name: 'Waterproof bib set', category: 'care', minMonths: 4, maxMonths: 36, sizes: ['one size'], price: 16, stock: 40, tags: ['bib', 'easy-wash'], why: 'Meals, teething, and messy art.' },
    { id: 'cl-tee-baby', name: 'Soft cotton tee', category: 'tops', minMonths: 6, maxMonths: 36, sizes: ['6–12M', '12–18M', '18–24M', '2T', '3T'], price: 14, stock: 32, tags: ['cotton', 'spare', 'sensitive'], why: 'Everyday cubby spare in breathable cotton.' },
    { id: 'cl-tee-pre', name: 'Play tee with name tape', category: 'tops', minMonths: 24, maxMonths: 84, sizes: ['2T', '3T', '4T', '5T', '6/7'], price: 18, stock: 28, tags: ['spare', 'labeled', 'cotton'], why: 'Labeled spare for shared-custody cubbies.' },
    { id: 'cl-willow', name: 'Willow grove picture-day tee', category: 'uniform', minMonths: 12, maxMonths: 84, sizes: ['12–18M', '18–24M', '2T', '3T', '4T', '5T', '6/7'], price: 22, stock: 40, tags: ['uniform', 'spare'], why: 'Center tee for picture day and trips.' },
    { id: 'cl-legging', name: 'Stretch leggings / joggers', category: 'bottoms', minMonths: 6, maxMonths: 84, sizes: ['6–12M', '12–18M', '18–24M', '2T', '3T', '4T', '5T', '6/7'], price: 20, stock: 30, tags: ['easy-on', 'spare', 'cotton'], why: 'Elastic waist for potty and independent dressing.' },
    { id: 'cl-short', name: 'Play shorts', category: 'bottoms', minMonths: 12, maxMonths: 84, sizes: ['12–18M', '18–24M', '2T', '3T', '4T', '5T', '6/7'], price: 16, stock: 22, tags: ['easy-on', 'outdoor', 'spare'], why: 'Hot-weather outdoor play.' },
    { id: 'cl-rain', name: 'Packable rain jacket', category: 'outerwear', minMonths: 12, maxMonths: 84, sizes: ['12–18M', '18–24M', '2T', '3T', '4T', '5T', '6/7'], price: 34, stock: 16, tags: ['outdoor', 'easy-wash'], why: 'Garden walks and wet pickup.' },
    { id: 'cl-fleece', name: 'Light fleece', category: 'outerwear', minMonths: 6, maxMonths: 84, sizes: ['6–12M', '12–18M', '18–24M', '2T', '3T', '4T', '5T', '6/7'], price: 30, stock: 14, tags: ['outdoor', 'cotton'], why: 'AC rooms and morning drop-off.' },
    { id: 'cl-velcro', name: 'Velcro sneakers', category: 'shoes', minMonths: 12, maxMonths: 72, sizes: ['18–24M', '2T', '3T', '4T', '5T'], price: 32, stock: 18, tags: ['easy-on', 'outdoor'], why: 'No laces — kids can put them on for yard time.' },
    { id: 'cl-softsole', name: 'Soft-sole crib shoes', category: 'shoes', minMonths: 0, maxMonths: 18, sizes: ['0–6M', '6–12M', '12–18M'], price: 18, stock: 12, tags: ['onesie'], why: 'Keep infant feet covered without stiff soles.' },
    { id: 'cl-hat', name: 'Sun hat with chin strap', category: 'outerwear', minMonths: 4, maxMonths: 72, sizes: ['0–6M', '6–12M', '12–18M', '2T', '3T', '4T', '5T'], price: 15, stock: 20, tags: ['outdoor', 'glasses'], why: 'Shade for playground; strap stays off glasses.' },
    { id: 'cl-smock', name: 'Art smock', category: 'care', minMonths: 18, maxMonths: 84, sizes: ['2T', '3T', '4T', '5T', '6/7'], price: 19, stock: 15, tags: ['easy-wash', 'spare'], why: 'Protects clothes during paint and cooking.' },
    { id: 'cl-underwear', name: 'Underwear / training set', category: 'care', minMonths: 18, maxMonths: 60, sizes: ['2T', '3T', '4T', '5T'], price: 14, stock: 26, tags: ['easy-on', 'spare'], why: 'Potty learning extras in the cubby.' },
    { id: 'cl-socks', name: 'Grip sock 5-pack', category: 'shoes', minMonths: 0, maxMonths: 84, sizes: ['0–6M', '6–12M', '12–18M', '2T', '3T', '4T', '5T', '6/7'], price: 12, stock: 50, tags: ['spare', 'easy-on'], why: 'Indoor backup when shoes come off.' },
  ]
}

export function clothingNeeds(child: Child): ShopNeed[] {
  const m = ageMonths(child.dob)
  const needs: ShopNeed[] = [
    { id: 'spare', label: 'Spare cubby set', reason: 'Every enrolled child needs a labeled extra outfit at the center.', tags: ['spare', 'labeled'] },
  ]
  if (m < 24) {
    needs.push({
      id: 'wash',
      label: 'Easy-wash meal layers',
      reason: 'Bottles, snacks, and drool at this age.',
      tags: ['bib', 'onesie', 'easy-wash'],
    })
  }
  if (m < 18) {
    needs.push({
      id: 'sleep',
      label: 'Safe rest layers',
      reason: 'Infant nap — no loose blankets.',
      tags: ['sleep', 'onesie'],
    })
  }
  if (m >= 18 && m < 48) {
    needs.push({
      id: 'potty',
      label: 'Easy-on bottoms',
      reason: 'Potty practice and independent dressing.',
      tags: ['easy-on'],
    })
  }
  if (m >= 24) {
    needs.push({
      id: 'yard',
      label: 'Outdoor play',
      reason: 'Garden trips and playground.',
      tags: ['outdoor'],
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
      score: item.tags.reduce((n, t) => n + (tags.has(t) ? 2 : 0), 0) + (item.sizes.includes(size) || item.sizes.includes('one size') ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
}

export function sizeForChild(item: ShopItem, child: Child) {
  const size = clothingSize(child.dob)
  if (item.sizes.includes(size)) return size
  return item.sizes[Math.floor(item.sizes.length / 2)] ?? item.sizes[0]
}
