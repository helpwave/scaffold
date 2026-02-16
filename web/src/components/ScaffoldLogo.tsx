const BRAND_PURPLE = '#7b4cd9'

export function ScaffoldLogo({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-md font-semibold text-white ${className}`}
      style={{
        width: 32,
        height: 32,
        backgroundColor: BRAND_PURPLE,
      }}
    >
      <span className="text-lg leading-none" style={{ color: 'white' }}>
        s
      </span>
    </div>
  )
}
