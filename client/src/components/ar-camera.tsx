import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface ARCameraProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export default function ARCamera({ onCapture, onClose }: ARCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        setError("Camera access denied. Please enable camera permissions.");
        console.error("Camera access error:", err);
      }
    }

    setupCamera();

    return () => {
      // Cleanup: stop all tracks when component unmounts
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to base64 image data
    const imageData = canvas.toDataURL("image/jpeg");
    onCapture(imageData);
  };

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-center text-destructive">
          <p>{error}</p>
          <Button variant="outline" onClick={onClose} className="mt-2">
            Close Camera
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full aspect-[3/4] object-cover rounded-lg"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
        <Button
          size="lg"
          variant="outline"
          className="bg-background/80 backdrop-blur"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          size="lg"
          className="bg-primary/80 backdrop-blur"
          onClick={handleCapture}
          disabled={!hasPermission}
        >
          <Camera className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
