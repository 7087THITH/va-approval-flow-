import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status badges for workflow
        draft: "border-info-border bg-info-light text-info",
        pending: "border-warning-border bg-warning-light text-warning-foreground",
        approved: "border-success-border bg-success-light text-success",
        rejected: "border-destructive-border bg-destructive-light text-destructive",
        revision: "border-purple-200 bg-purple-50 text-purple-700",
        // Confidentiality badges
        secret: "border-red-300 bg-red-100 text-red-800 font-bold",
        confidential: "border-amber-300 bg-amber-100 text-amber-800",
        internal: "border-blue-200 bg-blue-50 text-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
