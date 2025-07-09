export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="h-full">
      {children}
    </main>
  )
}
