import Link from "next/link";

import { RESTAURANT_CONFIGS } from "~/config/restaurants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-border text-muted-foreground mt-16 border-t pt-12 pb-16">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Column 1: Info & Disclaimer */}
        <div className="space-y-3">
          <h3 className="text-foreground text-base font-semibold tracking-wide">
            Lounaslistat
          </h3>
          <p className="text-sm leading-relaxed">
            Päivittäiset lounaslistat Ylen kampusalueen ja lähialueen (Pasila
            &amp; Ilmala) ravintoloista kootusti yhdessä paikassa.
          </p>
          <p className="text-sm leading-relaxed">
            Ruokalistat haetaan automaattisesti ravintoloiden omilta sivuilta.
            Tarkistathan erikoisruokavaliot ja mahdolliset muutokset suoraan
            ravintolasta.
          </p>
        </div>

        {/* Column 2: Ravintolat (Quick links) */}
        <div className="space-y-3">
          <h3 className="text-foreground text-base font-semibold tracking-wide">
            Ravintolat
          </h3>
          <ul className="space-y-2 text-sm">
            {RESTAURANT_CONFIGS.filter((r) => r.websiteUrl).map(
              (restaurant) => (
                <li key={restaurant.id}>
                  <a
                    href={restaurant.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors hover:underline"
                  >
                    <span>{restaurant.name}</span>
                    <svg
                      className="h-3.5 w-3.5 opacity-70"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                  </a>
                </li>
              ),
            )}
          </ul>
        </div>

        {/* Column 3: Radiaattori (Infopiste / Infonäyttö) */}
        <div className="space-y-3">
          <h3 className="text-foreground text-base font-semibold tracking-wide">
            Radiaattori
          </h3>
          <p className="text-sm leading-relaxed">
            Automaattisesti rullaava karusellinäkymä toimiston infonäytöille ja
            taukotiloihin.
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/radiator"
                className="hover:text-foreground inline-flex items-center gap-1.5 font-medium transition-colors hover:underline"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z"
                  />
                </svg>
                <span>Avaa radiaattorinäkymä</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Yhteys & Lähdekoodi */}
        <div className="space-y-3">
          <h3 className="text-foreground text-base font-semibold tracking-wide">
            Palaute &amp; Koodi
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a
                href="mailto:joonas.kauppinen@yle.fi"
                className="hover:text-foreground inline-flex items-center gap-2 transition-colors hover:underline"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
                <span>joonas.kauppinen@yle.fi</span>
              </a>
            </li>
            <li>
              <a
                href="https://github.com/joonasmkauppinen/yle-campus-lunch-list"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground inline-flex items-center gap-2 transition-colors hover:underline"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>GitHub-repositorio</span>
              </a>
            </li>
          </ul>
          <p className="pt-1 text-sm">
            Huomasitko virheen tai puuttuuko ravintola? Ota rohkeasti yhteyttä
            sähköpostitse tai avaa ilmoitus GitHubissa!
          </p>
        </div>
      </div>

      <div className="border-border/60 mt-10 flex flex-col items-center justify-between gap-2 border-t pt-6 text-sm sm:flex-row">
        <span
          className="order-1 inline-block h-6 w-6 shrink-0 bg-current opacity-60 sm:order-2"
          style={{
            maskImage: "url(/chef-hat.png)",
            WebkitMaskImage: "url(/chef-hat.png)",
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
          aria-hidden="true"
        />
        <p className="order-2 sm:order-1">© {currentYear} Joonas Kauppinen</p>
        <p className="order-3 text-sm sm:order-3">
          Pasilan ja Ilmalan alueen lounaat
        </p>
      </div>
    </footer>
  );
}
