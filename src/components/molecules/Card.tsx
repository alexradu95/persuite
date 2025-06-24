import * as React from "react"
import { Typography } from "../atoms"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "colored" | "minimal"
  color?: "yellow" | "red" | "blue" | "green" | "purple" | "pink" | "orange"
  shadow?: boolean
  hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className = "", 
    variant = "default", 
    color = "yellow",
    shadow = true,
    hover = false,
    children,
    ...props 
  }, ref) => {
    const baseClasses = "bg-white border-thick border-black"
    
    const variantClasses = {
      default: shadow ? "shadow-brutal" : "",
      colored: shadow ? `shadow-brutal-${color}` : `border-${color}`,
      minimal: "border shadow-none",
    }
    
    const hoverClasses = hover ? "transition-fast hover:transform hover:shadow-brutal-lg cursor-pointer" : ""
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`
    
    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => {
    const classes = `flex justify-between items-center p-6 border-b border-black ${className}`
    
    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", children, ...props }, ref) => {
    const { color, ...typographyProps } = props as any
    return (
      <Typography
        as="h3"
        variant="h4"
        className={className}
        ref={ref as React.Ref<HTMLHeadingElement>}
        {...typographyProps}
      >
        {children}
      </Typography>
    )
  }
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", children, ...props }, ref) => {
    const { color, ...typographyProps } = props as any
    return (
      <Typography
        as="p"
        variant="caption"
        color="gray-600"
        weight="bold"
        className={className}
        ref={ref as React.Ref<HTMLParagraphElement>}
        {...typographyProps}
      >
        {children}
      </Typography>
    )
  }
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => {
    const classes = `p-6 ${className}`
    
    return (
      <div 
        ref={ref} 
        className={classes} 
        {...props} 
      >
        {children}
      </div>
    )
  }
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => {
    const classes = `flex items-center p-6 border-t border-black ${className}`
    
    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }