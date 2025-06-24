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
    // Neo-brutalism styling with thick borders and hard shadows
    const baseClasses = "bg-white border-[5px] border-black p-6 relative"
    
    // Custom shadow for neo-brutalism effect
    const shadowStyle = {
      boxShadow: '6px 6px 0px #000000'
    }
    
    // Color-specific background classes - no text color here since we set it conditionally
    const colorClasses = {
      yellow: "bg-amber-400 text-black",
      blue: "bg-blue-500", 
      green: "bg-emerald-500",
      purple: "bg-purple-500",
      red: "bg-red-500",
      orange: "bg-orange-500",
      pink: "bg-pink-500"
    }
    
    // Border color for header (black for yellow, white for others)
    const headerBorderColor = color === 'yellow' ? 'border-black' : 'border-white'
    
    const textColorClass = color === 'yellow' ? 'text-black' : 'text-white'
    const cardClasses = `${baseClasses} ${colorClasses[color]} ${textColorClass} ${className}`
    
    return (
      <div ref={ref} className={cardClasses} style={shadowStyle}>
        <div className={`flex justify-between items-center mb-4 pb-3 border-b-[3px] ${headerBorderColor}`}>
          <h3 className="font-black text-sm uppercase tracking-wide m-0" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            {icon} {title}
          </h3>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-black mb-2" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            {value}
          </div>
          
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