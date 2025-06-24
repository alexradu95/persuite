import * as React from "react"

type InfoCardColor = 'yellow' | 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'pink'

interface InfoCardSubValue {
  value: string | number
  label: string
}

interface InfoCardProps {
  title: string
  icon: string
  value: string | number
  subtitle?: string
  subValues?: InfoCardSubValue[]
  color?: InfoCardColor
  className?: string
}

const InfoCard = React.forwardRef<HTMLDivElement, InfoCardProps>(
  ({ title, icon, value, subtitle, subValues, color = 'yellow', className = "" }, ref) => {
    const cardClasses = `card-brutal bg-${color} ${className}`
    
    return (
      <div ref={ref} className={cardClasses}>
        <div className="card-brutal-header">
          <h3 className="card-brutal-title text-sm">{icon} {title}</h3>
        </div>
        <div className="card-brutal-content">
          <div className="text-3xl font-black mb-2">{value}</div>
          
          {subValues && subValues.length > 0 && (
            <div className="space-y-1 mb-2">
              {subValues.map((subValue, index) => (
                <div key={index} className="text-sm font-bold opacity-80">
                  {subValue.value} {subValue.label}
                </div>
              ))}
            </div>
          )}
          
          {subtitle && (
            <p className="text-xs font-bold uppercase tracking-wide opacity-80">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    )
  }
)
InfoCard.displayName = "InfoCard"

export { InfoCard }
export type { InfoCardProps, InfoCardColor, InfoCardSubValue }