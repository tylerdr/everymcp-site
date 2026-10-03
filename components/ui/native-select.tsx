import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// shadcn/ui NativeSelect preserves native form, required and keyboard behavior.
// The registry's shadow token and utility import are adapted for Tailwind 3.
function NativeSelect({
  className,
  size = "default",
  ...props
}: Omit<React.ComponentPropsWithoutRef<"select">, "size"> & { size?: "sm" | "default" }) {
  return (
    <div className="group/native-select relative w-full" data-slot="native-select-wrapper">
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          "h-10 w-full min-w-0 appearance-none rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm text-foreground shadow-sm transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[size=sm]:h-8 data-[size=sm]:py-1",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 select-none text-muted-foreground"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<"option">) {
  return <option data-slot="native-select-option" className={cn("bg-[Canvas] text-[CanvasText]", className)} {...props} />;
}

export { NativeSelect, NativeSelectOption };
