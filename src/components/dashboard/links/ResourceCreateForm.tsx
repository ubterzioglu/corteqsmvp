'use client'

// "Yeni Kayıt Ekle" akordeonu. Alanlar ResourceFormFields'tan gelir; burada
// yalnız akordeon sarmalayıcısı ve gönder düğmesi vardır.

import type { FormEvent } from 'react'
import { Plus, Upload } from 'lucide-react'
import AccordionCard from '@/components/dashboard/AccordionCard'
import { requiresStoredFile, type ResourceFormState } from '@/lib/dashboard/resource-items'
import ResourceFormFields from './ResourceFormFields'
import type { ResourceFieldSetter } from './useLinkManager'

interface ResourceCreateFormProps {
  formState: ResourceFormState
  sectionOptions: string[]
  subsectionOptions: string[]
  isSubmitting: boolean
  onChange: ResourceFieldSetter
  onFileChange: (file: File | null) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function ResourceCreateForm({
  formState,
  sectionOptions,
  subsectionOptions,
  isSubmitting,
  onChange,
  onFileChange,
  onSubmit,
}: ResourceCreateFormProps) {
  return (
    <AccordionCard
      items={[
        {
          id: 'new-resource',
          title: 'Yeni Kayıt Ekle',
          accentColor: '#1A6DC2',
          children: (
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ResourceFormFields
                state={formState}
                mode="create"
                sectionOptions={sectionOptions}
                subsectionOptions={subsectionOptions}
                onChange={onChange}
                onFileChange={onFileChange}
              />
              <div className="flex items-end sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {requiresStoredFile(formState) ? (
                    <Upload size={16} className="mr-1 inline" aria-hidden="true" />
                  ) : (
                    <Plus size={16} className="mr-1 inline" aria-hidden="true" />
                  )}
                  {isSubmitting ? 'Kaydediliyor...' : 'Kaydı oluştur'}
                </button>
              </div>
            </form>
          ),
        },
      ]}
    />
  )
}
