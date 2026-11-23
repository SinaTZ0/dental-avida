import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

import { Button } from "#/components/primitive/button/button";
import { Input } from "#/components/primitive/input/input";
import { Label } from "#/components/primitive/label/label";
import { Textarea } from "#/components/primitive/textarea/textarea";
import { formatNumber } from "#/lib/locale";
import { syncIframeReviewTheme } from "#/lib/theme";
import { normalizeReviewPath, REVIEW_MIN_BOX_SIZE, REVIEW_VIEWPORTS } from "#/orpc/review/constants";
import type { ReviewTheme, ReviewViewport } from "#/orpc/review/constants";
import type { ReviewFeedback } from "#/orpc/review/contract";
import { m } from "#/paraglide/messages";
import type { ReviewMode, ReviewZoomSetting } from "#/routes/review/components/review-toolbar";

/*===== Types =====*/
export type DraftBox = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

type KeyedDraftBox = DraftBox & { readonly scopeKey: string };

type ReviewStageProps = {
  readonly path: string;
  readonly viewport: ReviewViewport;
  readonly theme: ReviewTheme;
  readonly mode: ReviewMode;
  readonly zoomSetting: ReviewZoomSetting;
  readonly showBoxes: boolean;
  readonly reloadKey: number;
  readonly items: readonly ReviewFeedback[];
  readonly selectedId: string | null;
  readonly hoveredId: string | null;
  readonly isSubmitting: boolean;
  readonly submitError: string | null;
  readonly scrollToY: { readonly y: number; readonly seq: number } | null;
  readonly onSelect: (id: string | null) => void;
  readonly onHover: (id: string | null) => void;
  readonly onIframePathChange: (nextPath: string) => void;
  readonly onCreateFeedback: (args: {
    readonly box: DraftBox;
    readonly comment: string;
    readonly authorName: string;
  }) => Promise<boolean>;
};

const AUTHOR_STORAGE_KEY = "avida_review_author";
const MIN_STAGE_HEIGHT = 900;

/*===== Helpers =====*/
function readSavedAuthor(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(AUTHOR_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveAuthor(value: string) {
  try {
    window.localStorage.setItem(AUTHOR_STORAGE_KEY, value);
  } catch {
    // Ignore storage quota or private-mode failures.
  }
}

/*===== Stage =====*/
/**
 * Fixed-width same-origin `<iframe>` artboard (`1440px` desktop or `390px` mobile) with an overlay that renders all
 * feedback boxes at once and captures pointer drags in `draw` mode.
 */
export function ReviewStage({
  path,
  viewport,
  theme,
  mode,
  zoomSetting,
  showBoxes,
  reloadKey,
  items,
  selectedId,
  hoveredId,
  isSubmitting,
  submitError,
  scrollToY,
  onSelect,
  onHover,
  onIframePathChange,
  onCreateFeedback,
}: ReviewStageProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const iframeResizeObserverRef = useRef<ResizeObserver | null>(null);

  const [containerWidth, setContainerWidth] = useState(1200);
  const [docHeight, setDocHeight] = useState(MIN_STAGE_HEIGHT);

  /*------ Drag & Composer State ------*/
  const scopeKey = `${path}|${viewport}`;
  const dragOriginRef = useRef<{ readonly x: number; readonly y: number } | null>(null);
  const [drawingBoxState, setDrawingBoxState] = useState<KeyedDraftBox | null>(null);
  const [pendingBoxState, setPendingBoxState] = useState<KeyedDraftBox | null>(null);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState(() => readSavedAuthor());

  const drawingBox = drawingBoxState?.scopeKey === scopeKey ? drawingBoxState : null;
  const pendingBox = pendingBoxState?.scopeKey === scopeKey ? pendingBoxState : null;

  const viewportWidth = REVIEW_VIEWPORTS[viewport];
  const fitZoom = Math.min(1, Math.max(0.3, (containerWidth - 48) / viewportWidth));
  const zoom = zoomSetting === "fit" ? fitZoom : zoomSetting === "75" ? 0.75 : 1;

  /*------ Container Width Tracking ------*/
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const update = () => setContainerWidth(scroller.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  /*------ External Scroll-to-Box ------*/
  useEffect(() => {
    if (!scrollToY || !scrollerRef.current) return;
    const top = Math.max(0, scrollToY.y * zoom - 120);
    scrollerRef.current.scrollTo({ top, behavior: "smooth" });
  }, [scrollToY, zoom]);

  /*------ Escape Cancels Draft ------*/
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDrawingBoxState(null);
      setPendingBoxState(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /*------ Iframe Height & Same-Origin Route Sync ------*/
  const syncIframeState = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) return;

      const measured = Math.max(MIN_STAGE_HEIGHT, doc.documentElement?.scrollHeight ?? 0, doc.body?.scrollHeight ?? 0);
      setDocHeight(measured);

      const currentPath = normalizeReviewPath(win.location.pathname);
      if (currentPath && !currentPath.startsWith("/review") && currentPath !== path) {
        onIframePathChange(currentPath);
      }
    } catch {
      // Cross-origin access shouldn't occur for same-origin routes; ignore safely if it ever does.
    }
  }, [onIframePathChange, path]);

  const handleIframeLoad = useCallback(() => {
    syncIframeReviewTheme(iframeRef.current?.contentWindow ?? null, theme);
    syncIframeState();
    iframeResizeObserverRef.current?.disconnect();
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc?.documentElement) {
        const observer = new ResizeObserver(() => syncIframeState());
        observer.observe(doc.documentElement);
        if (doc.body) observer.observe(doc.body);
        iframeResizeObserverRef.current = observer;
      }
    } catch {
      // Ignore if document is unavailable.
    }
  }, [syncIframeState, theme]);

  /*------ Push Theme Changes Live Into Iframe ------*/
  useEffect(() => {
    syncIframeReviewTheme(iframeRef.current?.contentWindow ?? null, theme);
    syncIframeState();
  }, [syncIframeState, theme]);

  useEffect(() => {
    // Lightweight poll catches client-side TanStack Router pushState navigations inside the iframe.
    const pollTimer = window.setInterval(syncIframeState, 500);
    return () => {
      window.clearInterval(pollTimer);
      iframeResizeObserverRef.current?.disconnect();
    };
  }, [syncIframeState]);

  /*------ Pointer Drawing ------*/
  function toArtboardPoint(event: ReactPointerEvent<HTMLDivElement>): { x: number; y: number } {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = Math.round(Math.max(0, Math.min(viewportWidth, (event.clientX - rect.left) / zoom)));
    const y = Math.round(Math.max(0, Math.min(docHeight, (event.clientY - rect.top) / zoom)));
    return { x, y };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (mode !== "draw" || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("[data-review-composer]")) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const point = toArtboardPoint(event);
    dragOriginRef.current = point;
    setPendingBoxState(null);
    setDrawingBoxState({ scopeKey, x: point.x, y: point.y, width: 0, height: 0 });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = dragOriginRef.current;
    if (!origin) return;
    const current = toArtboardPoint(event);
    setDrawingBoxState({
      scopeKey,
      x: Math.min(origin.x, current.x),
      y: Math.min(origin.y, current.y),
      width: Math.abs(current.x - origin.x),
      height: Math.abs(current.y - origin.y),
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = dragOriginRef.current;
    if (!origin) return;
    dragOriginRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const current = toArtboardPoint(event);
    const box: KeyedDraftBox = {
      scopeKey,
      x: Math.min(origin.x, current.x),
      y: Math.min(origin.y, current.y),
      width: Math.abs(current.x - origin.x),
      height: Math.abs(current.y - origin.y),
    };
    setDrawingBoxState(null);

    if (box.width >= REVIEW_MIN_BOX_SIZE && box.height >= REVIEW_MIN_BOX_SIZE) {
      setPendingBoxState(box);
      setComment("");
    }
  }

  async function handleComposerSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingBox || !comment.trim()) return;
    saveAuthor(authorName.trim());
    const saved = await onCreateFeedback({ box: pendingBox, comment, authorName });
    if (saved) {
      setPendingBoxState(null);
      setComment("");
    }
  }

  /*------ Dynamic Layout Variables ------*/
  const outerVars = {
    "--stage-outer-w": `${Math.round(viewportWidth * zoom)}px`,
    "--stage-outer-h": `${Math.round(docHeight * zoom)}px`,
  } as CSSProperties;

  const innerVars = {
    "--stage-w": `${viewportWidth}px`,
    "--stage-h": `${docHeight}px`,
    "--stage-zoom": String(zoom),
  } as CSSProperties;

  const composerWidth = Math.min(340, viewportWidth - 24);
  const composerLeft = pendingBox ? Math.max(12, Math.min(viewportWidth - composerWidth - 12, pendingBox.x)) : 12;
  const composerTop = pendingBox ? pendingBox.y + pendingBox.height + 12 : 12;
  const composerVars = {
    "--composer-x": `${composerLeft}px`,
    "--composer-y": `${composerTop}px`,
    "--composer-w": `${composerWidth}px`,
  } as CSSProperties;

  return (
    <div ref={scrollerRef} className="relative flex-1 overflow-auto bg-muted/40 p-6">
      {mode === "draw" && (
        <div className="pointer-events-none sticky top-0 z-30 mx-auto mb-3 w-fit rounded-full bg-primary px-3.5 py-1 text-xs font-medium text-primary-foreground shadow-sm">
          {m.review_mode_draw_hint()}
        </div>
      )}

      {/*===== Scaled Artboard Wrapper =====*/}
      <div
        dir="ltr"
        className="relative mx-auto h-(--stage-outer-h) w-(--stage-outer-w) overflow-hidden bg-background shadow-md ring-1 ring-border"
        style={outerVars}
      >
        <div
          className="relative h-(--stage-h) w-(--stage-w) origin-top-left scale-(--stage-zoom)"
          dir="ltr"
          style={innerVars}
        >
          {/*------ Live Same-Origin Page ------*/}
          {/* oxlint-disable-next-line react/iframe-missing-sandbox -- embeds this app's own same-origin routes */}
          <iframe
            key={`${viewport}-${reloadKey}`}
            ref={iframeRef}
            src={path}
            onLoad={handleIframeLoad}
            title={m.review_brand_label()}
            className={
              mode === "draw"
                ? "pointer-events-none block size-full border-0 bg-background"
                : "pointer-events-auto block size-full border-0 bg-background"
            }
          />

          {/*------ Annotation Overlay ------*/}
          <div
            ref={overlayRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={
              mode === "draw"
                ? "absolute inset-0 z-20 cursor-crosshair touch-none select-none"
                : "pointer-events-none absolute inset-0 z-20"
            }
          >
            {/* Existing Feedback Boxes */}
            {showBoxes &&
              items.map((item, index) => {
                const isSelected = selectedId === item.id;
                const isHovered = hoveredId === item.id;
                const isResolved = item.status === "resolved";
                const borderColor = isResolved
                  ? "border-success bg-success/15 ring-2 ring-background/95 outline-1 outline-foreground/30 shadow-md"
                  : isSelected || isHovered
                    ? "border-destructive bg-destructive/15 ring-2 ring-background outline-2 outline-destructive/60 shadow-lg"
                    : "border-warning bg-warning/15 ring-2 ring-background/95 outline-1 outline-foreground/35 shadow-md hover:bg-warning/25";
                const badgeColor = isResolved
                  ? "bg-success text-primary-foreground ring-2 ring-background shadow-md"
                  : isSelected || isHovered
                    ? "bg-destructive text-primary-foreground ring-2 ring-background shadow-md"
                    : "bg-warning text-primary-foreground ring-2 ring-background shadow-md";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(item.id);
                    }}
                    onMouseEnter={() => onHover(item.id)}
                    onMouseLeave={() => onHover(null)}
                    className={`pointer-events-auto absolute top-(--box-y) left-(--box-x) h-(--box-h) w-(--box-w) rounded-xs border-2 text-start transition-colors ${borderColor}`}
                    style={
                      {
                        "--box-x": `${item.x}px`,
                        "--box-y": `${item.y}px`,
                        "--box-w": `${item.width}px`,
                        "--box-h": `${item.height}px`,
                      } as CSSProperties
                    }
                    aria-label={`${formatNumber(index + 1)} — ${item.comment}`}
                  >
                    <span
                      className={`absolute -top-3 -left-3 inline-flex size-6 items-center justify-center rounded-full text-xs font-bold shadow-xs ${badgeColor}`}
                    >
                      {formatNumber(index + 1)}
                    </span>
                  </button>
                );
              })}

            {/* Active Drag Preview */}
            {drawingBox && (
              <div
                className="pointer-events-none absolute top-(--box-y) left-(--box-x) h-(--box-h) w-(--box-w) rounded-xs border-2 border-dashed border-destructive bg-destructive/15 shadow-lg ring-2 ring-background/95"
                style={
                  {
                    "--box-x": `${drawingBox.x}px`,
                    "--box-y": `${drawingBox.y}px`,
                    "--box-w": `${drawingBox.width}px`,
                    "--box-h": `${drawingBox.height}px`,
                  } as CSSProperties
                }
              />
            )}

            {/* Pending Box + Inline RTL Comment Composer */}
            {pendingBox && (
              <>
                <div
                  className="pointer-events-none absolute top-(--box-y) left-(--box-x) h-(--box-h) w-(--box-w) rounded-xs border-2 border-destructive bg-destructive/15 shadow-lg ring-2 ring-background"
                  style={
                    {
                      "--box-x": `${pendingBox.x}px`,
                      "--box-y": `${pendingBox.y}px`,
                      "--box-w": `${pendingBox.width}px`,
                      "--box-h": `${pendingBox.height}px`,
                    } as CSSProperties
                  }
                />
                <div
                  data-review-composer
                  dir="rtl"
                  className="pointer-events-auto absolute top-(--composer-y) left-(--composer-x) z-30 w-(--composer-w) rounded-lg border bg-background p-4 text-start shadow-xl"
                  style={composerVars}
                >
                  <form onSubmit={handleComposerSubmit} className="grid gap-3">
                    <p className="text-sm font-semibold text-foreground">{m.review_composer_title()}</p>

                    <div className="grid gap-1.5">
                      <Label htmlFor="review-comment-input">{m.review_composer_comment_label()}</Label>
                      <Textarea
                        id="review-comment-input"
                        rows={3}
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder={m.review_composer_comment_placeholder()}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="review-author-input">{m.review_composer_author_label()}</Label>
                      <Input
                        id="review-author-input"
                        value={authorName}
                        onChange={(event) => setAuthorName(event.target.value)}
                        placeholder={m.review_composer_author_placeholder()}
                        disabled={isSubmitting}
                      />
                    </div>

                    {submitError && <p className="text-xs text-destructive">{submitError}</p>}

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingBoxState(null)}
                        disabled={isSubmitting}
                      >
                        {m.review_composer_cancel()}
                      </Button>
                      <Button type="submit" size="sm" disabled={isSubmitting || !comment.trim()}>
                        {m.review_composer_submit()}
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
