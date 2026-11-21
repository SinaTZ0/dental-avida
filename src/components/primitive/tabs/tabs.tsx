import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { type VariantProps } from "class-variance-authority";
import { cn } from "#/lib/utils";
import {
  tabsContentClasses,
  tabsGuideIndicatorClasses,
  tabsListVariants,
  tabsTriggerClasses,
  tabsVariants,
} from "./tabs.styles";

/*===== Tabs =====*/

type TabsProps = TabsPrimitive.Root.Props & VariantProps<typeof tabsVariants>;

function Tabs({ className, orientation = "horizontal", variant, ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(tabsVariants({ variant }), className)}
      {...props}
    />
  );
}

/*===== Compound Parts =====*/

export type TabsListProps = TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>;

function TabsList({ children, className, variant = "default", ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {children}
      {variant === "guide" && <TabsPrimitive.Indicator className={tabsGuideIndicatorClasses} />}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return <TabsPrimitive.Tab data-slot="tabs-trigger" className={cn(tabsTriggerClasses, className)} {...props} />;
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn(tabsContentClasses, className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
