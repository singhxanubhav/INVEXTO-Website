"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      className="absolute left-4 top-4 z-20 gap-1.5 text-gray-400 hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}
