import React, { useState } from 'react';
import AdminNavbar from './AdminNavbar';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={`${styles.container} ${isMinimized ? styles.minimized : ''}`}>
      <AdminNavbar onToggleMinimize={() => setIsMinimized(!isMinimized)} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;