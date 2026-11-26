"use client";

import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/feedback";
import { Button } from "@/components/ui";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import type { MessageDocument } from "@/types/firestore";
import styles from "./ConversationPanel.module.css";

export function ConversationPanel({ listingId, initialConversationId, title = "Message this seller" }: { listingId?: string; initialConversationId?: string; title?: string }) {
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [messages, setMessages] = useState<MessageDocument[]>([]);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(Boolean(initialConversationId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!conversationId) return;
    try {
      const messagesQuery = query(collection(getFirebaseFirestore(), `conversations/${conversationId}/messages`), orderBy("createdAt", "asc"), limit(100));
      return onSnapshot(messagesQuery, (snapshot) => {
        setMessages(snapshot.docs.map((document) => ({ id: document.id, ...document.data() } as MessageDocument)));
        void fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, { method: "PATCH", headers: { "content-type": "application/json" } });
      }, () => setError("Live messages are unavailable. Please sign in again and retry."));
    } catch {
      window.setTimeout(() => setError("Messaging is unavailable until Firebase is configured."), 0);
    }
  }, [conversationId]);

  async function openConversation() {
    setOpen(true);
    setError(undefined);
    if (conversationId || !listingId) return;
    setBusy(true);
    try {
      const response = await fetch("/api/conversations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ listingId }) });
      const body = await response.json() as { conversation?: { id: string }; error?: string };
      if (!response.ok || !body.conversation) throw new Error(body.error ?? "Please sign in to message this seller.");
      setConversationId(body.conversation.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to open seller messaging.");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!conversationId || !draft.trim()) return;
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: draft }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to send message.");
      setDraft("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send message.");
    } finally {
      setBusy(false);
    }
  }

  return <div className={styles.wrapper}>
    {!open ? <Button variant="outline" startIcon={<MessageCircle size={18} aria-hidden="true" />} onClick={() => void openConversation()}>Message seller</Button> : <section className={styles.panel} aria-label={title}>
      <header className={styles.header}><div><strong>{title}</strong><span>Messages are delivered securely in real time.</span></div><button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close messages"><X size={18} aria-hidden="true" /></button></header>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <div className={styles.messages} aria-live="polite">{messages.length ? messages.map((message) => <p className={message.senderRole === "customer" ? styles.mine : styles.theirs} key={message.id}>{message.body}</p>) : <p className={styles.empty}>Your messages with this seller will appear here.</p>}</div>
      <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void send(); }}><label className={styles.srOnly} htmlFor="seller-message">Your message</label><textarea id="seller-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} placeholder="Write a respectful question..." disabled={busy || !conversationId} /><Button type="submit" size="small" loading={busy} disabled={!draft.trim() || !conversationId} aria-label="Send message"><Send size={16} aria-hidden="true" /></Button></form>
    </section>}
  </div>;
}
