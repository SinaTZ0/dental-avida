import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";

import { normalizeReviewPath, REVIEW_VIEWPORTS } from "#/orpc/review/constants";
import type { ReviewStatus, ReviewStatusFilter, ReviewViewport } from "#/orpc/review/constants";
import type { ReviewFeedback, ReviewPathSummary } from "#/orpc/review/contract";
import { ReviewFeedbackNotFound } from "#/orpc/review/errors";
import { ReviewRepo } from "#/orpc/review/repository";
import type { ReviewFeedbackRecord } from "#/orpc/review/repository";
import { CreateReviewFeedbackFields } from "#/orpc/review/validation";
import { decodeInput } from "#/server/errors";
import type { InvalidInput } from "#/server/errors";

/*===== IDs =====*/
const isFeedbackId = Schema.is(Schema.String.check(Schema.isUUID()));

/*===== Mapping =====*/
function toPublicFeedback(row: ReviewFeedbackRecord): ReviewFeedback {
  return {
    id: row.id,
    pathname: row.pathname,
    viewport: row.viewport as ReviewViewport,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    comment: row.comment,
    authorName: row.authorName,
    status: row.status as ReviewStatus,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
  };
}

/*===== Review Service =====*/
export class ReviewService extends Context.Service<
  ReviewService,
  {
    readonly list: (args: {
      pathname?: string;
      viewport?: ReviewViewport;
      status?: ReviewStatusFilter;
    }) => Effect.Effect<{ items: ReviewFeedback[]; pathSummary: ReviewPathSummary[] }>;
    readonly create: (input: unknown) => Effect.Effect<ReviewFeedback, InvalidInput>;
    readonly setStatus: (args: {
      id: string;
      status: ReviewStatus;
    }) => Effect.Effect<ReviewFeedback, ReviewFeedbackNotFound>;
    readonly remove: (id: string) => Effect.Effect<void, ReviewFeedbackNotFound>;
  }
>()("app/orpc/review/ReviewService") {
  static readonly layer = Layer.effect(
    ReviewService,
    Effect.gen(function* () {
      const repo = yield* ReviewRepo;
      const decodeCreate = decodeInput(CreateReviewFeedbackFields);

      /*------ List ------*/
      const list = Effect.fn("ReviewService.list")(function* ({
        pathname,
        viewport,
        status,
      }: {
        pathname?: string;
        viewport?: ReviewViewport;
        status?: ReviewStatusFilter;
      }) {
        const normalizedPath = pathname ? (normalizeReviewPath(pathname) ?? pathname) : undefined;
        const rows = yield* repo.findMany({ pathname: normalizedPath, viewport, status });
        const pathSummary = yield* repo.summarizeByPath;
        return {
          items: rows.map(toPublicFeedback),
          pathSummary,
        };
      });

      /*------ Create ------*/
      const create = Effect.fn("ReviewService.create")(function* (input: unknown) {
        const fields = yield* decodeCreate(input);
        const pathname = normalizeReviewPath(fields.pathname) ?? "/";
        const maxWidth = REVIEW_VIEWPORTS[fields.viewport];
        // Clamp box horizontally into the fixed artboard so sub-pixel rounding at the right edge never fails.
        const clampedX = Math.min(fields.x, maxWidth - 1);
        const clampedWidth = Math.min(fields.width, maxWidth - clampedX);

        const row = yield* repo.insert({
          pathname,
          viewport: fields.viewport,
          x: clampedX,
          y: fields.y,
          width: Math.max(1, clampedWidth),
          height: fields.height,
          comment: fields.comment,
          authorName: fields.authorName ?? "",
          status: "open",
        });
        return toPublicFeedback(row);
      });

      /*------ Set Status ------*/
      const setStatus = Effect.fn("ReviewService.setStatus")(function* ({
        id,
        status,
      }: {
        id: string;
        status: ReviewStatus;
      }) {
        if (!isFeedbackId(id)) return yield* new ReviewFeedbackNotFound({ id });
        const now = yield* DateTime.nowAsDate;
        const updated = yield* repo.updateStatus({
          id,
          status,
          resolvedAt: status === "resolved" ? now : null,
        });
        if (Option.isNone(updated)) return yield* new ReviewFeedbackNotFound({ id });
        return toPublicFeedback(updated.value);
      });

      /*------ Remove ------*/
      const remove = Effect.fn("ReviewService.remove")(function* (id: string) {
        if (!isFeedbackId(id)) return yield* new ReviewFeedbackNotFound({ id });
        const deleted = yield* repo.delete(id);
        if (!deleted) return yield* new ReviewFeedbackNotFound({ id });
      });

      return ReviewService.of({ list, create, setStatus, remove });
    }),
  );
}
