import { SessionScreen } from "@/app/components/session-screen";

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <SessionScreen key={sessionId} sessionId={sessionId} />;
}
