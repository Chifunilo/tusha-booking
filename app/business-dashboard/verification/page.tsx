"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { ZAMBIA_PROVINCES } from "@/lib/facilities";
import DocumentViewer from "@/components/verification/DocumentViewer";
import {
  DOCUMENT_STATUS_BADGES,
  DOCUMENT_TYPES,
  DocumentType,
  ID_TYPES,
  OPTIONAL_DOCUMENTS,
  STAGE_BANNERS,
  VerificationDocument,
  documentLabel,
  formatBytes,
} from "@/lib/verification";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerificationView {
  business: {
    business_name: string;
    business_email: string | null;
    business_phone: string | null;
    address_line1: string;
    city: string;
    state_province: string | null;
    owner_full_name: string | null;
    owner_id_type: string | null;
    owner_id_number: string | null;
    registration_number: string | null;
    tpin: string | null;
    is_vat_registered: boolean;
    review_note: string | null;
    agreement_accepted_at: string | null;
  };
  stage: string;
  editable: boolean;
  canUpload: boolean;
  documents: VerificationDocument[];
  checklist: { key: string; label: string; done: boolean }[];
  canSubmit: boolean;
  agreement: { version: string; terms: string[]; acceptedCurrent: boolean };
}

interface DetailsForm {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  addressLine1: string;
  city: string;
  province: string;
  ownerFullName: string;
  ownerIdType: string;
  ownerIdNumber: string;
  registrationNumber: string;
  tpin: string;
  isVatRegistered: boolean;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

function toForm(b: VerificationView["business"]): DetailsForm {
  const filled = (s: string | null) => (s && s.toUpperCase() !== "TBD" ? s : "");
  return {
    businessName: b.business_name,
    businessPhone: b.business_phone ?? "",
    businessEmail: b.business_email ?? "",
    addressLine1: filled(b.address_line1),
    city: filled(b.city),
    province: b.state_province ?? "",
    ownerFullName: b.owner_full_name ?? "",
    ownerIdType: b.owner_id_type ?? "nrc",
    ownerIdNumber: b.owner_id_number ?? "",
    registrationNumber: b.registration_number ?? "",
    tpin: b.tpin ?? "",
    isVatRegistered: b.is_vat_registered,
  };
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error ?? fallback;
}

// ─── Building blocks ──────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 focus:border-yellow-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500";

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-800">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-black/5 md:p-8">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DocumentRow({
  doc,
  canRemove,
  onView,
  onRemove,
}: {
  doc: VerificationDocument;
  canRemove: boolean;
  onView: () => void;
  onRemove: () => void;
}) {
  const badge = DOCUMENT_STATUS_BADGES[doc.status];
  return (
    <li className="rounded-xl bg-gray-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{doc.original_name ?? documentLabel(doc.doc_type)}</p>
          <p className="text-xs text-gray-500">
            {documentLabel(doc.doc_type)} · {formatBytes(doc.size_bytes)} · uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
          <button onClick={onView} className="rounded-full border border-gray-300 px-3 py-1 text-sm font-semibold hover:bg-white">View</button>
          {canRemove && (
            <button onClick={onRemove} className="rounded-full px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-50">Remove</button>
          )}
        </div>
      </div>
      {doc.status === "rejected" && doc.reject_reason && <p className="mt-2 text-sm text-red-700">Reason: {doc.reject_reason}</p>}
    </li>
  );
}

function UploadButton({
  label,
  disabled,
  onFile,
}: {
  label: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
      >
        {label}
      </button>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessVerificationPage() {
  const [view, setView] = useState<VerificationView | null>(null);
  const [form, setForm] = useState<DetailsForm | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [uploading, setUploading] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [optionalType, setOptionalType] = useState<DocumentType>("pacra_certificate");
  const [viewing, setViewing] = useState<VerificationDocument | null>(null);
  const closeViewer = useCallback(() => setViewing(null), []);

  const [agreed, setAgreed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const apply = useCallback((next: VerificationView, resetForm: boolean) => {
    setView(next);
    if (resetForm) setForm(toForm(next.business));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/verification`, { credentials: "include" });
        if (!res.ok) throw new Error(await errorMessage(res, "Couldn’t load your verification"));
        apply(await res.json(), true);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Couldn’t load your verification");
      }
    })();
  }, [apply]);

  const refresh = async () => {
    const res = await fetch(`${API_URL}/api/verification`, { credentials: "include" });
    if (res.ok) apply(await res.json(), false);
  };

  const update = <K extends keyof DetailsForm>(key: K, value: DetailsForm[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setSaved(false);
    if (fieldError?.field === key) setFieldError(null);
  };

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setFormError(null);
    setFieldError(null);
    try {
      const res = await fetch(`${API_URL}/api/verification`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.field) setFieldError({ field: data.field, message: data.error });
        else setFormError(data.error ?? "Couldn’t save your details");
        return;
      }
      apply(await res.json(), true);
      setSaved(true);
    } catch {
      setFormError("Couldn’t save your details. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async (docType: DocumentType, file: File) => {
    setDocError(null);
    if (file.size > MAX_BYTES) {
      setDocError("That file is over 10 MB. Try a smaller photo or a compressed PDF.");
      return;
    }
    setUploading(docType);
    try {
      const body = new FormData();
      body.append("docType", docType);
      body.append("file", file);
      const res = await fetch(`${API_URL}/api/verification/documents`, { method: "POST", credentials: "include", body });
      if (!res.ok) {
        setDocError(await errorMessage(res, "Upload failed"));
        return;
      }
      await refresh();
    } catch {
      setDocError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(null);
    }
  };

  const removeDocument = async (doc: VerificationDocument) => {
    setDocError(null);
    const res = await fetch(`${API_URL}/api/verification/documents/${doc.document_id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      setDocError(await errorMessage(res, "Couldn’t remove the document"));
      return;
    }
    apply(await res.json(), false);
  };

  const acceptAgreement = async () => {
    if (!view) return;
    setActionError(null);
    const res = await fetch(`${API_URL}/api/verification/agreement`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: view.agreement.version }),
    });
    if (!res.ok) {
      setActionError(await errorMessage(res, "Couldn’t record your acceptance"));
      return;
    }
    apply(await res.json(), false);
  };

  const submit = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/api/verification/submit`, { method: "POST", credentials: "include" });
      if (!res.ok) {
        setActionError(await errorMessage(res, "Couldn’t submit"));
        return;
      }
      apply(await res.json(), true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-yellow-50 p-4">
        <div className="rounded-3xl bg-white p-8 text-center shadow-lg">
          <p className="text-gray-700">{loadError}</p>
          <Link href="/business-dashboard" className="mt-4 inline-block font-semibold underline">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  if (!view || !form) return <div className="min-h-screen bg-yellow-50 p-8 text-gray-500">Loading…</div>;

  const banner = STAGE_BANNERS[view.stage] ?? STAGE_BANNERS.not_submitted;
  const idDocs = view.documents.filter((d) => d.doc_type === "national_id");
  const otherDocs = view.documents.filter((d) => d.doc_type !== "national_id");
  const canRemove = (d: VerificationDocument) => view.editable && d.status !== "accepted";
  const errorFor = (field: keyof DetailsForm) => (fieldError?.field === field ? fieldError.message : undefined);
  const idType = ID_TYPES.find((t) => t.value === form.ownerIdType) ?? ID_TYPES[0];
  const locked = !view.editable;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/business-dashboard" className="text-sm text-gray-600 hover:text-gray-900">← Back to dashboard</Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">Business verification</h1>
        </div>

        <div className={`rounded-2xl border-2 p-5 ${banner.className}`}>
          <p className="font-bold text-gray-900">{banner.title}</p>
          <p className="mt-1 text-sm text-gray-700">{banner.body}</p>
          {view.stage === "needs_info" && view.business.review_note && (
            <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm text-gray-900">
              <strong>Note from Tusha:</strong> {view.business.review_note}
            </p>
          )}
          {view.editable && (
            <ul className="mt-4 space-y-1.5">
              {view.checklist.map((item) => (
                <li key={item.key} className={`flex items-center gap-2 text-sm ${item.done ? "text-gray-500 line-through" : "text-gray-900"}`}>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${item.done ? "bg-green-600 text-white" : "border-2 border-gray-400"}`}>
                    {item.done ? "✓" : ""}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={saveDetails} className="space-y-6">
          <Card title="Your business" subtitle="How guests and Tusha reach you.">
            <fieldset disabled={locked} className="grid gap-4 md:grid-cols-2">
              <Field label="Business name" error={errorFor("businessName")}>
                <input className={inputClass} value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />
              </Field>
              <Field label="Phone number" hint="We’ll call this number to confirm your business." error={errorFor("businessPhone")}>
                <input className={inputClass} type="tel" placeholder="0977 123 456" value={form.businessPhone} onChange={(e) => update("businessPhone", e.target.value)} />
              </Field>
              <Field label="Business email (optional)" error={errorFor("businessEmail")}>
                <input className={inputClass} type="email" value={form.businessEmail} onChange={(e) => update("businessEmail", e.target.value)} />
              </Field>
              <Field label="Street address or plot" error={errorFor("addressLine1")}>
                <input className={inputClass} placeholder="Plot 12, Mosi-oa-Tunya Road" value={form.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} />
              </Field>
              <Field label="Town or city" error={errorFor("city")}>
                <input className={inputClass} value={form.city} onChange={(e) => update("city", e.target.value)} />
              </Field>
              <Field label="Province" error={errorFor("province")}>
                <select className={inputClass} value={form.province} onChange={(e) => update("province", e.target.value)}>
                  <option value="">Choose…</option>
                  {ZAMBIA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </fieldset>
          </Card>

          <Card title="Owner or manager" subtitle="The person responsible for the business. Use the name exactly as it appears on the ID.">
            <fieldset disabled={locked} className="grid gap-4 md:grid-cols-2">
              <Field label="Full name" error={errorFor("ownerFullName")}>
                <input className={inputClass} value={form.ownerFullName} onChange={(e) => update("ownerFullName", e.target.value)} />
              </Field>
              <div>
                <span className="mb-1 block text-sm font-semibold text-gray-800">ID type</span>
                <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
                  {ID_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => update("ownerIdType", t.value)}
                      className={`rounded-lg py-2 text-sm font-semibold ${form.ownerIdType === t.value ? "bg-white shadow" : "text-gray-600"} disabled:cursor-not-allowed`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <Field label={`${idType.label} number`} error={errorFor("ownerIdNumber")}>
                <input className={inputClass} placeholder={idType.placeholder} value={form.ownerIdNumber} onChange={(e) => update("ownerIdNumber", e.target.value)} />
              </Field>
            </fieldset>
          </Card>

          <Card title="Registration and tax" subtitle="Optional unless you charge VAT. Many guesthouses aren’t registered yet, and that’s fine.">
            <fieldset disabled={locked} className="grid gap-4 md:grid-cols-2">
              <Field label="PACRA registration number (optional)" error={errorFor("registrationNumber")}>
                <input className={inputClass} value={form.registrationNumber} onChange={(e) => update("registrationNumber", e.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 h-5 w-5 accent-yellow-500" checked={form.isVatRegistered} onChange={(e) => update("isVatRegistered", e.target.checked)} />
                  <span>
                    <span className="block font-semibold text-gray-900">My business is registered for VAT</span>
                    <span className="block text-sm text-gray-600">We’ll add 16% VAT to your guests’ bills. Only tick this if ZRA has registered you for VAT.</span>
                  </span>
                </label>
              </div>
              {form.isVatRegistered && (
                <Field label="TPIN" hint="10 digits, from your ZRA registration." error={errorFor("tpin")}>
                  <input className={inputClass} inputMode="numeric" value={form.tpin} onChange={(e) => update("tpin", e.target.value)} />
                </Field>
              )}
            </fieldset>
          </Card>

          {!locked && (
            <div className="flex items-center justify-end gap-3">
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              {saved && <p className="text-sm text-green-700">Saved</p>}
              <button type="submit" disabled={saving} className="rounded-full bg-yellow-400 px-8 py-3 font-bold text-black hover:bg-yellow-500 disabled:opacity-50">
                {saving ? "Saving…" : "Save details"}
              </button>
            </div>
          )}
        </form>

        <Card title="ID document" subtitle={DOCUMENT_TYPES.national_id.detail + " A photo from your phone is fine — make sure every word is readable."}>
          {idDocs.length > 0 && (
            <ul className="mb-4 space-y-2">
              {idDocs.map((d) => (
                <DocumentRow key={d.document_id} doc={d} canRemove={canRemove(d)} onView={() => setViewing(d)} onRemove={() => removeDocument(d)} />
              ))}
            </ul>
          )}
          {view.canUpload && (
            <UploadButton
              label={uploading === "national_id" ? "Uploading…" : idDocs.length ? "Add another photo (e.g. the back)" : "Upload NRC or passport"}
              disabled={uploading !== null}
              onFile={(f) => uploadDocument("national_id", f)}
            />
          )}
          <p className="mt-3 text-xs text-gray-500">Stored privately and only seen by the Tusha team. Never shown to guests. PDF, JPEG, PNG or WebP, up to 10 MB.</p>
        </Card>

        <Card title="Other documents (optional)" subtitle="These aren’t required, but they help us verify you faster.">
          {otherDocs.length > 0 && (
            <ul className="mb-4 space-y-2">
              {otherDocs.map((d) => (
                <DocumentRow key={d.document_id} doc={d} canRemove={canRemove(d)} onView={() => setViewing(d)} onRemove={() => removeDocument(d)} />
              ))}
            </ul>
          )}
          {view.canUpload && (
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Document" hint={DOCUMENT_TYPES[optionalType].detail}>
                <select className={inputClass} value={optionalType} onChange={(e) => setOptionalType(e.target.value as DocumentType)}>
                  {OPTIONAL_DOCUMENTS.map((t) => <option key={t} value={t}>{DOCUMENT_TYPES[t].label}</option>)}
                </select>
              </Field>
              <UploadButton label={uploading === optionalType ? "Uploading…" : "Upload"} disabled={uploading !== null} onFile={(f) => uploadDocument(optionalType, f)} />
            </div>
          )}
        </Card>

        {docError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{docError}</p>}

        <Card title="Partner agreement" subtitle={`Version ${view.agreement.version}`}>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
            {view.agreement.terms.map((t) => <li key={t}>{t}</li>)}
          </ul>
          {view.agreement.acceptedCurrent ? (
            <p className="mt-5 font-semibold text-green-700">
              ✓ Accepted{view.business.agreement_accepted_at ? ` on ${new Date(view.business.agreement_accepted_at).toLocaleDateString()}` : ""}
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-5 w-5 accent-yellow-500" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span className="text-sm text-gray-900">I agree to these terms on behalf of {view.business.business_name}.</span>
              </label>
              <button onClick={acceptAgreement} disabled={!agreed} className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-40">
                Accept agreement
              </button>
            </div>
          )}
        </Card>

        {view.editable && (
          <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-black/5 md:p-8">
            <h2 className="text-xl font-bold text-gray-900">Submit for verification</h2>
            <p className="mt-1 text-sm text-gray-600">
              {view.canSubmit
                ? "Everything we need is here. Your details are locked while we review them."
                : `Still needed: ${view.checklist.filter((i) => !i.done).map((i) => i.label.toLowerCase()).join("; ")}.`}
            </p>
            {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}
            <button
              onClick={submit}
              disabled={!view.canSubmit || submitting}
              className="mt-4 w-full rounded-full bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 md:w-auto md:px-10"
            >
              {submitting ? "Submitting…" : view.stage === "needs_info" ? "Submit again" : "Submit for verification"}
            </button>
          </div>
        )}
      </div>

      {viewing && (
        <DocumentViewer
          fileUrl={`${API_URL}/api/verification/documents/${viewing.document_id}/file`}
          title={viewing.original_name ?? documentLabel(viewing.doc_type)}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}
