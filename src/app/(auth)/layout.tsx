export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 via-background to-navy-100 dark:from-[#0f1929] dark:via-background dark:to-[#0d1f3c] p-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
