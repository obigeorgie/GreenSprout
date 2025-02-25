import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type PlantSpecies } from "@shared/schema";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlantSpeciesSearchProps {
  onSelect: (species: PlantSpecies) => void;
}

export default function PlantSpeciesSearch({ onSelect }: PlantSpeciesSearchProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const { data: species } = useQuery<PlantSpecies[]>({
    queryKey: ["/api/plant-species"],
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? species?.find((s) => s.scientificName === value)?.commonName
            : "Select a plant species..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search plant species..." />
          <CommandEmpty>No plant species found.</CommandEmpty>
          <CommandGroup>
            {species?.map((s) => (
              <CommandItem
                key={s.id}
                value={s.scientificName}
                onSelect={(currentValue) => {
                  setValue(currentValue);
                  setOpen(false);
                  onSelect(s);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === s.scientificName ? "opacity-100" : "opacity-0"
                  )}
                />
                <div>
                  <p className="font-medium">{s.commonName}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.scientificName}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
