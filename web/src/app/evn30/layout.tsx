import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";

import { AppearanceSync } from "./appearance";
import "./evn30.css";

/**
 * Radix has no media-query dark mode of its own — it keys off a `.dark` class.
 * Setting it before paint keeps the page from flashing light first.
 */
const APPEARANCE_SCRIPT = `
(function(){try{
  var d=document.documentElement;
  var dark=window.matchMedia('(prefers-color-scheme: dark)').matches;
  d.classList.add(dark?'dark':'light');
}catch(e){}})();
`;

export default function Evn30Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
      <AppearanceSync />
      <Theme accentColor="indigo" grayColor="slate" radius="medium" appearance="inherit">
        {children}
      </Theme>
    </>
  );
}
