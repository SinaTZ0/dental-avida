import { useCallback, useEffect, useState } from "react";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { buttonVariants } from "#/components/primitive/button/button.styles";
import { toast } from "#/components/primitive/toast/toast";
import { PageMessage } from "#/components/shared/page-message/page-message";
import { describeApiFailure } from "#/lib/api-error";
import { pageMeta } from "#/lib/seo";
import { applyReviewStudioTheme, clearReviewStudioTheme, subscribeToReviewIframeThemeToggle } from "#/lib/theme";
import { orpc } from "#/orpc/client";
import type { ReviewStatus, ReviewStatusFilter, ReviewTheme, ReviewViewport } from "#/orpc/review/constants";
import type { ReviewFeedback } from "#/orpc/review/contract";
import { m } from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";
import { ReviewSidebar } from "#/routes/review/components/review-sidebar";
import { ReviewStage } from "#/routes/review/components/review-stage";
import type { DraftBox } from "#/routes/review/components/review-stage";
import { ReviewToolbar } from "#/routes/review/components/review-toolbar";
import type { ReviewMode, ReviewZoomSetting } from "#/routes/review/components/review-toolbar";
import { reviewSearchSchema } from "#/routes/review/schema";

/*===== Route =====*/
export const Route = createFileRoute("/review")({
  validateSearch: reviewSearchSchema,
  loaderDeps: ({ search }) => ({
    pathname: search.path ?? "/",
    viewport: search.viewport ?? "desktop",
    status: search.status ?? "open",
  }),
  beforeLoad: async ({ context }) => {
    const access = await context.queryClient.ensureQueryData(orpc.review.access.queryOptions({ staleTime: 0 }));
    return { access };
  },
  loader: async ({ context, deps }) => {
    if (!context.access.allowed) return;
    await Promise.all([
      context.queryClient.ensureQueryData(orpc.review.list.queryOptions({ input: deps })),
      context.queryClient.ensureQueryData(orpc.campaign.public.queryOptions({ staleTime: 60_000 })),
    ]);
  },
  head: (args) =>
    pageMeta({
      args,
      title: m.review_meta_title(),
      description: m.review_meta_description(),
      index: false,
    }),
  component: ReviewPage,
});

/*===== Page =====*/
function ReviewPage() {
  const { access } = Route.useRouteContext();
  if (!access.allowed) {
    return (
      <main>
        <PageMessage title={m.review_unauthorized_title()} details={m.review_unauthorized_details()}>
          <a href={localizeHref("/")} className={buttonVariants({ size: "lg" })}>
            {m.review_go_home()}
          </a>
        </PageMessage>
      </main>
    );
  }
  return <ReviewStudio hasCookie={access.hasCookie} />;
}

/*===== Studio =====*/
function ReviewStudio({ hasCookie }: { readonly hasCookie: boolean }) {
  const search = Route.useSearch();
  const path = search.path ?? "/";
  const viewport = search.viewport ?? "desktop";
  const status = search.status ?? "open";
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const { data: campaign } = useSuspenseQuery(orpc.campaign.public.queryOptions({ staleTime: 60_000 }));
  const { data } = useSuspenseQuery(
    orpc.review.list.queryOptions({
      input: { pathname: path, viewport, status },
    }),
  );

  const activeTheme: ReviewTheme = search.theme ?? (campaign.themeActive ? "black-friday" : "light");

  const [mode, setMode] = useState<ReviewMode>("browse");
  const [zoom, setZoom] = useState<ReviewZoomSetting>("fit");
  const [showBoxes, setShowBoxes] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [scrollToY, setScrollToY] = useState<{ readonly y: number; readonly seq: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: orpc.review.key() });

  /*------ Mutations ------*/
  const createMutation = useMutation(orpc.review.create.mutationOptions());
  const statusMutation = useMutation(orpc.review.setStatus.mutationOptions());
  const deleteMutation = useMutation(orpc.review.delete.mutationOptions());

  /*------ Navigation Helpers ------*/
  const updateSearch = useCallback(
    (patch: Partial<{ path: string; viewport: ReviewViewport; status: ReviewStatusFilter; theme: ReviewTheme }>) => {
      void navigate({
        search: (prev) => ({ ...prev, ...patch }),
        replace: true,
      });
    },
    [navigate],
  );

  /*------ Sync Studio & Embedded Site Theme ------*/
  useEffect(() => {
    applyReviewStudioTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => () => clearReviewStudioTheme(), []);

  useEffect(
    () =>
      subscribeToReviewIframeThemeToggle((nextTheme) => {
        updateSearch({ theme: nextTheme });
      }),
    [updateSearch],
  );

  /*------ Keyboard Shortcut (`C` toggles Draw mode) ------*/
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key.toLowerCase() === "c") {
        setMode((current) => (current === "draw" ? "browse" : "draw"));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handlePathChange = useCallback(
    (nextPath: string) => {
      setSelectedId(null);
      updateSearch({ path: nextPath });
    },
    [updateSearch],
  );

  /*------ Actions ------*/
  async function handleCreateFeedback({
    box,
    comment,
    authorName,
  }: {
    readonly box: DraftBox;
    readonly comment: string;
    readonly authorName: string;
  }): Promise<boolean> {
    setSubmitError(null);
    try {
      const created = await createMutation.mutateAsync({
        pathname: path,
        viewport,
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        comment,
        authorName: authorName || undefined,
      });
      await refresh();
      setSelectedId(created.id);
      setMode("browse");
      return true;
    } catch (error) {
      const failure = describeApiFailure({ error, fallback: m.review_save_failed() });
      setSubmitError(failure.fields.comment ?? failure.message);
      return false;
    }
  }

  async function handleToggleStatus({
    id,
    status: nextStatus,
  }: {
    readonly id: string;
    readonly status: ReviewStatus;
  }) {
    setBusyId(id);
    try {
      await statusMutation.mutateAsync({ id, status: nextStatus });
      await refresh();
    } catch (error) {
      toast.add({
        title: describeApiFailure({ error, fallback: m.review_update_failed() }).message ?? m.review_update_failed(),
        type: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteMutation.mutateAsync({ id });
      if (selectedId === id) setSelectedId(null);
      await refresh();
    } catch (error) {
      toast.add({
        title: describeApiFailure({ error, fallback: m.review_delete_failed() }).message ?? m.review_delete_failed(),
        type: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  function handleSelectSidebarItem(item: ReviewFeedback) {
    setSelectedId(item.id);
    setScrollToY((prev) => ({ y: item.y, seq: (prev?.seq ?? 0) + 1 }));
  }

  async function handleExit() {
    setIsExiting(true);
    try {
      await fetch("/review/exit", { method: "POST" });
      window.location.assign(localizeHref("/"));
    } finally {
      setIsExiting(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <ReviewToolbar
        path={path}
        viewport={viewport}
        theme={activeTheme}
        mode={mode}
        zoom={zoom}
        showBoxes={showBoxes}
        hasCookie={hasCookie}
        isExiting={isExiting}
        onPathChange={handlePathChange}
        onViewportChange={(nextViewport) => updateSearch({ viewport: nextViewport })}
        onThemeChange={(nextTheme) => updateSearch({ theme: nextTheme })}
        onModeChange={setMode}
        onZoomChange={setZoom}
        onToggleBoxes={() => setShowBoxes((current) => !current)}
        onReloadFrame={() => setReloadKey((current) => current + 1)}
        onExit={handleExit}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ReviewStage
          path={path}
          viewport={viewport}
          theme={activeTheme}
          mode={mode}
          zoomSetting={zoom}
          showBoxes={showBoxes}
          reloadKey={reloadKey}
          items={data.items}
          selectedId={selectedId}
          hoveredId={hoveredId}
          isSubmitting={createMutation.isPending}
          submitError={submitError}
          scrollToY={scrollToY}
          onSelect={setSelectedId}
          onHover={setHoveredId}
          onIframePathChange={handlePathChange}
          onCreateFeedback={handleCreateFeedback}
        />

        <ReviewSidebar
          path={path}
          statusFilter={status}
          items={data.items}
          pathSummary={data.pathSummary}
          selectedId={selectedId}
          hoveredId={hoveredId}
          busyId={busyId}
          onStatusFilterChange={(nextStatus) => updateSearch({ status: nextStatus })}
          onPathSelect={handlePathChange}
          onSelectItem={handleSelectSidebarItem}
          onHoverItem={setHoveredId}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
