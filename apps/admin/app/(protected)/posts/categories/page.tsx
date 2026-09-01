import type { Metadata } from "next";

import { CategoryManager } from "@/components/posts/category-manager";

export const metadata: Metadata = { title: "Chuyên mục" };

export default function CategoriesPage() {
  return <CategoryManager />;
}
