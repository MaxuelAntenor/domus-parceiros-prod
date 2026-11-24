import * as React from "react";

import { cn } from "@/lib/utils";

const clampNumberInputValue = (input: HTMLInputElement) => {
  if (input.type !== "number") return;
  if (input.value === "" || input.value === "." || input.value === ",") return;

  const numericValue = Number(input.value);
  if (!Number.isNaN(numericValue) && numericValue < 0) {
    input.value = "0";
  }
};

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, min, onChange, onKeyDown, onPaste, ...props }, ref) => {
    const isNumberInput = type === "number";

    return (
      <input
        type={type}
        min={isNumberInput ? min ?? 0 : min}
        inputMode={isNumberInput ? props.inputMode ?? "decimal" : props.inputMode}
        onKeyDown={(event) => {
          if (isNumberInput && ["-", "Minus"].includes(event.key)) {
            event.preventDefault();
            return;
          }

          onKeyDown?.(event);
        }}
        onPaste={(event) => {
          if (isNumberInput) {
            const pastedValue = event.clipboardData.getData("text");
            if (pastedValue.trim().startsWith("-") || Number(pastedValue) < 0) {
              event.preventDefault();
              return;
            }
          }

          onPaste?.(event);
        }}
        onChange={(event) => {
          if (isNumberInput) clampNumberInputValue(event.currentTarget);
          onChange?.(event);
        }}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
