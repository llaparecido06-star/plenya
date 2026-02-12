import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PremiumGate from '@/components/subscription/PremiumGate';
import { FileText, Loader2, Download, Calendar, Share2, MessageCircle, Mail } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MedicalReportButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportDays, setReportDays] = useState<string>('30');
  const { toast } = useToast();
  const { user } = useAuth();

  const generatePDFBlob = async (): Promise<{ blob: Blob; filename: string } | null> => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logada para gerar o relatório.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const data = await fetchReportData(user.id, parseInt(reportDays));
      const pdf = generateHealthReportPDF(data, user.email || '');
      
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `relatorio-saude-plenya-${dateStr}.pdf`;
      const blob = pdf.output('blob');
      
      return { blob, filename };
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    const result = await generatePDFBlob();
    
    if (result) {
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: '📄 Relatório Gerado!',
        description: 'O download do PDF foi iniciado.',
      });
    }
    setIsLoading(false);
  };

  const handleShareNative = async () => {
    setIsLoading(true);
    const result = await generatePDFBlob();
    
    if (result && navigator.share && navigator.canShare) {
      const file = new File([result.blob], result.filename, { type: 'application/pdf' });
      
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Relatório de Saúde - Plenya',
            text: 'Confira meu relatório de saúde do app Plenya',
            files: [file],
          });
          toast({
            title: '✅ Compartilhado!',
            description: 'Relatório enviado com sucesso.',
          });
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error('Share failed:', err);
          }
        }
      } else {
        handleDownload();
      }
    } else {
      handleDownload();
    }
    setIsLoading(false);
  };

  const handleShareWhatsApp = async () => {
    setIsLoading(true);
    const result = await generatePDFBlob();
    
    if (result) {
      // For WhatsApp, we need to use Web Share API on mobile or fallback to download
      if (navigator.share && navigator.canShare) {
        const file = new File([result.blob], result.filename, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Relatório de Saúde - Plenya',
              text: 'Meu relatório de saúde do app Plenya',
              files: [file],
            });
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              // Fallback: open WhatsApp with text
              const url = URL.createObjectURL(result.blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = result.filename;
              link.click();
              URL.revokeObjectURL(url);
              
              window.open(
                `https://wa.me/?text=${encodeURIComponent('Olá! Segue meu relatório de saúde do app Plenya. Baixei o PDF e estou enviando aqui.')}`,
                '_blank'
              );
            }
          }
        }
      } else {
        // Desktop fallback
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        link.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: '📄 PDF baixado!',
          description: 'Agora você pode enviar pelo WhatsApp.',
        });
        
        setTimeout(() => {
          window.open(
            `https://wa.me/?text=${encodeURIComponent('Olá! Segue meu relatório de saúde do app Plenya.')}`,
            '_blank'
          );
        }, 500);
      }
    }
    setIsLoading(false);
  };

  const handleShareEmail = async () => {
    setIsLoading(true);
    const result = await generatePDFBlob();
    
    if (result) {
      // Download first, then open email client
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      
      const subject = encodeURIComponent('Relatório de Saúde - Plenya');
      const body = encodeURIComponent(
        'Olá,\n\nSegue em anexo meu relatório de saúde gerado pelo aplicativo Plenya.\n\nAtenciosamente.'
      );
      
      toast({
        title: '📄 PDF baixado!',
        description: 'Anexe o arquivo no email.',
      });
      
      setTimeout(() => {
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }, 500);
    }
    setIsLoading(false);
  };

  return (
    <PremiumGate feature="Relatório Médico" mode="inline">
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

      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          disabled={isLoading}
          className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Baixar PDF
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={isLoading}
              className="h-14 px-4 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShareNative}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShareWhatsApp}>
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShareEmail}>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <p className="text-xs text-center text-muted-foreground">
        Compartilhe este relatório com seu médico ou nutricionista
      </p>
    </motion.div>
    </PremiumGate>
  );
};

export default MedicalReportButton;
