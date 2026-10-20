// Keys must match DOC_TYPES / ID_TYPES in the backend's src/lib/validation/verification.ts.

export const DOCUMENT_TYPES = {
  national_id: { label: 'NRC or passport', detail: 'A clear photo of the front and back of the owner’s NRC, or the passport photo page.' },
  pacra_certificate: { label: 'PACRA certificate', detail: 'Certificate of incorporation or business name registration.' },
  zta_licence: { label: 'ZTA tourism licence', detail: 'Your Zambia Tourism Agency licence, or proof that your application is in progress.' },
  proof_of_ownership: { label: 'Proof of ownership or authority', detail: 'Title deed, lease, or a letter from the owner allowing you to manage the property.' },
  tax_clearance: { label: 'ZRA tax clearance', detail: 'A current tax clearance certificate.' },
  other: { label: 'Other document', detail: 'Anything else that helps us verify your business.' },
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

export function documentLabel(type: string): string {
  return DOCUMENT_TYPES[type as DocumentType]?.label ?? type.replace(/_/g, ' ');
}

export const OPTIONAL_DOCUMENTS: DocumentType[] = ['pacra_certificate', 'zta_licence', 'proof_of_ownership', 'tax_clearance', 'other'];

export const ID_TYPES = [
  { value: 'nrc', label: 'NRC', placeholder: '123456/78/9' },
  { value: 'passport', label: 'Passport', placeholder: 'ZN1234567' },
] as const;

export interface VerificationDocument {
  document_id: number;
  doc_type: string;
  status: 'submitted' | 'accepted' | 'rejected';
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  reject_reason: string | null;
  uploaded_at: string;
}

export const DOCUMENT_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Waiting for review', className: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Not accepted', className: 'bg-red-100 text-red-800' },
};

export const STAGE_BANNERS: Record<string, { title: string; body: string; className: string }> = {
  not_submitted: {
    title: 'Verify your business to go live',
    body: 'Guests can only book your properties once we’ve verified who runs the business. It takes about 5 minutes; we review within 3 working days.',
    className: 'bg-yellow-50 border-yellow-300',
  },
  in_review: {
    title: 'We’re reviewing your business',
    body: 'We’ll check your details and may call you on the number you gave. This usually takes up to 3 working days.',
    className: 'bg-blue-50 border-blue-200',
  },
  needs_info: {
    title: 'We need a little more from you',
    body: 'Please update the items below and submit again.',
    className: 'bg-orange-50 border-orange-300',
  },
  verified: {
    title: 'Your business is verified',
    body: 'Approved properties are live for guests. You can still add licences and registration documents below.',
    className: 'bg-green-50 border-green-200',
  },
  suspended: {
    title: 'Your business is suspended',
    body: 'Your listings are hidden from guests. Contact Tusha support to resolve this.',
    className: 'bg-gray-100 border-gray-300',
  },
  rejected: {
    title: 'We couldn’t verify your business',
    body: 'Contact Tusha support if you think this is a mistake.',
    className: 'bg-red-50 border-red-200',
  },
};

export function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
