"use client";

import type { ComponentProps } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/lib/utils";

// Base UI's render prop preserves section/details semantics when composing a card.
export function Card({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    render,
    state: { slot: "card" },
    props: mergeProps<"div">(
      {
        className: cn(
          "panel min-w-0 rounded-[var(--radius)] border border-border bg-card text-card-foreground shadow-sm",
          className,
        ),
      },
      props,
    ),
  });
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="card-header" className={cn("flex flex-col gap-2 p-6", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-6 pt-0", className)} {...props} />;
}
