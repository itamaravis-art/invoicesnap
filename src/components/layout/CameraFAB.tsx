"use client";

import Link from "next/link";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

export function CameraFAB() {
  return (
    <div className="fixed bottom-24 start-6 z-[60]">
      <Link
        href="/receipts/new"
        className="bg-primary text-on-primary w-16 h-16 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all shutter-ring group"
      >
        <MaterialIcon
          icon="photo_camera"
          className="text-3xl group-hover:rotate-45 transition-transform"
        />
      </Link>
    </div>
  );
}
