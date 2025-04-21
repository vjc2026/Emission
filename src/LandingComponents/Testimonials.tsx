import { Container, Title, Text, Card, Avatar, Group, SimpleGrid } from '@mantine/core';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const testimonials = [
  {
    name: 'Alice Johnson',
    title: 'Environmental Scientist',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    testimonial: 'EmissionSense has revolutionized how we track environmental impact in our research. The real-time analytics are incredibly precise.',
  },
  {
    name: 'Bob Williams',
    title: 'Tech Sustainability Lead',
    image: 'https://images.unsplash.com/photo-1580839849288-635d56a4ed96?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    testimonial: 'The insights provided by EmissionSense have helped us reduce our development carbon footprint by 40%. It\'s an essential tool for modern tech companies.',
  },
  {
    name: 'Sarah Chen',
    title: 'Software Architect',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    testimonial: 'As someone focused on sustainable software design, EmissionSense gives me the metrics I need to make environmentally conscious development decisions.',
  }
];

function TestimonialCard({ name, title, image, testimonial }: (typeof testimonials)[0]) {
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
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Group align="center" mb="md">
            <Avatar 
              src={image} 
              size={60} 
              radius="xl"
              style={{ 
                border: '2px solid rgba(0, 255, 200, 0.3)',
                boxShadow: '0 0 20px rgba(0, 255, 200, 0.1)'
              }}
            />
            <div>
              <Text fw={700} size="lg" style={{ 
                background: 'linear-gradient(135deg, #fff 0%, #9fffe7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>{name}</Text>
              <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{title}</Text>
            </div>
          </Group>
          <Text 
            size="md" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6,
              fontStyle: 'italic'
            }}
          >
            "{testimonial}"
          </Text>
        </div>
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(0,255,200,0.07) 0%, transparent 70%)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          }}
          className="card-glow"
        />
      </Card>
    </motion.div>
  );
}

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div 
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        background: 'linear-gradient(180deg, rgba(0,70,67,0.97) 0%, rgba(0,31,63,0.95) 100%)'
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
            Trusted by Developers Worldwide
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
            See how EmissionSense is making an impact in the developer community
          </Text>
        </motion.div>

        <SimpleGrid 
          cols={{ base: 1, sm: 2, md: 3 }} 
          spacing="xl"
          style={{ position: 'relative', zIndex: 1, width: '100%', padding: '0 2rem' }}
        >
          {testimonials.map((testimonial) => (
            <TestimonialCard 
              key={testimonial.name} 
              {...testimonial} 
            />
          ))}
        </SimpleGrid>

        <style jsx global>{`
          .card-glow {
            opacity: 0;
          }
          .mantine-Card-root:hover .card-glow {
            opacity: 1;
          }
        `}</style>
      </Container>
    </div>
  );
}
