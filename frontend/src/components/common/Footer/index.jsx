import { Logo } from "@/components/common/NavBar/logo";

const Footer = ({
  tagline = "Components made easy.",
  menuItems = [
    {
      title: "Product",
      links: [
        { text: "Overview", url: "#" },
        { text: "Features", url: "#" },
        { text: "Marketplace", url: "#" },
        { text: "Integrations", url: "#" },
        { text: "Pricing", url: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { text: "About", url: "#" },
        { text: "Team", url: "#" },
        { text: "Blog", url: "#" },
        { text: "Careers", url: "#" },
        { text: "Contact", url: "#" },
        { text: "Privacy", url: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { text: "Help", url: "#" },
        { text: "Sales", url: "#" },
        { text: "Advertise", url: "#" },
      ],
    },
    {
      title: "Social",
      links: [
        { text: "Twitter", url: "#" },
        { text: "Instagram", url: "#" },
        { text: "LinkedIn", url: "#" },
      ],
    },
  ],
  copyright = "© 2025 Team 3 From UTE. All rights reserved.",
  bottomLinks = [
    { text: "Terms and Conditions", url: "#" },
    { text: "Privacy Policy", url: "#" },
  ],
}) => {
  return (
    <section className="w-full py-32 text-lg">
      {/* Wrapper rộng hơn */}
      <div className="w-full max-w-9xl mx-auto px-10">
        <footer role="contentinfo" aria-label="Site footer" className="w-full">

          {/* TOP: Brand + Menus */}
          <div
            className="
              w-full max-w-9xl mx-auto
              grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6
              gap-y-12 gap-x-12
              justify-items-center lg:justify-items-start
              text-center lg:text-left
            "
          >
            {/* Brand / tagline */}
            <div className="lg:col-span-2 flex flex-col items-center lg:items-start">
              <button
                type="button"
                className="flex items-center gap-3 cursor-pointer"
                aria-label="Go to homepage"
              >
                <span className="scale-110">
                  <Logo />
                </span>
              </button>
              <p className="mt-6 font-semibold text-xl">{tagline}</p>
            </div>

            {/* Menus */}
            {menuItems.map((section, i) => (
              <nav key={i} aria-label={section.title} className="w-48">
                <h3 className="mb-6 font-bold text-xl">{section.title}</h3>
                <ul className="text-muted-foreground space-y-4 text-lg">
                  {section.links.map((link, j) => (
                    <li key={j} className="font-medium">
                      <a
                        href={link.url}
                        className="hover:text-primary transition-colors"
                      >
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* BOTTOM: Bar ngang */}
          <div
            className="
              w-full max-w-9xl mx-auto
              text-muted-foreground mt-20 border-t pt-10
              text-base md:text-lg font-medium
              flex flex-col md:flex-row
              items-center justify-between
              gap-4 md:gap-8
            "
          >
            <p className="text-center md:text-left">{copyright}</p>
            <ul className="flex flex-wrap items-center gap-6">
              {bottomLinks.map((link, k) => (
                <li key={k}>
                  <a
                    href={link.url}
                    className="underline hover:text-primary transition-colors"
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </footer>
      </div>
    </section>
  );
};

export { Footer };
