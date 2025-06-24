import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../molecules"
import { Button } from "../atoms"

interface CalendarDay {
  day: number
  isWorkDay: boolean
  data?: any
}

interface CalendarGridProps {
  title: string
  description?: string
  days: CalendarDay[]
  onDayClick?: (day: number) => void
  onQuickAdd?: (day: number, event: React.MouseEvent) => void
  className?: string
}

const CalendarGrid = React.forwardRef<HTMLDivElement, CalendarGridProps>(
  ({ title, description, days, onDayClick, onQuickAdd, className = "" }, ref) => {
    const classes = `${className}`
    
    const renderDay = (day: CalendarDay) => {
      if (day.day === 0) {
        return <div key={`empty-${Math.random()}`} />
      }
      
      const cellClasses = `calendar-cell group ${day.isWorkDay ? "is-work-day" : ""}`
      
      return (
        <div
          key={day.day}
          className={cellClasses}
          onClick={() => onDayClick?.(day.day)}
        >
          <span className="font-black">{day.day}</span>
          
          {!day.isWorkDay && onQuickAdd && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 w-4 h-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-blue hover:text-white text-xs border-none shadow-none"
              onClick={(e) => onQuickAdd(day.day, e)}
              title="Quick add: 8h at €37/hour"
            >
              <span>⚡</span>
            </Button>
          )}
        </div>
      )
    }
    
    return (
      <Card ref={ref} className={classes} variant="default">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="calendar-grid">
            {days.map(renderDay)}
          </div>
        </CardContent>
      </Card>
    )
  }
)
CalendarGrid.displayName = "CalendarGrid"

export { CalendarGrid }
export type { CalendarDay }