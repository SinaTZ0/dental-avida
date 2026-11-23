import { Schema } from "effect";

import { searchParam, searchSchema } from "#/lib/schema";
import { normalizeReviewPath, REVIEW_STATUS_FILTERS, REVIEW_VIEWPORT_KEYS } from "#/orpc/review/constants";

/*===== Search Params =====*/
const SafeReviewPath = Schema.String.pipe(
  Schema.check(Schema.makeFilter((value) => normalizeReviewPath(value) !== null)),
);

/**
 * URL state for `/review`: active page path, fixed viewport preset (`desktop` | `mobile`), and status filter.
 * Invalid values fall back cleanly instead of failing the route.
 */
export const reviewSearchSchema = searchSchema(
  Schema.Struct({
    path: searchParam(SafeReviewPath, "/"),
    viewport: searchParam(Schema.Literals(REVIEW_VIEWPORT_KEYS), "desktop"),
    status: searchParam(Schema.Literals(REVIEW_STATUS_FILTERS), "open"),
  }),
);
