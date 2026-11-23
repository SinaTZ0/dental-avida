import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "#/lib/utils";

import { checkboxClasses, checkboxIndicatorClasses } from "./checkbox.styles";

/*===== Checkbox =====*/

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root data-slot="checkbox" className={cn(checkboxClasses, className)} {...props}>
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className={checkboxIndicatorClasses}>
        <CheckIcon className="stroke-2" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
