import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { 
  translateSymptom, 
  cyclePhaseTranslations, 
  lifePhaseLabels,
  moodLabels,
  energyLabels,
  stressLabels 
} from '@/lib/symptomTranslations';

// ============================================
// TYPES
// ============================================

interface ReportData {
  profile: {
    full_name: string | null;
    date_of_birth: string | null;
    life_phase: string | null;
    cycle_length: number | null;
    last_period_start: string | null;
    contraceptive_type: string | null;
    contraceptive_brand: string | null;
    pregnancy_start_date: string | null;
    goal: string | null;
  };
  dailyLogs: Array<{
    log_date: string;
    cycle_phase: string | null;
    mood: number | null;
    energy: number | null;
    stress: number | null;
    weight: number | null;
    symptoms: string[] | null;
  }>;
  menstruationLogs: Array<{
    log_date: string;
    is_menstruating: boolean;
  }>;
  intimacyLogs: Array<{
    log_date: string;
    libido: number | null;
    is_protected: boolean | null;
  }>;
  nutritionIntake: Array<{
    intake_date: string;
    meal_type: string;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  }>;
  workouts: Array<{
    workout_date: string;
    workout_name: string;
    workout_type: string;
    duration_minutes: number | null;
    completed: boolean | null;
  }>;
  dateRange: {
    start: Date;
    end: Date;
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Translates cycle phase to Portuguese (PDF-safe version without accents)
 */
function translatePhase(phase: string | null): string {
  if (!phase) return '-';
  // Use accent-free versions for PDF
  const pdfSafePhases: Record<string, string> = {
    menstrual: 'Menstrual',
    folicular: 'Folicular',
    ovulatoria: 'Ovulatoria',
    lutea: 'Lutea',
  };
  return pdfSafePhases[phase] || cyclePhaseTranslations[phase] || phase;
}

/**
 * Removes accents from string for PDF safety
 */
function removeAccents(str: string): string {
  return str
    .replace(/[áàâã]/g, 'a')
    .replace(/[éèê]/g, 'e')
    .replace(/[íìî]/g, 'i')
    .replace(/[óòôõ]/g, 'o')
    .replace(/[úùû]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ÁÀÂÃ]/g, 'A')
    .replace(/[ÉÈÊ]/g, 'E')
    .replace(/[ÍÌÎ]/g, 'I')
    .replace(/[ÓÒÔÕ]/g, 'O')
    .replace(/[ÚÙÛ]/g, 'U')
    .replace(/[Ç]/g, 'C');
}

/**
 * Translates symptom and removes accents for PDF
 */
function translateSymptomForPDF(key: string): string {
  return removeAccents(translateSymptom(key));
}

/**
 * Calculates age from birth date
 */
function calculateAge(birthDate: string): number {
  const birth = parseISO(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calculates pregnancy weeks from start date
 */
function calculatePregnancyWeeks(startDate: string): number {
  const start = parseISO(startDate);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

// ============================================
// BRAND COLORS (RGB values for jsPDF)
// ============================================

const COLORS = {
  sageGreen: { r: 139, g: 157, b: 130 },      // Verde Salvia
  terracotta: { r: 180, g: 103, b: 77 },       // Terracota  
  burntPink: { r: 199, g: 112, b: 134 },       // Rosa Queimado
  leafGreen: { r: 107, g: 142, b: 95 },        // Verde Folha
  cream: { r: 254, g: 250, b: 240 },           // Creme
  darkText: { r: 45, g: 45, b: 45 },           // Texto escuro
  lightText: { r: 120, g: 120, b: 120 },       // Texto claro
  white: { r: 255, g: 255, b: 255 },
  tableStripe: { r: 248, g: 250, b: 247 },     // Fundo alternado tabela
};

// ============================================
// DATA FETCHING
// ============================================

export async function fetchReportData(userId: string, days: number = 30): Promise<ReportData> {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  const [
    profileRes,
    dailyLogsRes,
    menstruationRes,
    intimacyRes,
    nutritionRes,
    workoutsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).single(),
    supabase.from('daily_logs').select('*').eq('user_id', userId).gte('log_date', startDateStr).lte('log_date', endDateStr).order('log_date', { ascending: true }),
    supabase.from('menstruation_logs').select('*').eq('user_id', userId).gte('log_date', startDateStr).lte('log_date', endDateStr).order('log_date', { ascending: false }),
    supabase.from('intimacy_logs').select('*').eq('user_id', userId).gte('log_date', startDateStr).lte('log_date', endDateStr).order('log_date', { ascending: false }),
    supabase.from('nutrition_intake').select('*').eq('user_id', userId).gte('intake_date', startDateStr).lte('intake_date', endDateStr).order('intake_date', { ascending: false }),
    supabase.from('workouts').select('*').eq('user_id', userId).gte('workout_date', startDateStr).lte('workout_date', endDateStr).order('workout_date', { ascending: false }),
  ]);

  return {
    profile: profileRes.data || {} as ReportData['profile'],
    dailyLogs: dailyLogsRes.data || [],
    menstruationLogs: menstruationRes.data || [],
    intimacyLogs: intimacyRes.data || [],
    nutritionIntake: nutritionRes.data || [],
    workouts: workoutsRes.data || [],
    dateRange: { start: startDate, end: endDate },
  };
}

// ============================================
// CHART DRAWING
// ============================================

function drawLineChart(
  doc: jsPDF,
  data: { date: string; mood: number | null; energy: number | null }[],
  startX: number,
  startY: number,
  width: number,
  height: number
) {
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // Background
  doc.setFillColor(COLORS.tableStripe.r, COLORS.tableStripe.g, COLORS.tableStripe.b);
  doc.roundedRect(startX, startY, width, height, 4, 4, 'F');
  
  // Border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(startX, startY, width, height, 4, 4, 'S');
  
  // Draw grid lines
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.setFontSize(7);
  doc.setTextColor(COLORS.lightText.r, COLORS.lightText.g, COLORS.lightText.b);
  
  for (let i = 0; i <= 5; i++) {
    const y = startY + padding + (chartHeight / 5) * (5 - i);
    doc.line(startX + padding, y, startX + padding + chartWidth, y);
    doc.text(`${i}`, startX + padding - 10, y + 2);
  }
  
  // Filter and prepare data points
  const moodPoints = data.filter(d => d.mood !== null).map((d, idx, arr) => ({
    x: startX + padding + (chartWidth / Math.max(arr.length - 1, 1)) * idx,
    y: startY + padding + chartHeight - (chartHeight / 5) * (d.mood || 0),
    label: d.date,
  }));
  
  const energyPoints = data.filter(d => d.energy !== null).map((d, idx, arr) => ({
    x: startX + padding + (chartWidth / Math.max(arr.length - 1, 1)) * idx,
    y: startY + padding + chartHeight - (chartHeight / 5) * (d.energy || 0),
  }));
  
  // Draw energy line (amber/terracotta)
  if (energyPoints.length > 1) {
    doc.setDrawColor(COLORS.terracotta.r, COLORS.terracotta.g, COLORS.terracotta.b);
    doc.setLineWidth(1.8);
    for (let i = 1; i < energyPoints.length; i++) {
      doc.line(energyPoints[i - 1].x, energyPoints[i - 1].y, energyPoints[i].x, energyPoints[i].y);
    }
    doc.setFillColor(COLORS.terracotta.r, COLORS.terracotta.g, COLORS.terracotta.b);
    energyPoints.forEach(p => doc.circle(p.x, p.y, 2, 'F'));
  }
  
  // Draw mood line (pink)
  if (moodPoints.length > 1) {
    doc.setDrawColor(COLORS.burntPink.r, COLORS.burntPink.g, COLORS.burntPink.b);
    doc.setLineWidth(1.8);
    for (let i = 1; i < moodPoints.length; i++) {
      doc.line(moodPoints[i - 1].x, moodPoints[i - 1].y, moodPoints[i].x, moodPoints[i].y);
    }
    doc.setFillColor(COLORS.burntPink.r, COLORS.burntPink.g, COLORS.burntPink.b);
    moodPoints.forEach(p => doc.circle(p.x, p.y, 2, 'F'));
  }
  
  // X-axis labels
  doc.setFontSize(6);
  doc.setTextColor(COLORS.lightText.r, COLORS.lightText.g, COLORS.lightText.b);
  const labelStep = Math.max(1, Math.floor(moodPoints.length / 8));
  moodPoints.forEach((p, idx) => {
    if (idx % labelStep === 0 || idx === moodPoints.length - 1) {
      doc.text(p.label, p.x, startY + height - 5, { align: 'center' });
    }
  });
  
  // Legend
  const legendY = startY + 10;
  doc.setFillColor(COLORS.burntPink.r, COLORS.burntPink.g, COLORS.burntPink.b);
  doc.circle(startX + padding + 5, legendY, 2.5, 'F');
  doc.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  doc.setFontSize(8);
  doc.text('Humor', startX + padding + 10, legendY + 2);
  
  doc.setFillColor(COLORS.terracotta.r, COLORS.terracotta.g, COLORS.terracotta.b);
  doc.circle(startX + padding + 45, legendY, 2.5, 'F');
  doc.text('Energia', startX + padding + 50, legendY + 2);
}

// ============================================
// PDF GENERATION
// ============================================

export function generateHealthReportPDF(data: ReportData, userEmail: string): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  let yPos = 0;

  // Helper to check page break
  const checkPageBreak = (requiredSpace: number = 30) => {
    if (yPos + requiredSpace > pageHeight - 25) {
      doc.addPage();
      yPos = 25;
    }
  };

  // ============================================
  // 1. BRANDED HEADER
  // ============================================
  
  // Header background - Sage Green
  doc.setFillColor(COLORS.sageGreen.r, COLORS.sageGreen.g, COLORS.sageGreen.b);
  doc.rect(0, 0, pageWidth, 42, 'F');
  
  // Decorative accent line
  doc.setFillColor(COLORS.terracotta.r, COLORS.terracotta.g, COLORS.terracotta.b);
  doc.rect(0, 42, pageWidth, 3, 'F');
  
  // Logo/Brand text
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Plenya', margin, 18);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sinta-se em casa no seu corpo', margin, 26);
  
  // Main title - right aligned
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Dossie de Saude da Mulher', pageWidth - margin, 16, { align: 'right' });
  
  // Generation date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  // Remove accents for PDF safety
  const safeDate = generationDate
    .replace(/ã/g, 'a')
    .replace(/ç/g, 'c')
    .replace(/é/g, 'e')
    .replace(/ê/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ô/g, 'o')
    .replace(/ú/g, 'u');
  doc.text(`Gerado em: ${safeDate}`, pageWidth - margin, 24, { align: 'right' });
  
  // Period covered
  const periodStart = format(data.dateRange.start, 'dd/MM/yyyy');
  const periodEnd = format(data.dateRange.end, 'dd/MM/yyyy');
  doc.text(`Periodo: ${periodStart} a ${periodEnd}`, pageWidth - margin, 32, { align: 'right' });

  yPos = 55;

  // ============================================
  // 2. PATIENT INFO BOX
  // ============================================
  
  const patientBoxHeight = 45;
  
  // Box background
  doc.setFillColor(COLORS.cream.r, COLORS.cream.g, COLORS.cream.b);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, patientBoxHeight, 4, 4, 'F');
  
  // Box border
  doc.setDrawColor(COLORS.sageGreen.r, COLORS.sageGreen.g, COLORS.sageGreen.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, patientBoxHeight, 4, 4, 'S');
  
  // Section title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.sageGreen.r, COLORS.sageGreen.g, COLORS.sageGreen.b);
  doc.text('DADOS DA PACIENTE', margin + 5, yPos + 8);
  
  // Horizontal divider
  doc.setDrawColor(COLORS.sageGreen.r, COLORS.sageGreen.g, COLORS.sageGreen.b);
  doc.setLineWidth(0.3);
  doc.line(margin + 5, yPos + 12, pageWidth - margin - 5, yPos + 12);
  
  // Patient data
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  
  const name = data.profile.full_name || userEmail.split('@')[0];
  let patientInfoY = yPos + 20;
  
  // Left column
  doc.setFont('helvetica', 'bold');
  doc.text('Nome:', margin + 5, patientInfoY);
  doc.setFont('helvetica', 'normal');
  doc.text(name, margin + 25, patientInfoY);
  
  if (data.profile.date_of_birth) {
    const age = calculateAge(data.profile.date_of_birth);
    doc.setFont('helvetica', 'bold');
    doc.text('Idade:', margin + 5, patientInfoY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${age} anos`, margin + 25, patientInfoY + 7);
  }
  
  // Right column
  const rightColX = pageWidth / 2 + 10;
  
  // Life phase with pregnancy weeks if applicable
  let phaseText = lifePhaseLabels[data.profile.life_phase || ''] || 'Nao informado';
  if (data.profile.life_phase === 'pregnant' && data.profile.pregnancy_start_date) {
    const weeks = calculatePregnancyWeeks(data.profile.pregnancy_start_date);
    phaseText = `Gestante (${weeks} semanas)`;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Fase Atual:', rightColX, patientInfoY);
  doc.setFont('helvetica', 'normal');
  doc.text(phaseText, rightColX + 30, patientInfoY);
  
  if (data.profile.cycle_length && data.profile.life_phase !== 'pregnant') {
    doc.setFont('helvetica', 'bold');
    doc.text('Ciclo Medio:', rightColX, patientInfoY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.profile.cycle_length} dias`, rightColX + 30, patientInfoY + 7);
  }
  
  // Contraceptive info (third row)
  if (data.profile.contraceptive_type && data.profile.life_phase !== 'pregnant') {
    const contraceptiveText = data.profile.contraceptive_brand || data.profile.contraceptive_type;
    doc.setFont('helvetica', 'bold');
    doc.text('Contraceptivo:', margin + 5, patientInfoY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(contraceptiveText, margin + 40, patientInfoY + 14);
  }

  yPos += patientBoxHeight + 15;

  // ============================================
  // 3. SUMMARY STATISTICS
  // ============================================
  
  checkPageBreak(60);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.terracotta.r, COLORS.terracotta.g, COLORS.terracotta.b);
  doc.text('RESUMO DO PERIODO', margin, yPos);
  yPos += 8;
  
  // Stats boxes
  const boxWidth = (pageWidth - margin * 2 - 15) / 4;
  const boxHeight = 25;
  const statsBoxY = yPos;
  
  // Calculate statistics
  const moodLogs = data.dailyLogs.filter(l => l.mood !== null);
  const energyLogs = data.dailyLogs.filter(l => l.energy !== null);
  const stressLogs = data.dailyLogs.filter(l => l.stress !== null);
  const menstruatingDays = data.menstruationLogs.filter(l => l.is_menstruating).length;
  
  const avgMood = moodLogs.length > 0 
    ? moodLogs.reduce((a, b) => a + (b.mood || 0), 0) / moodLogs.length 
    : null;
  const avgEnergy = energyLogs.length > 0 
    ? energyLogs.reduce((a, b) => a + (b.energy || 0), 0) / energyLogs.length 
    : null;
  const avgStress = stressLogs.length > 0 
    ? stressLogs.reduce((a, b) => a + (b.stress || 0), 0) / stressLogs.length 
    : null;
  
  const stats = [
    { 
      label: 'Humor Medio', 
      value: avgMood ? `${avgMood.toFixed(1)}/5` : '-',
      subtext: avgMood ? moodLabels[Math.round(avgMood)] : ''
    },
    { 
      label: 'Energia Media', 
      value: avgEnergy ? `${avgEnergy.toFixed(1)}/5` : '-',
      subtext: avgEnergy ? energyLabels[Math.round(avgEnergy)] : ''
    },
    { 
      label: 'Estresse Medio', 
      value: avgStress ? `${avgStress.toFixed(1)}/5` : '-',
      subtext: avgStress ? stressLabels[Math.round(avgStress)] : ''
    },
    { 
      label: 'Dias Registrados', 
      value: `${data.dailyLogs.length}`,
      subtext: menstruatingDays > 0 ? `${menstruatingDays} em menstruacao` : ''
    },
  ];
  
  stats.forEach((stat, idx) => {
    const boxX = margin + idx * (boxWidth + 5);
    
    // Box background
    doc.setFillColor(COLORS.tableStripe.r, COLORS.tableStripe.g, COLORS.tableStripe.b);
    doc.roundedRect(boxX, statsBoxY, boxWidth, boxHeight, 3, 3, 'F');
    
    // Value
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.sageGreen.r, COLORS.sageGreen.g, COLORS.sageGreen.b);
    doc.text(stat.value, boxX + boxWidth / 2, statsBoxY + 10, { align: 'center' });
    
    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.lightText.r, COLORS.lightText.g, COLORS.lightText.b);
    doc.text(stat.label, boxX + boxWidth / 2, statsBoxY + 16, { align: 'center' });
    
    // Subtext
    if (stat.subtext) {
      doc.setFontSize(6);
      doc.text(stat.subtext, boxX + boxWidth / 2, statsBoxY + 21, { align: 'center' });
    }
  });
  
  yPos = statsBoxY + boxHeight + 15;

  // ============================================
  // 4. SYMPTOMS ANALYSIS
  // ============================================
  
  const symptomCounts: Record<string, number> = {};
  data.dailyLogs.forEach(log => {
    (log.symptoms || []).forEach(s => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  });
  
  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  if (topSymptoms.length > 0) {
    checkPageBreak(45);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.terracotta.r, COLORS.terracotta.g, COLORS.terracotta.b);
    doc.text('SINTOMAS MAIS FREQUENTES', margin, yPos);
    yPos += 8;
    
    // Symptoms table
    const symptomTableData = topSymptoms.map(([symptom, count]) => [
      translateSymptomForPDF(symptom),
      `${count}x`,
      `${((count / data.dailyLogs.length) * 100).toFixed(0)}%`
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Sintoma', 'Ocorrencias', 'Frequencia']],
      body: symptomTableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [COLORS.sageGreen.r, COLORS.sageGreen.g, COLORS.sageGreen.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b],
      },
      alternateRowStyles: {
        fillColor: [COLORS.tableStripe.r, COLORS.tableStripe.g, COLORS.tableStripe.b],
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
      },
      margin: { left: margin, right: margin },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ============================================
  // 5. MOOD/ENERGY CHART
  // ============================================
  
  if (data.dailyLogs.length >= 3) {
    checkPageBreak(75);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.terracotta.r, COLORS.terracotta.g, COLORS.terracotta.b);
    doc.text('EVOLUCAO DO HUMOR E ENERGIA', margin, yPos);
    yPos += 8;
    
    const chartData = data.dailyLogs.map(log => ({
      date: format(parseISO(log.log_date), 'dd/MM'),
      mood: log.mood,
      energy: log.energy,
    }));
    
    drawLineChart(doc, chartData, margin, yPos, pageWidth - margin * 2, 60);
    yPos += 70;
  }

  // ============================================
  // 6. DETAILED DAILY LOGS TABLE
  // ============================================
  
  if (data.dailyLogs.length > 0) {
    checkPageBreak(80);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.terracotta.r, COLORS.terracotta.g, COLORS.terracotta.b);
    doc.text('HISTORICO DETALHADO', margin, yPos);
    yPos += 8;
    
    // Prepare table data with translations
    const tableData = data.dailyLogs.slice(0, 20).map(log => {
      const translatedSymptoms = (log.symptoms || [])
        .slice(0, 3)
        .map(s => translateSymptomForPDF(s))
        .join(', ');
      
      return [
        format(parseISO(log.log_date), 'dd/MM'),
        translatePhase(log.cycle_phase),
        log.mood ? `${log.mood}/5` : '-',
        log.energy ? `${log.energy}/5` : '-',
        log.stress ? `${log.stress}/5` : '-',
        translatedSymptoms || '-',
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Fase', 'Humor', 'Energia', 'Estresse', 'Sintomas']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [COLORS.sageGreen.r, COLORS.sageGreen.g, COLORS.sageGreen.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b],
      },
      alternateRowStyles: {
        fillColor: [COLORS.tableStripe.r, COLORS.tableStripe.g, COLORS.tableStripe.b],
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 22 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ============================================
  // 7. NUTRITION SUMMARY
  // ============================================
  
  if (data.nutritionIntake.length > 0) {
    checkPageBreak(50);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.terracotta.r, COLORS.terracotta.g, COLORS.terracotta.b);
    doc.text('NUTRICAO', margin, yPos);
    yPos += 8;
    
    const totalCalories = data.nutritionIntake.reduce((a, b) => a + (b.calories || 0), 0);
    const totalProtein = data.nutritionIntake.reduce((a, b) => a + (b.protein || 0), 0);
    const totalCarbs = data.nutritionIntake.reduce((a, b) => a + (b.carbs || 0), 0);
    const totalFat = data.nutritionIntake.reduce((a, b) => a + (b.fat || 0), 0);
    const uniqueDays = new Set(data.nutritionIntake.map(n => n.intake_date)).size;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
    
    doc.text(`Total de refeicoes registradas: ${data.nutritionIntake.length}`, margin, yPos);
    yPos += 6;
    doc.text(`Media de calorias diarias: ${(totalCalories / uniqueDays).toFixed(0)} kcal`, margin, yPos);
    yPos += 6;
    doc.text(`Macros totais: Proteina ${totalProtein.toFixed(0)}g | Carboidratos ${totalCarbs.toFixed(0)}g | Gordura ${totalFat.toFixed(0)}g`, margin, yPos);
    yPos += 15;
  }

  // ============================================
  // 8. WORKOUTS SUMMARY
  // ============================================
  
  if (data.workouts.length > 0) {
    checkPageBreak(50);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.terracotta.r, COLORS.terracotta.g, COLORS.terracotta.b);
    doc.text('ATIVIDADE FISICA', margin, yPos);
    yPos += 8;
    
    const completedWorkouts = data.workouts.filter(w => w.completed);
    const totalMinutes = completedWorkouts.reduce((a, b) => a + (b.duration_minutes || 0), 0);
    
    const workoutTypes: Record<string, number> = {};
    completedWorkouts.forEach(w => {
      workoutTypes[w.workout_type] = (workoutTypes[w.workout_type] || 0) + 1;
    });
    
    const typeLabels: Record<string, string> = {
      hiit: 'HIIT',
      forca: 'Forca',
      yoga: 'Yoga',
      mobilidade: 'Mobilidade',
      cardio: 'Cardio',
    };
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
    
    doc.text(`Treinos realizados: ${completedWorkouts.length}`, margin, yPos);
    yPos += 6;
    doc.text(`Tempo total: ${totalMinutes} minutos`, margin, yPos);
    yPos += 6;
    
    const typeBreakdown = Object.entries(workoutTypes)
      .map(([type, count]) => `${typeLabels[type] || type}: ${count}`)
      .join(' | ');
    
    if (typeBreakdown) {
      doc.text(`Por tipo: ${typeBreakdown}`, margin, yPos);
    }
    
    yPos += 15;
  }

  // ============================================
  // 9. FOOTER ON ALL PAGES
  // ============================================
  
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(COLORS.sageGreen.r, COLORS.sageGreen.g, COLORS.sageGreen.b);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightText.r, COLORS.lightText.g, COLORS.lightText.b);
    doc.text(
      'Este relatorio foi gerado automaticamente pelo aplicativo Plenya.',
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );
    doc.text(
      'Compartilhe com seu profissional de saude para um acompanhamento personalizado.',
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
    
    // Page number
    doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
  }

  return doc;
}
