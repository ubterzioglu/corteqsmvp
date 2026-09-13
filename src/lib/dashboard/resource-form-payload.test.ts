// LinkManager.tsx bölünürken (967 → barrel + alt bileşenler) bileşenin içinden
// çıkarılan saf mantık burada kilitlenir. Bileşenin birim testi yoktu; bu dosya
// "davranış değişmedi" iddiasının kanıtıdır.

import { describe, expect, it } from 'vitest'
import {
  buildResourceInsertPayload,
  buildResourceUpdatePayload,
  buildTitleFromCv,
  normalizeOptionalText,
  resourceEntryToFormState,
  validateResourceCreate,
  validateResourceFile,
  validateResourceUpdate,
} from './resource-form-payload'
import {
  createEmptyResourceFormState,
  type ResourceEntry,
  type ResourceFormState,
} from './resource-items'

function formState(overrides: Partial<ResourceFormState> = {}): ResourceFormState {
  return { ...createEmptyResourceFormState(), ...overrides }
}

const NO_UPLOAD = { bucket: null, storagePath: null, fileName: null }

describe('normalizeOptionalText', () => {
  it('boş/boşluklu metni null yapar, doluyu trimler', () => {
    expect(normalizeOptionalText('')).toBeNull()
    expect(normalizeOptionalText('   ')).toBeNull()
    expect(normalizeOptionalText('  Şahin  ')).toBe('Şahin')
  })
})

describe('buildTitleFromCv', () => {
  it('ad soyad varsa onları birleştirir', () => {
    expect(buildTitleFromCv(formState({ personFirstName: 'Ayşe', personLastName: 'Çelik' }))).toBe(
      'Ayşe Çelik',
    )
  })

  it('ad soyad yoksa başlığa, o da yoksa sabit metne düşer', () => {
    expect(buildTitleFromCv(formState({ title: 'Aday dosyası' }))).toBe('Aday dosyası')
    expect(buildTitleFromCv(formState())).toBe('CV Kaydı')
  })
})

describe('validateResourceCreate / validateResourceUpdate', () => {
  it('bölüm ve alt bölüm zorunludur', () => {
    expect(validateResourceCreate(formState({ subsection: '' }), null)).toBe(
      'Bölüm ve alt bölüm zorunlu.',
    )
    expect(validateResourceUpdate(formState({ section: '  ', subsection: 'Genel' }))).toBe(
      'Bölüm ve alt bölüm zorunlu.',
    )
  })

  it('Link kaydında URL zorunludur', () => {
    expect(validateResourceCreate(formState({ subsection: 'Rehber' }), null)).toBe(
      'Bu kayıt için URL zorunlu.',
    )
  })

  it('URL gerektirmeyen kayıt geçerli sayılır', () => {
    const state = formState({ section: 'ARGE', subsection: 'Raporlar', recordKind: 'Dosya' })
    // ARGE/Dosya URL istemez ama dosya ister.
    expect(validateResourceCreate(state, null)).toBe('Lütfen dosya seçin.')
    expect(validateResourceUpdate(state)).toBeNull()
  })

  it('CV kaydında yalnız pdf/doc/docx kabul edilir', () => {
    const state = formState({ subsection: 'Adaylar', recordKind: 'CV' })
    expect(validateResourceFile(state, new File(['x'], 'cv.pdf'))).toBeNull()
    expect(validateResourceFile(state, new File(['x'], 'cv.png'))).toContain(
      'Geçersiz dosya uzantısı',
    )
  })
})

describe('buildResourceInsertPayload', () => {
  it('Link kaydında bölüm türevlerini ve URL normalizasyonunu uygular', () => {
    const payload = buildResourceInsertPayload(
      formState({
        section: '  HR  ',
        subsection: '  Rehber  ',
        title: '  Politika  ',
        description: '   ',
        url: 'corteqs.net/rehber',
      }),
      NO_UPLOAD,
    )

    expect(payload).toMatchObject({
      section: 'HR',
      subsection: 'Rehber',
      department: 'HR',
      source_subfolder: 'Rehber',
      source_folder: 'HR / Rehber',
      import_batch: 'dashboard-manual',
      title: 'Politika',
      description: null,
      url: 'https://corteqs.net/rehber',
      storage_bucket: null,
      storage_path: null,
      file_name: null,
      person_first_name: null,
    })
  })

  it('CV kaydında başlığı ad soyaddan üretir ve kişi alanlarını doldurur', () => {
    const payload = buildResourceInsertPayload(
      formState({
        section: 'HR',
        subsection: 'Adaylar',
        recordKind: 'CV',
        personFirstName: 'Ayşe',
        personLastName: 'Çelik',
        personRole: 'Ürün',
        linkedinUrl: 'linkedin.com/in/ayse',
        instagramUrl: '',
      }),
      { bucket: 'cv-files', storagePath: 'abc.pdf', fileName: 'ayse-cv.pdf' },
    )

    expect(payload).toMatchObject({
      title: 'Ayşe Çelik',
      url: null,
      person_first_name: 'Ayşe',
      person_last_name: 'Çelik',
      person_role: 'Ürün',
      linkedin_url: 'https://linkedin.com/in/ayse',
      instagram_url: null,
      storage_bucket: 'cv-files',
      storage_path: 'abc.pdf',
      file_name: 'ayse-cv.pdf',
    })
  })

  it('yükleme başarısızsa bucket ve dosya adı da yazılmaz', () => {
    const payload = buildResourceInsertPayload(
      formState({ section: 'ARGE', subsection: 'Raporlar', recordKind: 'Dosya' }),
      { bucket: 'arge-files', storagePath: null, fileName: 'rapor.pdf' },
    )

    expect(payload.storage_bucket).toBeNull()
    expect(payload.file_name).toBeNull()
  })
})

describe('buildResourceUpdatePayload', () => {
  it('URL gerekmeyen kayıtta mevcut URL korunur', () => {
    const payload = buildResourceUpdatePayload(
      formState({ section: 'ARGE', subsection: 'Raporlar', recordKind: 'Dosya', title: 'Rapor' }),
      'https://eski.example/rapor',
    )

    expect(payload.url).toBe('https://eski.example/rapor')
  })

  it('URL gerektiren kayıtta yeni URL sanitize edilir', () => {
    const payload = buildResourceUpdatePayload(
      formState({ subsection: 'Rehber', url: 'corteqs.net/yeni' }),
      'https://eski.example/rapor',
    )

    expect(payload.url).toBe('https://corteqs.net/yeni')
  })

  it('güncelleme yükü import_batch/storage alanlarına dokunmaz', () => {
    const payload = buildResourceUpdatePayload(formState({ subsection: 'Rehber', url: 'a.co' }), null)

    expect(payload).not.toHaveProperty('import_batch')
    expect(payload).not.toHaveProperty('storage_path')
  })
})

describe('resourceEntryToFormState', () => {
  it('null alanları boş dizgeye çevirir', () => {
    const entry = {
      id: '1',
      section: 'HR',
      subsection: 'Rehber',
      recordKind: 'Link',
      addedBy: 'UBT',
      title: 'Politika',
      description: null,
      url: null,
      personFirstName: null,
      personLastName: null,
      personRole: null,
      linkedinUrl: null,
      instagramUrl: null,
      websiteUrl: null,
    } as ResourceEntry

    expect(resourceEntryToFormState(entry)).toEqual({
      section: 'HR',
      subsection: 'Rehber',
      recordKind: 'Link',
      addedBy: 'UBT',
      title: 'Politika',
      description: '',
      url: '',
      personFirstName: '',
      personLastName: '',
      personRole: '',
      linkedinUrl: '',
      instagramUrl: '',
      websiteUrl: '',
    })
  })
})
