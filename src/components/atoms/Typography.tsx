import * as React from "react"

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "caption" | "mono"
  weight?: "normal" | "bold" | "black"
  color?: "black" | "white" | "gray-500" | "gray-600" | "gray-700"
  transform?: "none" | "uppercase" | "lowercase" | "capitalize"
  as?: keyof JSX.IntrinsicElements
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ 
    className = "", 
    variant = "body", 
    weight = "black", 
    color = "black",
    transform = "none",
    as,
    children,
    ...props 
  }, ref) => {
    const baseClasses = "block"
    
    const variantClasses = {
      h1: "text-4xl font-black uppercase tracking-wide",
      h2: "text-3xl font-black uppercase tracking-wide", 
      h3: "text-2xl font-black uppercase tracking-wide",
      h4: "text-xl font-bold uppercase tracking-wide",
      body: "text-base",
      caption: "text-sm",
      mono: "font-mono text-base",
    }
    
    const weightClasses = {
      normal: "font-normal",
      bold: "font-bold", 
      black: "font-black",
    }
    
    const colorClasses = {
      black: "text-black",
      white: "text-white",
      "gray-500": "text-gray-500",
      "gray-600": "text-gray-600", 
      "gray-700": "text-gray-700",
    }
    
    const transformClasses = {
      none: "",
      uppercase: "uppercase",
      lowercase: "lowercase",
      capitalize: "capitalize",
    }
    
    const defaultElement = {
      h1: "h1",
      h2: "h2", 
      h3: "h3",
      h4: "h4",
      body: "p",
      caption: "span",
      mono: "code",
    }
    
    const Element = (as || defaultElement[variant]) as keyof JSX.IntrinsicElements
    const classes = `${baseClasses} ${variantClasses[variant]} ${weightClasses[weight]} ${colorClasses[color]} ${transformClasses[transform]} ${className}`
    
    return React.createElement(
      Element,
      {
        ref,
        className: classes,
        ...props
      },
      children
    )
  }
)
Typography.displayName = "Typography"

export { Typography }