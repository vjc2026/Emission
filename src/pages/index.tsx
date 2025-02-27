import React, { useEffect, useState, useCallback } from 'react';
import { Title, Text, Container } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useRouter } from 'next/router';
import { IconTree, IconLeaf, IconRecycle, IconWindmill, IconPlant2, IconChartLine, IconBulb } from '@tabler/icons-react';
import { motion, useAnimation } from 'framer-motion';
import styles from './Landing.module.css';
import { HowItWorks } from '../LandingComponents/HowItWorks';
import { Testimonials } from '../LandingComponents/Testimonials';
import ClientRequest from '../LandingComponents/ClientRequest';

const LandingPage = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const controls = useAnimation();
  
  const [stats, setStats] = useState({
    treesPlanted: 0,
    emissionsReduced: 0,
    usersHelped: 0
  });

  useEffect(() => {
    controls.start('visible');
    const interval = setInterval(() => {
      setStats(prev => ({
        treesPlanted: Math.min(prev.treesPlanted + 1, 1000),
        emissionsReduced: Math.min(prev.emissionsReduced + 5, 2500),
        usersHelped: Math.min(prev.usersHelped + 2, 500)
      }));
    }, 50);
    return () => clearInterval(interval);
  }, [controls]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isMobile]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.215, 0.61, 0.355, 1]
      }
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div 
          className={styles.particleBackground} 
          style={{ 
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        <div className={styles.heroContent}>
          <motion.div 
            className={styles.heroText}
            variants={containerVariants}
            initial="hidden"
            animate={controls}
          >
            <motion.h1 
              className={styles.heroTitle}
              variants={itemVariants}
            >
              Transform Your<br />
              <span className={styles.gradientText}>Carbon Impact</span>
            </motion.h1>
            
            <motion.p 
              className={styles.heroSubtitle}
              variants={itemVariants}
            >
              Join the movement towards a sustainable future. Track, analyze, and reduce your environmental impact with precision.
            </motion.p>
            
            <motion.button 
              className={styles.actionButton}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02,
                boxShadow: '0 5px 30px rgba(0, 255, 200, 0.4)'
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/Login')}
            >
              Start Your Green Journey
            </motion.button>
          </motion.div>

          <motion.div 
            className={styles.heroVisual}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: {
                duration: 1,
                ease: [0.215, 0.61, 0.355, 1]
              }
            }}
          >
            <motion.div 
              className={styles.glowingOrb}
              animate={{
                scale: [1, 1.03, 1],
                opacity: [0.85, 1, 0.85],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <IconPlant2 
                size={120} 
                color="#00ffc8" 
                stroke={1} 
                style={{ 
                  filter: 'drop-shadow(0 0 20px rgba(0, 255, 200, 0.3))',
                  opacity: 0.8
                }} 
              />
            </motion.div>
          </motion.div>
        </div>
        
        <motion.div 
          className={styles.scrollIndicator}
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: [0.4, 0.8, 0.4], 
            y: [0, 10, 0] 
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
            delay: 1
          }}
        >
          <IconLeaf 
            size={24} 
            color="#00ffc8" 
            style={{ transform: 'rotate(45deg)' }} 
          />
        </motion.div>
      </section>

      <section className={styles.featureSection}>
        <Container size="xl">
          <motion.div 
            className={styles.featureGrid}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.6,
                ease: [0.215, 0.61, 0.355, 1]
              }
            }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <IconChartLine size={24} color="#00ffc8" />
              </div>
              <Title order={3} style={{ color: 'white', marginBottom: '1rem' }}>Smart Analytics</Title>
              <Text style={{ color: '#b4ffe9' }}>
                Advanced algorithms provide real-time monitoring and precise tracking of your carbon footprint.
              </Text>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <IconBulb size={24} color="#00ffc8" />
              </div>
              <Title order={3} style={{ color: 'white', marginBottom: '1rem' }}>Actionable Insights</Title>
              <Text style={{ color: '#b4ffe9' }}>
                Get personalized recommendations and practical solutions to reduce your environmental impact.
              </Text>
            </div>
          </motion.div>
        </Container>
      </section>
      
      <div className={styles.sectionConnector}></div>
      
      <HowItWorks />
      
      <div className={styles.sectionConnector}></div>
      
      <Testimonials />
      
      <div className={styles.sectionConnector}></div>
      
      <ClientRequest />
      
      <footer className={styles.footer}>
        <Container size="xl" style={{ padding: '2rem 1rem' }}>
          <div className={styles.footerContent}>
            <Text ta="center" size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              © {new Date().getFullYear()} EmissionSense. All rights reserved. Building a sustainable future, one line of code at a time.
            </Text>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;