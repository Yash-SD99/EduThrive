"use client"

export default function Input({
  label,
  type = "text",
  placeholder,
  register,
  name,
  error,
  validation,
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-semibold text-main">
          {label}
        </label>
      )}

      <input
        type={type}
        placeholder={placeholder}
        {...register(name)}
        {...props}
        className={`
          w-full px-3 py-2 rounded-md
          border
          bg-card text-main
          border-[rgb(var(--text)/0.2)]
          focus:outline-none
          focus:ring-2
          focus:ring-[rgb(var(--primary))]
          placeholder:opacity-50
          transition
        `}
      />

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}