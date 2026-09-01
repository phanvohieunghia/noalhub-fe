import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { type MessageTree, pickMessages } from "./messages";
import { SHARED_NAMESPACES, type Namespace } from "./namespaces";

/**
 * Đưa message xuống Client Component — nhưng chỉ **đúng namespace của route
 * này**, không phải cả kho chuỗi (`docs/i18n-plan.md` §5).
 *
 * Server Component không cần provider: `getTranslations` đọc thẳng từ
 * `getRequestConfig`. Provider chỉ tồn tại vì client không có đường nào khác để
 * lấy message ngoài việc chúng được serialize vào payload — nên mỗi chuỗi thừa
 * ở đây là byte thừa trên đường truyền của **mọi** người vào trang.
 *
 * Đặt ở layout gần route nhất. Provider lồng nhau thì cái trong cùng thắng, nên
 * `namespace` phải là namespace của chính route đó; `common`/`nav`/`validation`
 * luôn được kèm sẵn.
 */
export async function IntlProvider({
  namespace,
  children,
}: {
  namespace?: Namespace;
  children: React.ReactNode;
}) {
  const messages = (await getMessages()) as MessageTree;
  const namespaces = namespace
    ? [...SHARED_NAMESPACES, namespace]
    : [...SHARED_NAMESPACES];

  return (
    <NextIntlClientProvider messages={pickMessages(messages, namespaces)}>
      {children}
    </NextIntlClientProvider>
  );
}
