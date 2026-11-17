"use client";

import { Box, Card, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useMemo } from "react";

import { money, percent } from "@/lib/evn30/format";
import { DEFAULT_INPUTS, simulate } from "@/lib/evn30/simulate";
import type { Snapshot } from "@/lib/evn30/types";

export function Evn30Simulator({ snapshot }: { snapshot: Snapshot }) {
  const result = useMemo(() => simulate(snapshot, DEFAULT_INPUTS), [snapshot]);

  return (
    <Container size="3" px="4" py="6">
      <Heading size="8" mb="2">
        What if I&apos;d just kept buying?
      </Heading>
      <Text as="p" color="gray" mb="5">
        Paid in {money(result.paidIn)} over {result.months.length} months.
      </Text>
      <Flex gap="3" wrap="wrap">
        {result.channels.map((c) => (
          <Box key={c.key} flexGrow="1">
            <Card>
              <Text as="div" size="2" color="gray">
                {c.label}
              </Text>
              <Text as="div" size="7" weight="bold">
                {money(c.value)}
              </Text>
              <Text as="div" size="2" color="gray">
                {percent(c.xirr)} a year
              </Text>
            </Card>
          </Box>
        ))}
      </Flex>
    </Container>
  );
}
