export function Logo({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="32" height="32" rx="8" fill="url(#logo_grad)" />
      <path d="M9 20.5L14.5 15L18 18.5L23.5 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 16.5V10.5H18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="logo_grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ADE80"/>
          <stop offset="1" stopColor="#16A34A"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
