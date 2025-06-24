import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../molecules"
import { Typography } from "../atoms"

interface StatItem {
  label: string
  value: string | number
  icon?: string
  color?: "yellow" | "red" | "blue" | "green" | "purple" | "pink" | "orange"
  subtitle?: string
}

interface StatsGridProps {
  stats: StatItem[]
  columns?: 2 | 3 | 4
  className?: string
}

const StatsGrid = React.forwardRef<HTMLDivElement, StatsGridProps>(
  ({ stats, columns = 4, className = "" }, ref) => {
    const gridClasses = {
      2: "grid-2",
      3: "grid-3", 
      4: "grid-4",
    }
    
    const classes = `${gridClasses[columns]} gap-4 ${className}`
    
    return (
      <div ref={ref} className={classes}>
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            variant="colored" 
            color={stat.color || "yellow"}
            hover
            className="transition-fast"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{stat.label}</CardTitle>
              {stat.icon && (
                <span className="text-gray-500 text-lg">{stat.icon}</span>
              )}
            </CardHeader>
            
            <CardContent className="pt-0">
              <Typography variant="h2" className="text-3xl mb-2">
                {stat.value}
              </Typography>
              {stat.subtitle && (
                <Typography variant="caption" color="gray-600" weight="bold">
                  {stat.subtitle}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
)
StatsGrid.displayName = "StatsGrid"

export { StatsGrid }
export type { StatItem }