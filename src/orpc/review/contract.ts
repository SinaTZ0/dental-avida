import { oc } from "@orpc/contract";
import { Schema } from "effect";

import { standardSchema } from "#/lib/schema";
import { authErrors, commonErrors, errorDataSchema } from "#/orpc/errors";
import { REVIEW_STATUSES, REVIEW_STATUS_FILTERS, REVIEW_VIEWPORT_KEYS } from "#/orpc/review/constants";

/*===== Schemas =====*/
const ViewportSchema = Schema.Literals(REVIEW_VIEWPORT_KEYS);
const StatusSchema = Schema.Literals(REVIEW_STATUSES);
const StatusFilterSchema = Schema.Literals(REVIEW_STATUS_FILTERS);

export const ReviewAccessSchema = Schema.Struct({
  allowed: Schema.Boolean,
  isAdmin: Schema.Boolean,
  hasCookie: Schema.Boolean,
});

export type ReviewAccessOutput = typeof ReviewAccessSchema.Type;

export const ReviewFeedbackSchema = Schema.Struct({
  id: Schema.String,
  pathname: Schema.String,
  viewport: ViewportSchema,
  x: Schema.Int,
  y: Schema.Int,
  width: Schema.Int,
  height: Schema.Int,
  comment: Schema.String,
  authorName: Schema.String,
  status: StatusSchema,
  createdAt: Schema.Date,
  resolvedAt: Schema.NullOr(Schema.Date),
});

export type ReviewFeedback = typeof ReviewFeedbackSchema.Type;

export const ReviewPathSummarySchema = Schema.Struct({
  pathname: Schema.String,
  open: Schema.Int,
  total: Schema.Int,
});

export type ReviewPathSummary = typeof ReviewPathSummarySchema.Type;

const ListReviewFeedbackInput = Schema.Struct({
  pathname: Schema.optional(Schema.String),
  viewport: Schema.optional(ViewportSchema),
  status: Schema.optional(StatusFilterSchema),
});

const ListReviewFeedbackOutput = Schema.Struct({
  items: Schema.Array(ReviewFeedbackSchema),
  pathSummary: Schema.Array(ReviewPathSummarySchema),
});

const CreateReviewFeedbackInput = Schema.Struct({
  pathname: Schema.String,
  viewport: ViewportSchema,
  x: Schema.Int,
  y: Schema.Int,
  width: Schema.Int,
  height: Schema.Int,
  comment: Schema.String,
  authorName: Schema.optional(Schema.String),
});

const SetReviewStatusInput = Schema.Struct({
  id: Schema.String,
  status: StatusSchema,
});

const ReviewIdInput = Schema.Struct({ id: Schema.String });

/*===== Errors =====*/
const notFoundErrors = {
  NOT_FOUND: { message: "Review feedback not found.", data: errorDataSchema },
};

/*===== Procedures =====*/
export const reviewAccessContract = oc.errors(commonErrors).output(standardSchema(ReviewAccessSchema));

export const listReviewFeedbackContract = oc
  .errors({ ...commonErrors, ...authErrors })
  .input(standardSchema(ListReviewFeedbackInput))
  .output(standardSchema(ListReviewFeedbackOutput));

export const createReviewFeedbackContract = oc
  .errors({ ...commonErrors, ...authErrors })
  .input(standardSchema(CreateReviewFeedbackInput))
  .output(standardSchema(ReviewFeedbackSchema));

export const setReviewStatusContract = oc
  .errors({ ...commonErrors, ...authErrors, ...notFoundErrors })
  .input(standardSchema(SetReviewStatusInput))
  .output(standardSchema(ReviewFeedbackSchema));

export const deleteReviewFeedbackContract = oc
  .errors({ ...commonErrors, ...authErrors, ...notFoundErrors })
  .input(standardSchema(ReviewIdInput))
  .output(standardSchema(Schema.Void));

export const reviewContract = {
  access: reviewAccessContract,
  list: listReviewFeedbackContract,
  create: createReviewFeedbackContract,
  setStatus: setReviewStatusContract,
  delete: deleteReviewFeedbackContract,
};
