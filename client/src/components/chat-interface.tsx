import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { type ChatMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, Camera, Loader2 } from "lucide-react";
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

  const { data: messages = [], isLoading, error } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat-messages"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/chat-messages");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch chat messages");
      }
      return response.json();
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load chat history. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = useMutation({
    mutationFn: async ({ content, image }: { content: string; image: string | null }) => {
      const response = await apiRequest("POST", "/api/chat-messages", {
        role: "user",
        content,
        imageUrl: image,
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          throw new Error("PlantBuddy is a bit busy. Please wait a moment before trying again.");
        }
        throw new Error(error.message || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-messages"] });
      setMessage("");
      setSelectedImage(null);

      if (data.assistantMessage?.actionType) {
        handleAssistantAction(
          data.assistantMessage.actionType,
          data.assistantMessage.actionPayload || {}
        );
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      console.error("Chat error:", error);
    },
  });

  const handleAssistantAction = (
    actionType: string,
    actionPayload: Record<string, unknown>
  ) => {
    if ("redirect" in actionPayload && typeof actionPayload.redirect === "string") {
      navigate(actionPayload.redirect);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedImage) || sendMessage.isPending) return;

    // Show a loading toast for long-running requests
    const pendingToast = toast({
      title: "Sending message",
      description: "PlantBuddy is processing your request...",
    });

    sendMessage.mutate(
      { content: message, image: selectedImage },
      {
        onSettled: () => {
          // Dismiss the loading toast
          toast.dismiss(pendingToast);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading chat history...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages?.map((msg) => (
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
                    className="mb-2 rounded-md max-w-full h-auto"
                    loading="lazy"
                  />
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
          {sendMessage.isPending && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">PlantBuddy is thinking...</span>
            </div>
          )}
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
            disabled={sendMessage.isPending}
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
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        {selectedImage && (
          <div className="mt-2">
            <img
              src={selectedImage}
              alt="Selected image"
              className="h-20 rounded-md object-cover"
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              onClick={() => setSelectedImage(null)}
              disabled={sendMessage.isPending}
            >
              Remove
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}