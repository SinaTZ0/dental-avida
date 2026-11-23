import { Effect } from "effect";

import type { RateLimitPolicy } from "#/lib/rate-limit.server";
import { effectProcedure } from "#/orpc/effect.server";
import { noErrorData } from "#/orpc/errors";
import { base } from "#/orpc/implementer.server";
import { checkReviewAccess, requireReviewAccess } from "#/orpc/review/auth.server";
import { ReviewService } from "#/orpc/review/service";
import { m } from "#/paraglide/messages";

/*===== Policies =====*/
const CREATE_REVIEW_RATE_LIMIT: RateLimitPolicy = { name: "review-create", limit: 60, windowMs: 60_000 };

/*===== Messages =====*/
const notFoundData = () => ({ errors: [m.review_error_not_found()], fields: {} });

/*===== Access =====*/
export const reviewAccessProcedure = effectProcedure(base.review.access, {
  run: () => checkReviewAccess,
  errors: {},
});

/*===== List =====*/
export const listReviewFeedbackProcedure = effectProcedure(base.review.list, {
  run: ({ input }) =>
    Effect.gen(function* () {
      yield* requireReviewAccess;
      const reviews = yield* ReviewService;
      return yield* reviews.list(input);
    }),
  errors: {},
});

/*===== Create =====*/
export const createReviewFeedbackProcedure = effectProcedure(base.review.create, {
  rateLimit: CREATE_REVIEW_RATE_LIMIT,
  run: ({ input }) =>
    Effect.gen(function* () {
      yield* requireReviewAccess;
      const reviews = yield* ReviewService;
      return yield* reviews.create(input);
    }),
  errors: {},
});

/*===== Set Status =====*/
export const setReviewStatusProcedure = effectProcedure(base.review.setStatus, {
  run: ({ input }) =>
    Effect.gen(function* () {
      yield* requireReviewAccess;
      const reviews = yield* ReviewService;
      return yield* reviews.setStatus(input);
    }),
  errors: {
    ReviewFeedbackNotFound: ({ errors }) => errors.NOT_FOUND({ data: notFoundData() }),
  },
});

/*===== Delete =====*/
export const deleteReviewFeedbackProcedure = effectProcedure(base.review.delete, {
  run: ({ input }) =>
    Effect.gen(function* () {
      yield* requireReviewAccess;
      const reviews = yield* ReviewService;
      yield* reviews.remove(input.id);
    }),
  errors: {
    ReviewFeedbackNotFound: ({ errors }) => errors.NOT_FOUND({ data: noErrorData }),
  },
});
