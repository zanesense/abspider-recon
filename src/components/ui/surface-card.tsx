import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SurfaceColor =
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "orange"
  | "violet"
  | "teal"
  | "slate"
  | "green"
  | "indigo"
  | "purple";

const GRADIENTS: Record<SurfaceColor, string> = {
  blue:    "from-blue-500/5 via-blue-500/10 to-cyan-500/5",
  emerald: "from-emerald-500/5 via-green-500/10 to-emerald-500/5",
  amber:   "from-amber-500/5 via-yellow-500/10 to-orange-500/5",
  rose:    "from-rose-500/5 via-red-500/10 to-pink-500/5",
  orange:  "from-orange-500/5 via-orange-500/10 to-amber-500/5",
  violet:  "from-violet-500/5 via-purple-500/10 to-indigo-500/5",
  teal:    "from-teal-500/5 via-cyan-500/10 to-blue-500/5",
  slate:   "from-slate-500/5 via-slate-500/10 to-slate-500/5",
  green:   "from-green-500/5 via-emerald-500/10 to-green-500/5",
  indigo:  "from-blue-500/5 via-indigo-500/10 to-blue-500/5",
  purple:  "from-indigo-500/5 via-purple-500/10 to-indigo-500/5",
};

const GLOWS: Record<SurfaceColor, string> = {
  blue:    "from-blue-500/10",
  emerald: "from-emerald-500/10",
  amber:   "from-amber-500/10",
  rose:    "from-rose-500/10",
  orange:  "from-orange-500/10",
  violet:  "from-violet-500/10",
  teal:    "from-teal-500/10",
  slate:   "from-slate-500/10",
  green:   "from-green-500/10",
  indigo:  "from-indigo-500/10",
  purple:  "from-indigo-500/10",
};

export interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: SurfaceColor;
  /** Adds cursor-pointer so the card reads as clickable. */
  interactive?: boolean;
}

export const SurfaceCard = React.forwardRef<HTMLDivElement, SurfaceCardProps>(
  ({ color = "blue", interactive, className, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "group relative overflow-hidden backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br",
          interactive && "cursor-pointer",
          GRADIENTS[color],
          className
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500",
            GLOWS[color]
          )}
        />
        <div className="relative z-10">{children}</div>
      </Card>
    );
  }
);
SurfaceCard.displayName = "SurfaceCard";
