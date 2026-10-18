import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";

// The group owns the border and focus ring, including the search icon.
export function SearchInput(props: ComponentProps<typeof Input> & { "aria-label": string }) {
  return (
    <label className="search-field flex min-h-[48px] min-w-0 max-w-[420px] flex-1 items-center gap-2 rounded-lg border border-input bg-card pl-3 text-muted-foreground transition-colors focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/50 max-[767px]:max-w-none max-[767px]:basis-full">
      <Search aria-hidden="true" size={20} />
      <Input
        {...props}
        className="flex-1 rounded-none border-0 bg-transparent pl-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
    </label>
  );
}
