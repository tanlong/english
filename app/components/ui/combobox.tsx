"use client";

// Single-selection parts adapted from shadcn/ui's Base UI Combobox.
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Combobox = ComboboxPrimitive.Root;

export function ComboboxInput({
  className,
  disabled,
  triggerLabel = "Mở danh sách",
  ...props
}: ComboboxPrimitive.Input.Props & { triggerLabel?: string }) {
  return (
    <div
      data-slot="combobox-control"
      data-disabled={disabled || undefined}
      className="app-combobox-control flex min-h-[48px] w-full min-w-0 items-center rounded-lg border border-input bg-card focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 data-disabled:opacity-50"
    >
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        disabled={disabled}
        className={cn(
          "min-h-11 w-full min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-normal text-foreground outline-none disabled:cursor-not-allowed large-text:text-base",
          className,
        )}
        {...props}
      />
      <ComboboxPrimitive.Trigger
        type="button"
        disabled={disabled}
        aria-label={triggerLabel}
        className="grid size-11 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
      >
        <ChevronDown aria-hidden="true" size={18} />
      </ComboboxPrimitive.Trigger>
    </div>
  );
}

export function ComboboxContent({
  className,
  container,
  positionMethod,
  ...props
}: ComboboxPrimitive.Popup.Props & {
  container?: ComboboxPrimitive.Portal.Props["container"];
  positionMethod?: ComboboxPrimitive.Positioner.Props["positionMethod"];
}) {
  return (
    <ComboboxPrimitive.Portal container={container}>
      <ComboboxPrimitive.Positioner
        sideOffset={4}
        align="start"
        positionMethod={positionMethod}
        className="isolate z-100 w-(--anchor-width) max-w-(--available-width)"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "app-combobox-popup max-h-(--available-height) overflow-hidden rounded-lg border border-input bg-popover text-popover-foreground shadow-lg",
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

export function ComboboxList(props: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className="max-h-[min(280px,calc(var(--available-height)-2px))] overflow-y-auto overscroll-contain p-1 data-empty:p-0"
      {...props}
    />
  );
}

export function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm outline-none data-highlighted:bg-accent data-highlighted:ring-2 data-highlighted:ring-ring data-highlighted:ring-inset data-selected:bg-accent",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator>
        <Check aria-hidden="true" size={16} className="text-primary" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

export function ComboboxEmpty(props: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      // Keep the live region mounted; an empty announcement must not add padding.
      className="p-3 text-sm text-muted-foreground empty:p-0"
      {...props}
    />
  );
}
