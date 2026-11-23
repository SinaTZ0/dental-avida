import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../button/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";

const meta: Meta<typeof Dialog> = {
  title: "Primitive/Dialog",
  component: Dialog,
};

export default meta;

type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>باز کردن پنجره</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>عنوان پنجره</DialogTitle>
          <DialogDescription>توضیحات نمونهٔ پنجرهٔ گفت‌وگو در حالت راست‌به‌چپ.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
};
