import React from 'react';
import { motion } from 'framer-motion';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';

const CycleWheel: React.FC = () => {
  const { cycleDay, cycleLength, currentPhase, getPhaseInfo, hasDUM, isLate, daysLate } = useCycle();
  
  const phaseInfo = getPhaseInfo();
  
  // SVG dimensions
  const size = 280;
  const center = size / 2;
  const outerRadius = 120;
  const innerRadius = 85;
  const markerRadius = 102;

  // Phase colors matching our design system
  const phaseColors: Record<CyclePhase, string> = {
    menstrual: 'hsl(var(--terracotta))',
    folicular: 'hsl(var(--leaf-green))',
    ovulatoria: 'hsl(var(--burnt-pink))',
    lutea: 'hsl(var(--phase-glow))',
  };

  // Neutral color for awaiting state
  const neutralColor = 'hsl(var(--muted-foreground) / 0.4)';
  const lateColor = 'hsl(var(--destructive))';

  // Phase angles (approximate based on typical cycle)
  const phases = [
    { phase: 'menstrual' as CyclePhase, startAngle: 0, endAngle: 64 },     // Days 1-5
    { phase: 'folicular' as CyclePhase, startAngle: 64, endAngle: 167 },   // Days 6-13
    { phase: 'ovulatoria' as CyclePhase, startAngle: 167, endAngle: 219 }, // Days 14-17
    { phase: 'lutea' as CyclePhase, startAngle: 219, endAngle: 360 },      // Days 18-28
  ];

  const describeArc = (
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ): string => {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    ].join(' ');
  };

  const polarToCartesian = (
    cx: number,
    cy: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians),
    };
  };

  // Calculate marker position - cap at 100% when late
  const effectiveCycleDay = Math.min(cycleDay, cycleLength);
  const markerAngle = (effectiveCycleDay / cycleLength) * 360;
  const markerPos = polarToCartesian(center, center, markerRadius, markerAngle);

  // Get phase for display - when late, show as if at end of lutea
  const displayPhase = isLate ? 'lutea' : currentPhase;

  // Awaiting state - no DUM registered
  if (!hasDUM) {
    return (
      <div id="cycle-wheel" className="relative flex flex-col items-center">
        <div className="relative">
          <svg width={size} height={size} className="drop-shadow-lg">
            {/* Background circle - neutral/gray */}
            <circle
              cx={center}
              cy={center}
              r={outerRadius}
              fill="none"
              stroke={neutralColor}
              strokeWidth="36"
              opacity="0.3"
            />
            
            {/* Inner circle (white center) */}
            <circle
              cx={center}
              cy={center}
              r={innerRadius - 10}
              fill="hsl(var(--card))"
              className="drop-shadow-sm"
            />
          </svg>
          
          {/* Center content - Awaiting state */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-4xl mb-1">❓</span>
            <span className="text-lg font-medium text-muted-foreground text-center px-4">
              Aguardando
            </span>
            <span className="text-sm text-muted-foreground">primeiro ciclo</span>
          </motion.div>
        </div>
        
        {/* No legend when awaiting */}
        <div className="flex gap-4 mt-6 flex-wrap justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span className="text-xs text-muted-foreground">Registre sua menstruação</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="cycle-wheel" className="relative flex flex-col items-center animate-fade-up">
      <div className="relative">
        <svg width={size} height={size} className="drop-shadow-lg">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="36"
            opacity="0.3"
          />
          
          {/* Phase arcs */}
          {phases.map(({ phase, startAngle, endAngle }) => (
            <path
              key={phase}
              d={describeArc(center, center, outerRadius, startAngle, endAngle)}
              fill="none"
              stroke={isLate && phase === 'lutea' ? lateColor : phaseColors[phase]}
              strokeWidth="36"
              strokeLinecap="butt"
              className={`transition-opacity duration-300 ${
                displayPhase === phase ? 'opacity-100' : 'opacity-40'
              }`}
            />
          ))}
          
          {/* Late indicator - pulsing outer ring when late */}
          {isLate && (
            <motion.circle
              cx={center}
              cy={center}
              r={outerRadius + 5}
              fill="none"
              stroke={lateColor}
              strokeWidth="2"
              opacity="0.6"
              animate={{ scale: [1, 1.02, 1], opacity: [0.6, 0.3, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          
          {/* Inner circle (white center) */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius - 10}
            fill="hsl(var(--card))"
            className="drop-shadow-sm"
          />
          
          {/* Current day marker */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <circle
              cx={markerPos.x}
              cy={markerPos.y}
              r="14"
              fill="hsl(var(--card))"
              className="drop-shadow-md"
            />
            <circle
              cx={markerPos.x}
              cy={markerPos.y}
              r="10"
              fill={isLate ? lateColor : phaseColors[displayPhase]}
            />
          </motion.g>
        </svg>
        
        {/* Center content */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isLate ? (
            // Late state - show days late
            <>
              <span className="text-3xl mb-1">⚠️</span>
              <span className="text-2xl font-bold text-destructive">
                {daysLate} {daysLate === 1 ? 'dia' : 'dias'}
              </span>
              <span className="text-sm text-muted-foreground">de atraso</span>
            </>
          ) : (
            // Normal state - show cycle day
            <>
              <span className="text-4xl mb-1">{phaseInfo.icon}</span>
              <span className="text-4xl font-bold text-foreground">Dia {cycleDay}</span>
              <span className="text-sm text-muted-foreground mt-1">{phaseInfo.name}</span>
            </>
          )}
        </motion.div>
      </div>
      
      {/* Phase legend */}
      <div className="flex gap-4 mt-6 flex-wrap justify-center">
        {phases.map(({ phase }) => (
          <div
            key={phase}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
              displayPhase === phase
                ? isLate && phase === 'lutea' 
                  ? 'bg-red-500/20 scale-105' 
                  : 'bg-phase-secondary/50 scale-105'
                : 'opacity-60'
            }`}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: isLate && phase === 'lutea' ? lateColor : phaseColors[phase] }}
            />
            <span className="text-xs font-medium capitalize">
              {phase === 'lutea' && isLate ? 'atrasada' : phase}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CycleWheel;
