import type { Metadata } from "next";

import { OverviewContent } from "@/components/overview/overview-content";

export const metadata: Metadata = { title: "Tổng quan" };

export default function OverviewPage() {
  return <OverviewContent />;
}
