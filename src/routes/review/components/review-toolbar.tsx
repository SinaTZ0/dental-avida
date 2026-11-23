import { useState } from "react";

import {
  EyeIcon,
  EyeOffIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  MousePointerClickIcon,
  RefreshCwIcon,
  SmartphoneIcon,
  SquareDashedMousePointerIcon,
  SunIcon,
  ZapIcon,
} from "lucide-react";

import { Button } from "#/components/primitive/button/button";
import { Input } from "#/components/primitive/input/input";
import { Separator } from "#/components/primitive/separator/separator";
import { normalizeReviewPath } from "#/orpc/review/constants";
import type { ReviewTheme, ReviewViewport } from "#/orpc/review/constants";
import { m } from "#/paraglide/messages";

/*===== Types =====*/
export type ReviewMode = "browse" | "draw";
export type ReviewZoomSetting = "fit" | "100" | "75";

type ReviewToolbarProps = {
  readonly path: string;
  readonly viewport: ReviewViewport;
  readonly theme: ReviewTheme;
  readonly mode: ReviewMode;
  readonly zoom: ReviewZoomSetting;
  readonly showBoxes: boolean;
  readonly hasCookie: boolean;
  readonly isExiting: boolean;
  readonly onPathChange: (nextPath: string) => void;
  readonly onViewportChange: (nextViewport: ReviewViewport) => void;
  readonly onThemeChange: (nextTheme: ReviewTheme) => void;
  readonly onModeChange: (nextMode: ReviewMode) => void;
  readonly onZoomChange: (nextZoom: ReviewZoomSetting) => void;
  readonly onToggleBoxes: () => void;
  readonly onReloadFrame: () => void;
  readonly onExit: () => void;
};

/*===== Toolbar =====*/
/** Full-width studio command band above the artboard and feedback ledger. */
export function ReviewToolbar({
  path,
  viewport,
  theme,
  mode,
  zoom,
  showBoxes,
  hasCookie,
  isExiting,
  onPathChange,
  onViewportChange,
  onThemeChange,
  onModeChange,
  onZoomChange,
  onToggleBoxes,
  onReloadFrame,
  onExit,
}: ReviewToolbarProps) {
  const [draft, setDraft] = useState<{ readonly basePath: string; readonly value: string }>({
    basePath: path,
    value: path,
  });
  const pathDraft = draft.basePath === path ? draft.value : path;

  function handlePathSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeReviewPath(pathDraft);
    if (!normalized || normalized.startsWith("/review")) {
      setDraft({ basePath: path, value: path });
      return;
    }
    onPathChange(normalized);
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b bg-background px-3 py-2">
      {/*===== Brand & Route Input =====*/}
      <div className="flex min-w-80 flex-1 items-center gap-2.5">
        <span className="shrink-0 text-sm font-semibold tracking-tight text-foreground">{m.review_brand_label()}</span>
        <Separator orientation="vertical" className="h-5 shrink-0" />
        <form onSubmit={handlePathSubmit} className="flex min-w-0 flex-1 items-center gap-1.5 sm:max-w-72">
          <Input
            dir="ltr"
            value={pathDraft}
            onChange={(event) => setDraft({ basePath: path, value: event.target.value })}
            placeholder={m.review_path_placeholder()}
            aria-label={m.review_path_placeholder()}
            className="min-w-32"
          />
          <Button type="submit" variant="outline" size="xs">
            {m.review_path_go()}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onReloadFrame}
            aria-label={m.review_reload_frame()}
            title={m.review_reload_frame()}
          >
            <RefreshCwIcon className="size-3.5" />
          </Button>
        </form>
      </div>

      {/*===== Controls =====*/}
      <div className="flex flex-wrap items-center gap-1.5">
        {/*------ Mode ------*/}
        <div className="flex items-center gap-1 rounded-md border border-border bg-muted/50 p-1">
          <Button
            type="button"
            variant={mode === "browse" ? "default" : "ghost"}
            size="xs"
            aria-pressed={mode === "browse"}
            onClick={() => onModeChange("browse")}
          >
            <MousePointerClickIcon className="size-3.5" />
            <span>{m.review_mode_browse()}</span>
          </Button>
          <Button
            type="button"
            variant={mode === "draw" ? "default" : "ghost"}
            size="xs"
            aria-pressed={mode === "draw"}
            onClick={() => onModeChange("draw")}
            title={m.review_mode_draw_hint()}
          >
            <SquareDashedMousePointerIcon className="size-3.5" />
            <span>{m.review_mode_draw()}</span>
          </Button>
        </div>

        {/*------ Theme & Style Switcher ------*/}
        <fieldset
          aria-label={m.review_theme_group_label()}
          className="flex items-center gap-1 rounded-md border border-border bg-muted/50 p-1"
        >
          <Button
            type="button"
            variant={theme === "light" ? "default" : "ghost"}
            size="xs"
            aria-pressed={theme === "light"}
            onClick={() => onThemeChange("light")}
            title={m.review_theme_light_hint()}
          >
            <SunIcon className="size-3.5" />
            <span className="sr-only sm:not-sr-only">{m.review_theme_light()}</span>
          </Button>
          <Button
            type="button"
            variant={theme === "dark" ? "default" : "ghost"}
            size="xs"
            aria-pressed={theme === "dark"}
            onClick={() => onThemeChange("dark")}
            title={m.review_theme_dark_hint()}
          >
            <MoonIcon className="size-3.5" />
            <span className="sr-only sm:not-sr-only">{m.review_theme_dark()}</span>
          </Button>
          <Button
            type="button"
            variant={theme === "black-friday" ? "default" : "ghost"}
            size="xs"
            aria-pressed={theme === "black-friday"}
            onClick={() => onThemeChange("black-friday")}
            title={m.review_theme_black_friday_hint()}
          >
            <ZapIcon className="size-3.5" />
            <span>{m.review_theme_black_friday()}</span>
          </Button>
        </fieldset>

        {/*------ Viewport Preset ------*/}
        <div className="flex items-center gap-1 rounded-md border border-border bg-muted/50 p-1">
          <Button
            type="button"
            variant={viewport === "desktop" ? "default" : "ghost"}
            size="xs"
            aria-pressed={viewport === "desktop"}
            onClick={() => onViewportChange("desktop")}
            title={m.review_viewport_desktop()}
          >
            <MonitorIcon className="size-3.5" />
            <span className="sr-only 2xl:not-sr-only">{m.review_viewport_desktop()}</span>
          </Button>
          <Button
            type="button"
            variant={viewport === "mobile" ? "default" : "ghost"}
            size="xs"
            aria-pressed={viewport === "mobile"}
            onClick={() => onViewportChange("mobile")}
            title={m.review_viewport_mobile()}
          >
            <SmartphoneIcon className="size-3.5" />
            <span className="sr-only 2xl:not-sr-only">{m.review_viewport_mobile()}</span>
          </Button>
        </div>

        {/*------ Zoom ------*/}
        <div className="hidden items-center gap-0.5 rounded-md border border-border bg-muted/50 p-1 md:flex">
          <Button
            type="button"
            variant={zoom === "fit" ? "default" : "ghost"}
            size="xs"
            aria-pressed={zoom === "fit"}
            onClick={() => onZoomChange("fit")}
          >
            {m.review_zoom_fit()}
          </Button>
          <Button
            type="button"
            variant={zoom === "100" ? "default" : "ghost"}
            size="xs"
            aria-pressed={zoom === "100"}
            onClick={() => onZoomChange("100")}
          >
            {m.review_zoom_100()}
          </Button>
          <Button
            type="button"
            variant={zoom === "75" ? "default" : "ghost"}
            size="xs"
            aria-pressed={zoom === "75"}
            onClick={() => onZoomChange("75")}
          >
            {m.review_zoom_75()}
          </Button>
        </div>

        {/*------ Visibility & Exit ------*/}
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={onToggleBoxes}
          aria-label={showBoxes ? m.review_boxes_hide() : m.review_boxes_show()}
          title={showBoxes ? m.review_boxes_hide() : m.review_boxes_show()}
        >
          {showBoxes ? <EyeIcon className="size-3.5" /> : <EyeOffIcon className="size-3.5" />}
        </Button>

        {hasCookie && (
          <Button type="button" variant="ghost" size="xs" onClick={onExit} disabled={isExiting}>
            <LogOutIcon className="size-3.5" />
            <span className="hidden 2xl:inline">{m.review_exit()}</span>
          </Button>
        )}
      </div>
    </header>
  );
}
