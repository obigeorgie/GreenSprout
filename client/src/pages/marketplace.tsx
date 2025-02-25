import { useQuery } from "@tanstack/react-query";
import { type SwapListing } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Plus } from "lucide-react";

export default function Marketplace() {
  const [, navigate] = useLocation();
  const { data: listings, isLoading } = useQuery<SwapListing[]>({
    queryKey: ["/api/swap-listings"],
  });

  if (isLoading) {
    return (
      <div className="py-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Plant Swap Marketplace</h1>
        <Button onClick={() => navigate("/marketplace/new")}>
          <Plus className="h-4 w-4 mr-2" />
          List Plant for Swap
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {listings?.map((listing) => (
          <Card
            key={listing.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/marketplace/${listing.id}`)}
          >
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">{listing.title}</h3>
              <p className="text-muted-foreground mb-4 line-clamp-2">
                {listing.description}
              </p>
              <div className="text-sm">
                <p>
                  <strong>Location:</strong> {listing.location}
                </p>
                <p>
                  <strong>Looking for:</strong> {listing.swapPreferences}
                </p>
                <p className="mt-2 text-primary font-medium">
                  Status: {listing.status}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {listings?.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No plant swap listings yet. Be the first to list a plant!
          </div>
        )}
      </div>
    </div>
  );
}
