import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect directly to the template builder
  redirect("/templates/builder")
}
