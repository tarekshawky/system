import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app");

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">{t("name")}</h1>
    </main>
  );
}
