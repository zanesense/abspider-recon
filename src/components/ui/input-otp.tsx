import * as React from "react"
import { OTPInput, type OTPInputProps } from "input-otp"
import { Slot } from "@radix-ui/react-slot" // Corrected import for Slot
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
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInput.Context)
  const { char, hasValue, isActive, isFocused, isHovered, isLast } =
    inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 border-primary ring-1 ring-primary",
        isFocused && "z-10 border-primary ring-1 ring-primary",
        isHovered && "z-10 border-primary ring-1 ring-primary",
        isLast && "last:border-r",
        className
      )}
      {...props}
    >
      {char}
      {hasValue && !isLast && (
        <div className="absolute right-0 top-1/2 h-4 w-px -translate-y-1/2 bg-border" />
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPMarker = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-center", className)}
    {...props}
  />
))
InputOTPMarker.displayName = "InputOTPMarker"

const InputOTPDot = React.forwardRef<
  React.ElementRef<SVGSVGElement>, // Corrected ref type to SVGSVGElement
  React.ComponentPropsWithoutRef<typeof Dot>
>(({ className, ...props }, ref) => (
  <Dot
    ref={ref}
    className={cn("h-4 w-4", className)}
    {...props}
  />
))
InputOTPDot.displayName = "InputOTPDot"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPMarker, InputOTPDot }