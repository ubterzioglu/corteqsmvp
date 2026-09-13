'use client'

// Yeni kayıt formu ve satır içi düzenleme formu AYNI alan kümesini kullanır;
// tek fark dosya yükleme alanının yalnız 'create' kipinde çizilmesidir.
// Bileşen bilinçli olarak bir Fragment döner: üst gridin doğrudan çocukları
// alanların kendisi olmalı, araya sarmalayıcı `div` girerse ızgara bozulur.

import type { ResourceFormState } from '@/lib/dashboard/resource-items'
import { requiresStoredFile, requiresUrl, RESOURCE_ADDED_BY, RESOURCE_RECORD_KINDS } from '@/lib/dashboard/resource-items'
import type { ResourceFieldSetter, ResourceFormMode } from './useLinkManager'
import {
  ARGE_FILE_ACCEPT,
  CV_FILE_ACCEPT,
  FIELD_LABEL_CLS,
  INPUT_CLS,
} from './link-manager-styles'

interface ResourceFormFieldsProps {
  state: ResourceFormState
  mode: ResourceFormMode
  sectionOptions: string[]
  subsectionOptions: string[]
  onChange: ResourceFieldSetter
  onFileChange: (file: File | null) => void
}

export default function ResourceFormFields({
  state,
  mode,
  sectionOptions,
  subsectionOptions,
  onChange,
  onFileChange,
}: ResourceFormFieldsProps) {
  const isCv = state.recordKind === 'CV'
  const isGeneralFile = state.recordKind === 'Dosya' && state.section !== 'ARGE'
  const needsUpload = requiresStoredFile(state)

  return (
    <>
      <label className="space-y-2">
        <span className={FIELD_LABEL_CLS}>Bölüm</span>
        <select
          value={state.section}
          onChange={(event) => {
            onChange('section', event.target.value)
            onChange('subsection', '')
          }}
          className={INPUT_CLS}
          required
        >
          {sectionOptions.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className={FIELD_LABEL_CLS}>Alt Bölüm</span>
        <select
          value={state.subsection}
          onChange={(event) => onChange('subsection', event.target.value)}
          className={INPUT_CLS}
          required
        >
          <option value="" disabled>
            Alt bölüm seçin
          </option>
          {subsectionOptions.map((subsection) => (
            <option key={subsection} value={subsection}>
              {subsection}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className={FIELD_LABEL_CLS}>Kayıt Türü</span>
        <select
          value={state.recordKind}
          onChange={(event) => onChange('recordKind', event.target.value)}
          className={INPUT_CLS}
        >
          {RESOURCE_RECORD_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className={FIELD_LABEL_CLS}>Ekleyen</span>
        <select
          value={state.addedBy}
          onChange={(event) => onChange('addedBy', event.target.value)}
          className={INPUT_CLS}
        >
          {RESOURCE_ADDED_BY.map((person) => (
            <option key={person} value={person}>
              {person}
            </option>
          ))}
        </select>
      </label>

      {!isCv && (
        <label className="space-y-2 sm:col-span-2">
          <span className={FIELD_LABEL_CLS}>Başlık</span>
          <input
            type="text"
            value={state.title}
            onChange={(event) => onChange('title', event.target.value)}
            placeholder="Kayıt başlığı"
            className={INPUT_CLS}
            required
          />
        </label>
      )}

      <label className={`space-y-2 ${isCv ? '' : 'sm:col-span-2'}`}>
        <span className={FIELD_LABEL_CLS}>{isCv ? 'Açıklama / Not' : 'Açıklama'}</span>
        <input
          type="text"
          value={state.description}
          onChange={(event) => onChange('description', event.target.value)}
          placeholder={isCv ? 'Aday hakkında not' : 'Kısa açıklama'}
          className={INPUT_CLS}
        />
      </label>

      {isCv && <ResourceCvFields state={state} onChange={onChange} />}

      {requiresUrl(state) && (
        <label className={`${isGeneralFile ? 'sm:col-span-2' : 'sm:col-span-2'} space-y-2`}>
          <span className={FIELD_LABEL_CLS}>{isGeneralFile ? 'Dosya Linki' : 'URL'}</span>
          <input
            type="url"
            value={state.url}
            onChange={(event) => onChange('url', event.target.value)}
            placeholder="https://..."
            className={INPUT_CLS}
            required
          />
        </label>
      )}

      {needsUpload && mode === 'create' && (
        <label className="space-y-2 sm:col-span-2">
          <span className={FIELD_LABEL_CLS}>Dosya</span>
          <input
            type="file"
            accept={isCv ? CV_FILE_ACCEPT : ARGE_FILE_ACCEPT}
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className={INPUT_CLS}
            required
          />
        </label>
      )}
    </>
  )
}

interface ResourceCvFieldsProps {
  state: ResourceFormState
  onChange: ResourceFieldSetter
}

/** Yalnız kayıt türü CV iken görünen kişi alanları. */
function ResourceCvFields({ state, onChange }: ResourceCvFieldsProps) {
  return (
    <>
      <label className="space-y-2">
        <span className={FIELD_LABEL_CLS}>İsim</span>
        <input
          type="text"
          value={state.personFirstName}
          onChange={(event) => onChange('personFirstName', event.target.value)}
          placeholder="İsim"
          className={INPUT_CLS}
          required
        />
      </label>
      <label className="space-y-2">
        <span className={FIELD_LABEL_CLS}>Soyisim</span>
        <input
          type="text"
          value={state.personLastName}
          onChange={(event) => onChange('personLastName', event.target.value)}
          placeholder="Soyisim"
          className={INPUT_CLS}
          required
        />
      </label>
      <label className="space-y-2">
        <span className={FIELD_LABEL_CLS}>Rol</span>
        <input
          type="text"
          value={state.personRole}
          onChange={(event) => onChange('personRole', event.target.value)}
          placeholder="Pozisyon"
          className={INPUT_CLS}
        />
      </label>
      <label className="space-y-2">
        <span className={FIELD_LABEL_CLS}>LinkedIn</span>
        <input
          type="url"
          value={state.linkedinUrl}
          onChange={(event) => onChange('linkedinUrl', event.target.value)}
          placeholder="https://linkedin.com/in/..."
          className={INPUT_CLS}
        />
      </label>
      <label className="space-y-2">
        <span className={FIELD_LABEL_CLS}>Instagram</span>
        <input
          type="url"
          value={state.instagramUrl}
          onChange={(event) => onChange('instagramUrl', event.target.value)}
          placeholder="https://instagram.com/..."
          className={INPUT_CLS}
        />
      </label>
      <label className="space-y-2">
        <span className={FIELD_LABEL_CLS}>Website</span>
        <input
          type="url"
          value={state.websiteUrl}
          onChange={(event) => onChange('websiteUrl', event.target.value)}
          placeholder="https://ornek.com"
          className={INPUT_CLS}
        />
      </label>
    </>
  )
}
