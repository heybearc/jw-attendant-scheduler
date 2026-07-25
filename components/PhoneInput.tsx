import { useEffect } from 'react'
import { formatPhoneNumber } from '../src/lib/formatPhone'

interface PhoneInputProps {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  label?: string
}

export default function PhoneInput({
  id,
  name,
  value,
  onChange,
  placeholder = '(555) 123-4567',
  required = false,
  disabled = false,
  className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
  label
}: PhoneInputProps) {
  useEffect(() => {
    if (value) {
      const formatted = formatPhoneNumber(value)
      if (formatted !== value) {
        onChange(formatted)
      }
    }
    // Only re-format when the external value changes (paste / load), not on every keystroke cycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    onChange(formatted)
  }

  return (
    <>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type="tel"
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
        maxLength={14} // (XXX) XXX-XXXX = 14 characters
      />
    </>
  )
}
