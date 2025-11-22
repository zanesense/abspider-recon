"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

// Define the expected structure of the slot object from OTPInputContext
interface SlotContextProps {
  char: string;
  hasValue: boolean;
  isActive: boolean;
  isFocused: boolean;
  isHovered: boolean;
  isLast: boolean;
}

interface InputOTPSlotProps extends React.ComponentPropsWithoutRef<"div"> {
  index: number;
}

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  InputOTPSlotProps
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  // Destructure properties from the slot object provided by the context, casting to the expected type
  const { char, hasValue, isActive, isFocused, isHovered, isLast } =
    inputOTPContext.slots[index] as SlotContextProps

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-ring",
        className
      )}
      {...props}
    >
      {char}
      {hasValue && (
        <div
          className={cn(
            "absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground",
            isActive && "bg-primary"
          )}
        />
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPAcceptableText = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => (
  <Slot {...props} ref={ref} />
))
InputOTPAcceptableText.displayName = "InputOTPAcceptableText"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    {" "}
    &nbsp;{" "}
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPSlot, InputOTPAcceptableText, InputOTPSeparator }