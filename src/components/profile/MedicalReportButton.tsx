import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { fetchReportData, generateHealthReportPDF } from '@/lib/generateHealthReport';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MedicalReportButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportDays, setReportDays] = useState<string>('30');
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGenerateReport = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logada para gerar o relatório.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const data = await fetchReportData(user.id, parseInt(reportDays));
      const pdf = generateHealthReportPDF(data, user.email || '');
      
      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `relatorio-saude-plenya-${dateStr}.pdf`;
      
      // Download the PDF
      pdf.save(filename);

      toast({
        title: '📄 Relatório Gerado!',
        description: 'O download do PDF foi iniciado.',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Período do relatório:</span>
        <Select value={reportDays} onValueChange={setReportDays}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="14">14 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="60">60 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
            <Download className="w-5 h-5 mr-2" />
            Baixar Relatório Médico (PDF)
          </>
        )}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        Compartilhe este relatório com seu médico ou nutricionista
      </p>
    </motion.div>
  );
};

export default MedicalReportButton;
