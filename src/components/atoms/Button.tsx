import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg" | "icon"
  color?: "black" | "yellow" | "red" | "blue" | "green" | "purple"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = "", 
    variant = "primary", 
    size = "md", 
    color = "black",
    children,
    ...props 
  }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-black uppercase tracking-wide transition-fast border-thick focus:outline-none focus:ring disabled:opacity-50 disabled:cursor-not-allowed hover:transform hover:shadow-brutal-lg active:transform active:shadow-none"
    
    const variantClasses = {
      primary: `bg-${color} text-white border-black shadow-brutal`,
      secondary: `bg-white text-black border-black shadow-brutal`,
      danger: "bg-red text-white border-black shadow-brutal",
      ghost: "bg-transparent text-black border-black hover:bg-gray-100",
    }
    
    const sizeClasses = {
      sm: "px-3 py-2 text-xs h-8",
      md: "px-4 py-3 text-sm h-10", 
      lg: "px-6 py-4 text-base h-12",
      icon: "w-10 h-10 p-0",
    }
    
    const hoverClasses = {
      primary: variant === "primary" ? `hover:bg-${color === "black" ? "gray-800" : color}` : "",
      secondary: variant === "secondary" ? "hover:bg-gray-100" : "",
      danger: variant === "danger" ? "hover:bg-red" : "",
      ghost: variant === "ghost" ? "hover:bg-gray-100" : "",
    }
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${hoverClasses[variant]} ${className}`
    
    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }