"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to wealth management page
    router.replace("/wealth");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting to Wealth Management...</h2>
        <p className="text-neutral-600">Please wait while we load your portfolio.</p>
      </div>
    </div>
  );
}
