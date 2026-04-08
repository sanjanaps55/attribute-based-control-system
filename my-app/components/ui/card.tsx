import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "standard" | "elevated" | "featured";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

const variantClasses: Record<CardVariant, string> = {
  standard: "bg-background border border-border",
  elevated: "bg-background border border-border shadow-sm hover:shadow-md",
  featured: "bg-background border border-border border-t-2 border-t-accent",
};

export function Card({ className, variant = "standard", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "p-6 hover:-translate-y-0.5 hover:border-accent/45",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
