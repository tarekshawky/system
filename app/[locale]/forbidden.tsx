import { getTranslations } from "next-intl/server";

export default async function Forbidden() {
  const t = await getTranslations("errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">{t("forbiddenTitle")}</h1>
      <p className="text-muted-foreground">{t("forbiddenMessage")}</p>
    </div>
  );
}
