import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const MedicalReportButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsLoading(true);

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    setIsLoading(false);
    toast({
      title: '📄 Relatório Médico',
      description: 'Enviado para seu email com sucesso!',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Button
        onClick={handleGenerateReport}
        disabled={isLoading}
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Gerando Relatório...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5 mr-2" />
            Baixar Relatório Médico (PDF)
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default MedicalReportButton;
