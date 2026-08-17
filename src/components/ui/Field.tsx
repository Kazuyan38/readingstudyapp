import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

function FieldWrapper({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-(--text-muted)">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-(--glass-stroke) bg-transparent px-3.5 py-2.5 text-(--text-primary) outline-none transition-colors focus:border-(--accent)'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function TextField({ label, ...inputProps }: TextFieldProps) {
  return (
    <FieldWrapper label={label}>
      <input className={inputClass} {...inputProps} />
    </FieldWrapper>
  )
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

export function TextAreaField({ label, ...areaProps }: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label}>
      <textarea className={`${inputClass} resize-y`} rows={4} {...areaProps} />
    </FieldWrapper>
  )
}
