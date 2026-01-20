import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import BottomNav from './BottomNav';

interface PageLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const PageLayout: React.FC<PageLayoutProps> = ({ children, showNav = true }) => {
  return (
    <div className="min-h-screen bg-background">
      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`${showNav ? 'pb-28' : ''}`}
      >
        {children}
      </motion.main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default PageLayout;
