import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ScanResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const MealScanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const mockResults: ScanResult[] = [
    { name: 'Frango Grelhado com Salada', calories: 350, protein: 30, carbs: 15, fat: 12 },
    { name: 'Bowl de Açaí com Granola', calories: 420, protein: 8, carbs: 65, fat: 14 },
    { name: 'Omelete com Legumes', calories: 280, protein: 22, carbs: 8, fat: 18 },
    { name: 'Salmão com Batata Doce', calories: 450, protein: 35, carbs: 30, fat: 20 },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        startScanning();
      };
      reader.readAsDataURL(file);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);
    
    // Simulate AI analysis
    setTimeout(() => {
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      setScanResult(randomResult);
      setIsScanning(false);
    }, 2500);
  };

  const handleConfirm = () => {
    // Here you would save to database
    setIsOpen(false);
    setScanResult(null);
    setImagePreview(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setScanResult(null);
    setImagePreview(null);
    setIsScanning(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.button
          className="fixed bottom-28 right-4 z-40 w-14 h-14 rounded-full phase-gradient shadow-glow flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        >
          <Camera className="w-6 h-6 text-white" />
        </motion.button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl phase-gradient">
              <Camera className="w-4 h-4 text-white" />
            </div>
            Scan de Refeição
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!imagePreview && !isScanning && !scanResult && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-secondary/30">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-phase-secondary/50">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Tire uma foto da refeição</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Nossa IA vai identificar os alimentos
                    </p>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full phase-gradient text-white font-medium">
                      <Camera className="w-4 h-4" />
                      Tirar Foto
                    </span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {isScanning && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-8"
            >
              <div className="flex flex-col items-center gap-4">
                {imagePreview && (
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-2">
                    <img
                      src={imagePreview}
                      alt="Refeição"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <motion.div
                  className="relative"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="w-16 h-16 rounded-full phase-gradient flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </motion.div>
                <motion.p
                  className="text-lg font-semibold text-foreground"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Analisando com IA...
                </motion.p>
                <p className="text-sm text-muted-foreground">
                  Identificando alimentos e calculando macros
                </p>
              </div>
            </motion.div>
          )}

          {scanResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {imagePreview && (
                <div className="w-full h-40 rounded-xl overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Refeição"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="glass-card p-4 border-2 border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg phase-gradient">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-foreground">Prato Identificado</span>
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-3">
                  {scanResult.name}
                </h3>
                
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 rounded-xl bg-secondary">
                    <p className="text-lg font-bold text-primary">{scanResult.calories}</p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-secondary">
                    <p className="text-lg font-bold text-menstrual">{scanResult.protein}g</p>
                    <p className="text-xs text-muted-foreground">Proteína</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-secondary">
                    <p className="text-lg font-bold text-folicular">{scanResult.carbs}g</p>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-secondary">
                    <p className="text-lg font-bold text-ovulatoria">{scanResult.fat}g</p>
                    <p className="text-xs text-muted-foreground">Gordura</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 phase-gradient text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar e Registrar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default MealScanner;
