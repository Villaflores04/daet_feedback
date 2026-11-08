"use client";

import { useEffect } from "react";
import { captureSourceTag } from "@/lib/pulse/source-tag";

export function SourceTagCapture() {
  useEffect(() => captureSourceTag(), []);
  return null;
}
