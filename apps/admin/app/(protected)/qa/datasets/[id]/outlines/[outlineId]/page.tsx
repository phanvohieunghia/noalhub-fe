import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { QaOutlineEditor } from "@/components/qa/qa-outline-editor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.qa");
  return { title: t("outlines.editorTitle") };
}

/**
 * Nested under the dataset on purpose: the outline DTO does not repeat
 * `datasetId`, and the version list plus "make this the current one" both need
 * it. Taking it from the URL beats stashing it somewhere and hoping a direct
 * link still has it.
 */
export default async function QaOutlinePage({
  params,
}: PageProps<"/qa/datasets/[id]/outlines/[outlineId]">) {
  const { id, outlineId } = await params;

  return (
    <IntlProvider namespace="admin.qa">
      <QaOutlineEditor datasetId={id} outlineId={outlineId} />
    </IntlProvider>
  );
}
