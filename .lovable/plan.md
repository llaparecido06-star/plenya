
# Plano: Corrigir Lógica de Atraso da Menstruação

## Problema Identificado

O app assume que a menstruação desce no dia previsto e "reinicia" o contador automaticamente. 

**Comportamento atual:**
- Dia 28 → Dia 29 → **Dia 1** (reinicia sozinho)
- Ignora que a usuária não confirmou a menstruação

**Comportamento correto:**
- Dia 28 → Dia 29 → **Dia 30** (continua contando)
- Mostra "2 dias de atraso"
- Só reseta quando a usuária registrar "menstruação desceu"

---

## Resumo da Solução

Modificar a lógica de cálculo do ciclo para:
1. Continuar contando dias além do esperado
2. Exibir estado de "atraso" quando passar do cicleLength
3. Manter previsões baseadas na última DUM real (não fictícia)

---

## Mudanças Propostas

### 1. CycleContext - Parar de Resetar Automaticamente

Remover o operador módulo (`%`) que reinicia o ciclo e adicionar:

- `isLate: boolean` - indica se está atrasada
- `daysLate: number` - quantos dias de atraso
- `hasDUM: boolean` - se tem DUM registrada

```
Antes:  let dayInCycle = diffDays % length
Depois: let dayInCycle = diffDays (sem módulo)
```

### 2. CycleWheel - Estado Visual de Atraso

Quando `cycleDay > cycleLength`:
- Mostrar "Dia 32" (real, não fictício)
- Adicionar indicação visual de atraso (ex: borda pulsante, cor diferente)
- Texto central: "4 dias de atraso"

Quando não há DUM:
- Mostrar roda neutra/cinza
- Texto: "Registre sua menstruação"

### 3. NextPeriodCard → LatePeriodCard (Condicional)

Substituir a lógica de "próxima menstruação" por "atrasada" quando apropriado:

| Estado | Card Exibido |
|--------|--------------|
| cycleDay ≤ cycleLength | NextPeriodCard (previsão) |
| cycleDay > cycleLength | **LatePeriodCard** (atraso) |
| sem DUM | **AwaitingPeriodCard** (aguardando) |

### 4. Criar Componentes de Estado

**LatePeriodCard.tsx** (Novo)
- Mostra "X dias de atraso"
- Data esperada que passou
- Botão destacado: "Menstruação começou hoje"
- Link: "Começou antes? Marcar no calendário"

**AwaitingPeriodCard.tsx** (Novo)
- Para usuárias sem DUM
- Explica a importância do registro
- Botão: "Começou hoje!"

### 5. Index.tsx - Lógica de Exibição

```
if (!hasDUM) {
  → CycleWheel (estado neutro) + AwaitingPeriodCard
} else if (isLate) {
  → CycleWheel (mostrando atraso) + LatePeriodCard  
} else {
  → CycleWheel (normal) + NextPeriodCard
}
```

---

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/contexts/CycleContext.tsx` | Remover módulo, adicionar `isLate`, `daysLate`, `hasDUM` |
| `src/components/cycle/CycleWheel.tsx` | Estado visual de atraso e aguardando |
| `src/components/home/LatePeriodCard.tsx` | **Novo** - Card de atraso |
| `src/components/home/AwaitingPeriodCard.tsx` | **Novo** - Card sem DUM |
| `src/components/home/NextPeriodCard.tsx` | Ajustar para não aparecer quando atrasada |
| `src/pages/Index.tsx` | Lógica condicional atualizada |

---

## Fluxo da Usuária

1. **Usuária no Dia 25** (5 dias antes)
   - Vê: "Previsão: 5 dias para próxima menstruação"
   
2. **Dia 28 chega** (dia esperado)
   - Vê: "Menstruação pode começar hoje!"
   - Botão em destaque para confirmar
   
3. **Dia 29, 30, 31...** (não confirmou)
   - Vê: "Dia 31" na roda (real)
   - Card vermelho: "3 dias de atraso"
   - Botão: "Confirmar que começou"
   
4. **Usuária registra menstruação**
   - DUM é atualizada automaticamente
   - Ciclo reinicia para Dia 1
   - Novas previsões são calculadas

---

## Detalhes Técnicos

### CycleContext - Modificações

```typescript
// ANTES (reinicia automaticamente)
const calculateCycleDay = (lastPeriod: Date, length: number): number => {
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  let dayInCycle = diffDays % length;  // ← PROBLEMA
  if (dayInCycle === 0) dayInCycle = length;
  return Math.max(1, Math.min(dayInCycle, length));
};

// DEPOIS (conta dias reais)
const calculateCycleDay = (lastPeriod: Date, length: number): number => {
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);  // Sem limite, sem módulo
};

// Novos valores no contexto
const hasDUM = !!lastPeriodStart;
const isLate = cycleDay > cycleLength;
const daysLate = isLate ? cycleDay - cycleLength : 0;
```

### CycleWheel - Estado de Atraso

```typescript
// Verificar estado
const isLate = cycleDay > cycleLength;
const daysLate = cycleDay - cycleLength;

// Texto central dinâmico
{isLate ? (
  <>
    <span className="text-2xl font-bold text-red-500">
      {daysLate} {daysLate === 1 ? 'dia' : 'dias'}
    </span>
    <span className="text-sm text-muted-foreground">de atraso</span>
  </>
) : (
  <span className="text-4xl font-bold">Dia {cycleDay}</span>
)}
```

---

## Benefícios

- **Honestidade**: O app não finge que sabe quando a menstruação desceu
- **Clareza**: Usuária vê exatamente há quantos dias está atrasada
- **Engajamento**: Incentiva o registro real para previsões precisas
- **Dados reais**: Histórico reflete a realidade, não suposições
