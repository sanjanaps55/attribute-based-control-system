import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SimpleProps = {
  children: ReactNode;
  className?: string;
};

export function MainContainer({ children, className }: SimpleProps) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function Section({ children, className }: SimpleProps) {
  return <section className={cn("py-32", className)}>{children}</section>;
}

export function EditorialGrid({ children, className }: SimpleProps) {
  return <div className={cn("grid gap-8 md:gap-12", className)}>{children}</div>;
}
