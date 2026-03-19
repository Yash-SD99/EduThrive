"use client"

/*
========================================
Reusable Button Component (EduThrive)
========================================

Supports:
- Variants (primary, secondary, outline, ghost, danger)
- Sizes (sm, md, lg)
- Left & Right icons
- Loading state
- Disabled state
- Custom className override

Usage Examples:

1) Normal Button
<Button>Save</Button>

2) With Left Icon
<Button leftIcon={<Plus size={16} />}>
  Add Student
</Button>

3) With Right Icon
<Button rightIcon={<ArrowRight size={16} />}>
  Continue
</Button>

4️) Icon Only Button
<Button variant="danger" size="sm">
  <Trash size={16} />
</Button>

5️) Loading Button
<Button loading>
  Saving...
</Button>

6️) Full Width Button
<Button className="w-full">
  Login
</Button>
*/

export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}) {

  /*
  ========================================
  Base Styles (shared across all buttons)
  ========================================
  */
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    rounded-md font-medium
    transition-all duration-200
    focus:outline-none focus:ring-2
    disabled:opacity-60 disabled:cursor-not-allowed
  `

  /*
  ========================================
  Variants (color styles)
  ========================================
  */
  const variants = {
    primary: `
      bg-primary text-white
      hover:opacity-90
      focus:ring-[rgb(var(--primary))]
    `,
    secondary: `
      bg-secondary text-white
      hover:opacity-90
      focus:ring-[rgb(var(--secondary))]
    `,
    outline: `
      border border-[rgb(var(--text)/0.3)]
      text-main bg-transparent
      hover:bg-[rgb(var(--text)/0.05)]
      focus:ring-[rgb(var(--primary))]
    `,
    ghost: `
      text-main bg-transparent
      hover:bg-[rgb(var(--text)/0.05)]
      focus:ring-[rgb(var(--primary))]
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700
      focus:ring-red-500
    `
  }

  /*
  ========================================
  Sizes (padding & font size)
  ========================================
  */
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${sizes[size]}
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {/* Left Icon */}
      {leftIcon && !loading && (
        <span className="flex items-center">
          {leftIcon}
        </span>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        children
      )}

      {/* Right Icon */}
      {rightIcon && !loading && (
        <span className="flex items-center">
          {rightIcon}
        </span>
      )}
    </button>
  )
}