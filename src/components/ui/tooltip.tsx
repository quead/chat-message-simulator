import { Tooltip as TooltipPrimitive } from "@kobalte/core/tooltip";
import { splitProps, type ParentComponent, type ValidComponent } from "solid-js";

export const TooltipTrigger = TooltipPrimitive.Trigger;

type tooltipContentProps<T extends ValidComponent = "div"> =
  TooltipPrimitive.TooltipContentProps<T> & {
    class?: string;
  };

export const TooltipContent: ParentComponent<tooltipContentProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        class={`z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md animate-in fade-in-0 zoom-in-95 ${local.class || ""}`}
        {...rest}
      >
        {local.children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
};

export const Tooltip = TooltipPrimitive;
