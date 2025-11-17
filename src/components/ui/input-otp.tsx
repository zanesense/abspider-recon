"use client"

import * as React from "react"
import { OTPInput, Slot, type OTPInputProps } from "input-otp"
import { Dot } from "lucide-react"

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

const InputOTPGroup = React.forwardRef<
  HTMLDivElement, // Corrected ref type
  React.HTMLAttributes<HTMLDivElement> // Corrected props type
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

// Define props for InputOTPSlot directly, including those passed by input-otp's render prop
interface InputOTPSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  char: string;
  isActive: boolean;
  isFocused: boolean;
  isPlaceholder: boolean;
  placeholderChar: string;
  hasFakeCaret: boolean;
  index: number;
}

const InputOTPSlot = React.forwardRef<
  HTMLDivElement, // Corrected ref type
  InputOTPSlotProps // Corrected props type
>(({ char, isActive, className, isFocused, isPlaceholder, placeholderChar, hasFakeCaret, index, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-ring",
        className
      )}
      {...props} // Now 'props' should only contain standard HTMLDivElement attributes
    >
      {char}
      {isActive && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPDot = React.forwardRef<
  React.ElementRef<typeof Dot>,
  React.ComponentPropsWithoutRef<typeof Dot>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-center", className)}
    {...props}
  >
    <Dot className="h-4 w-4" />
  </div>
))
InputOTPDot.displayName = "InputOTPDot"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPDot }