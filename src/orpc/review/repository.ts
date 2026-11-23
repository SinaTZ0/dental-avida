import { and, asc, count, eq, sql } from "drizzle-orm";
import { Context, Effect, Layer, Option } from "effect";

import { reviewFeedback } from "#/db/schema";
import type { ReviewStatus, ReviewStatusFilter, ReviewViewport } from "#/orpc/review/constants";
import { Db } from "#/server/db.server";

/*===== Types =====*/
export type ReviewFeedbackRecord = typeof reviewFeedback.$inferSelect;
type NewReviewFeedbackRecord = typeof reviewFeedback.$inferInsert;

export type ReviewPathSummaryRow = {
  readonly pathname: string;
  readonly open: number;
  readonly total: number;
};

/*===== Review Repository =====*/
/**
 * Focused reads and writes of the `review_feedback` table. Every method joins the caller's `Db.transaction`, and a
 * failed query is a defect.
 */
export class ReviewRepo extends Context.Service<
  ReviewRepo,
  {
    readonly findMany: (args: {
      pathname?: string;
      viewport?: ReviewViewport;
      status?: ReviewStatusFilter;
    }) => Effect.Effect<ReviewFeedbackRecord[]>;
    readonly summarizeByPath: Effect.Effect<ReviewPathSummaryRow[]>;
    readonly findById: (id: string) => Effect.Effect<Option.Option<ReviewFeedbackRecord>>;
    readonly insert: (values: NewReviewFeedbackRecord) => Effect.Effect<ReviewFeedbackRecord>;
    readonly updateStatus: (args: {
      id: string;
      status: ReviewStatus;
      resolvedAt: Date | null;
    }) => Effect.Effect<Option.Option<ReviewFeedbackRecord>>;
    readonly delete: (id: string) => Effect.Effect<boolean>;
  }
>()("app/orpc/review/ReviewRepo") {
  static readonly layer = Layer.effect(
    ReviewRepo,
    Effect.gen(function* () {
      const { q } = yield* Db;

      const findMany = Effect.fn("ReviewRepo.findMany")(function* ({
        pathname,
        viewport,
        status,
      }: {
        pathname?: string;
        viewport?: ReviewViewport;
        status?: ReviewStatusFilter;
      }) {
        const filters = [
          pathname ? eq(reviewFeedback.pathname, pathname) : undefined,
          viewport ? eq(reviewFeedback.viewport, viewport) : undefined,
          status && status !== "all" ? eq(reviewFeedback.status, status) : undefined,
        ];
        return yield* q
          .select()
          .from(reviewFeedback)
          .where(and(...filters))
          .orderBy(asc(reviewFeedback.createdAt), asc(reviewFeedback.id));
      }, Effect.orDie);

      const summarizeByPath = Effect.gen(function* () {
        const rows = yield* q
          .select({
            pathname: reviewFeedback.pathname,
            open: sql<number>`cast(count(*) filter (where ${reviewFeedback.status} = 'open') as int)`,
            total: count(),
          })
          .from(reviewFeedback)
          .groupBy(reviewFeedback.pathname)
          .orderBy(asc(reviewFeedback.pathname));
        return rows.map((row) => ({
          pathname: row.pathname,
          open: Number(row.open),
          total: Number(row.total),
        }));
      }).pipe(Effect.orDie, Effect.withSpan("ReviewRepo.summarizeByPath"));

      const findById = Effect.fn("ReviewRepo.findById")(function* (id: string) {
        const [row] = yield* q.select().from(reviewFeedback).where(eq(reviewFeedback.id, id)).limit(1);
        return Option.fromNullishOr(row);
      }, Effect.orDie);

      const insert = Effect.fn("ReviewRepo.insert")(function* (values: NewReviewFeedbackRecord) {
        const [row] = yield* q.insert(reviewFeedback).values(values).returning();
        if (!row) return yield* Effect.die(new Error("ReviewRepo.insert: insert returned no row"));
        return row;
      }, Effect.orDie);

      const updateStatus = Effect.fn("ReviewRepo.updateStatus")(function* ({
        id,
        status,
        resolvedAt,
      }: {
        id: string;
        status: ReviewStatus;
        resolvedAt: Date | null;
      }) {
        const [row] = yield* q
          .update(reviewFeedback)
          .set({ status, resolvedAt })
          .where(eq(reviewFeedback.id, id))
          .returning();
        return Option.fromNullishOr(row);
      }, Effect.orDie);

      const del = Effect.fn("ReviewRepo.delete")(function* (id: string) {
        const rows = yield* q
          .delete(reviewFeedback)
          .where(eq(reviewFeedback.id, id))
          .returning({ id: reviewFeedback.id });
        return rows.length > 0;
      }, Effect.orDie);

      return ReviewRepo.of({
        findMany,
        summarizeByPath,
        findById,
        insert,
        updateStatus,
        delete: del,
      });
    }),
  );
}
