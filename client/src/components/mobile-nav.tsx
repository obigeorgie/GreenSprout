import { Link, useLocation } from "wouter";
import { Home, PlusCircle, Camera, Leaf, MessageSquare, Heart, BookOpen } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background p-2">
      <div className="container mx-auto flex justify-around">
        <Link href="/">
          <a className={`flex flex-col items-center p-2 ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </a>
        </Link>
        <Link href="/identify">
          <a className={`flex flex-col items-center p-2 ${location === "/identify" ? "text-primary" : "text-muted-foreground"}`}>
            <Camera className="h-6 w-6" />
            <span className="text-xs">Identify</span>
          </a>
        </Link>
        <Link href="/marketplace">
          <a className={`flex flex-col items-center p-2 ${location.startsWith("/marketplace") ? "text-primary" : "text-muted-foreground"}`}>
            <Leaf className="h-6 w-6" />
            <span className="text-xs">Swap</span>
          </a>
        </Link>
        <Link href="/chat">
          <a className={`flex flex-col items-center p-2 ${location === "/chat" ? "text-primary" : "text-muted-foreground"}`}>
            <MessageSquare className="h-6 w-6" />
            <span className="text-xs">Chat</span>
          </a>
        </Link>
        <Link href="/add">
          <a className={`flex flex-col items-center p-2 ${location === "/add" ? "text-primary" : "text-muted-foreground"}`}>
            <PlusCircle className="h-6 w-6" />
            <span className="text-xs">Add Plant</span>
          </a>
        </Link>
        <Link href="/rescue-missions">
          <a className={`flex flex-col items-center p-2 ${location === "/rescue-missions" ? "text-primary" : "text-muted-foreground"}`}>
            <Heart className="h-6 w-6" />
            <span className="text-xs">Rescue</span>
          </a>
        </Link>
        <Link href="/tutorial">
          <a className={`flex flex-col items-center p-2 ${location === "/tutorial" ? "text-primary" : "text-muted-foreground"}`}>
            <BookOpen className="h-6 w-6" />
            <span className="text-xs">Tutorial</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}