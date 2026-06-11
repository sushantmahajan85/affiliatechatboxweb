"use client";

import { CountryFlag } from "@/components/country-flag";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/components/ui/utils";
import { Check, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { getCountryCallingCode } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";

type CountryOption = {
  value?: string;
  label?: string;
  divider?: boolean;
};

type PhoneCountrySelectProps = {
  value?: Country;
  onChange: (country?: Country) => void;
  options: CountryOption[];
  disabled?: boolean;
  readOnly?: boolean;
  onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
  iconComponent?: React.ComponentType<{
    country: Country;
    label?: string;
    "aria-hidden"?: boolean;
  }>;
};

const POPULAR_COUNTRIES = ["BD", "IN", "US", "GB", "AE", "SA", "PK", "SG", "MY"];

export function PhoneCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  onFocus,
  onBlur,
}: PhoneCountrySelectProps) {
  const [open, setOpen] = useState(false);

  const countries = useMemo(
    () => options.filter((o) => !o.divider && o.value && o.value !== "ZZ"),
    [options]
  );

  const selected = countries.find((o) => o.value === value);
  const isDisabled = disabled || readOnly;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      onFocus?.({} as React.FocusEvent<HTMLElement>);
    } else {
      onBlur?.({} as React.FocusEvent<HTMLElement>);
    }
  };

  const handleSelect = (country: string) => {
    onChange(country as Country);
    setOpen(false);
  };

  const renderFlag = (iso: string, size = 18) => (
    <CountryFlag flag={iso} size={size} className="rounded-[3px] overflow-hidden shrink-0" />
  );

  const renderItem = (option: CountryOption) => {
    const iso = option.value!;
    const code = `+${getCountryCallingCode(iso as Country)}`;

    return (
      <CommandItem
        key={iso}
        value={`${option.label} ${iso} ${code}`}
        onSelect={() => handleSelect(iso)}
        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 aria-selected:bg-[#0A7EA4]/8"
      >
        {renderFlag(iso)}
        <span className="min-w-0 flex-1 truncate text-sm text-[#1A1A2E]">{option.label}</span>
        <span className="text-xs font-semibold text-[#64748B]">{code}</span>
        {value === iso ? <Check className="h-4 w-4 shrink-0 text-[#0A7EA4]" /> : <span className="w-4" />}
      </CommandItem>
    );
  };

  const popular = countries.filter((o) => POPULAR_COUNTRIES.includes(o.value!));
  const popularSet = new Set(POPULAR_COUNTRIES);
  const rest = countries.filter((o) => !popularSet.has(o.value!));

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isDisabled}
          aria-label={
            value
              ? `Select country, current: ${selected?.label ?? value}`
              : "Select country"
          }
          className={cn(
            "flex h-12 w-[72px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-2 shadow-sm",
            "transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC]",
            "focus:border-[#0A7EA4] focus:outline-none focus:ring-2 focus:ring-[#0A7EA4]/20",
            isDisabled && "cursor-not-allowed opacity-50"
          )}
        >
          {value ? renderFlag(value, 22) : (
            <span className="text-xs font-medium text-[#94A3B8]">--</span>
          )}
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 text-[#94A3B8] transition-transform", open && "rotate-180")}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="z-[100] w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-0 shadow-2xl"
      >
        <Command
          filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
        >
          <CommandInput
            placeholder="Search country or code..."
            className="h-11 border-none text-sm"
          />
          <CommandList className="max-h-[min(320px,50vh)]">
            <CommandEmpty className="py-8 text-sm text-[#64748B]">No country found.</CommandEmpty>
            {popular.length > 0 ? (
              <CommandGroup
                heading="Popular"
                className="px-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[#94A3B8]"
              >
                {popular.map(renderItem)}
              </CommandGroup>
            ) : null}
            <CommandGroup
              heading="All countries"
              className="px-2 pb-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[#94A3B8]"
            >
              {rest.map(renderItem)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
