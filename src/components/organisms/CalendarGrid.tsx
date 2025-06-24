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
      
      // Neo-brutalist calendar cell styling
      const baseCellClasses = "aspect-square flex flex-col items-center justify-center border-[3px] border-black bg-white cursor-pointer transition-all duration-200 font-black min-h-[60px] p-2 relative group"
      const workDayClasses = day.isWorkDay ? "bg-emerald-500 text-white" : "hover:bg-amber-400 hover:-translate-x-0.5 hover:-translate-y-0.5"
      const cellClasses = `${baseCellClasses} ${workDayClasses}`
      
      // Custom shadow for neo-brutalism
      const shadowStyle = day.isWorkDay 
        ? { boxShadow: '6px 6px 0px #000000' }
        : { boxShadow: '4px 4px 0px #000000' }
      
      return (
        <div
          key={day.day}
          className={cellClasses}
          style={shadowStyle}
          onClick={() => onDayClick?.(day.day)}
        >
          <span className="font-black" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            {day.day}
          </span>
          
          {!day.isWorkDay && onQuickAdd && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 w-4 h-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-blue-500 hover:text-white text-xs border-none shadow-none"
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
          <div 
            className="grid grid-cols-7 gap-2 p-4 bg-gray-100 border-[5px] border-black"
            style={{ boxShadow: '6px 6px 0px #000000' }}
          >
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