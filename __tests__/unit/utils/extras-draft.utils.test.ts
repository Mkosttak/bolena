import { describe, it, expect } from 'vitest'
import {
  addDraftGroup,
  updateDraftGroup,
  deleteDraftGroup,
  addDraftOption,
  updateDraftOption,
  deleteDraftOption,
  toggleDraftOptionActive,
} from '@/lib/utils/extras-draft.utils'
import type { DraftExtraGroup, DraftExtraOption } from '@/components/modules/menu/ProductExtrasDraft'

// ─── Test Fixtures ────────────────────────────────────────────────────────────

function makeGroup(overrides?: Partial<DraftExtraGroup>): DraftExtraGroup {
  return {
    tempId: 'group-1',
    name_tr: 'Sos Seçimi',
    name_en: 'Sauce Choice',
    is_required: false,
    options: [],
    ...overrides,
  }
}

function makeOption(overrides?: Partial<DraftExtraOption>): DraftExtraOption {
  return {
    tempId: 'opt-1',
    name_tr: 'Ketçap',
    name_en: 'Ketchup',
    price: 0,
    max_selections: 1,
    is_active: true,
    sort_order: 0,
    ...overrides,
  }
}

// ─── addDraftGroup ────────────────────────────────────────────────────────────

describe('addDraftGroup', () => {
  it('boş listeye grup ekler', () => {
    const result = addDraftGroup([], { name_tr: 'Sos', name_en: 'Sauce', is_required: false })
    expect(result).toHaveLength(1)
    expect(result[0].name_tr).toBe('Sos')
    expect(result[0].name_en).toBe('Sauce')
    expect(result[0].is_required).toBe(false)
    expect(result[0].options).toEqual([])
  })

  it('mevcut listeye grup ekler, orijinal bozulmaz', () => {
    const existing = [makeGroup()]
    const result = addDraftGroup(existing, { name_tr: 'İçecek', name_en: 'Drink', is_required: true })
    expect(result).toHaveLength(2)
    expect(result[0].tempId).toBe('group-1') // orijinal değişmedi
    expect(result[1].name_tr).toBe('İçecek')
    expect(result[1].is_required).toBe(true)
  })

  it('her yeni gruba benzersiz tempId atar', () => {
    const r1 = addDraftGroup([], { name_tr: 'A', name_en: 'A', is_required: false })
    const r2 = addDraftGroup([], { name_tr: 'B', name_en: 'B', is_required: false })
    expect(r1[0].tempId).not.toBe(r2[0].tempId)
  })

  it('orijinal diziyi mutate etmez', () => {
    const original: DraftExtraGroup[] = []
    addDraftGroup(original, { name_tr: 'X', name_en: 'X', is_required: false })
    expect(original).toHaveLength(0)
  })
})

// ─── updateDraftGroup ─────────────────────────────────────────────────────────

describe('updateDraftGroup', () => {
  it('doğru grubu günceller', () => {
    const groups = [makeGroup({ tempId: 'g-1' }), makeGroup({ tempId: 'g-2', name_tr: 'Diğer' })]
    const result = updateDraftGroup(groups, 'g-1', { name_tr: 'Yeni Ad', name_en: 'New Name', is_required: true })
    expect(result[0].name_tr).toBe('Yeni Ad')
    expect(result[0].is_required).toBe(true)
    expect(result[1].name_tr).toBe('Diğer') // diğer grup değişmedi
  })

  it('olmayan tempId için değişiklik yapmaz', () => {
    const groups = [makeGroup()]
    const result = updateDraftGroup(groups, 'yok', { name_tr: 'X', name_en: 'X', is_required: false })
    expect(result[0].name_tr).toBe('Sos Seçimi')
  })

  it('grup seçeneklerini korur', () => {
    const opt = makeOption()
    const groups = [makeGroup({ options: [opt] })]
    const result = updateDraftGroup(groups, 'group-1', { name_tr: 'Yeni', name_en: 'New', is_required: false })
    expect(result[0].options).toHaveLength(1)
    expect(result[0].options[0].tempId).toBe('opt-1')
  })
})

// ─── deleteDraftGroup ─────────────────────────────────────────────────────────

describe('deleteDraftGroup', () => {
  it('doğru grubu siler', () => {
    const groups = [makeGroup({ tempId: 'g-1' }), makeGroup({ tempId: 'g-2' })]
    const result = deleteDraftGroup(groups, 'g-1')
    expect(result).toHaveLength(1)
    expect(result[0].tempId).toBe('g-2')
  })

  it('olmayan tempId için listeyi değiştirmez', () => {
    const groups = [makeGroup()]
    const result = deleteDraftGroup(groups, 'yok')
    expect(result).toHaveLength(1)
  })

  it('grup silinince seçenekleri de gider', () => {
    const groups = [makeGroup({ tempId: 'g-1', options: [makeOption()] })]
    const result = deleteDraftGroup(groups, 'g-1')
    expect(result).toHaveLength(0)
  })
})

// ─── addDraftOption ───────────────────────────────────────────────────────────

describe('addDraftOption', () => {
  it('doğru gruba seçenek ekler', () => {
    const groups = [makeGroup({ tempId: 'g-1' }), makeGroup({ tempId: 'g-2' })]
    const result = addDraftOption(groups, 'g-1', {
      name_tr: 'Mayonez', name_en: 'Mayo', price: 5, max_selections: 1, is_active: true,
    })
    expect(result[0].options).toHaveLength(1)
    expect(result[0].options[0].name_tr).toBe('Mayonez')
    expect(result[1].options).toHaveLength(0) // diğer grup etkilenmedi
  })

  it('seçeneğe doğru sort_order atar', () => {
    const opt = makeOption({ tempId: 'o-0', sort_order: 0 })
    const groups = [makeGroup({ tempId: 'g-1', options: [opt] })]
    const result = addDraftOption(groups, 'g-1', {
      name_tr: 'İkinci', name_en: 'Second', price: 0, max_selections: 1, is_active: true,
    })
    expect(result[0].options[1].sort_order).toBe(1)
  })

  it('olmayan gruba ekleme yapmaz', () => {
    const groups = [makeGroup({ tempId: 'g-1' })]
    const result = addDraftOption(groups, 'yok', {
      name_tr: 'X', name_en: 'X', price: 0, max_selections: 1, is_active: true,
    })
    expect(result[0].options).toHaveLength(0)
  })

  it('ücretli seçeneği doğru kaydeder', () => {
    const groups = [makeGroup({ tempId: 'g-1' })]
    const result = addDraftOption(groups, 'g-1', {
      name_tr: 'Ekstra Peynir', name_en: 'Extra Cheese', price: 15.5, max_selections: 2, is_active: true,
    })
    expect(result[0].options[0].price).toBe(15.5)
    expect(result[0].options[0].max_selections).toBe(2)
  })
})

// ─── updateDraftOption ────────────────────────────────────────────────────────

describe('updateDraftOption', () => {
  it('doğru seçeneği günceller', () => {
    const groups = [makeGroup({ tempId: 'g-1', options: [makeOption({ tempId: 'o-1' }), makeOption({ tempId: 'o-2', name_tr: 'Hardal' })] })]
    const result = updateDraftOption(groups, 'g-1', 'o-1', {
      name_tr: 'Mayonez', name_en: 'Mayo', price: 3, max_selections: 1, is_active: false,
    })
    expect(result[0].options[0].name_tr).toBe('Mayonez')
    expect(result[0].options[0].is_active).toBe(false)
    expect(result[0].options[1].name_tr).toBe('Hardal') // diğer seçenek değişmedi
  })

  it('yanlış groupTempId ile hiçbir şey değiştirmez', () => {
    const groups = [makeGroup({ tempId: 'g-1', options: [makeOption()] })]
    const result = updateDraftOption(groups, 'yok', 'opt-1', {
      name_tr: 'X', name_en: 'X', price: 0, max_selections: 1, is_active: true,
    })
    expect(result[0].options[0].name_tr).toBe('Ketçap')
  })
})

// ─── deleteDraftOption ────────────────────────────────────────────────────────

describe('deleteDraftOption', () => {
  it('doğru seçeneği siler', () => {
    const groups = [makeGroup({
      tempId: 'g-1',
      options: [makeOption({ tempId: 'o-1' }), makeOption({ tempId: 'o-2', name_tr: 'Hardal' })],
    })]
    const result = deleteDraftOption(groups, 'g-1', 'o-1')
    expect(result[0].options).toHaveLength(1)
    expect(result[0].options[0].tempId).toBe('o-2')
  })

  it('olmayan seçenek için listeyi değiştirmez', () => {
    const groups = [makeGroup({ tempId: 'g-1', options: [makeOption()] })]
    const result = deleteDraftOption(groups, 'g-1', 'yok')
    expect(result[0].options).toHaveLength(1)
  })

  it('grup düzeyinde diğer grupları etkilemez', () => {
    const groups = [
      makeGroup({ tempId: 'g-1', options: [makeOption({ tempId: 'o-1' })] }),
      makeGroup({ tempId: 'g-2', options: [makeOption({ tempId: 'o-2' })] }),
    ]
    const result = deleteDraftOption(groups, 'g-1', 'o-1')
    expect(result[0].options).toHaveLength(0)
    expect(result[1].options).toHaveLength(1) // g-2 korundu
  })
})

// ─── toggleDraftOptionActive ──────────────────────────────────────────────────

describe('toggleDraftOptionActive', () => {
  it('aktif seçeneği pasife çevirir', () => {
    const groups = [makeGroup({ tempId: 'g-1', options: [makeOption({ tempId: 'o-1', is_active: true })] })]
    const result = toggleDraftOptionActive(groups, 'g-1', 'o-1')
    expect(result[0].options[0].is_active).toBe(false)
  })

  it('pasif seçeneği aktife çevirir', () => {
    const groups = [makeGroup({ tempId: 'g-1', options: [makeOption({ tempId: 'o-1', is_active: false })] })]
    const result = toggleDraftOptionActive(groups, 'g-1', 'o-1')
    expect(result[0].options[0].is_active).toBe(true)
  })

  it('iki kez toggle orijinale döner', () => {
    const groups = [makeGroup({ tempId: 'g-1', options: [makeOption({ tempId: 'o-1', is_active: true })] })]
    const once = toggleDraftOptionActive(groups, 'g-1', 'o-1')
    const twice = toggleDraftOptionActive(once, 'g-1', 'o-1')
    expect(twice[0].options[0].is_active).toBe(true)
  })

  it('diğer seçenekleri etkilemez', () => {
    const groups = [makeGroup({
      tempId: 'g-1',
      options: [
        makeOption({ tempId: 'o-1', is_active: true }),
        makeOption({ tempId: 'o-2', is_active: true }),
      ],
    })]
    const result = toggleDraftOptionActive(groups, 'g-1', 'o-1')
    expect(result[0].options[0].is_active).toBe(false)
    expect(result[0].options[1].is_active).toBe(true)
  })

  it('immutable — orijinal diziyi değiştirmez', () => {
    const original = [makeGroup({ tempId: 'g-1', options: [makeOption({ tempId: 'o-1', is_active: true })] })]
    toggleDraftOptionActive(original, 'g-1', 'o-1')
    expect(original[0].options[0].is_active).toBe(true) // değişmedi
  })
})
