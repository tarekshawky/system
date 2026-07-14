import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const t = await getTranslations("nav");

  return <h1 className="text-xl font-semibold">{t("dashboard")}</h1>;
}
