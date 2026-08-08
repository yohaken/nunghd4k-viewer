export default function VerifyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-primary text-5xl mb-6">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 4L12 13 2 4" />
          </svg>
        </div>

        <h1 className="text-2xl font-heading font-extrabold text-primary mb-3">
          NUNGHD4K
        </h1>
        <h2 className="text-lg font-heading font-semibold text-text mb-2">
          ตรวจสอบอีเมลของคุณ
        </h2>
        <p className="text-dim text-sm font-body leading-relaxed">
          เราได้ส่งลิงก์เข้าสู่ระบบไปที่อีเมลของคุณแล้ว
          <br />
          กรุณาเปิดอีเมลและคลิกลิงก์เพื่อเข้าใช้งาน
        </p>
        <p className="text-dim/60 text-xs mt-4 font-body">
          หากไม่พบอีเมล กรุณาตรวจสอบโฟลเดอร์ Spam
        </p>
      </div>
    </main>
  );
}
