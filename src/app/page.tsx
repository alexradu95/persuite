"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to working days page
    router.replace("/income");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting to Working Days...</h2>
        <p className="text-neutral-600">Please wait while we load your working days tracker.</p>
      </div>
    </div>
  );
}
