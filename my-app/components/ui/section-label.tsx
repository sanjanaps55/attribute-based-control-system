import { cn } from "@/lib/utils";

type SectionLabelProps = {
  children: string;
  className?: string;
};

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="h-px flex-1 bg-border" />
      <span className="small-caps-label">{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
