import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  IconBellRinging,
  IconReceipt2,
  IconFingerprint,
  IconKey,
  IconDatabaseImport,
  Icon2fa,
  IconSettings,
  IconLogout,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import styles from './AdminNavbar.module.css';

const data = [
  { link: '/AdminPages/AdminDashboard', label: 'Dashboard', icon: IconBellRinging },
  { link: '/AdminPages/AdminUsers', label: 'Users', icon: IconReceipt2 },
  { link: '/AdminPages/AdminEmissionView', label: 'Admin Emission View', icon: IconFingerprint },
];

interface AdminNavbarProps {
  onToggleMinimize: () => void;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ onToggleMinimize }) => {
  const router = useRouter();
  const [active, setActive] = useState(router.pathname);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const toggleNavbar = () => {
    setIsMinimized(!isMinimized);
    onToggleMinimize();
  };

  const links = data.map((item) => (
    <Link href={item.link} key={item.label}>
      <div
        className={`${styles.link} ${isMinimized ? styles.minimizedLink : ''}`}
        data-active={router.pathname === item.link || undefined}
        onClick={() => setActive(item.link)}
      >
        <item.icon className={styles.linkIcon} stroke={1.5} />
        {!isMinimized && <span>{item.label}</span>}
      </div>
    </Link>
  ));

  return (
    <nav className={`${styles.navbar} ${isMinimized ? styles.minimized : ''}`}>
      <button className={styles.toggleButton} onClick={toggleNavbar}>
        {isMinimized ? <IconChevronRight /> : <IconChevronLeft />}
      </button>
      <div className={styles.navbarMain}>
        {links}
      </div>
      <div className={styles.footer}>
        <div className={styles.link} onClick={handleLogout}>
          <IconLogout className={styles.linkIcon} stroke={1.5} />
          {!isMinimized && <span>Logout</span>}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;