import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Send, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCycleDiary } from '@/hooks/useCycleDiary';
import { useCycle } from '@/contexts/CycleContext';
import { useAIBrain } from '@/hooks/useAIBrain';
import { useLifePhase } from '@/hooks/useLifePhase';

const sentimentEmojis: Record<string, string> = {
  positivo: '😊',
  neutro: '😐',
  negativo: '😔',
  ansioso: '😰',
  energetico: '⚡',
  cansado: '😴',
  irritado: '😤',
  amoroso: '🥰',
};

const CycleDiaryCard: React.FC = () => {
  const { todayEntry, entries, saveEntry, updateAIAnalysis } = useCycleDiary();
  const { cycleDay, currentPhase, getPhaseInfo } = useCycle();
  const { chat, loading: aiLoading } = useAIBrain();
  const { lifePhase } = useLifePhase();
  const phaseInfo = getPhaseInfo();

  const [text, setText] = useState(todayEntry?.content || '');
  const [showHistory, setShowHistory] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Prompts sugestivos por fase
  const phasePrompts: Record<string, string> = {
    menstrual: 'Como está se sentindo hoje? Cólicas, cansaço, vontade de descansar?',
    folicular: 'Energia subindo? Novos projetos? Como está seu ânimo?',
    ovulatoria: 'Sentindo-se mais social e confiante? Como foi seu dia?',
    lutea: 'Percebeu mudanças de humor ou apetite? Como está se cuidando?',
  };

  const placeholder = phasePrompts[currentPhase] || 'Como você está se sentindo hoje?';

  const recentEntries = useMemo(() => entries.slice(0, 7), [entries]);

  const handleSave = async () => {
    if (!text.trim()) return;
    const entry = await saveEntry(text, cycleDay, currentPhase, todayEntry?.id);
    if (entry) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    // Save first
    const entry = await saveEntry(text, cycleDay, currentPhase, todayEntry?.id);
    if (!entry) return;

    setAnalyzing(true);
    try {
      // Build context from recent entries
      const recentContext = entries
        .slice(0, 5)
        .map(e => `[Dia ${e.cycle_day} - ${e.cycle_phase}]: ${e.content}`)
        .join('\n');

      const analysisPrompt = `Analise este relato do diário do ciclo menstrual e identifique:
1. O sentimento predominante (uma palavra: positivo, negativo, neutro, ansioso, energetico, cansado, irritado, amoroso)
2. Tags emocionais relevantes (máx 3 palavras-chave)
3. Padrões comparando com relatos anteriores da mesma fase
4. Uma dica personalizada de autocuidado

Relato de HOJE (Dia ${cycleDay} - Fase ${phaseInfo.name}):
"${text}"

Relatos recentes para contexto:
${recentContext || 'Primeiro relato.'}

Responda em formato estruturado:
SENTIMENTO: [palavra]
TAGS: [tag1, tag2, tag3]
PADRÃO: [observação sobre padrões]
DICA: [dica de autocuidado]`;

      const response = await chat({
        message: analysisPrompt,
        history: [],
        life_phase: lifePhase as any,
        phase_name: currentPhase,
      });

      if (response) {
        // Parse the structured response
        const sentimentMatch = response.match(/SENTIMENTO:\s*(\w+)/i);
        const tagsMatch = response.match(/TAGS:\s*(.+)/i);
        const sentiment = sentimentMatch?.[1]?.toLowerCase() || 'neutro';
        const tags = tagsMatch?.[1]?.split(',').map(t => t.trim()).filter(Boolean) || [];

        await updateAIAnalysis(entry.id, response, sentiment, tags);
      }
    } catch (e) {
      console.error('AI analysis error:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="px-4"
    >
      <Card className="overflow-hidden border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            Diário do Ciclo
            {todayEntry?.sentiment && (
              <span className="text-base ml-auto">
                {sentimentEmojis[todayEntry.sentiment] || '📝'}
              </span>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Dia {cycleDay} · {phaseInfo.name}
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Text area */}
          <Textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setSaved(false); }}
            placeholder={placeholder}
            className="min-h-[100px] resize-none text-sm bg-secondary/30 border-0 focus-visible:ring-primary/30"
            maxLength={1000}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{text.length}/1000</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!text.trim()}
              >
                {saved ? '✓ Salvo' : 'Salvar'}
              </Button>
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={!text.trim() || aiLoading || analyzing}
                className="gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {analyzing ? 'Analisando...' : 'Analisar com IA'}
              </Button>
            </div>
          </div>

          {/* AI Analysis Display */}
          <AnimatePresence>
            {todayEntry?.ai_analysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Análise da Plenya</span>
                  {todayEntry.sentiment && (
                    <Badge variant="secondary" className="text-xs">
                      {sentimentEmojis[todayEntry.sentiment]} {todayEntry.sentiment}
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                {todayEntry.tags && todayEntry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {todayEntry.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Full analysis text */}
                <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                  {todayEntry.ai_analysis
                    .replace(/SENTIMENTO:.*\n?/i, '')
                    .replace(/TAGS:.*\n?/i, '')
                    .trim()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History toggle */}
          {recentEntries.length > 0 && (
            <>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center pt-1"
              >
                {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showHistory ? 'Ocultar histórico' : `Ver últimos ${recentEntries.length} relatos`}
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {recentEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-2.5 rounded-lg bg-secondary/30 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">
                            Dia {entry.cycle_day} · {entry.cycle_phase || '—'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {entry.sentiment && (
                              <span className="text-xs">{sentimentEmojis[entry.sentiment]}</span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.entry_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CycleDiaryCard;
