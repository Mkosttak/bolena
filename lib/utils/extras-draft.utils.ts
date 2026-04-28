import type { DraftExtraGroup, DraftExtraOption } from '@/components/modules/menu/ProductExtrasDraft'

export function addDraftGroup(
  groups: DraftExtraGroup[],
  data: { name_tr: string; name_en: string; is_required: boolean }
): DraftExtraGroup[] {
  const newGroup: DraftExtraGroup = {
    tempId: crypto.randomUUID(),
    name_tr: data.name_tr,
    name_en: data.name_en,
    is_required: data.is_required,
    options: [],
  }
  return [...groups, newGroup]
}

export function updateDraftGroup(
  groups: DraftExtraGroup[],
  tempId: string,
  data: { name_tr: string; name_en: string; is_required: boolean }
): DraftExtraGroup[] {
  return groups.map((g) => g.tempId === tempId ? { ...g, ...data } : g)
}

export function deleteDraftGroup(
  groups: DraftExtraGroup[],
  tempId: string
): DraftExtraGroup[] {
  return groups.filter((g) => g.tempId !== tempId)
}

export function addDraftOption(
  groups: DraftExtraGroup[],
  groupTempId: string,
  data: { name_tr: string; name_en: string; price: number; max_selections: number; is_active: boolean }
): DraftExtraGroup[] {
  return groups.map((g) => {
    if (g.tempId !== groupTempId) return g
    const newOption: DraftExtraOption = {
      tempId: crypto.randomUUID(),
      name_tr: data.name_tr,
      name_en: data.name_en,
      price: data.price,
      max_selections: data.max_selections,
      is_active: data.is_active,
      sort_order: g.options.length,
    }
    return { ...g, options: [...g.options, newOption] }
  })
}

export function updateDraftOption(
  groups: DraftExtraGroup[],
  groupTempId: string,
  optionTempId: string,
  data: { name_tr: string; name_en: string; price: number; max_selections: number; is_active: boolean }
): DraftExtraGroup[] {
  return groups.map((g) => {
    if (g.tempId !== groupTempId) return g
    return {
      ...g,
      options: g.options.map((o) => o.tempId === optionTempId ? { ...o, ...data } : o),
    }
  })
}

export function deleteDraftOption(
  groups: DraftExtraGroup[],
  groupTempId: string,
  optionTempId: string
): DraftExtraGroup[] {
  return groups.map((g) => {
    if (g.tempId !== groupTempId) return g
    return { ...g, options: g.options.filter((o) => o.tempId !== optionTempId) }
  })
}

export function toggleDraftOptionActive(
  groups: DraftExtraGroup[],
  groupTempId: string,
  optionTempId: string
): DraftExtraGroup[] {
  return groups.map((g) => {
    if (g.tempId !== groupTempId) return g
    return {
      ...g,
      options: g.options.map((o) =>
        o.tempId === optionTempId ? { ...o, is_active: !o.is_active } : o
      ),
    }
  })
}
