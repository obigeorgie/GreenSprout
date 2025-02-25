import ChatInterface from "@/components/chat-interface";

export default function Chat() {
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">Plant Care Assistant</h1>
      <p className="text-muted-foreground mb-6">
        Ask questions about plant care, get personalized advice, and learn how to
        keep your plants healthy.
      </p>
      <ChatInterface />
    </div>
  );
}
