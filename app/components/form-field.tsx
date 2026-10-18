import type { ReactNode } from "react";
import { Label } from "@/app/components/ui/label";
import { cn } from "@/lib/utils";

export function FormField({
  id,
  label,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("field mb-5 flex min-w-0 flex-col gap-2 text-[14px] font-semibold", className)}
    >
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && (
        <p
          id={`${id}-hint`}
          className="text-xs leading-relaxed font-normal text-muted-foreground italic"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
