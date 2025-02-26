import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { GrowthTimeline } from "@shared/schema";

interface ShareMilestoneProps {
  milestone: GrowthTimeline;
  plantName: string;
}

export default function ShareMilestone({ milestone, plantName }: ShareMilestoneProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const formatShareText = () => {
    const emoji = milestone.celebrationEmoji || "🌱";
    return `${emoji} Plant Milestone Achievement! ${emoji}\n\n` +
      `My plant ${plantName} just reached a new milestone:\n` +
      `${milestone.description}\n\n` +
      `#PlantCare #PlantParenthood #GrowWithMe`;
  };

  const handleShare = async () => {
    const shareText = formatShareText();

    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
          title: "Plant Milestone",
          ...(milestone.image && { url: milestone.image }),
        });
        toast({
          title: "Shared successfully!",
          description: "Your milestone has been shared.",
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          handleCopyFallback();
        }
      }
    } else {
      handleCopyFallback();
    }
  };

  const handleCopyFallback = async () => {
    try {
      await navigator.clipboard.writeText(formatShareText());
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "You can now paste it anywhere.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleShare}
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : navigator.share ? (
        <Share2 className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}
