import { CustomField } from '../types/departmentTemplate'

interface CustomFieldsRendererProps {
  fields: CustomField[]
  values: Record<string, any>
  onChange: (fieldName: string, value: any) => void
  errors?: Record<string, string>
}

export default function CustomFieldsRenderer({
  fields,
  values,
  onChange,
  errors = {}
}: CustomFieldsRendererProps) {
  if (!fields || fields.length === 0) return null

  const renderField = (field: CustomField) => {
    const value = values[field.name] || ''
    const error = errors[field.name]

    const baseInputClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    }`

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={baseInputClasses}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
            className={baseInputClasses}
          />
        )

      case 'date':
        return (
          <input
            type="date"
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            required={field.required}
            className={baseInputClasses}
          />
        )

      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className={baseInputClasses}
          />
        )

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            required={field.required}
            className={baseInputClasses}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <select
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
              onChange(field.name, selectedOptions)
            }}
            required={field.required}
            multiple
            className={`${baseInputClasses} min-h-[100px]`}
          >
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📝 Department-Specific Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
              {field.helpText && (
                <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
              )}
              {errors[field.name] && (
                <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper component for displaying custom field values (read-only)
export function CustomFieldsDisplay({
  fields,
  values
}: {
  fields: CustomField[]
  values: Record<string, any>
}) {
  if (!fields || fields.length === 0 || !values) return null

  const hasValues = fields.some(field => values[field.name])
  if (!hasValues) return null

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mr-4">
          <span className="text-2xl">📝</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Department-Specific Information</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const value = values[field.name]
          if (!value) return null

          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-500">{field.label}</label>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {Array.isArray(value) ? value.join(', ') : value}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
