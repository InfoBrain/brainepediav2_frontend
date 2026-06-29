import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  illustration?: React.ReactNode;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  illustration,
}: EmptyStateProps) {
  return (
    <Empty
      className={cn(
        "rounded-2xl border border-dashed border-white/10 bg-[#0d1119]/60 px-6 py-12",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <EmptyHeader>
        <EmptyMedia variant="icon" className="border border-white/10 bg-white/5 text-primary">
          {illustration ?? <Icon className="h-6 w-6" aria-hidden="true" />}
        </EmptyMedia>
        <EmptyTitle className="text-xl font-bold text-foreground">{title}</EmptyTitle>
        <EmptyDescription className="max-w-md text-muted-foreground">{description}</EmptyDescription>
      </EmptyHeader>
      {(actionLabel || secondaryActionLabel) && (
        <EmptyContent>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {actionLabel && (onAction || actionHref) && (
              actionHref ? (
                <Button asChild>
                  <a href={actionHref}>{actionLabel}</a>
                </Button>
              ) : (
                <Button onClick={onAction}>{actionLabel}</Button>
              )
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <Button variant="outline" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        </EmptyContent>
      )}
    </Empty>
  );
}
