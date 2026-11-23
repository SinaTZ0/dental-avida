import { Schema } from "effect";

import { PersianText } from "#/lib/schema";
import {
  REVIEW_AUTHOR_MAX_LENGTH,
  REVIEW_COMMENT_MAX_LENGTH,
  REVIEW_MIN_BOX_SIZE,
  REVIEW_PATHNAME_MAX_LENGTH,
  REVIEW_VIEWPORT_KEYS,
} from "#/orpc/review/constants";
import { m } from "#/paraglide/messages";

/*===== Review Feedback Fields =====*/
// Domain rules for creating a visual feedback box. Free text is normalized (`PersianText`) before its limits are
// checked. Each message is a function (`text`), evaluated at the API boundary in the request's locale.
export const CreateReviewFeedbackFields = Schema.Struct({
  pathname: Schema.String.check(
    Schema.isMinLength(1, { text: () => m.review_error_pathname_invalid() }),
    Schema.isMaxLength(REVIEW_PATHNAME_MAX_LENGTH, { text: () => m.review_error_pathname_invalid() }),
    Schema.isPattern(/^\/(?!\/)/, { text: () => m.review_error_pathname_invalid() }),
  ),
  viewport: Schema.Literals(REVIEW_VIEWPORT_KEYS),
  x: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  y: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  width: Schema.Int.check(
    Schema.isGreaterThanOrEqualTo(REVIEW_MIN_BOX_SIZE, { text: () => m.review_error_box_too_small() }),
  ),
  height: Schema.Int.check(
    Schema.isGreaterThanOrEqualTo(REVIEW_MIN_BOX_SIZE, { text: () => m.review_error_box_too_small() }),
  ),
  comment: PersianText.check(
    Schema.isMinLength(1, { text: () => m.review_error_comment_required() }),
    Schema.isMaxLength(REVIEW_COMMENT_MAX_LENGTH, {
      text: () => m.review_error_comment_too_long({ max: REVIEW_COMMENT_MAX_LENGTH }),
    }),
  ),
  authorName: Schema.optional(
    PersianText.check(
      Schema.isMaxLength(REVIEW_AUTHOR_MAX_LENGTH, {
        text: () => m.review_error_author_too_long({ max: REVIEW_AUTHOR_MAX_LENGTH }),
      }),
    ),
  ),
});

export type CreateReviewFeedbackFields = typeof CreateReviewFeedbackFields.Type;
