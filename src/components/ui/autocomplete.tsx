import { useState, ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { CardListSkeleton } from "@/components/common/skeleton-loading";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";

export interface AutocompleteOption {
  id: string;
  [key: string]: any;
}

interface AutocompleteProps<T extends AutocompleteOption> {
  options?: T[];
  value?: T | null;
  onSelect: (option: T) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  renderOption?: (option: T) => ReactNode;
  renderValue?: (option: T | null) => ReactNode;
  className?: string;
  popoverClassName?: string;
  skeletonCount?: number;
}

export function Autocomplete<T extends AutocompleteOption>({
  options = [],
  value,
  onSelect,
  onSearch,
  isLoading = false,
  disabled = false,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  noResultsText = "No results found",
  renderOption,
  renderValue,
  className = "",
  popoverClassName = "",
  skeletonCount = 3,
}: AutocompleteProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleSearch = (query: string) => {
    setSearch(query);
    onSearch?.(query);
  };

  const displayValue = value
    ? renderValue
      ? renderValue(value)
      : JSON.stringify(value)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <div
          className={cn(
            "w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm flex items-center justify-between cursor-pointer shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950",
            className
          )}
          role="combobox"
          aria-expanded={open}
        >
          <div className="flex-1 truncate">{displayValue}</div>
          <ChevronDownIcon className="h-4 w-4 ml-1 opacity-50 shrink-0" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0",
          popoverClassName
        )}
      >
        <div className="pt-1">
          <div className="flex items-center border-b border-gray-200 px-2">
            <MagnifyingGlassIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0"
            />
          </div>
          <ScrollArea className="h-56">
            <div className="overflow-hidden p-1">
              {isLoading && <CardListSkeleton count={skeletonCount} />}
              {!isLoading && options.length === 0 && (
                <div className="py-6 text-center text-sm">{noResultsText}</div>
              )}
              {!isLoading &&
                options.map((option) => (
                  <div
                    key={option.id}
                    className="relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 hover:text-gray-900"
                    onClick={() => {
                      onSelect(option);
                      setOpen(false);
                    }}
                  >
                    {renderOption
                      ? renderOption(option)
                      : JSON.stringify(option)}
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
