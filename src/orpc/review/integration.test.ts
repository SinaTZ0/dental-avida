import { randomUUID } from "node:crypto";

import { expect, layer } from "@effect/vitest";
import { like } from "drizzle-orm";
import { Effect, Layer } from "effect";

import { reviewFeedback } from "#/db/schema";
import { issueToErrorData } from "#/lib/schema";
import { ReviewFeedbackNotFound } from "#/orpc/review/errors";
import { ReviewService } from "#/orpc/review/service";
import { Db } from "#/server/db.server";
import { InvalidInput } from "#/server/errors";
import { AppLayer } from "#/server/runtime.server";

/*===== Review Feedback =====*/
// Runs against the real database (`DATABASE_URL`, after `pnpm db:migrate`) on the app's own layers. Every row uses a
// run-scoped path prefix and is cleaned up when the layer closes.

const query = <A>(f: (q: Db["Service"]["q"]) => Effect.Effect<A, unknown>) =>
  Db.use(({ q }) => f(q).pipe(Effect.orDie));

const runPrefix = `/__review-test-${randomUUID().slice(0, 8)}`;

function fieldsOf(error: unknown): Record<string, string> {
  expect(error).toBeInstanceOf(InvalidInput);
  return issueToErrorData((error as InvalidInput).issue).fields;
}

/*===== Fixtures =====*/
const Cleanup = Layer.effectDiscard(
  Effect.acquireRelease(Effect.void, () =>
    query((q) => q.delete(reviewFeedback).where(like(reviewFeedback.pathname, `${runPrefix}%`))),
  ),
);

/*===== Tests =====*/
layer(Cleanup.pipe(Layer.provideMerge(AppLayer)), { excludeTestServices: true })("review", (it) => {
  it.effect("creates, lists, filters, resolves and deletes visual feedback boxes", () =>
    Effect.gen(function* () {
      const reviews = yield* ReviewService;
      const homePath = `${runPrefix}/home`;
      const aboutPath = `${runPrefix}/about`;

      const desktop = yield* reviews.create({
        pathname: `${homePath}/`,
        viewport: "desktop",
        x: 120,
        y: 340,
        width: 240,
        height: 80,
        comment: "  فونت تیتر كمى كوچك است  ",
        authorName: "  مدیر  ",
      });

      // Trailing slash stripped and Persian text normalized.
      expect(desktop).toMatchObject({
        pathname: homePath,
        viewport: "desktop",
        x: 120,
        y: 340,
        width: 240,
        height: 80,
        comment: "فونت تیتر کمی کوچک است",
        authorName: "مدیر",
        status: "open",
        resolvedAt: null,
      });

      const mobile = yield* reviews.create({
        pathname: aboutPath,
        viewport: "mobile",
        x: 20,
        y: 100,
        width: 180,
        height: 60,
        comment: "فاصلهٔ دکمه کم است",
      });

      const desktopList = yield* reviews.list({ pathname: homePath, viewport: "desktop", status: "open" });
      expect(desktopList.items.map((item) => item.id)).toEqual([desktop.id]);
      expect(desktopList.pathSummary).toEqual(
        expect.arrayContaining([
          { pathname: homePath, open: 1, total: 1 },
          { pathname: aboutPath, open: 1, total: 1 },
        ]),
      );

      const resolved = yield* reviews.setStatus({ id: desktop.id, status: "resolved" });
      expect(resolved.status).toBe("resolved");
      expect(resolved.resolvedAt).toBeInstanceOf(Date);

      const openDesktop = yield* reviews.list({ pathname: homePath, viewport: "desktop", status: "open" });
      expect(openDesktop.items).toEqual([]);

      yield* reviews.remove(desktop.id);
      yield* reviews.remove(mobile.id);

      const missing = yield* Effect.flip(reviews.remove(desktop.id));
      expect(missing).toBeInstanceOf(ReviewFeedbackNotFound);
    }),
  );

  it.effect("rejects empty comments, tiny boxes, and malformed paths", () =>
    Effect.gen(function* () {
      const reviews = yield* ReviewService;

      const empty = yield* Effect.flip(
        reviews.create({
          pathname: `${runPrefix}/bad`,
          viewport: "desktop",
          x: 0,
          y: 0,
          width: 40,
          height: 40,
          comment: "   ",
        }),
      );
      expect(fieldsOf(empty)).toEqual({ comment: expect.any(String) });

      const tiny = yield* Effect.flip(
        reviews.create({
          pathname: `${runPrefix}/bad`,
          viewport: "desktop",
          x: 0,
          y: 0,
          width: 4,
          height: 4,
          comment: "کوچک",
        }),
      );
      expect(fieldsOf(tiny)).toMatchObject({ width: expect.any(String), height: expect.any(String) });

      const badPath = yield* Effect.flip(
        reviews.create({
          pathname: "//evil.example",
          viewport: "desktop",
          x: 0,
          y: 0,
          width: 40,
          height: 40,
          comment: "مسیر بد",
        }),
      );
      expect(fieldsOf(badPath)).toEqual({ pathname: expect.any(String) });
    }),
  );
});
