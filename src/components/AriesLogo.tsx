export default function AriesLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="100" height="100" rx="20" fill="#0f172a" />
      <g fill="none" stroke="#6366f1" strokeWidth="7" strokeLinecap="round">
        <line x1="50" y1="18" x2="50" y2="34" />
        <path d="M50 34 Q28 34 28 54 Q28 72 44 72" />
        <path d="M50 34 Q72 34 72 54 Q72 72 56 72" />
      </g>
    </svg>
  );
}
