import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import BottomNav from './BottomNav';

interface PageLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const PageLayout: React.FC<PageLayoutProps> = ({ children, showNav = true }) => {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`${showNav ? 'pb-24' : ''}`}
      >
        {children}
      </motion.main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default PageLayout;
