import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";

import "./evn30.css";

/**
 * Radix has no media-query dark mode of its own — it keys off a `.dark` class.
 * Setting it before paint keeps the page from flashing the wrong way, and the
 * reader's own choice has to be read here too, or a dark-mode reader on a light
 * machine would see a white flash on every load.
 */
const APPEARANCE_SCRIPT = `
(function(){try{
  var c=null;
  try{c=localStorage.getItem('evn30:theme:v1')}catch(e){}
  var dark=c==='dark'||(c!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.add(dark?'dark':'light');
}catch(e){}})();
`;

export default function Evn30Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
      <Theme accentColor="indigo" grayColor="slate" radius="medium" appearance="inherit">
        {children}
      </Theme>
    </>
  );
}
