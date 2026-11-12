import type { DailyMenu } from "@acme/shared-types";

export function MenuFreshness({ menu }: { menu?: DailyMenu }) {
  if (
    !menu?.items.length ||
    !menu.availability ||
    menu.availability === "published"
  )
    return null;
  return (
    <p
      role="status"
      className="my-3 text-sm text-amber-700 dark:text-amber-400"
    >
      Ruokalistan päivitys ei onnistunut. Näytetään viimeisin saatavilla oleva
      lista.
    </p>
  );
}

export function MenuUnavailable({ menu }: { menu?: DailyMenu }) {
  return (
    <p className="text-muted-foreground text-sm">
      {menu?.availability === "closed"
        ? "Suljettu valittuna päivänä."
        : menu?.availability === "failed"
          ? "Ruokalistaa ei voitu päivittää tälle päivälle."
          : "Ruokalistaa ei ole vielä julkaistu tälle päivälle."}
    </p>
  );
}
