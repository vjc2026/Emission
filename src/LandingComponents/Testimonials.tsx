import { Container, Title, Text, Card, Avatar, Group } from '@mantine/core';

const testimonials = [
  {
    name: 'Alice Johnson',
    title: 'Environmental Activist',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
    testimonial:
      'EmissionSense has transformed the way I track my environmental impact. It\'s easy to use and incredibly insightful!',
  },
  {
    name: 'Bob Williams',
    title: 'Sustainability Manager',
    image: 'https://images.unsplash.com/photo-1580839849288-635d56a4ed96?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
    testimonial:
      'As a sustainability manager, I rely on EmissionSense to provide accurate data and help our company reduce its carbon footprint.',
  },
];

function TestimonialCard({ name, title, image, testimonial }: (typeof testimonials)[0]) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group align="apart" mt="md" mb="xs">
        <Text fw={500}>{name}</Text>
      </Group>

      <Text size="sm" color="dimmed">
        {title}
      </Text>

      <Text size="sm" color="dimmed" mt="md">
        {testimonial}
      </Text>
      <Avatar src={image} mt="md" radius="xl" />
    </Card>
  );
}

export function Testimonials() {
  return (
    <Container size="xl" py="xl">
      <Title style={{ textAlign: 'center' }} mb="md">
        Testimonials
      </Title>
      <Text color="dimmed" style={{ textAlign: 'center' }}>
        See what our users are saying about EmissionSense.
      </Text>
      <Group mt={50} style={(theme) => ({ gap: theme.spacing.xl })}>
        {testimonials.map((testimonial) => (
          <TestimonialCard {...testimonial} key={testimonial.name} />
        ))}
      </Group>
    </Container>
  );
}
