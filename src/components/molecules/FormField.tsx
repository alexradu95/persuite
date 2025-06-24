import * as React from "react"
import { Label, Input } from "../atoms"
import type { InputProps, LabelProps } from "../atoms"

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  labelProps?: LabelProps
  inputProps?: InputProps
  className?: string
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, labelProps, inputProps, className = "" }, ref) => {
    const fieldId = inputProps?.id || `field-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className={`space-y-2 ${className}`}>
        <Label 
          htmlFor={fieldId}
          {...labelProps}
        >
          {label}
        </Label>
        
        <Input
          id={fieldId}
          hasError={!!error}
          ref={ref}
          {...inputProps}
        />
        
        {hint && !error && (
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
            {hint}
          </p>
        )}
        
        {error && (
          <p className="text-xs font-black text-red uppercase tracking-wide">
            ❌ {error}
          </p>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }