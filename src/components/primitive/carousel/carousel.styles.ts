import { defineStyles } from "#/components/primitive/styles";

/*===== Carousel Styles =====*/

export const twCarousel = defineStyles({
  root: { layout: "relative" },
  viewport: { layout: "overflow-hidden" },
  track: { layout: "flex" },
  horizontalTrack: { geometry: "-ms-4", interaction: "touch-pan-y" },
  verticalTrack: { geometry: "-mt-4", layout: "flex-col", interaction: "touch-pan-x" },
  item: { geometry: "min-w-0", layout: "shrink-0 grow-0 basis-full" },
  horizontalItem: { geometry: "ps-4" },
  verticalItem: { geometry: "pt-4" },
  arrow: { layout: "absolute", interaction: "touch-manipulation" },
  horizontalPrevious: { layout: "inset-y-0 -start-12", geometry: "my-auto" },
  horizontalNext: { layout: "inset-y-0 -end-12", geometry: "my-auto" },
  verticalPrevious: { layout: "start-1/2 -top-12 -translate-x-1/2 rtl:translate-x-1/2" },
  verticalNext: { layout: "start-1/2 -bottom-12 -translate-x-1/2 rtl:translate-x-1/2" },
});
