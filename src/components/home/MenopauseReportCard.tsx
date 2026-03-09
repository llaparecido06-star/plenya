import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { fetchMenopauseReportData, generateMenopauseReportPDF } from '@/lib/generateMenopauseReport';

const MenopauseReportCard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);

    try {
      const data = await fetchMenopauseReportData(user.id);
      const doc = generateMenopauseReportPDF(data, user.email || '');
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const fileName = `plenya-menopausa-${new Date().toISOString().split('T')[0]}.pdf`;

      // Try Web Share API first (mobile)
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], fileName, { type: 'application/pdf' })] })) {
        try {
          await navigator.share({
            title: t('menopause.report_title'),
            files: [new File([blob], fileName, { type: 'application/pdf' })],
          });
          toast({ title: t('menopause.report_shared') });
          return;
        } catch {
          // Fallback to download
        }
      }

      // Download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: t('menopause.report_downloaded') });
    } catch (err) {
      toast({ title: t('actions.error'), variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-violet-500/5 to-indigo-500/10 border-violet-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-violet-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">{t('menopause.report_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('menopause.report_subtitle')}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{t('menopause.report_description')}</p>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {generating ? t('actions.loading') : t('menopause.report_generate')}
        </Button>
      </div>
    </motion.div>
  );
};

export default MenopauseReportCard;
