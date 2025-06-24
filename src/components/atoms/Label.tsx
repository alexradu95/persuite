import * as React from "react"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  size?: "sm" | "md" | "lg"
  weight?: "normal" | "bold" | "black"
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", size = "md", weight = "black", ...props }, ref) => {
    const baseClasses = "block text-black uppercase tracking-wide"
    
    const sizeClasses = {
      sm: "text-xs mb-1",
      md: "text-sm mb-2", 
      lg: "text-base mb-3",
    }
    
    const weightClasses = {
      normal: "font-normal",
      bold: "font-bold",
      black: "font-black",
    }
    
    const classes = `${baseClasses} ${sizeClasses[size]} ${weightClasses[weight]} ${className}`
    
    return (
      <label
        ref={ref}
        className={classes}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export { Label }