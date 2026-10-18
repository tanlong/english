import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "tag inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1.5 text-[12px] leading-snug font-semibold tracking-wide",
  {
    variants: {
      variant: {
        default: "border-primary/15 bg-accent text-blue-strong",
        secondary: "border-border bg-muted text-muted-foreground",
        violet: "border-violet/15 bg-violet-soft text-violet",
        warning: "border-[#f0ddb1] bg-[#fff6df] text-[#886015]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
