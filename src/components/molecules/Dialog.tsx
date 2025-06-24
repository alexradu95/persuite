"use client"

import * as React from "react"
import { Typography, Button } from "../atoms"

interface DialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextType | null>(null)

const useDialog = () => {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog")
  }
  return context
}

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open = false, onOpenChange, children }: DialogProps) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className = "", children, asChild, ...props }, ref) => {
  const { onOpenChange } = useDialog()
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: (e: React.MouseEvent) => {
        onOpenChange(true)
        if (children.props.onClick) {
          children.props.onClick(e)
        }
      }
    })
  }
  
  return (
    <button
      ref={ref}
      className={className}
      onClick={() => onOpenChange(true)}
      {...props}
    >
      {children}
    </button>
  )
})
DialogTrigger.displayName = "DialogTrigger"

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => {
    const { open, onOpenChange } = useDialog()
    
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onOpenChange(false)
        }
      }
      
      if (open) {
        document.addEventListener("keydown", handleEscape)
        document.body.style.overflow = "hidden"
      }
      
      return () => {
        document.removeEventListener("keydown", handleEscape)
        document.body.style.overflow = "unset"
      }
    }, [open, onOpenChange])
    
    if (!open) return null
    
    const overlayClasses = "fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4"
    const contentClasses = `w-full max-w-lg bg-white border-thick border-black shadow-brutal-lg p-6 relative ${className}`
    
    return (
      <div className={overlayClasses}>
        <div
          ref={ref}
          className={contentClasses}
          {...props}
        >
          {children}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 border-none shadow-none hover:bg-red hover:text-white"
          >
            <span className="text-lg font-black">✕</span>
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>
    )
  }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => {
    const classes = `flex flex-col space-y-2 text-center sm:text-left mb-6 pb-4 border-b border-black ${className}`
    
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
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", children, ...props }, ref) => {
    const { color, ...typographyProps } = props as any
    return (
      <Typography
        as="h2"
        variant="h3"
        className={className}
        ref={ref as React.Ref<HTMLHeadingElement>}
        {...typographyProps}
      >
        {children}
      </Typography>
    )
  }
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", children, ...props }, ref) => {
    const { color, ...typographyProps } = props as any
    return (
      <Typography
        as="p"
        variant="body"
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
DialogDescription.displayName = "DialogDescription"

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => {
    const classes = `flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-4 border-t border-black ${className}`
    
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
DialogFooter.displayName = "DialogFooter"

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}