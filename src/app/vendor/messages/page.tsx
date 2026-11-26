import { Card, CardBody } from "@/components/ui";
import { ConversationPanel } from "@/features/messaging/components";
import { listConversations } from "@/features/messaging/server";
import { requireVendorSession } from "@/lib/auth/session";
import styles from "./page.module.css";

export default async function VendorMessagesPage() {
  const user = await requireVendorSession();
  const conversations = await listConversations(user.uid);
  return <div className={styles.page}><div><p className={styles.eyebrow}>Customer conversations</p><h1>Messages</h1><p className={styles.intro}>Reply to buyers securely and keep product questions in one place.</p></div>{conversations.length ? conversations.map((conversation) => <Card key={conversation.id}><CardBody><p className={styles.meta}>Listing · {conversation.listingId} · Buyer {conversation.customerId}</p><ConversationPanel initialConversationId={conversation.id} title="Buyer conversation" /></CardBody></Card>) : <Card><CardBody><p>No buyer conversations yet.</p></CardBody></Card>}</div>;
}
