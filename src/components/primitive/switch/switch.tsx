import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "#/lib/utils";

import { switchClasses, switchThumbClasses } from "./switch.styles";

/*===== Switch =====*/

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root data-slot="switch" className={cn(switchClasses, className)} {...props}>
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={switchThumbClasses} />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
