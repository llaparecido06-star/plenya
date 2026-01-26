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

    const timer = setTimeout(() => {
      setIsVisible(true);
      
      if (step?.targetId) {
        const element = document.getElementById(step.targetId);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    }, 400);

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

  if (isLoading || !shouldShowTutorial || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Dark overlay with optional spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id={`spotlight-mask-${currentStep}`}>
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
          mask={`url(#spotlight-mask-${currentStep})`}
        />
      </svg>

      {/* Click blocker */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Spotlight glow effect */}
      {targetRect && (
        <motion.div
          key={`spotlight-${currentStep}`}
          className="absolute pointer-events-none rounded-2xl ring-4 ring-primary/50"
          style={{
            left: targetRect.left - 12,
            top: targetRect.top - 12,
            width: targetRect.width + 24,
            height: targetRect.height + 24,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
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
      )}

      {/* Centered Tooltip Card - Always centered for mobile */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`tooltip-${currentStep}`}
          className="fixed inset-x-4 z-[10000] flex items-center justify-center"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className="bg-card p-5 rounded-2xl border-2 border-primary/40 shadow-2xl w-full max-w-sm mx-auto">
            {/* Header with progress dots and close button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-primary scale-110'
                        : index < currentStep
                        ? 'bg-primary/50'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleComplete}
                className="p-2 rounded-full hover:bg-muted transition-colors -mr-1"
                aria-label="Fechar tutorial"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <motion.div
              key={`content-${currentStep}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="font-semibold text-foreground text-lg mb-2">
                {step?.title || 'Tutorial'}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                {step?.description || 'Continue explorando o app!'}
              </p>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="default"
                onClick={handleComplete}
                className="flex-1 h-11"
              >
                Pular
              </Button>
              <Button
                size="default"
                onClick={handleNext}
                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {currentStep < steps.length - 1 ? (
                  <span className="flex items-center">
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                ) : (
                  'Entendi!'
                )}
              </Button>
            </div>

            {/* Step counter */}
            <p className="text-center text-xs text-muted-foreground mt-3">
              {currentStep + 1} de {steps.length}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TutorialOverlay;
