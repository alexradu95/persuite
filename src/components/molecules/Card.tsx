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
    const baseClasses = "bg-white border-[5px] border-black"
    
    // Map color to Tailwind color classes
    const colorMap = {
      yellow: "border-amber-400",
      red: "border-red-500",
      blue: "border-blue-500", 
      green: "border-emerald-500",
      purple: "border-purple-500",
      pink: "border-pink-500",
      orange: "border-orange-500"
    }
    
    // Custom shadows for neo-brutalism
    const shadowStyles = {
      default: shadow ? { boxShadow: '6px 6px 0px #000000' } : {},
      colored: shadow ? {
        yellow: { boxShadow: '6px 6px 0px #fbbf24' },
        red: { boxShadow: '6px 6px 0px #ef4444' },
        blue: { boxShadow: '6px 6px 0px #3b82f6' },
        green: { boxShadow: '6px 6px 0px #10b981' },
        purple: { boxShadow: '6px 6px 0px #8b5cf6' },
        pink: { boxShadow: '6px 6px 0px #ec4899' },
        orange: { boxShadow: '6px 6px 0px #f97316' }
      }[color] : {},
      minimal: {}
    }
    
    const variantClasses = {
      default: "",
      colored: colorMap[color],
      minimal: "border-[3px]",
    }
    
    const hoverClasses = hover ? "transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer" : ""
    const hoverStyle = hover ? {
      ':hover': {
        boxShadow: '10px 10px 0px #000000'
      }
    } : {}
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`
    
    return (
      <div
        ref={ref}
        className={classes}
        style={{
          ...shadowStyles[variant],
          ...hoverStyle
        }}
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
    const classes = `flex justify-between items-center p-6 border-b-[3px] border-black ${className}`
    
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
    const classes = `flex items-center p-6 border-t-[3px] border-black ${className}`
    
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