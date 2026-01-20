import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Apple, Dumbbell, Brain, User } from 'lucide-react';
import { useCycle } from '@/contexts/CycleContext';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: Home, label: 'Hoje' },
  { path: '/nutricao', icon: Apple, label: 'Nutrição' },
  { path: '/corpo', icon: Dumbbell, label: 'Corpo' },
  { path: '/mente', icon: Brain, label: 'Mente' },
  { path: '/perfil', icon: User, label: 'Perfil' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentPhase } = useCycle();

  return (
    <div className="bottom-nav">
      <nav className="bottom-nav-inner px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                {/* Active indicator - subtle underline only, no background */}
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-xs mt-1 font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
