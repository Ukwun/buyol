import { Card, CardBody } from "@/components/ui";
import { ConversationPanel } from "@/features/messaging/components";
import { listConversations } from "@/features/messaging/server";
import { requireCustomerSession } from "@/lib/auth/session";
import styles from "./page.module.css";

export default async function AccountMessagesPage() {
  const user = await requireCustomerSession();
  const conversations = await listConversations(user.uid);
  return <div className={styles.page}><div><p className={styles.eyebrow}>Buyer support</p><h1>Messages</h1><p className={styles.intro}>Ask a seller a question and receive replies in real time.</p></div>{conversations.length ? conversations.map((conversation) => <Card key={conversation.id}><CardBody><p className={styles.meta}>Product conversation · {conversation.listingId}</p><ConversationPanel initialConversationId={conversation.id} title="Conversation with seller" /></CardBody></Card>) : <Card><CardBody><p>No conversations yet. Open a published product and choose “Message seller” to start one.</p></CardBody></Card>}</div>;
}
