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

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  tutorialKey,
  steps,
  onComplete,
}) => {
  const { shouldShowTutorial, isLoading, completeTutorial } = useTutorial(tutorialKey);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

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
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  const handleComplete = useCallback(async () => {
    setIsVisible(false);
    await completeTutorial();
    onComplete?.();
  }, [completeTutorial, onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (isLoading || !shouldShowTutorial || !isVisible) {
    return null;
  }

  const getTooltipPosition = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipHeight = 200;
    const tooltipWidth = 320;

    const position = step?.position || 'bottom';

    switch (position) {
      case 'top':
        return {
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          right: `${window.innerWidth - targetRect.left + padding}px`,
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
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
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Dark overlay with spotlight cutout */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
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
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight glow effect */}
        {targetRect && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: targetRect.left - 12,
              top: targetRect.top - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-full h-full rounded-2xl ring-4 ring-primary/50 shadow-[0_0_30px_10px_hsl(var(--primary)/0.3)]" />
          </motion.div>
        )}

        {/* Tooltip card */}
        <motion.div
          className="absolute z-10 w-80 max-w-[calc(100vw-32px)]"
          style={getTooltipPosition()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass-card p-5 rounded-2xl border border-primary/30 shadow-2xl">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-primary'
                        : index < currentStep
                        ? 'bg-primary/50'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {currentStep + 1}/{steps.length}
              </span>
            </div>

            {/* Content */}
            <h3 className="font-semibold text-foreground text-lg mb-2">
              {step.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              {step.description}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Pular
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  'Entendi!'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialOverlay;
