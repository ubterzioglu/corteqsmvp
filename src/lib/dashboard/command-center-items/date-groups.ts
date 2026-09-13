// Komuta Merkezi — üst kategori ve tarih grubu türetimi.
// "T 26 Şubat" / "WA 6 Nisan" / "TODO" etiketleri ile bunların sıralama
// jetonları burada üretilir. WA kayıtları haftalık kovalara toplanır; kova
// başlangıcı ilgili ayın İLK PAZARTESİ'sidir (Mayıs bilinçli istisnadır).

import { getMeetingCategoryLabel, TODO_DATE_GROUP_LABEL } from './labels'
import type { CommandCenterDateGroupInfo, CommandCenterItem } from './types'

const WA_BUCKET_YEAR = 2026

function isWaMeetingCategory(label: string): boolean {
  return /\bWA\b/i.test(label)
}

function extractDateLabelWithoutWa(label: string): string {
  return label.replace(/\bWA\b/gi, '').replace(/\s+/g, ' ').trim()
}

function getMonthNumber(monthLabel: string): number | null {
  const normalized = monthLabel
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')

  const monthMap: Record<string, number> = {
    ocak: 1,
    subat: 2,
    mart: 3,
    nisan: 4,
    mayis: 5,
    haziran: 6,
    temmuz: 7,
    agustos: 8,
    eylul: 9,
    ekim: 10,
    kasim: 11,
    aralik: 12,
  }

  return monthMap[normalized] ?? null
}

function formatMonthDayLabel(date: Date): string {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

function getFirstMondayOfMonth(monthNumber: number): Date {
  const firstDayOfMonth = new Date(Date.UTC(WA_BUCKET_YEAR, monthNumber - 1, 1))
  const weekday = firstDayOfMonth.getUTCDay()
  const daysUntilMonday = (8 - weekday) % 7

  return new Date(Date.UTC(WA_BUCKET_YEAR, monthNumber - 1, 1 + daysUntilMonday))
}

function getWaWeekBucketLabel(rawLabel: string): string {
  const normalizedLabel = extractDateLabelWithoutWa(rawLabel)
  const match = normalizedLabel.match(/(\d{1,2})\s+([^\s]+)/)
  if (!match) {
    return normalizedLabel || 'WA'
  }

  const day = Number(match[1])
  const month = match[2]
  if (!Number.isFinite(day)) {
    return normalizedLabel || 'WA'
  }

  const monthNumber = getMonthNumber(month)
  if (!monthNumber) {
    return normalizedLabel || 'WA'
  }

  if (monthNumber === 5) {
    return '8 Mayıs'
  }

  const firstMonday = getFirstMondayOfMonth(monthNumber)
  const firstMondayDay = firstMonday.getUTCDate()
  const bucketDay =
    day <= firstMondayDay
      ? firstMondayDay
      : firstMondayDay + Math.floor((day - firstMondayDay) / 7) * 7
  const bucketDate = new Date(Date.UTC(WA_BUCKET_YEAR, monthNumber - 1, bucketDay))

  return formatMonthDayLabel(bucketDate)
}

export function getDateGroupSortToken(label: string): string {
  if (label === TODO_DATE_GROUP_LABEL) {
    return '0-0000-00-00'
  }

  const isTop = label.startsWith('TOP ')
  const isWa = label.startsWith('WA ')
  const rawLabel = label.replace(/^(TOP|WA)\s+/, '')
  const match = rawLabel.match(/(\d{1,2})\s+([^\s]+)/)

  if (!match) {
    return `${isTop ? '1' : isWa ? '2' : '9'}-${rawLabel}`
  }

  const day = Number(match[1])
  const monthNumber = getMonthNumber(match[2]) ?? 99
  const paddedMonth = String(monthNumber).padStart(2, '0')
  const paddedDay = String(day).padStart(2, '0')

  return `${isTop ? '1' : isWa ? '2' : '9'}-2026-${paddedMonth}-${paddedDay}`
}

export function getCommandCenterTopCategoryLabel(
  item: Pick<CommandCenterItem, 'itemType' | 'categoryLabel' | 'legacySourceCategory'>
): string {
  if (item.itemType === 'todo') {
    return item.categoryLabel.trim() || 'Genel'
  }

  return getMeetingCategoryLabel(item.legacySourceCategory)
}

export function getCommandCenterDateGroupInfo(
  item: Pick<
    CommandCenterItem,
    'itemType' | 'categoryLabel' | 'legacySourceCode' | 'legacySourceDateLabel'
  >
): CommandCenterDateGroupInfo {
  if (item.itemType === 'todo') {
    return {
      key: 'TODO',
      label: TODO_DATE_GROUP_LABEL,
      rawLabel: TODO_DATE_GROUP_LABEL,
      sortValue: '0-TODO',
    }
  }

  const rawLabel = (item.legacySourceDateLabel ?? item.categoryLabel).trim() || 'Tarihsiz'
  if (item.legacySourceCode === 'WA' || isWaMeetingCategory(rawLabel)) {
    const bucketLabel = getWaWeekBucketLabel(rawLabel)
    return {
      key: `WA::${bucketLabel}`,
      label: `WA ${bucketLabel}`,
      rawLabel,
      sortValue: `2-${bucketLabel}`,
    }
  }

  return {
    key: `TOP::${rawLabel}`,
    label: `T ${rawLabel}`,
    rawLabel,
    sortValue: `1-${rawLabel}`,
  }
}
