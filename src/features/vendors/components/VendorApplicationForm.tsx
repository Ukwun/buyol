"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/feedback";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import { FormField, Input, Select, Textarea } from "@/components/forms";
import styles from "./VendorApplicationForm.module.css";

interface ApplicationFormData {
  personal: { fullLegalName: string; contactEmail: string; phoneNumber: string; countryCode: string; preferredContactMethod: "email" | "phone" };
  business: { tradingName: string; businessType: "individual" | "registered_business" | "company" | "other"; registrationCountryCode: string; registrationNumber?: string; address: { recipientName: string; phoneNumber: string; addressLine1: string; city: string; region?: string; postalCode?: string; countryCode: string }; contactEmail: string; phoneNumber: string; website?: string };
  store: { name: string; slug: string; description: string; countryCode: string; settlementCurrency: string; logoStoragePath?: string; bannerStoragePath?: string };
}

const initialData: ApplicationFormData = {
  personal: { fullLegalName: "", contactEmail: "", phoneNumber: "", countryCode: "NG", preferredContactMethod: "email" },
  business: { tradingName: "", businessType: "individual", registrationCountryCode: "NG", registrationNumber: "", address: { recipientName: "", phoneNumber: "", addressLine1: "", city: "", region: "", postalCode: "", countryCode: "NG" }, contactEmail: "", phoneNumber: "", website: "" },
  store: { name: "", slug: "", description: "", countryCode: "NG", settlementCurrency: "NGN" },
};

function fieldValue(data: ApplicationFormData, path: string): string {
  const [section, field] = path.split(".") as ["personal" | "business" | "store", string];
  return String((data[section] as Record<string, unknown>)[field] ?? "");
}

interface ExistingApplication {
  status?: string;
  rejectionReason?: string;
  personal?: Partial<ApplicationFormData["personal"]>;
  business?: Partial<ApplicationFormData["business"]> & { address?: Partial<ApplicationFormData["business"]["address"]> };
  store?: Partial<ApplicationFormData["store"]>;
}

export function VendorApplicationForm({ email, existing }: { email: string; existing?: ExistingApplication }) {
  const [data, setData] = useState<ApplicationFormData>(() => ({ ...initialData, ...existing, personal: { ...initialData.personal, ...existing?.personal, contactEmail: email }, business: { ...initialData.business, ...existing?.business, address: { ...initialData.business.address, ...existing?.business?.address } }, store: { ...initialData.store, ...existing?.store } }));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string }>();

  function update(section: "personal" | "business" | "store", field: string, value: string) {
    setData((current) => ({ ...current, [section]: { ...current[section], [field]: value } }));
  }

  async function save(action: "draft" | "submit") {
    setBusy(true); setMessage(undefined);
    try {
      const response = await fetch("/api/vendor/application", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, application: data }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to save your application.");
      setMessage({ kind: "success", text: action === "submit" ? "Your application has been submitted for review." : "Your draft has been saved." });
    } catch (error) { setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to save your application." }); }
    finally { setBusy(false); }
  }

  async function upload(kind: "logo" | "banner", file: File | undefined) {
    if (!file) return;
    setBusy(true); setMessage(undefined);
    try {
      const form = new FormData(); form.set("kind", kind); form.set("file", file);
      const response = await fetch("/api/vendor/application/media", { method: "POST", body: form });
      const body = await response.json() as { error?: string; path?: string };
      if (!response.ok || !body.path) throw new Error(body.error ?? "Unable to upload image.");
      setData((current) => ({ ...current, store: { ...current.store, [`${kind}StoragePath`]: body.path } }));
      setMessage({ kind: "success", text: `${kind === "logo" ? "Logo" : "Banner"} uploaded. Save the draft to keep it with your application.` });
    } catch (error) { setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to upload image." }); }
    finally { setBusy(false); }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void save("submit"); }

  if (existing?.status === "submitted" || existing?.status === "under_review") return <StatusPanel status={existing.status} />;

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      {message ? <Alert variant={message.kind} title={message.kind === "error" ? "Could not save" : "Saved"}>{message.text}</Alert> : null}
      {existing?.rejectionReason ? <Alert variant="warning" title="Changes requested">{existing.rejectionReason}</Alert> : null}
      <Card><CardHeader><h2 className={styles.sectionTitle}>Personal information</h2><p className={styles.sectionDescription}>Use your verified account email. We will not assign permissions from this form.</p></CardHeader><CardBody><div className={styles.grid}>
        <FormField controlId="fullLegalName" label="Full legal name" required><Input id="fullLegalName" value={fieldValue(data, "personal.fullLegalName")} onChange={(e) => update("personal", "fullLegalName", e.target.value)} required /></FormField>
        <FormField controlId="contactEmail" label="Contact email" required><Input id="contactEmail" type="email" value={email} readOnly /></FormField>
        <FormField controlId="personalPhone" label="Phone number" required><Input id="personalPhone" value={data.personal.phoneNumber} onChange={(e) => update("personal", "phoneNumber", e.target.value)} required /></FormField>
        <FormField controlId="personalCountry" label="Country of residence" required><Input id="personalCountry" value={data.personal.countryCode} onChange={(e) => update("personal", "countryCode", e.target.value.toUpperCase())} maxLength={2} required /></FormField>
        <FormField controlId="preferredContact" label="Preferred contact method" required><Select id="preferredContact" value={data.personal.preferredContactMethod} onChange={(e) => update("personal", "preferredContactMethod", e.target.value)}><option value="email">Email</option><option value="phone">Phone</option></Select></FormField>
      </div></CardBody></Card>
      <Card><CardHeader><h2 className={styles.sectionTitle}>Business information</h2></CardHeader><CardBody><div className={styles.grid}>
        <FormField controlId="tradingName" label="Business or trading name" required><Input id="tradingName" value={data.business.tradingName} onChange={(e) => update("business", "tradingName", e.target.value)} required /></FormField>
        <FormField controlId="businessType" label="Business type" required><Select id="businessType" value={data.business.businessType} onChange={(e) => update("business", "businessType", e.target.value)}><option value="individual">Individual</option><option value="registered_business">Registered business</option><option value="company">Company</option><option value="other">Other</option></Select></FormField>
        <FormField controlId="registrationCountry" label="Registration country" required><Input id="registrationCountry" value={data.business.registrationCountryCode} onChange={(e) => update("business", "registrationCountryCode", e.target.value.toUpperCase())} maxLength={2} required /></FormField>
        <FormField controlId="registrationNumber" label="Registration number"><Input id="registrationNumber" value={data.business.registrationNumber} onChange={(e) => update("business", "registrationNumber", e.target.value)} /></FormField>
        <FormField controlId="businessEmail" label="Business email" required><Input id="businessEmail" type="email" value={data.business.contactEmail} onChange={(e) => update("business", "contactEmail", e.target.value)} required /></FormField>
        <FormField controlId="businessPhone" label="Business phone" required><Input id="businessPhone" value={data.business.phoneNumber} onChange={(e) => update("business", "phoneNumber", e.target.value)} required /></FormField>
        <FormField controlId="website" label="Website"><Input id="website" type="url" placeholder="https://" value={data.business.website} onChange={(e) => update("business", "website", e.target.value)} /></FormField>
        <FormField controlId="businessAddress" label="Business address" required><Input id="businessAddress" value={data.business.address.addressLine1} onChange={(e) => setData((c) => ({ ...c, business: { ...c.business, address: { ...c.business.address, addressLine1: e.target.value } } }))} required /></FormField>
        <FormField controlId="addressRecipient" label="Address recipient" required><Input id="addressRecipient" value={data.business.address.recipientName} onChange={(e) => setData((c) => ({ ...c, business: { ...c.business, address: { ...c.business.address, recipientName: e.target.value } } }))} required /></FormField>
        <FormField controlId="addressPhone" label="Address phone" required><Input id="addressPhone" value={data.business.address.phoneNumber} onChange={(e) => setData((c) => ({ ...c, business: { ...c.business, address: { ...c.business.address, phoneNumber: e.target.value } } }))} required /></FormField>
        <FormField controlId="businessCity" label="City" required><Input id="businessCity" value={data.business.address.city} onChange={(e) => setData((c) => ({ ...c, business: { ...c.business, address: { ...c.business.address, city: e.target.value } } }))} required /></FormField>
      </div></CardBody></Card>
      <Card><CardHeader><h2 className={styles.sectionTitle}>Store profile</h2><p className={styles.sectionDescription}>Your store remains pending until an authorized reviewer approves the application.</p></CardHeader><CardBody><div className={styles.grid}>
        <FormField controlId="storeName" label="Store name" required><Input id="storeName" value={data.store.name} onChange={(e) => update("store", "name", e.target.value)} required /></FormField>
        <FormField controlId="storeSlug" label="Unique store slug" required><Input id="storeSlug" value={data.store.slug} onChange={(e) => update("store", "slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></FormField>
        <FormField controlId="storeCountry" label="Country of operation" required><Input id="storeCountry" value={data.store.countryCode} onChange={(e) => update("store", "countryCode", e.target.value.toUpperCase())} maxLength={2} required /></FormField>
        <FormField controlId="settlementCurrency" label="Default settlement currency" required><Select id="settlementCurrency" value={data.store.settlementCurrency} onChange={(e) => update("store", "settlementCurrency", e.target.value)}>{["NGN", "USD", "GHS", "GBP", "EUR", "CNY", "ZAR"].map((currency) => <option key={currency} value={currency}>{currency}</option>)}</Select></FormField>
        <div className={styles.wide}><FormField controlId="storeDescription" label="Store description" required><Textarea id="storeDescription" rows={5} value={data.store.description} onChange={(e) => update("store", "description", e.target.value)} required /></FormField></div>
        <div className={styles.upload}><label htmlFor="storeLogo">Store logo</label><input id="storeLogo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => void upload("logo", e.target.files?.[0])} /><small>Optional. JPEG, PNG or WebP up to 5 MB.</small></div>
        <div className={styles.upload}><label htmlFor="storeBanner">Store banner</label><input id="storeBanner" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => void upload("banner", e.target.files?.[0])} /><small>Optional. JPEG, PNG or WebP up to 5 MB.</small></div>
      </div></CardBody></Card>
      <div className={styles.actions}><Button type="button" variant="outline" loading={busy} onClick={() => void save("draft")}>Save draft</Button><Button type="submit" loading={busy}>Submit for review</Button></div>
    </form>
  );
}

function StatusPanel({ status }: { status?: string }) { return <Card><CardBody><div className={styles.summary}><h2 className={styles.sectionTitle}>Application under review</h2><div className={styles.summaryRow}><span className={styles.summaryLabel}>Status</span><span className={styles.summaryValue}>{status === "under_review" ? "Under review" : "Submitted"}</span></div><p className={styles.sectionDescription}>An authorized BUYOL reviewer will update your application. You cannot change its review status.</p></div></CardBody></Card>; }
