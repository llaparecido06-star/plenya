import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, X } from 'lucide-react';
import { useTutorial, TutorialKey } from '@/hooks/useTutorial';

export interface TutorialStep {
  targetId?: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TutorialOverlayProps {
  tutorialKey: TutorialKey;
  steps: TutorialStep[];
  onComplete?: () => void;
}

// Animation variants for smooth transitions
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const spotlightVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 }
  },
  exit: { opacity: 0, scale: 0.9 }
};

const tooltipVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring" as const, 
      stiffness: 400, 
      damping: 30,
      delay: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};

const contentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: "spring" as const, 
      stiffness: 400, 
      damping: 30,
      staggerChildren: 0.05
    }
  },
  exit: { opacity: 0, x: -20 }
};

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  tutorialKey,
  steps,
  onComplete,
}) => {
  const { shouldShowTutorial, isLoading, completeTutorial } = useTutorial(tutorialKey);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const step = steps[currentStep];

  // Find and highlight target element
  useEffect(() => {
    if (!shouldShowTutorial || isLoading) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      if (step?.targetId) {
        const element = document.getElementById(step.targetId);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          
          // Scroll element into view if needed
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentStep, shouldShowTutorial, isLoading, step]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setIsTransitioning(true);
      // Brief delay for exit animation
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsTransitioning(false);
      }, 150);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  const handleComplete = useCallback(async () => {
    setIsTransitioning(true);
    setTimeout(async () => {
      setIsVisible(false);
      await completeTutorial();
      onComplete?.();
    }, 200);
  }, [completeTutorial, onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (isLoading || !shouldShowTutorial || !isVisible) {
    return null;
  }

  const getTooltipPosition = (): React.CSSProperties => {
    const padding = 16;
    const tooltipHeight = 220;
    const tooltipWidth = 320;
    const safeBottomMargin = 100; // Space for bottom nav

    // Center if no target
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const position = step?.position || 'bottom';
    const horizontalCenter = Math.max(
      padding,
      Math.min(
        targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        window.innerWidth - tooltipWidth - padding
      )
    );

    // Check if there's enough space below
    const spaceBelow = window.innerHeight - targetRect.bottom - safeBottomMargin;
    const spaceAbove = targetRect.top;

    // Auto-adjust: if requested bottom but not enough space, go top
    let finalPosition = position;
    if (position === 'bottom' && spaceBelow < tooltipHeight && spaceAbove > tooltipHeight) {
      finalPosition = 'top';
    } else if (position === 'top' && spaceAbove < tooltipHeight && spaceBelow > tooltipHeight) {
      finalPosition = 'bottom';
    }

    switch (finalPosition) {
      case 'top':
        return {
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${horizontalCenter}px`,
        };
      case 'bottom':
        // Ensure it doesn't go below safe area
        const bottomTop = Math.min(
          targetRect.bottom + padding,
          window.innerHeight - tooltipHeight - safeBottomMargin
        );
        return {
          top: `${bottomTop}px`,
          left: `${horizontalCenter}px`,
        };
      case 'left':
        return {
          top: `${Math.max(padding, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - safeBottomMargin))}px`,
          right: `${window.innerWidth - targetRect.left + padding}px`,
        };
      case 'right':
        return {
          top: `${Math.max(padding, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - safeBottomMargin))}px`,
          left: `${targetRect.right + padding}px`,
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="fixed inset-0 z-[9999]"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        {/* Dark overlay with spotlight cutout */}
        <motion.svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <defs>
            <mask id={`spotlight-mask-${currentStep}`}>
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ 
                    x: targetRect.left - 8,
                    y: targetRect.top - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    opacity: 1
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30 
                  }}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.85)"
            mask={`url(#spotlight-mask-${currentStep})`}
          />
        </motion.svg>

        {/* Click blocker overlay */}
        <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

        {/* Spotlight glow effect with smooth transition */}
        <AnimatePresence mode="wait">
          {targetRect && (
            <motion.div
              key={`spotlight-${currentStep}`}
              className="absolute pointer-events-none"
              style={{
                left: targetRect.left - 12,
                top: targetRect.top - 12,
                width: targetRect.width + 24,
                height: targetRect.height + 24,
              }}
              variants={spotlightVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div 
                className="w-full h-full rounded-2xl ring-4 ring-primary/50 shadow-[0_0_30px_10px_hsl(var(--primary)/0.3)]"
                animate={{ 
                  boxShadow: [
                    "0 0 20px 5px hsl(var(--primary) / 0.2)",
                    "0 0 35px 12px hsl(var(--primary) / 0.35)",
                    "0 0 20px 5px hsl(var(--primary) / 0.2)"
                  ]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip card with smooth step transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`tooltip-${currentStep}`}
            className="fixed z-[10000] w-80 max-w-[calc(100vw-32px)]"
            style={getTooltipPosition()}
            variants={tooltipVariants}
            initial="hidden"
            animate={isTransitioning ? "exit" : "visible"}
            exit="exit"
          >
            <motion.div 
              className="bg-card p-4 rounded-2xl border-2 border-primary/40 shadow-2xl overflow-hidden"
              layoutId="tutorial-card"
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1.5">
                  {steps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`w-2.5 h-2.5 rounded-full ${
                        index === currentStep
                          ? 'bg-primary'
                          : index < currentStep
                          ? 'bg-primary/50'
                          : 'bg-muted'
                      }`}
                      animate={{
                        scale: index === currentStep ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        duration: 0.3,
                        delay: index === currentStep ? 0.2 : 0,
                      }}
                    />
                  ))}
                </div>
                <motion.button
                  onClick={handleSkip}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                  aria-label="Fechar tutorial"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Animated Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`content-${currentStep}`}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.h3 
                    className="font-semibold text-foreground text-base mb-1.5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {step?.title || 'Tutorial'}
                  </motion.h3>
                  <motion.p 
                    className="text-muted-foreground text-sm leading-relaxed mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {step?.description || 'Continue explorando o app!'}
                  </motion.p>
                </motion.div>
              </AnimatePresence>

              {/* Actions with hover animations */}
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                  className="flex-1 text-muted-foreground border-muted-foreground/30 transition-all duration-200 hover:scale-[1.02]"
                >
                  Pular tudo
                </Button>
                <motion.div className="flex-1">
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200"
                  >
                    <motion.span
                      className="flex items-center justify-center"
                      whileHover={{ x: currentStep < steps.length - 1 ? 2 : 0 }}
                    >
                      {currentStep < steps.length - 1 ? (
                        <>
                          Próximo
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        'Entendi!'
                      )}
                    </motion.span>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Step counter with animation */}
              <motion.p 
                className="text-center text-xs text-muted-foreground mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                Passo {currentStep + 1} de {steps.length}
              </motion.p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialOverlay;
