import { useTranslation } from 'react-i18next'

interface LocalizedItem {
  name?: string | null
  name_en?: string | null
  name_th?: string | null
  name_jp?: string | null
  desc?: string | null
  desc_en?: string | null
  desc_th?: string | null
  desc_jp?: string | null
}

/**
 * Returns the best-matching localized name for an item based on the current locale.
 * Falls back through: requested locale → name_en → name → first available name.
 */
export const getLocalizedName = (item: LocalizedItem, locale: string): string => {
  const nameMap: Record<string, string | null | undefined> = {
    en: item.name_en,
    th: item.name_th,
    jp: item.name_jp
  }

  // Try requested locale first, then English, then the default `name` field
  return nameMap[locale] || item.name_en || item.name || item.name_th || item.name_jp || ''
}

/**
 * React hook that returns a localized name getter bound to the current i18n language.
 */
export const useLocalizedName = () => {
  const { i18n } = useTranslation()
  return (item: LocalizedItem) => getLocalizedName(item, i18n.language)
}

/**
 * Returns the best-matching localized description for an item based on the current locale.
 */
export const getLocalizedDesc = (item: LocalizedItem, locale: string): string => {
  const descMap: Record<string, string | null | undefined> = {
    en: item.desc_en,
    th: item.desc_th,
    jp: item.desc_jp
  }

  return descMap[locale] || item.desc_en || item.desc || item.desc_th || item.desc_jp || ''
}

/**
 * React hook that returns a localized description getter bound to the current i18n language.
 */
export const useLocalizedDesc = () => {
  const { i18n } = useTranslation()
  return (item: LocalizedItem) => getLocalizedDesc(item, i18n.language)
}
