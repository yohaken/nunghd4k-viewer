import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-dim animate-pulse font-body">กำลังโหลด...</p>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
