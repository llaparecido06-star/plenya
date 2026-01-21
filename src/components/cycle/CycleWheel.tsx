import React from 'react';
import { motion } from 'framer-motion';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';

const CycleWheel: React.FC = () => {
  const { cycleDay, cycleLength, currentPhase, getPhaseInfo } = useCycle();
  
  const phaseInfo = getPhaseInfo();
  
  // Calculate rotation based on cycle day
  const rotation = (cycleDay / cycleLength) * 360 - 90;
  
  // SVG dimensions
  const size = 280;
  const center = size / 2;
  const outerRadius = 120;
  const innerRadius = 85;
  const markerRadius = 102;

  // Phase colors matching our design system
  const phaseColors: Record<CyclePhase, string> = {
    menstrual: '#E07A5F',
    folicular: '#81B29A',
    ovulatoria: '#F4A261',
    lutea: '#9B8BB0',
  };

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

  // Calculate marker position
  const markerAngle = (cycleDay / cycleLength) * 360;
  const markerPos = polarToCartesian(center, center, markerRadius, markerAngle);

  return (
    <div id="cycle-wheel" className="relative flex flex-col items-center">
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
              stroke={phaseColors[phase]}
              strokeWidth="36"
              strokeLinecap="butt"
              className={`transition-opacity duration-300 ${
                currentPhase === phase ? 'opacity-100' : 'opacity-40'
              }`}
            />
          ))}
          
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
              fill={phaseColors[currentPhase]}
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
          <span className="text-4xl mb-1">{phaseInfo.icon}</span>
          <span className="text-4xl font-bold text-foreground">Dia {cycleDay}</span>
          <span className="text-sm text-muted-foreground mt-1">{phaseInfo.name}</span>
        </motion.div>
      </div>
      
      {/* Phase legend */}
      <div className="flex gap-4 mt-6 flex-wrap justify-center">
        {phases.map(({ phase }) => (
          <div
            key={phase}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
              currentPhase === phase
                ? 'bg-phase-secondary/50 scale-105'
                : 'opacity-60'
            }`}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: phaseColors[phase] }}
            />
            <span className="text-xs font-medium capitalize">{phase}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CycleWheel;
