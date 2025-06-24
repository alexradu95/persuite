import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "brutal"
  hasError?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", variant = "brutal", hasError = false, type, ...props }, ref) => {
    const baseClasses = "w-full px-4 py-3 font-bold text-black bg-white border-thick border-black focus:outline-none focus:ring placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
    
    const variantClasses = {
      default: "rounded-sm shadow-brutal",
      brutal: "rounded-none shadow-brutal hover:transform hover:shadow-brutal-lg focus:transform focus:shadow-brutal-lg",
    }
    
    const errorClasses = hasError ? "border-red shadow-brutal-red" : ""
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${errorClasses} ${className}`
    
    return (
      <input
        type={type}
        className={classes}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }