import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Pill, Check, X, PenLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { commonContraceptives, Contraceptive } from '@/data/contraceptives';

interface MedicationSearchProps {
  value: string | null;
  medicationType: string | null;
  onChange: (name: string | null, type: string | null) => void;
}

const MedicationSearch: React.FC<MedicationSearchProps> = ({
  value,
  medicationType,
  onChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualName, setManualName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter contraceptives based on search term
  const filteredOptions = commonContraceptives.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (contraceptive: Contraceptive) => {
    onChange(contraceptive.name, contraceptive.type);
    setSearchTerm('');
    setIsOpen(false);
    setShowManualInput(false);
  };

  const handleManualSubmit = () => {
    if (manualName.trim()) {
      onChange(manualName.trim(), 'Outro');
      setManualName('');
      setShowManualInput(false);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(null, null);
    setSearchTerm('');
  };

  const selectedMedication = value
    ? commonContraceptives.find((c) => c.name === value)
    : null;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-foreground mb-2">
        Qual medicamento você usa?
      </label>

      {/* Selected medication display */}
      {value && !isOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Pill className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{medicationType}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className="h-8 w-8"
            >
              <PenLine className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8 text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Digite o nome (ex: Yasmin, Mirena...)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="pl-10 pr-4"
            />
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 py-2 rounded-xl bg-card border border-border shadow-xl max-h-64 overflow-y-auto"
              >
                {filteredOptions.length > 0 ? (
                  <>
                    {filteredOptions.map((contraceptive) => (
                      <button
                        key={contraceptive.name}
                        onClick={() => handleSelect(contraceptive)}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-secondary/50 transition-colors ${
                          value === contraceptive.name ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {contraceptive.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contraceptive.type}
                          </p>
                        </div>
                        {value === contraceptive.name && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="px-4 py-3 text-center text-muted-foreground text-sm">
                    Nenhum medicamento encontrado
                  </div>
                )}

                {/* Manual input option */}
                <div className="border-t border-border mt-2 pt-2 px-4">
                  {!showManualInput ? (
                    <button
                      onClick={() => setShowManualInput(true)}
                      className="w-full py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-2"
                    >
                      <PenLine className="w-4 h-4" />
                      Não encontrei meu medicamento
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="py-2 space-y-2"
                    >
                      <Input
                        type="text"
                        placeholder="Digite o nome do medicamento"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowManualInput(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleManualSubmit}
                          disabled={!manualName.trim()}
                          className="flex-1"
                        >
                          Salvar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Known effects info */}
      {selectedMedication && selectedMedication.effects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50"
        >
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">
            ⚠️ Efeitos colaterais conhecidos:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedMedication.effects.map((effect) => (
              <span
                key={effect}
                className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
              >
                {effect}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MedicationSearch;
