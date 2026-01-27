import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface ReportData {
  profile: {
    full_name: string | null;
    date_of_birth: string | null;
    life_phase: string | null;
    cycle_length: number | null;
    last_period_start: string | null;
    contraceptive_type: string | null;
    contraceptive_brand: string | null;
    goal: string | null;
  };
  dailyLogs: Array<{
    log_date: string;
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
}

const lifePhaseLabels: Record<string, string> = {
  menstruating: 'Menstruando regularmente',
  pregnant: 'Gestante',
  menopause: 'Menopausa/Climatério',
};

const moodEmojis = ['😢', '😔', '😐', '😊', '🤩'];
const energyLabels = ['Muito baixa', 'Baixa', 'Moderada', 'Alta', 'Muito alta'];

export async function fetchReportData(userId: string, days: number = 30): Promise<ReportData> {
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
  const endDate = format(new Date(), 'yyyy-MM-dd');

  const [
    profileRes,
    dailyLogsRes,
    menstruationRes,
    intimacyRes,
    nutritionRes,
    workoutsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).single(),
    supabase.from('daily_logs').select('*').eq('user_id', userId).gte('log_date', startDate).lte('log_date', endDate).order('log_date', { ascending: false }),
    supabase.from('menstruation_logs').select('*').eq('user_id', userId).gte('log_date', startDate).lte('log_date', endDate).order('log_date', { ascending: false }),
    supabase.from('intimacy_logs').select('*').eq('user_id', userId).gte('log_date', startDate).lte('log_date', endDate).order('log_date', { ascending: false }),
    supabase.from('nutrition_intake').select('*').eq('user_id', userId).gte('intake_date', startDate).lte('intake_date', endDate).order('intake_date', { ascending: false }),
    supabase.from('workouts').select('*').eq('user_id', userId).gte('workout_date', startDate).lte('workout_date', endDate).order('workout_date', { ascending: false }),
  ]);

  return {
    profile: profileRes.data || {} as ReportData['profile'],
    dailyLogs: dailyLogsRes.data || [],
    menstruationLogs: menstruationRes.data || [],
    intimacyLogs: intimacyRes.data || [],
    nutritionIntake: nutritionRes.data || [],
    workouts: workoutsRes.data || [],
  };
}

export function generateHealthReportPDF(data: ReportData, userEmail: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number = 30) => {
    if (yPos + requiredSpace > 270) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Header
  doc.setFillColor(236, 72, 153); // Primary pink
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Saúde Feminina', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, pageWidth / 2, 25, { align: 'center' });
  doc.text('Plenya - Seu Aplicativo de Saúde', pageWidth / 2, 31, { align: 'center' });

  yPos = 45;
  doc.setTextColor(0, 0, 0);

  // Patient Info Section
  doc.setFillColor(252, 231, 243); // Light pink
  doc.rect(10, yPos - 5, pageWidth - 20, 35, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações da Paciente', 15, yPos + 3);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPos += 12;
  
  const name = data.profile.full_name || userEmail.split('@')[0];
  doc.text(`Nome: ${name}`, 15, yPos);
  
  if (data.profile.date_of_birth) {
    const birthDate = parseISO(data.profile.date_of_birth);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    doc.text(`Data de Nascimento: ${format(birthDate, 'dd/MM/yyyy')} (${age} anos)`, 100, yPos);
  }
  
  yPos += 7;
  const lifePhase = data.profile.life_phase ? lifePhaseLabels[data.profile.life_phase] || data.profile.life_phase : 'Não informado';
  doc.text(`Fase de Vida: ${lifePhase}`, 15, yPos);
  
  if (data.profile.cycle_length) {
    doc.text(`Ciclo Médio: ${data.profile.cycle_length} dias`, 100, yPos);
  }
  
  yPos += 7;
  if (data.profile.contraceptive_type) {
    doc.text(`Método Contraceptivo: ${data.profile.contraceptive_brand || data.profile.contraceptive_type}`, 15, yPos);
  }

  yPos += 20;

  // Menstrual Cycle Section
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(190, 24, 93);
  doc.text('📅 Ciclo Menstrual (Últimos 30 dias)', 15, yPos);
  yPos += 8;
  doc.setTextColor(0, 0, 0);

  if (data.menstruationLogs.length > 0) {
    const menstruatingDays = data.menstruationLogs.filter(l => l.is_menstruating).map(l => 
      format(parseISO(l.log_date), 'dd/MM')
    );
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (menstruatingDays.length > 0) {
      doc.text(`Dias de menstruação: ${menstruatingDays.join(', ')}`, 15, yPos);
      yPos += 6;
      doc.text(`Total de dias menstruando: ${menstruatingDays.length}`, 15, yPos);
    } else {
      doc.text('Nenhum dia de menstruação registrado no período.', 15, yPos);
    }
    
    if (data.profile.last_period_start) {
      yPos += 6;
      doc.text(`Última menstruação iniciou em: ${format(parseISO(data.profile.last_period_start), 'dd/MM/yyyy')}`, 15, yPos);
    }
  } else {
    doc.setFontSize(10);
    doc.text('Nenhum registro de menstruação no período.', 15, yPos);
  }

  yPos += 15;

  // Daily Logs Summary
  checkPageBreak(60);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(190, 24, 93);
  doc.text('💭 Bem-estar Diário', 15, yPos);
  yPos += 8;
  doc.setTextColor(0, 0, 0);

  if (data.dailyLogs.length > 0) {
    // Calculate averages
    const moodLogs = data.dailyLogs.filter(l => l.mood !== null);
    const energyLogs = data.dailyLogs.filter(l => l.energy !== null);
    const stressLogs = data.dailyLogs.filter(l => l.stress !== null);
    const weightLogs = data.dailyLogs.filter(l => l.weight !== null);

    const avgMood = moodLogs.length > 0 ? moodLogs.reduce((a, b) => a + (b.mood || 0), 0) / moodLogs.length : null;
    const avgEnergy = energyLogs.length > 0 ? energyLogs.reduce((a, b) => a + (b.energy || 0), 0) / energyLogs.length : null;
    const avgStress = stressLogs.length > 0 ? stressLogs.reduce((a, b) => a + (b.stress || 0), 0) / stressLogs.length : null;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Registros no período: ${data.dailyLogs.length} dias`, 15, yPos);
    yPos += 7;

    if (avgMood !== null) {
      doc.text(`Humor médio: ${avgMood.toFixed(1)}/5 ${moodEmojis[Math.round(avgMood) - 1] || ''}`, 15, yPos);
      yPos += 6;
    }
    if (avgEnergy !== null) {
      doc.text(`Energia média: ${avgEnergy.toFixed(1)}/5 (${energyLabels[Math.round(avgEnergy) - 1] || ''})`, 15, yPos);
      yPos += 6;
    }
    if (avgStress !== null) {
      doc.text(`Nível de estresse médio: ${avgStress.toFixed(1)}/5`, 15, yPos);
      yPos += 6;
    }

    // Weight tracking
    if (weightLogs.length > 0) {
      const weights = weightLogs.map(l => l.weight!);
      const minWeight = Math.min(...weights);
      const maxWeight = Math.max(...weights);
      const lastWeight = weights[0];
      doc.text(`Peso: ${lastWeight.toFixed(1)} kg (variação: ${minWeight.toFixed(1)} - ${maxWeight.toFixed(1)} kg)`, 15, yPos);
      yPos += 6;
    }

    // Symptom frequency
    const symptomCounts: Record<string, number> = {};
    data.dailyLogs.forEach(log => {
      (log.symptoms || []).forEach(s => {
        symptomCounts[s] = (symptomCounts[s] || 0) + 1;
      });
    });

    const topSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topSymptoms.length > 0) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Sintomas mais frequentes:', 15, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      
      topSymptoms.forEach(([symptom, count]) => {
        doc.text(`• ${symptom}: ${count} ocorrência(s)`, 20, yPos);
        yPos += 5;
      });
    }
  } else {
    doc.setFontSize(10);
    doc.text('Nenhum registro de bem-estar no período.', 15, yPos);
  }

  yPos += 15;

  // Nutrition Summary
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(190, 24, 93);
  doc.text('🥗 Nutrição', 15, yPos);
  yPos += 8;
  doc.setTextColor(0, 0, 0);

  if (data.nutritionIntake.length > 0) {
    const totalCalories = data.nutritionIntake.reduce((a, b) => a + (b.calories || 0), 0);
    const totalProtein = data.nutritionIntake.reduce((a, b) => a + (b.protein || 0), 0);
    const totalCarbs = data.nutritionIntake.reduce((a, b) => a + (b.carbs || 0), 0);
    const totalFat = data.nutritionIntake.reduce((a, b) => a + (b.fat || 0), 0);

    const uniqueDays = new Set(data.nutritionIntake.map(n => n.intake_date)).size;
    const avgCalories = totalCalories / uniqueDays;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de refeições registradas: ${data.nutritionIntake.length}`, 15, yPos);
    yPos += 6;
    doc.text(`Média de calorias diárias: ${avgCalories.toFixed(0)} kcal`, 15, yPos);
    yPos += 6;
    doc.text(`Macros totais: Proteína ${totalProtein.toFixed(0)}g | Carboidratos ${totalCarbs.toFixed(0)}g | Gordura ${totalFat.toFixed(0)}g`, 15, yPos);
  } else {
    doc.setFontSize(10);
    doc.text('Nenhum registro nutricional no período.', 15, yPos);
  }

  yPos += 15;

  // Workouts Summary
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(190, 24, 93);
  doc.text('💪 Atividade Física', 15, yPos);
  yPos += 8;
  doc.setTextColor(0, 0, 0);

  if (data.workouts.length > 0) {
    const completedWorkouts = data.workouts.filter(w => w.completed);
    const totalMinutes = completedWorkouts.reduce((a, b) => a + (b.duration_minutes || 0), 0);

    const workoutTypes: Record<string, number> = {};
    completedWorkouts.forEach(w => {
      workoutTypes[w.workout_type] = (workoutTypes[w.workout_type] || 0) + 1;
    });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Treinos realizados: ${completedWorkouts.length}`, 15, yPos);
    yPos += 6;
    doc.text(`Tempo total de exercício: ${totalMinutes} minutos`, 15, yPos);
    yPos += 6;

    const typeLabels: Record<string, string> = {
      hiit: 'HIIT',
      forca: 'Força',
      yoga: 'Yoga',
      mobilidade: 'Mobilidade',
      cardio: 'Cardio',
    };

    const typeBreakdown = Object.entries(workoutTypes)
      .map(([type, count]) => `${typeLabels[type] || type}: ${count}`)
      .join(', ');
    
    if (typeBreakdown) {
      doc.text(`Por tipo: ${typeBreakdown}`, 15, yPos);
    }
  } else {
    doc.setFontSize(10);
    doc.text('Nenhum treino registrado no período.', 15, yPos);
  }

  yPos += 15;

  // Daily Logs Table (if space allows)
  if (data.dailyLogs.length > 0) {
    checkPageBreak(80);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 24, 93);
    doc.text('📊 Histórico Detalhado', 15, yPos);
    yPos += 10;

    const tableData = data.dailyLogs.slice(0, 14).map(log => [
      format(parseISO(log.log_date), 'dd/MM'),
      log.mood ? `${log.mood}/5` : '-',
      log.energy ? `${log.energy}/5` : '-',
      log.stress ? `${log.stress}/5` : '-',
      log.weight ? `${log.weight}kg` : '-',
      (log.symptoms || []).slice(0, 2).join(', ') || '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Humor', 'Energia', 'Estresse', 'Peso', 'Sintomas']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [236, 72, 153] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 'auto' },
      },
    });
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Este relatório foi gerado automaticamente pelo app Plenya. Compartilhe com seu profissional de saúde.',
      pageWidth / 2,
      285,
      { align: 'center' }
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 15, 285, { align: 'right' });
  }

  return doc;
}
