export type ResourceSection = string
export type ResourceSubsection = string

export const RESOURCE_RECORD_KINDS = ['Link', 'Dosya', 'CV'] as const
export type ResourceRecordKind = (typeof RESOURCE_RECORD_KINDS)[number]

export const RESOURCE_ADDED_BY = ['Şahin', 'UBT', 'Baran', 'Burak', 'Diğer'] as const
export type ResourceAddedBy = (typeof RESOURCE_ADDED_BY)[number]

export interface ResourceEntryRow {
  id: string
  order_no: number | null
  slug: string | null
  section: string | null
  subsection: string | null
  department: string
  record_kind: string
  added_by: string
  title: string
  description: string | null
  url: string | null
  file_id: string | null
  file_type: string | null
  mime_type: string | null
  privacy_level: string | null
  is_public_import: boolean | null
  import_suggestion: string | null
  tags: string | null
  source_path: string | null
  status: string | null
  is_hidden: boolean | null
  storage_bucket: string | null
  storage_path: string | null
  file_name: string | null
  person_first_name: string | null
  person_last_name: string | null
  person_role: string | null
  linkedin_url: string | null
  instagram_url: string | null
  website_url: string | null
  source_folder: string | null
  source_subfolder: string | null
  source_snapshot_date: string | null
  import_batch: string | null
  created_at: string
}

export interface ResourceEntry {
  id: string
  orderNo: number | null
  slug: string | null
  section: string
  subsection: string
  department: string
  recordKind: string
  addedBy: string
  title: string
  description: string | null
  url: string | null
  fileId: string | null
  fileType: string | null
  mimeType: string | null
  privacyLevel: string | null
  isPublicImport: boolean | null
  importSuggestion: string | null
  tags: string | null
  sourcePath: string | null
  status: string | null
  isHidden: boolean
  storageBucket: string | null
  storagePath: string | null
  fileName: string | null
  personFirstName: string | null
  personLastName: string | null
  personRole: string | null
  linkedinUrl: string | null
  instagramUrl: string | null
  websiteUrl: string | null
  sourceFolder: string | null
  sourceSubfolder: string | null
  sourceSnapshotDate: string | null
  importBatch: string | null
  createdAt: string
}

export interface ResourceFormState {
  section: ResourceSection
  subsection: ResourceSubsection
  recordKind: string
  addedBy: string
  title: string
  description: string
  url: string
  personFirstName: string
  personLastName: string
  personRole: string
  linkedinUrl: string
  instagramUrl: string
  websiteUrl: string
}

export type ResourceSectionFilter = 'all' | string
export type ResourceSubsectionFilter = 'all' | string

export function createEmptyResourceFormState(): ResourceFormState {
  return {
    section: 'Genel',
    subsection: '',
    recordKind: 'Link',
    addedBy: 'UBT',
    title: '',
    description: '',
    url: '',
    personFirstName: '',
    personLastName: '',
    personRole: '',
    linkedinUrl: '',
    instagramUrl: '',
    websiteUrl: '',
  }
}

export function mapResourceEntryRow(row: ResourceEntryRow): ResourceEntry {
  const normalizedSection = row.section ?? row.department ?? 'Genel'
  const normalizedSubsection = row.subsection ?? row.source_subfolder ?? ''

  return {
    id: row.id,
    orderNo: row.order_no,
    slug: row.slug,
    section: normalizedSection,
    subsection: normalizedSubsection,
    department: row.department,
    recordKind: row.record_kind,
    addedBy: row.added_by,
    title: row.title,
    description: row.description,
    url: row.url,
    fileId: row.file_id,
    fileType: row.file_type,
    mimeType: row.mime_type,
    privacyLevel: row.privacy_level,
    isPublicImport: row.is_public_import,
    importSuggestion: row.import_suggestion,
    tags: row.tags,
    sourcePath: row.source_path,
    status: row.status,
    isHidden: row.is_hidden ?? false,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    fileName: row.file_name,
    personFirstName: row.person_first_name,
    personLastName: row.person_last_name,
    personRole: row.person_role,
    linkedinUrl: row.linkedin_url,
    instagramUrl: row.instagram_url,
    websiteUrl: row.website_url,
    sourceFolder: row.source_folder,
    sourceSubfolder: row.source_subfolder,
    sourceSnapshotDate: row.source_snapshot_date,
    importBatch: row.import_batch,
    createdAt: row.created_at,
  }
}

export function getResourceSectionFromQuery(
  section: string | string[] | undefined
): ResourceSectionFilter {
  const normalized = Array.isArray(section) ? section[0] : section

  if (normalized === 'insankaynaklari') {
    return 'HR'
  }

  if (normalized === 'arge') {
    return 'ARGE'
  }

  return 'all'
}

export function requiresStoredFile(entry: Pick<ResourceFormState, 'section' | 'recordKind'>): boolean {
  return entry.recordKind === 'CV' || (entry.recordKind === 'Dosya' && entry.section === 'ARGE')
}

export function requiresUrl(entry: Pick<ResourceFormState, 'section' | 'recordKind'>): boolean {
  if (entry.recordKind === 'Link') return true
  if (entry.recordKind === 'Dosya' && entry.section !== 'ARGE') return true
  return false
}

export function getStorageBucket(entry: Pick<ResourceFormState, 'section' | 'recordKind'>): string | null {
  if (entry.recordKind === 'CV') return 'cv-files'
  if (entry.recordKind === 'Dosya' && entry.section === 'ARGE') return 'arge-files'
  return null
}
