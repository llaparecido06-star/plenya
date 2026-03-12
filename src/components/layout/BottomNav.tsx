import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Apple, Dumbbell, Brain, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavItem {
  path: string;
  icon: React.ElementType;
  labelKey: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/nutricao', icon: Apple, labelKey: 'nav.nutrition' },
  { path: '/corpo', icon: Dumbbell, labelKey: 'nav.body' },
  { path: '/mente', icon: Brain, labelKey: 'nav.mind' },
  { path: '/perfil', icon: User, labelKey: 'nav.profile' },
];

const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="bottom-nav">
      <nav className="bottom-nav-inner">
        <div className="flex items-center justify-around relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 ${
                  isActive ? 'bg-primary/12' : ''
                }`}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <motion.div
                  animate={isActive ? { y: -2 } : { y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Icon
                    className={`w-[22px] h-[22px] transition-all duration-300 ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </motion.div>
                <motion.span
                  className={`text-[10px] mt-0.5 font-semibold tracking-wide transition-all duration-300 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.7, y: 0 }}
                >
                  {t(item.labelKey)}
                </motion.span>
                {isActive && (
                  <motion.div
                    className="absolute -top-0.5 w-5 h-[3px] rounded-full bg-primary"
                    layoutId="activeTab"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
