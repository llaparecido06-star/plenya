import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader2, Check, AlertTriangle } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useIntimacyLog } from '@/hooks/useIntimacyLog';
import { useCycle } from '@/contexts/CycleContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TagOption {
  id: string;
  emoji: string;
  label: string;
}

const practicesTags: TagOption[] = [
  { id: 'vaginal', emoji: '🍆', label: 'Sexo Vaginal' },
  { id: 'oral', emoji: '👄', label: 'Sexo Oral' },
  { id: 'anal', emoji: '🍑', label: 'Sexo Anal' },
  { id: 'masturbation', emoji: '🖐️', label: 'Masturbação' },
  { id: 'toys', emoji: '🧸', label: 'Brinquedos' },
  { id: 'foreplay', emoji: '🔥', label: 'Preliminares' },
];

const protectionTags: TagOption[] = [
  { id: 'condom', emoji: '🛡️', label: 'Preservativo' },
  { id: 'withdrawal', emoji: '⏱️', label: 'Coito Interrompido' },
  { id: 'unprotected', emoji: '⚠️', label: 'Sem Proteção' },
  { id: 'morning_after', emoji: '💊', label: 'Pílula Dia Seguinte' },
];

const sensationTags: TagOption[] = [
  { id: 'orgasm', emoji: '✨', label: 'Orgasmo' },
  { id: 'high_lubrication', emoji: '🌊', label: 'Lubrificação Alta' },
  { id: 'dryness', emoji: '🌵', label: 'Ressecamento' },
  { id: 'pain', emoji: '😣', label: 'Dor' },
];

const aftercareTags: TagOption[] = [
  { id: 'connected', emoji: '🥰', label: 'Conectada' },
  { id: 'relaxed', emoji: '😌', label: 'Relaxada' },
  { id: 'energized', emoji: '🔋', label: 'Energizada' },
  { id: 'guilty_sad', emoji: '😔', label: 'Culpada/Triste' },
];

interface IntimacyLogProps {
  showAlert?: boolean;
}

const IntimacyLog: React.FC<IntimacyLogProps> = ({ showAlert = false }) => {
  const { existingLog, loading, saving, saveLog, isAuthenticated, yesterdayRiskDetected } = useIntimacyLog();
  const { currentPhase } = useCycle();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [selectedPractices, setSelectedPractices] = useState<string[]>([]);
  const [selectedProtection, setSelectedProtection] = useState<string[]>([]);
  const [selectedSensations, setSelectedSensations] = useState<string[]>([]);
  const [selectedAftercare, setSelectedAftercare] = useState<string[]>([]);

  // Load existing data
  useEffect(() => {
    if (existingLog) {
      // Parse the stored arrays back into state
      const practices = existingLog.sensation_physical?.filter(s => 
        practicesTags.some(t => t.id === s)
      ) || [];
      const protection = existingLog.sensation_physical?.filter(s => 
        protectionTags.some(t => t.id === s)
      ) || [];
      const sensations = existingLog.sensation_emotional?.filter(s => 
        sensationTags.some(t => t.id === s)
      ) || [];
      const aftercare = existingLog.sensation_emotional?.filter(s => 
        aftercareTags.some(t => t.id === s)
      ) || [];
      
      setSelectedPractices(practices);
      setSelectedProtection(protection);
      setSelectedSensations(sensations);
      setSelectedAftercare(aftercare);
    }
  }, [existingLog]);

  const toggleTag = (
    tagId: string, 
    selected: string[], 
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    // Combine all selections for storage
    const allPhysical = [...selectedPractices, ...selectedProtection];
    const allEmotional = [...selectedSensations, ...selectedAftercare];
    
    // Check if in fertile window with risky protection
    const isRisky = selectedProtection.includes('unprotected') || 
                    selectedProtection.includes('withdrawal');
    const isFertile = currentPhase === 'ovulatoria';
    
    const success = await saveLog({
      libido: existingLog?.libido || 3,
      fluid_type: existingLog?.fluid_type || null,
      sensation_emotional: allEmotional,
      sensation_physical: allPhysical,
      symptoms: existingLog?.symptoms || [],
      activity_type: selectedPractices.length > 0 
        ? (selectedPractices.includes('masturbation') ? 'solo' : 'partner') 
        : null,
      is_protected: selectedProtection.includes('condom'),
      pleasure_rating: selectedSensations.includes('orgasm') ? 5 : 3,
    });
    
    if (success) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setDrawerOpen(false);
      }, 1500);
    }
  };

  const hasIntimacyData = existingLog && (
    (existingLog.sensation_physical?.length || 0) > 0 ||
    (existingLog.sensation_emotional?.length || 0) > 0
  );

  const renderTagGroup = (
    title: string,
    tags: TagOption[],
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    isCritical: boolean = false
  ) => (
    <div className="space-y-2">
      <h4 className={`text-sm font-medium ${isCritical ? 'text-amber-600' : 'text-muted-foreground'}`}>
        {title} {isCritical && '⚠️'}
      </h4>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id, selected, setSelected)}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              selected.includes(tag.id)
                ? isCritical && (tag.id === 'unprotected' || tag.id === 'withdrawal')
                  ? 'bg-amber-500 text-white'
                  : 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <span>{tag.emoji}</span>
            <span>{tag.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return null;
  }

  return (
    <>
      {/* Alert for yesterday's risk */}
      {showAlert && yesterdayRiskDetected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mb-4"
        >
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
              <strong>Atenção:</strong> Chance de gravidez detectada ontem (relação sem proteção durante janela fértil).
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <motion.button
            className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl glass-card hover:shadow-soft transition-all"
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className={`p-3 rounded-xl ${hasIntimacyData ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'}`}>
              <Heart className="w-5 h-5" fill={hasIntimacyData ? 'currentColor' : 'none'} />
            </div>
            <span className="text-sm font-medium text-foreground">Sexo & Libido</span>
          </motion.button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Heart className="w-4 h-4" />
              </div>
              Registrar Intimidade
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto space-y-6">
            {/* Fertility Warning */}
            {currentPhase === 'ovulatoria' && (
              <Alert className="border-purple-500/50 bg-purple-50 dark:bg-purple-950/20">
                <Heart className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-700 dark:text-purple-400 text-sm">
                  Você está na <strong>janela fértil</strong>. Registre com atenção o método de proteção utilizado.
                </AlertDescription>
              </Alert>
            )}

            {renderTagGroup('Práticas', practicesTags, selectedPractices, setSelectedPractices)}
            {renderTagGroup('Proteção', protectionTags, selectedProtection, setSelectedProtection, true)}
            {renderTagGroup('Sensação', sensationTags, selectedSensations, setSelectedSensations)}
            {renderTagGroup('After-Care', aftercareTags, selectedAftercare, setSelectedAftercare)}

            <Button 
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleSave}
              disabled={saving || saved || !isAuthenticated}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </span>
              ) : saved ? (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Salvo!
                </span>
              ) : !isAuthenticated ? (
                'Faça login para salvar'
              ) : (
                'Salvar Registro 💜'
              )}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default IntimacyLog;
