"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useCreateBlogPost } from "@noalhub/api/blog";
import { Button } from "@noalhub/ui/button";

import { AdminErrorState } from "../admin-error-state";
import { Typography } from "@noalhub/ui/typography";

/**
 * `/posts/new` **tạo bản nháp rồi `replace` sang `/posts/[id]` ngay**
 * (`docs/blog-plan.md` §7.1).
 *
 * Vì sao không dựng một form "tạo mới" riêng: như vậy mọi thao tác sau đó chỉ có
 * MỘT đường lưu (`PATCH`), không phải hai nhánh create/update phải giữ đồng bộ
 * mãi mãi — kể cả `version`, `slug`, và checklist publish.
 *
 * `replace` chứ không `push`: bấm Back từ editor phải về `/posts`, không phải
 * quay lại đây rồi tạo thêm một bản nháp rỗng nữa.
 */
export function NewPostRedirect() {
  const router = useRouter();
  const create = useCreateBlogPost();
  // StrictMode ở dev chạy effect hai lần — không có chốt này là mỗi lần mở
  // `/posts/new` đẻ ra hai bản nháp.
  const started = useRef(false);

  // ⚠️ `mutateAsync` chứ KHÔNG phải `mutate(_, { onSuccess })`.
  //
  // Callback truyền vào `mutate` thuộc về observer của lần mount đó; StrictMode
  // unmount rồi mount lại ngay, observer đầu tiên bị huỷ nên callback không bao
  // giờ chạy — mà chốt `started` lại chặn lần mount thứ hai gọi lại. Kết quả:
  // bản nháp được tạo thật (POST 201) nhưng trang treo mãi ở "Đang tạo bản
  // nháp…". Promise của `mutateAsync` thì sống độc lập với observer.
  const start = () => {
    create
      .mutateAsync(undefined)
      .then((post) => router.replace(`/posts/${post.id}`))
      // Lỗi đã nằm trong `create.isError` và được render bên dưới; `catch` này
      // chỉ để promise không rơi ra ngoài thành unhandled rejection.
      .catch(() => {});
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (create.isError) {
    return (
      <main className="w-full p-6">
        <AdminErrorState error={create.error} />
        <div className="mt-3 flex gap-2">
          <Button
            onClick={() => {
              create.reset();
              start();
            }}
          >
            Thử lại
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full p-6">
      <Typography variant="body-3" className="opacity-70">
        Đang tạo bản nháp…
      </Typography>
    </main>
  );
}
