import { Link, useLocation } from "wouter";
import { Home, PlusCircle } from "lucide-react";

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
        <Link href="/add">
          <a className={`flex flex-col items-center p-2 ${location === "/add" ? "text-primary" : "text-muted-foreground"}`}>
            <PlusCircle className="h-6 w-6" />
            <span className="text-xs">Add Plant</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
