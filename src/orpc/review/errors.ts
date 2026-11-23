import { Schema } from "effect";

/*===== Review Errors =====*/
// Expected failures of the review service. Facts only: the procedure that receives one writes its message.

/** No feedback item exists with this ID. */
export class ReviewFeedbackNotFound extends Schema.TaggedError<ReviewFeedbackNotFound>()("ReviewFeedbackNotFound", {
  id: Schema.String,
}) {}
