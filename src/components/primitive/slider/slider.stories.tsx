import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slider } from "#/components/primitive/slider/slider";
import { m } from "#/paraglide/messages";

/*===== Meta =====*/

const meta = {
  title: "Primitive/Slider",
  render: () => <Slider defaultValue={50} label={m.home_results_treatments()} className="max-w-sm" />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/

export const Playground: Story = {};

export const Comparison: Story = {
  render: () => (
    <Slider
      variant="comparison"
      className="h-32 max-w-sm"
      defaultValue={50}
      label={m.home_results_comparison({ treatment: m.home_results_veneers() })}
    />
  ),
};
