import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { QaDatasetDetail } from "@/components/qa/qa-dataset-detail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.qa");
  return { title: t("datasets.detailTitle") };
}

export default async function QaDatasetDetailPage({ params }: PageProps<"/qa/datasets/[id]">) {
  const { id } = await params;

  return (
    <IntlProvider namespace="admin.qa">
      <QaDatasetDetail datasetId={id} />
    </IntlProvider>
  );
}
