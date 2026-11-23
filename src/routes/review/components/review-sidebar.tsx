import { CheckCircle2Icon, MessageSquareDashedIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";

import { Badge } from "#/components/primitive/badge/badge";
import { Button } from "#/components/primitive/button/button";
import { formatDate, formatNumber } from "#/lib/locale";
import type { ReviewStatus, ReviewStatusFilter } from "#/orpc/review/constants";
import type { ReviewFeedback, ReviewPathSummary } from "#/orpc/review/contract";
import { m } from "#/paraglide/messages";

/*===== Types =====*/
type ReviewSidebarProps = {
  readonly path: string;
  readonly statusFilter: ReviewStatusFilter;
  readonly items: readonly ReviewFeedback[];
  readonly pathSummary: readonly ReviewPathSummary[];
  readonly selectedId: string | null;
  readonly hoveredId: string | null;
  readonly busyId: string | null;
  readonly onStatusFilterChange: (next: ReviewStatusFilter) => void;
  readonly onPathSelect: (nextPath: string) => void;
  readonly onSelectItem: (item: ReviewFeedback) => void;
  readonly onHoverItem: (id: string | null) => void;
  readonly onToggleStatus: (args: { readonly id: string; readonly status: ReviewStatus }) => void;
  readonly onDelete: (id: string) => void;
};

/*===== Sidebar =====*/
/**
 * Integrated feedback ledger beside the artboard: cross-page counts strip, open/resolved filter tabs, and a hairline-
 * ruled list of comments synchronized with the overlay boxes.
 */
export function ReviewSidebar({
  path,
  statusFilter,
  items,
  pathSummary,
  selectedId,
  hoveredId,
  busyId,
  onStatusFilterChange,
  onPathSelect,
  onSelectItem,
  onHoverItem,
  onToggleStatus,
  onDelete,
}: ReviewSidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-t bg-background lg:w-88 lg:border-s lg:border-t-0">
      {/*===== Header & Filter =====*/}
      <div className="grid gap-3 border-b px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-semibold text-foreground">{m.review_sidebar_title()}</h1>
          <Badge variant="secondary">{formatNumber(items.length)}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-md border border-border bg-muted/50 p-1">
          {(
            [
              ["open", m.review_filter_open()],
              ["resolved", m.review_filter_resolved()],
              ["all", m.review_filter_all()],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={statusFilter === value ? "default" : "ghost"}
              size="xs"
              aria-pressed={statusFilter === value}
              onClick={() => onStatusFilterChange(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/*===== Other Pages With Feedback =====*/}
      {pathSummary.length > 0 && (
        <div className="border-b px-4 py-2.5">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">{m.review_sidebar_pages_label()}</p>
          <div className="flex flex-wrap gap-1.5">
            {pathSummary.map((entry) => {
              const isCurrent = entry.pathname === path;
              return (
                <button
                  key={entry.pathname}
                  type="button"
                  onClick={() => onPathSelect(entry.pathname)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs transition-colors ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  <span dir="ltr">{entry.pathname}</span>
                  <span>({formatNumber(entry.open)})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/*===== Feedback Ledger =====*/}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-muted-foreground">
            <MessageSquareDashedIcon className="size-7 opacity-70" />
            <p className="text-sm font-medium text-foreground">
              {statusFilter === "resolved" ? m.review_empty_resolved() : m.review_empty_title()}
            </p>
            {statusFilter !== "resolved" && <p className="text-xs leading-relaxed">{m.review_empty_body()}</p>}
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {items.map((item, index) => {
              const isSelected = selectedId === item.id;
              const isHovered = hoveredId === item.id;
              const isResolved = item.status === "resolved";
              const isBusy = busyId === item.id;

              return (
                <li
                  key={item.id}
                  className={`transition-colors ${
                    isSelected ? "bg-primary/8" : isHovered ? "bg-muted/50" : "bg-transparent"
                  }`}
                >
                  <div className="grid gap-2.5 px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => onSelectItem(item)}
                      onMouseEnter={() => onHoverItem(item.id)}
                      onMouseLeave={() => onHoverItem(null)}
                      className="grid gap-1.5 text-start"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isResolved
                                ? "bg-success text-primary-foreground"
                                : isSelected
                                  ? "bg-destructive text-primary-foreground"
                                  : "bg-warning text-primary-foreground"
                            }`}
                          >
                            {formatNumber(index + 1)}
                          </span>
                          <span className="text-xs font-medium text-foreground">
                            {item.authorName || m.review_anonymous_author()}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt, { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{item.comment}</p>
                    </button>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <Badge variant={isResolved ? "secondary" : "outline"}>
                        {isResolved ? m.review_status_resolved() : m.review_status_open()}
                      </Badge>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          disabled={isBusy}
                          onClick={() => onToggleStatus({ id: item.id, status: isResolved ? "open" : "resolved" })}
                        >
                          {isResolved ? (
                            <>
                              <RotateCcwIcon className="size-3.5" />
                              <span>{m.review_action_reopen()}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2Icon className="size-3.5" />
                              <span>{m.review_action_resolve()}</span>
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={isBusy}
                          onClick={() => onDelete(item.id)}
                          aria-label={m.review_action_delete()}
                          title={m.review_action_delete()}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}
