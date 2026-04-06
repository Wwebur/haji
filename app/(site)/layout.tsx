/**
 * Wraps the job board (haji) so legacy CSS resets stay scoped and do not
 * strip Tailwind/shadcn on the admin app under /admin/.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="haji-public min-h-screen">{children}</div>;
}
