export function OrderIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Clipboard */}
      <rect x="2" y="3" width="12" height="16" rx="1" ry="1" />
      <circle cx="8" cy="6" r="1" fill="currentColor" />
      
      {/* Checkboxes */}
      <rect x="4" y="10" width="2" height="2" rx="0.3" />
      <line x1="7" y1="11" x2="10" y2="11" />
      
      <rect x="4" y="14" width="2" height="2" rx="0.3" />
      <line x1="7" y1="15" x2="10" y2="15" />
      
      {/* Box/Package (isometric style) */}
      <path d="M14 9 L19 12 L19 19 L14 16 Z" strokeWidth="1.5" />
      <path d="M14 9 L14 16 L9 13 L9 6 Z" strokeWidth="1.5" />
      <path d="M19 12 L14 9 L9 12 L14 15 Z" fill="currentColor" opacity="0.1" />
    </svg>
  )
}
