import { Container, Title, Text, SimpleGrid, Card, ThemeIcon } from '@mantine/core';
import { IconSearch, IconChartPie3, IconSettings } from '@tabler/icons-react';

const features = [
  {
    icon: IconSearch,
    title: 'Track Emissions',
    description:
      'Easily monitor your carbon footprint by connecting your accounts and tracking your daily activities.',
  },
  {
    icon: IconChartPie3,
    title: 'Analyze Data',
    description:
      'Get detailed insights into your emissions with our comprehensive analytics dashboard.',
  },
  {
    icon: IconSettings,
    title: 'Reduce Impact',
    description:
      'Implement strategies to lower your environmental impact with our personalized recommendations.',
  },
];

function Feature({ icon, title, description }: (typeof features)[0]) {
  return (
    <Card shadow="md" withBorder padding="xl" radius="md">
      <ThemeIcon size={44} radius="md" variant="gradient" gradient={{ from: 'teal', to: 'blue' }}>

      </ThemeIcon>
      <Title order={3} mt="sm">
        {title}
      </Title>
      <Text color="dimmed" mt="sm">
        {description}
      </Text>
    </Card>
  );
}

export function HowItWorks() {
  return (
    <Container size="xl" py="xl">
      <Title mb="md">
        How It Works
      </Title>
      <Text color="dimmed">
        Learn how EmissionSense can help you track, analyze, and reduce your carbon emissions.
      </Text>
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" mt={50}>
        {features.map((feature) => (
          <Feature {...feature} key={feature.title} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
