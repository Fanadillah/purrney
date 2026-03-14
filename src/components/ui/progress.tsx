"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    value?: number
  }
>(({ className, value = 0, ...props }, ref) => {
  // tentukan warna berdasarkan value
  const indicatorColor =
    value >= 0 && value < 50
      ? "bg-green-500"
      : value >= 50 && value < 80
      ? "bg-yellow-500"
      : "bg-red-500"


  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-gray-200",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full transition-all", indicatorColor)}
        style={{ width: `${value}%` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }