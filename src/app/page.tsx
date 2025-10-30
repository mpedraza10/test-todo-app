// src/app/page.tsx
import AuthGuard from "@/components/AuthGuard";

export default function HomePage() {
  return <AuthGuard />;
}
