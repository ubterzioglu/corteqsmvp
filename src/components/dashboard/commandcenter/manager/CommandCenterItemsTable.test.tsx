// A08d — sıralanabilir başlık sözleşmesi.
//
// Sıralama SUNUCUDA (A08b); tablo başlıkları yalnız tetikler. Bu test üç
// kuralı kilitler: (1) sıralanabilir başlıklar button + aria-sort taşır,
// (2) 'İşlem' (ve diğer türetilmiş kolonlar) sıralanamaz, (3) tıklama
// onSortChange'i doğru anahtarla çağırır.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import CommandCenterItemsTable from './CommandCenterItemsTable'

function renderTable(overrides: Partial<Parameters<typeof CommandCenterItemsTable>[0]> = {}) {
  const props = {
    items: [],
    editingId: null,
    editingState: {} as never,
    setEditingState: vi.fn(),
    isSubmitting: false,
    sortKey: 'priority' as const,
    sortDirection: 'desc' as const,
    onSortChange: vi.fn(),
    onStartEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onUpdate: vi.fn(),
    onArchive: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
  render(<CommandCenterItemsTable {...props} />)
  return props
}

describe('CommandCenterItemsTable — sıralama başlıkları', () => {
  it('aktif sıralama descending olarak işaretlenir', () => {
    renderTable()

    const prioHeader = screen.getByRole('columnheader', { name: /Prio/ })
    expect(prioHeader).toHaveAttribute('aria-sort', 'descending')
  })

  it('pasif sıralanabilir başlıklar aria-sort="none" taşır', () => {
    renderTable()

    expect(screen.getByRole('columnheader', { name: /Başlık & Detay/ })).toHaveAttribute(
      'aria-sort',
      'none'
    )
  })

  it('İşlem kolonu sıralanamaz — aria-sort ve düğme YOK', () => {
    renderTable()

    const islemHeader = screen.getByRole('columnheader', { name: 'İşlem' })
    expect(islemHeader).not.toHaveAttribute('aria-sort')
    expect(islemHeader.querySelector('button')).toBeNull()
  })

  it('türetilmiş kolonlar (Acil/Kategori/Tarih) sıralanamaz', () => {
    renderTable()

    for (const label of ['Acil', 'Kategori', 'Tarih']) {
      const header = screen.getByRole('columnheader', { name: label })
      expect(header).not.toHaveAttribute('aria-sort')
      expect(header.querySelector('button')).toBeNull()
    }
  })

  it('başlığa tıklama onSortChange\'i anahtarla çağırır', async () => {
    const user = userEvent.setup()
    const props = renderTable()

    await user.click(screen.getByRole('button', { name: /Durum/ }))

    expect(props.onSortChange).toHaveBeenCalledWith('status')
  })
})
