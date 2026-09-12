export type PublicShopInput = {
  ageMonths: number
  sizeBand: string
  veg: boolean
  needTags: string[]
  allergyNames: string[]
  pinPrefix: string
  preferCodCap: boolean
  now?: Date
}

export function publicShopInput(input: PublicShopInput): PublicShopInput {
  return {
    ageMonths: Math.max(0, Math.min(216, Math.round(input.ageMonths))),
    sizeBand: String(input.sizeBand || '').slice(0, 12),
    veg: Boolean(input.veg),
    needTags: input.needTags.map((t) => t.slice(0, 24)).slice(0, 12),
    allergyNames: input.allergyNames.map((a) => a.toLowerCase().slice(0, 24)).slice(0, 8),
    pinPrefix: String(input.pinPrefix || '').replace(/\D/g, '').slice(0, 2),
    preferCodCap: Boolean(input.preferCodCap),
  }
}

export function shopInputFromChild(child: {
  dob: string
  dietType?: string
  foodPreferences?: string
  allergies?: { name: string }[]
}, extras: { sizeBand: string; needTags: string[]; pinPrefix: string; preferCodCap?: boolean; ageMonths: number }): PublicShopInput {
  const veg = Boolean(
    child.dietType?.toLowerCase().includes('veg') || child.foodPreferences?.toLowerCase().includes('vegetarian'),
  )
  return publicShopInput({
    ageMonths: extras.ageMonths,
    sizeBand: extras.sizeBand,
    veg,
    needTags: extras.needTags,
    allergyNames: (child.allergies ?? []).map((a) => a.name),
    pinPrefix: extras.pinPrefix,
    preferCodCap: extras.preferCodCap !== false,
  })
}
