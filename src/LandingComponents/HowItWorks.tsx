import { Container, Title, Text, SimpleGrid, Card, ThemeIcon } from '@mantine/core';
import { IconSearch, IconChartPie3, IconSettings } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    icon: IconSearch,
    title: 'Track Emissions',
    description:
      'Real-time monitoring of your carbon footprint during development. Get precise measurements of your environmental impact.',
  },
  {
    icon: IconChartPie3,
    title: 'Analyze Data',
    description:
      'Advanced analytics dashboard provides deep insights into your emissions patterns and identifies optimization opportunities.',
  },
  {
    icon: IconSettings,
    title: 'Optimize Impact',
    description:
      'Smart recommendations help you implement effective strategies to reduce your carbon footprint and build sustainably.',
  },
];

function Feature({ icon: Icon, title, description }: (typeof features)[0]) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
    >
      <Card
        shadow="sm"
        padding="xl"
        radius="md"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,255,200,0.05) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.07)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            borderColor: 'rgba(0,255,200,0.2)',
            boxShadow: '0 10px 30px rgba(0,255,200,0.1)'
          }
        }}
      >
        <ThemeIcon
          size={60}
          radius="md"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,200,0.15) 0%, rgba(0,200,255,0.1) 100%)',
            border: '1px solid rgba(0,255,200,0.2)',
            marginBottom: '1.5rem',
            boxShadow: '0 0 20px rgba(0,255,200,0.1)'
          }}
        >
          <Icon size={28} style={{ color: '#00ffc8' }} />
        </ThemeIcon>

        <Text
          fw={700}
          size="lg"
          mb="sm"
          style={{
            background: 'linear-gradient(135deg, #fff 0%, #9fffe7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {title}
        </Text>

        <Text style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
          {description}
        </Text>
      </Card>
    </motion.div>
  );
}

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div 
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        background: 'linear-gradient(180deg, rgba(0,31,63,0.97) 0%, rgba(0,70,67,0.95) 100%)'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 20% 20%, rgba(0,255,200,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,200,255,0.05) 0%, transparent 50%)',
          opacity: 0.6,
          zIndex: 0
        }}
      />

      <Container 
        size="xl" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '6rem 0',
          margin: '0 auto',
          zIndex: 1
        }}
      >
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
          style={{ position: 'relative', zIndex: 1, width: '100%', padding: '0 2rem' }}
        >
          <Title 
            ta="center" 
            mb="sm"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #fff 0%, #9fffe7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem'
            }}
          >
            How It Works
          </Title>
          
          <Text 
            ta="center" 
            mb={40}
            style={{ 
              color: '#b4ffe9',
              fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
              maxWidth: '700px',
              margin: '0 auto 3rem auto'
            }}
          >
            Discover how EmissionSense empowers you to build sustainably and make a real environmental impact
          </Text>

          <SimpleGrid 
            cols={{ base: 1, sm: 2, md: 3 }} 
            spacing="xl"
            style={{ position: 'relative', zIndex: 1 }}
          >
            {features.map((feature) => (
              <Feature {...feature} key={feature.title} />
            ))}
          </SimpleGrid>
        </motion.div>
      </Container>
    </div>
  );
}
