import * as React from "react"

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = "", ...props }, ref) => {
    const classes = `text-sm font-medium leading-none ${className}`
    
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