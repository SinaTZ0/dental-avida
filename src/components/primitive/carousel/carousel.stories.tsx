import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "#/components/primitive/carousel/carousel";
import { formatNumber } from "#/lib/locale";
import { m } from "#/paraglide/messages";

/*===== Meta =====*/

const meta = {
  title: "Primitive/Carousel",
  component: Carousel,
  render: (args) => (
    <Carousel {...args} aria-label={m.common_carousel()} className="mx-auto max-w-xs">
      <CarouselContent>
        {[1, 2, 3].map((slide) => (
          <CarouselItem key={slide}>
            <div className="grid aspect-video place-items-center rounded-lg bg-muted text-h2">
              {formatNumber(slide)}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
} satisfies Meta<typeof Carousel>;

export default meta;

/*===== Stories =====*/

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const RightToLeft: Story = { args: { dir: "rtl", opts: { loop: true } } };
