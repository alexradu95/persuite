import * as React from "react"
import { Typography } from "../atoms"

interface AppHeaderProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(
  ({ title = "Working Days Tracker", subtitle, actions, className = "" }, ref) => {
    const classes = `flex h-16 items-center justify-between border-b border-thick border-black px-4 md:px-8 bg-white shadow-brutal ${className}`
    
    return (
      <header ref={ref} className={classes}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div className="flex flex-col">
            <Typography variant="h4" className="m-0 leading-none">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="gray-600" weight="bold" className="mt-1">
                {subtitle}
              </Typography>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </header>
    )
  }
)
AppHeader.displayName = "AppHeader"

export { AppHeader }