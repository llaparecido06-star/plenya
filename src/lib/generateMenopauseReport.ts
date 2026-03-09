import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays, parseISO, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

const COLORS = {
  sageGreen: { r: 139, g: 157, b: 130 },
  terracotta: { r: 180, g: 103, b: 77 },
  burntPink: { r: 199, g: 112, b: 134 },
  violet: { r: 139, g: 92, b: 246 },
  orange: { r: 249, g: 115, b: 22 },
  teal: { r: 20, g: 184, b: 166 },
  indigo: { r: 99, g: 102, b: 241 },
  darkText: { r: 45, g: 45, b: 45 },
  lightText: { r: 120, g: 120, b: 120 },
  white: { r: 255, g: 255, b: 255 },
  cream: { r: 254, g: 250, b: 240 },
  tableStripe: { r: 248, g: 250, b: 247 },
};

interface MenopauseReportData {
  profile: {
    full_name: string | null;
    date_of_birth: string | null;
    hrt_type: string | null;
    hrt_start_date: string | null;
  };
  diaryEntries: Array<{
    entry_date: string;
    mood: number | null;
    weight: number | null;
    symptoms: string[] | null;
    notes: string | null;
  }>;
  hotFlashes: Array<{
    logged_at: string;
    intensity: number;
    duration_minutes: number | null;
    trigger: string | null;
  }>;
  dailyLogs: Array<{
    log_date: string;
    mood: number | null;
    energy: number | null;
    stress: number | null;
    symptoms: string[] | null;
    notes: string | null;
  }>;
  workouts: Array<{
    workout_date: string;
    workout_type: string;
    duration_minutes: number | null;
    completed: boolean | null;
  }>;
}

function removeEmojis(str: string): string {
  return str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
}

function calculateAge(birthDate: string): number {
  const birth = parseISO(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const symptomLabels: Record<string, string> = {
  hot_flash: 'Ondas de Calor', night_sweats: 'Suores Noturnos', insomnia: 'Insônia',
  mood_swings: 'Oscilação de Humor', brain_fog: 'Névoa Mental', joint_pain: 'Dor Articular',
  dry_skin: 'Pele Seca', anxiety: 'Ansiedade', fatigue: 'Fadiga', headache: 'Dor de Cabeça',
  weight_gain: 'Ganho de Peso', hair_loss: 'Queda de Cabelo', low_libido: 'Baixa Libido',
  palpitations: 'Palpitações', hot_flashes: 'Ondas de Calor', night_sweat: 'Suores Noturnos',
};

const triggerLabels: Record<string, string> = {
  stress: 'Estresse', food: 'Comida', exercise: 'Exercício',
  alcohol: 'Álcool', caffeine: 'Cafeína',
};

const hrtLabels: Record<string, string> = {
  pill: 'Comprimido', patch: 'Adesivo', gel: 'Gel',
  injection: 'Injeção', ring: 'Anel vaginal', cream: 'Creme',
};

export async function fetchMenopauseReportData(userId: string, days: number = 30): Promise<MenopauseReportData> {
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
  const startDateISO = subDays(new Date(), days).toISOString();

  const [profileRes, diaryRes, hfRes, dailyRes, workoutsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, date_of_birth, hrt_type, hrt_start_date').eq('user_id', userId).single(),
    supabase.from('menopause_diary').select('entry_date, mood, weight, symptoms, notes').eq('user_id', userId).gte('entry_date', startDate).order('entry_date', { ascending: true }),
    supabase.from('hot_flash_logs').select('logged_at, intensity, duration_minutes, trigger').eq('user_id', userId).gte('logged_at', startDateISO).order('logged_at', { ascending: true }),
    supabase.from('daily_logs').select('log_date, mood, energy, stress, symptoms, notes').eq('user_id', userId).gte('log_date', startDate).order('log_date', { ascending: true }),
    supabase.from('workouts').select('workout_date, workout_type, duration_minutes, completed').eq('user_id', userId).gte('workout_date', startDate).order('workout_date', { ascending: true }),
  ]);

  return {
    profile: profileRes.data || { full_name: null, date_of_birth: null, hrt_type: null, hrt_start_date: null },
    diaryEntries: diaryRes.data || [],
    hotFlashes: hfRes.data || [],
    dailyLogs: dailyRes.data || [],
    workouts: workoutsRes.data || [],
  };
}

export function generateMenopauseReportPDF(data: MenopauseReportData, userEmail: string): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 0;

  const checkPageBreak = (required: number = 30) => {
    if (yPos + required > pageHeight - 25) {
      doc.addPage();
      yPos = 25;
    }
  };

  // === HEADER ===
  doc.setFillColor(COLORS.violet.r, COLORS.violet.g, COLORS.violet.b);
  doc.rect(0, 0, pageWidth, 42, 'F');
  doc.setFillColor(COLORS.orange.r, COLORS.orange.g, COLORS.orange.b);
  doc.rect(0, 42, pageWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Plenya', margin, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Menopausa', margin, 26);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Dossiê Mensal — Menopausa', pageWidth - margin, 16, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, pageWidth - margin, 24, { align: 'right' });
  doc.text(`Período: últimos 30 dias`, pageWidth - margin, 32, { align: 'right' });

  yPos = 55;

  // === PATIENT INFO ===
  doc.setFillColor(COLORS.cream.r, COLORS.cream.g, COLORS.cream.b);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 4, 4, 'F');
  doc.setDrawColor(COLORS.violet.r, COLORS.violet.g, COLORS.violet.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 4, 4, 'S');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.violet.r, COLORS.violet.g, COLORS.violet.b);
  doc.text('DADOS DA PACIENTE', margin + 5, yPos + 8);
  doc.setDrawColor(COLORS.violet.r, COLORS.violet.g, COLORS.violet.b);
  doc.line(margin + 5, yPos + 12, pageWidth - margin - 5, yPos + 12);

  doc.setFontSize(10);
  doc.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  const name = data.profile.full_name || userEmail.split('@')[0];
  const age = data.profile.date_of_birth ? calculateAge(data.profile.date_of_birth) : null;

  doc.setFont('helvetica', 'bold');
  doc.text('Nome:', margin + 5, yPos + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(name, margin + 25, yPos + 20);

  if (age) {
    doc.setFont('helvetica', 'bold');
    doc.text('Idade:', margin + 5, yPos + 27);
    doc.setFont('helvetica', 'normal');
    doc.text(`${age} anos`, margin + 25, yPos + 27);
  }

  const rightColX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Fase:', rightColX, yPos + 20);
  doc.setFont('helvetica', 'normal');
  doc.text('Menopausa', rightColX + 15, yPos + 20);

  if (data.profile.hrt_type) {
    doc.setFont('helvetica', 'bold');
    doc.text('TRH:', rightColX, yPos + 27);
    doc.setFont('helvetica', 'normal');
    doc.text(hrtLabels[data.profile.hrt_type] || data.profile.hrt_type, rightColX + 15, yPos + 27);
  }

  yPos += 50;

  // === SUMMARY STATS ===
  checkPageBreak(40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.orange.r, COLORS.orange.g, COLORS.orange.b);
  doc.text('RESUMO DO MÊS', margin, yPos);
  yPos += 8;

  const boxWidth = (pageWidth - margin * 2 - 15) / 4;
  const boxH = 25;

  const moodLogs = data.diaryEntries.filter(e => e.mood !== null);
  const avgMood = moodLogs.length > 0 ? (moodLogs.reduce((a, b) => a + (b.mood || 0), 0) / moodLogs.length).toFixed(1) : '-';
  const weightLogs = data.diaryEntries.filter(e => e.weight !== null);
  const lastWeight = weightLogs.length > 0 ? Number(weightLogs[weightLogs.length - 1].weight).toFixed(1) : '-';
  const avgIntensity = data.hotFlashes.length > 0 ? (data.hotFlashes.reduce((a, b) => a + b.intensity, 0) / data.hotFlashes.length).toFixed(1) : '-';

  const stats = [
    { label: 'Ondas de Calor', value: `${data.hotFlashes.length}`, subtext: `média: ${avgIntensity}/5` },
    { label: 'Humor Medio', value: `${avgMood}/5`, subtext: '' },
    { label: 'Peso Atual', value: lastWeight !== '-' ? `${lastWeight} kg` : '-', subtext: '' },
    { label: 'Dias Registrados', value: `${data.diaryEntries.length}`, subtext: '' },
  ];

  stats.forEach((stat, idx) => {
    const boxX = margin + idx * (boxWidth + 5);
    doc.setFillColor(COLORS.tableStripe.r, COLORS.tableStripe.g, COLORS.tableStripe.b);
    doc.roundedRect(boxX, yPos, boxWidth, boxH, 3, 3, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.violet.r, COLORS.violet.g, COLORS.violet.b);
    doc.text(stat.value, boxX + boxWidth / 2, yPos + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.lightText.r, COLORS.lightText.g, COLORS.lightText.b);
    doc.text(stat.label, boxX + boxWidth / 2, yPos + 16, { align: 'center' });
    if (stat.subtext) {
      doc.setFontSize(6);
      doc.text(stat.subtext, boxX + boxWidth / 2, yPos + 21, { align: 'center' });
    }
  });

  yPos += boxH + 15;

  // === HOT FLASH ANALYSIS ===
  if (data.hotFlashes.length > 0) {
    checkPageBreak(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.orange.r, COLORS.orange.g, COLORS.orange.b);
    doc.text('ANÁLISE DE ONDAS DE CALOR', margin, yPos);
    yPos += 8;

    // Trigger distribution
    const triggerCounts: Record<string, { count: number; totalI: number }> = {};
    data.hotFlashes.filter(h => h.trigger).forEach(h => {
      const tr = h.trigger!;
      if (!triggerCounts[tr]) triggerCounts[tr] = { count: 0, totalI: 0 };
      triggerCounts[tr].count++;
      triggerCounts[tr].totalI += h.intensity;
    });

    const triggerTable = Object.entries(triggerCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([trigger, d]) => [
        triggerLabels[trigger] || trigger,
        `${d.count}x`,
        `${Math.round((d.count / data.hotFlashes.length) * 100)}%`,
        `${(d.totalI / d.count).toFixed(1)}/5`,
      ]);

    if (triggerTable.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Gatilho', 'Ocorrências', 'Frequência', 'Intensidade Média']],
        body: triggerTable,
        theme: 'grid',
        headStyles: {
          fillColor: [COLORS.orange.r, COLORS.orange.g, COLORS.orange.b],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: { fontSize: 9, textColor: [COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b] },
        alternateRowStyles: { fillColor: [COLORS.tableStripe.r, COLORS.tableStripe.g, COLORS.tableStripe.b] },
        margin: { left: margin, right: margin },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Time distribution
    const timeBuckets: Record<string, number> = { 'Manhã (6-12h)': 0, 'Tarde (12-18h)': 0, 'Noite (18-22h)': 0, 'Madrugada (22-6h)': 0 };
    data.hotFlashes.forEach(h => {
      const hour = getHours(parseISO(h.logged_at));
      if (hour >= 6 && hour < 12) timeBuckets['Manhã (6-12h)']++;
      else if (hour >= 12 && hour < 18) timeBuckets['Tarde (12-18h)']++;
      else if (hour >= 18 && hour < 22) timeBuckets['Noite (18-22h)']++;
      else timeBuckets['Madrugada (22-6h)']++;
    });

    const timeTable = Object.entries(timeBuckets)
      .filter(([, v]) => v > 0)
      .map(([label, count]) => [label, `${count}x`, `${Math.round((count / data.hotFlashes.length) * 100)}%`]);

    if (timeTable.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
      doc.text('Distribuição por Horário', margin, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Período', 'Ocorrências', 'Frequência']],
        body: timeTable,
        theme: 'grid',
        headStyles: { fillColor: [COLORS.orange.r, COLORS.orange.g, COLORS.orange.b], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: margin, right: margin },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // === SYMPTOMS ===
  const allSymptoms: Record<string, number> = {};
  [...data.diaryEntries, ...data.dailyLogs].forEach(entry => {
    (entry.symptoms || []).forEach(s => {
      allSymptoms[s] = (allSymptoms[s] || 0) + 1;
    });
  });

  const topSymptoms = Object.entries(allSymptoms).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (topSymptoms.length > 0) {
    checkPageBreak(50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.violet.r, COLORS.violet.g, COLORS.violet.b);
    doc.text('SINTOMAS MAIS FREQUENTES', margin, yPos);
    yPos += 8;

    const totalEntries = data.diaryEntries.length + data.dailyLogs.length;
    autoTable(doc, {
      startY: yPos,
      head: [['Sintoma', 'Ocorrências', 'Frequência']],
      body: topSymptoms.map(([s, count]) => [
        removeEmojis(symptomLabels[s] || s),
        `${count}x`,
        `${Math.round((count / Math.max(totalEntries, 1)) * 100)}%`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [COLORS.violet.r, COLORS.violet.g, COLORS.violet.b], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [COLORS.tableStripe.r, COLORS.tableStripe.g, COLORS.tableStripe.b] },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // === WEIGHT EVOLUTION ===
  if (weightLogs.length >= 2) {
    checkPageBreak(70);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.indigo.r, COLORS.indigo.g, COLORS.indigo.b);
    doc.text('EVOLUÇÃO DO PESO', margin, yPos);
    yPos += 8;

    const weights = weightLogs.map(w => Number(w.weight));
    const first = weights[0];
    const last = weights[weights.length - 1];
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
    const change = last - first;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
    doc.text(`Peso inicial: ${first.toFixed(1)} kg | Peso atual: ${last.toFixed(1)} kg | Variação: ${change > 0 ? '+' : ''}${change.toFixed(1)} kg`, margin, yPos);
    yPos += 6;
    doc.text(`Mínimo: ${min.toFixed(1)} kg | Máximo: ${max.toFixed(1)} kg | Média: ${avg.toFixed(1)} kg`, margin, yPos);
    yPos += 15;
  }

  // === SLEEP DATA ===
  const sleepLogs = data.dailyLogs.filter(l => l.notes).map(l => {
    try {
      const parsed = JSON.parse(l.notes || '{}');
      if (parsed.sleep_hours) return { date: l.log_date, hours: parsed.sleep_hours, quality: parsed.sleep_quality || 0 };
    } catch { /* ignore */ }
    return null;
  }).filter(Boolean) as Array<{ date: string; hours: number; quality: number }>;

  if (sleepLogs.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.teal.r, COLORS.teal.g, COLORS.teal.b);
    doc.text('QUALIDADE DO SONO', margin, yPos);
    yPos += 8;

    const avgHours = sleepLogs.reduce((a, b) => a + b.hours, 0) / sleepLogs.length;
    const avgQuality = sleepLogs.reduce((a, b) => a + b.quality, 0) / sleepLogs.length;
    const qualityLabels = ['', 'Péssima', 'Ruim', 'Regular', 'Boa', 'Excelente'];

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
    doc.text(`Média de horas: ${avgHours.toFixed(1)}h | Qualidade média: ${qualityLabels[Math.round(avgQuality)] || avgQuality.toFixed(1)}/5`, margin, yPos);
    doc.text(`Registros de sono: ${sleepLogs.length} noites`, margin, yPos + 6);
    yPos += 20;
  }

  // === EXERCISE ===
  const completedWorkouts = data.workouts.filter(w => w.completed);
  if (completedWorkouts.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.sageGreen.r, COLORS.sageGreen.g, COLORS.sageGreen.b);
    doc.text('ATIVIDADE FÍSICA', margin, yPos);
    yPos += 8;

    const totalMin = completedWorkouts.reduce((a, b) => a + (b.duration_minutes || 0), 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
    doc.text(`Treinos realizados: ${completedWorkouts.length} | Tempo total: ${totalMin} minutos`, margin, yPos);
    yPos += 15;
  }

  // === FOOTER ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(COLORS.violet.r, COLORS.violet.g, COLORS.violet.b);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightText.r, COLORS.lightText.g, COLORS.lightText.b);
    doc.text('Relatório gerado pelo aplicativo Plenya — Compartilhe com seu profissional de saúde.', pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
  }

  return doc;
}
