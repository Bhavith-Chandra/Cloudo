import { cn } from "@/lib/utils"

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  variant?: "default" | "primary" | "secondary"
}

export function Loading({ 
  className, 
  size = "md", 
  variant = "default",
  ...props 
}: LoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        {
          "h-4 w-4": size === "sm",
          "h-6 w-6": size === "md",
          "h-8 w-8": size === "lg",
        },
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-current border-t-transparent",
          {
            "border-gray-400": variant === "default",
            "border-blue-500": variant === "primary",
            "border-gray-600": variant === "secondary",
          }
        )}
      />
    </div>
  )
} 