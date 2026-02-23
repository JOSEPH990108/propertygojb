"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { sortedCountries } from "@/lib/countries";

interface CountrySelectProps {
  value: string; // ISO code, e.g. "MY"
  onChange: (value: string) => void;
  className?: string;
}

export function CountrySelect({ value, onChange, className }: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);

  const selected =
    sortedCountries.find((c) => c.value === value) ??
    sortedCountries.find((c) => c.value === "MY");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[120px] justify-between px-3", className)}
        >
          <span className="flex items-center gap-2 truncate">
            {selected && (
              <Image
                src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${selected.value}.svg`}
                alt={selected.label}
                width={20}
                height={14}
                className="w-5 h-3.5 rounded-[2px] object-cover"
              />
            )}
            <span className="text-muted-foreground">
              {selected?.code}
            </span>
          </span>
          <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0" align="start" data-lenis-prevent>
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList data-lenis-prevent className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {sortedCountries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.label}
                  onSelect={() => {
                    onChange(country.value);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3"
                >
                  <Image
                    src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country.value}.svg`}
                    alt={country.label}
                    width={20}
                    height={14}
                    className="w-5 h-3.5 rounded-[2px] object-cover"
                  />
                  <span className="flex-1 truncate">
                    {country.label}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {country.code}
                  </span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === country.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
