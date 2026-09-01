import { redirect } from "next/navigation";

/**
 * `/blogs/category` trần → về danh sách, **không** 404 (`docs/blog-plan.md` §6.5).
 *
 * Nav không bao giờ trỏ tới URL này; người vào đây là do gõ tay hoặc cắt bớt
 * URL — và với họ trang danh sách mới là thứ cần, không phải một trang lỗi.
 */
export default function CategoryIndexPage() {
  redirect("/blogs");
}
