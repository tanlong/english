"use client";

// shadcn/ui Base UI composition, with this app's accessible touch sizes.
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "button inline-flex max-w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent text-center text-[14px] large-text:text-base leading-normal font-semibold whitespace-normal transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-blue-strong",
        outline: "border-border bg-card text-card-foreground hover:border-primary hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "bg-transparent text-foreground hover:bg-accent",
        destructive: "border-[#efc9c4] bg-[#fff1ef] text-destructive hover:bg-destructive/15",
        link: "bg-transparent px-0 text-blue-strong shadow-none hover:underline",
      },
      size: {
        default: "min-h-[46px] px-[18px] py-[12px]",
        sm: "min-h-11 px-3 py-2",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
