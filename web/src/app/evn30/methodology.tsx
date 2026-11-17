import { Box, Heading, Separator, Text } from "@radix-ui/themes";

import type { Lang } from "@/lib/evn30/copy";
import { METHODOLOGY } from "@/lib/evn30/methodology";

/**
 * The page explaining itself. Rendered straight from the content module so
 * there is one place to correct when the engine changes — a methodology tab
 * that drifts from the code is worse than none at all.
 */
export function Methodology({ lang }: { lang: Lang }) {
  const sections = METHODOLOGY[lang];

  return (
    <Box style={{ maxWidth: "68ch" }}>
      {sections.map((section, i) => (
        <Box key={section.id}>
          {i > 0 ? <Separator size="4" my="4" /> : null}
          <Heading size="3" mb="2">
            {section.heading}
          </Heading>
          {section.body.map((paragraph, j) => (
            <Text as="p" key={j} size="2" color="gray" mb="2">
              {paragraph}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}
