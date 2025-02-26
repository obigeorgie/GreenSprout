import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { type ChatMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, Camera } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ChatInterface() {
  const [message, setMessage] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch chat history
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat-messages"],
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/chat-messages", {
        role: "user",
        content,
        imageUrl: selectedImage,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-messages"] });
      setMessage("");
      setSelectedImage(null);

      // Handle assistant actions
      if (response.assistantMessage.actionType) {
        handleAssistantAction(
          response.assistantMessage.actionType,
          response.assistantMessage.actionPayload
        );
      }

      // Show toast for successful actions
      if (response.assistantMessage.actionType) {
        toast({
          title: "Action Taken",
          description: "I've helped you with that request!",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAssistantAction = (
    actionType: string,
    actionPayload: Record<string, unknown>
  ) => {
    switch (actionType) {
      case "view_plant":
      case "add_plant":
      case "identify_plant":
      case "view_marketplace":
      case "create_swap":
      case "diagnose_health":
      case "start_tutorial":
      case "view_timeline":
      case "view_rescue_missions":
      case "chat_with_plant":
        if (actionPayload.redirect) {
          navigate(actionPayload.redirect as string);
        }
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !selectedImage) return;
    sendMessage.mutate(message);
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-8 bg-muted rounded animate-pulse w-3/4" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${
                msg.role === "assistant" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div
                className={`p-2 rounded-lg max-w-[80%] ${
                  msg.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {msg.role === "assistant" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium">
                    {msg.role === "assistant" ? "PlantBuddy" : "You"}
                  </span>
                </div>
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Shared plant"
                    className="mb-2 rounded-md max-w-full"
                  />
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask PlantBuddy anything about your plants..."
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            disabled={sendMessage.isPending || (!message.trim() && !selectedImage)}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        {selectedImage && (
          <div className="mt-2">
            <img
              src={selectedImage}
              alt="Selected image"
              className="h-20 rounded-md"
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              onClick={() => setSelectedImage(null)}
            >
              Remove
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}