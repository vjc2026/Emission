import { useRouter } from 'next/router';
import { useEffect } from 'react';

// This is a placeholder file to prevent Next.js from trying to render ProtectedRoute as a page
// The actual ProtectedRoute component is now in src/components/ProtectedRoute.tsx
export default function ProtectedRoutePlaceholder() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to home page if this page is accessed directly
    router.replace('/');
  }, [router]);
  
  return null;
}