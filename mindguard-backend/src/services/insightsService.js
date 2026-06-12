// services/insightsService.js
// Gera recomendações personalizadas e narrativa semanal com base em dados do usuário.
import { query } from '../config/database.js';

const SIGNAL_DISPLAY = {
  HRV:            'variabilidade cardíaca (HRV)',
  HR_resting:     'frequência cardíaca em repouso',
  sleep_duration: 'duração do sono',
  sleep_quality:  'qualidade do sono',
  stress_level:   'nível de estresse',
  energy_level:   'nível de energia',
  mood:           'humor',
  steps:          'passos diários',
};

class InsightsService {
  async generateInsights(userId) {
    const [riskRow, signalTrends, lastQuestionnaires, activeContexts] = await Promise.all([
      this._getLastRisk(userId),
      this._getSignalTrends(userId),
      this._getLastQuestionnaires(userId),
      this._getActiveContexts(userId),
    ]);

    const recommendations = this._buildRecommendations(riskRow, signalTrends, lastQuestionnaires, activeContexts);
    const weeklyNarrative = this._buildWeeklyNarrative(riskRow, signalTrends, lastQuestionnaires);

    return { recommendations, weekly_narrative: weeklyNarrative };
  }

  async _getLastRisk(userId) {
    const r = await query(
      `SELECT ra.risk_score, rl.code AS risk_level, ra.primary_explanation
       FROM risk_assessments ra
       JOIN risk_levels rl ON ra.risk_level_id = rl.id
       WHERE ra.user_id = $1
       ORDER BY ra.assessment_timestamp DESC LIMIT 1`,
      [userId]
    );
    return r.rows[0] || null;
  }

  async _getSignalTrends(userId) {
    const r = await query(
      `SELECT
         st.name,
         AVG(CASE WHEN us.timestamp >= NOW() - INTERVAL '7 days'  THEN us.value END)  AS recent_7d,
         AVG(CASE WHEN us.timestamp >= NOW() - INTERVAL '14 days'
                  AND us.timestamp < NOW() - INTERVAL '7 days'    THEN us.value END) AS prev_7d,
         AVG(us.value) AS all_avg,
         COUNT(*) AS readings
       FROM user_signals us
       JOIN signal_types st ON us.signal_type_id = st.id
       WHERE us.user_id = $1
         AND us.timestamp >= NOW() - INTERVAL '14 days'
         AND us.is_outlier = FALSE
       GROUP BY st.name`,
      [userId]
    );
    return r.rows;
  }

  async _getLastQuestionnaires(userId) {
    const r = await query(
      `SELECT DISTINCT ON (qt.code)
         qt.code, qt.name, qt.max_score, qr.total_score, qr.completed_at
       FROM questionnaire_responses qr
       JOIN questionnaire_types qt ON qr.questionnaire_type_id = qt.id
       WHERE qr.user_id = $1 AND qr.is_valid = TRUE
       ORDER BY qt.code, qr.completed_at DESC`,
      [userId]
    );
    return r.rows;
  }

  async _getActiveContexts(userId) {
    const r = await query(
      `SELECT ct.code, ct.name, uc.severity
       FROM user_contexts uc
       JOIN context_types ct ON uc.context_type_id = ct.id
       WHERE uc.user_id = $1 AND uc.is_active = TRUE`,
      [userId]
    );
    return r.rows;
  }

  _getSignalValue(trends, name) {
    const row = trends.find(r => r.name === name);
    if (!row || row.recent_7d == null) return null;
    return {
      recent:  parseFloat(row.recent_7d),
      prev:    row.prev_7d != null ? parseFloat(row.prev_7d) : null,
      pct:     row.prev_7d != null ? ((parseFloat(row.recent_7d) - parseFloat(row.prev_7d)) / Math.abs(parseFloat(row.prev_7d))) * 100 : null,
    };
  }

  _buildRecommendations(risk, trends, questionnaires, contexts) {
    const recs = [];
    const riskScore = risk ? parseFloat(risk.risk_score) : 0;
    const riskLevel = risk?.risk_level || 'stable';

    const sleep   = this._getSignalValue(trends, 'sleep_duration');
    const hrv     = this._getSignalValue(trends, 'HRV');
    const stress  = this._getSignalValue(trends, 'stress_level');
    const mood    = this._getSignalValue(trends, 'mood');
    const energy  = this._getSignalValue(trends, 'energy_level');
    const steps   = this._getSignalValue(trends, 'steps');
    const hr      = this._getSignalValue(trends, 'HR_resting');

    const qMap = {};
    questionnaires.forEach(q => { qMap[q.code] = q; });
    const pss = qMap['PSS'];
    const gad = qMap['GAD7'];

    const contextCodes = new Set(contexts.map(c => c.code));

    // --- 1. Sleep ---
    if (sleep && sleep.recent < 6.5) {
      recs.push({
        type: 'sleep',
        priority: 'high',
        title: 'Priorize o sono esta semana',
        reason: `Sua média de sono nos últimos 7 dias foi ${sleep.recent.toFixed(1)}h, abaixo do mínimo recomendado de 7h. Sono insuficiente amplifica todos os outros indicadores de risco e prejudica a recuperação do SNC.`,
        action: 'Vá para a cama 30 minutos mais cedo por 3 dias seguidos. Sem telas 1h antes de dormir.',
        action_type: 'quick_win',
      });
    } else if (sleep && sleep.pct != null && sleep.pct < -15) {
      recs.push({
        type: 'sleep',
        priority: 'medium',
        title: 'Seu sono piorou esta semana',
        reason: `A duração média caiu ${Math.abs(sleep.pct).toFixed(0)}% em relação à semana anterior (${sleep.recent.toFixed(1)}h vs ${sleep.prev?.toFixed(1)}h). Quedas graduais no sono precedem picos de estresse.`,
        action: 'Mantenha o mesmo horário para dormir e acordar, inclusive no fim de semana.',
        action_type: 'habit',
      });
    }

    // --- 2. HRV / Breathing ---
    if (hrv && hrv.pct != null && hrv.pct < -20) {
      recs.push({
        type: 'breathing',
        priority: 'high',
        title: 'Exercício de respiração (5 min)',
        reason: `Sua HRV caiu ${Math.abs(hrv.pct).toFixed(0)}% esta semana (atual: ${hrv.recent.toFixed(0)} ms). Isso indica ativação sustentada do sistema nervoso simpático — seu corpo está em modo de alerta prolongado.`,
        action: 'Inspire por 4s, segure por 4s, expire por 6s. Repita 5 vezes, 3× ao dia. Ou use o exercício guiado na aba Ferramentas.',
        action_type: 'immediate',
      });
    }

    // --- 3. Stress / Meditation ---
    if (stress && stress.recent >= 7) {
      const alreadyHasBreathing = recs.some(r => r.type === 'breathing');
      if (alreadyHasBreathing) {
        recs.push({
          type: 'meditation',
          priority: 'medium',
          title: 'Meditação de 10 minutos',
          reason: `Estresse médio de ${stress.recent.toFixed(0)}/10 por vários dias seguidos. A prática de mindfulness reduz cortisol e melhora a resposta ao estresse ao longo do tempo.`,
          action: 'Use um app de meditação guiada (Headspace, Insight Timer) por 10 min antes de dormir.',
          action_type: 'habit',
        });
      } else {
        recs.push({
          type: 'breathing',
          priority: 'medium',
          title: 'Pausa consciente — respiração',
          reason: `Estresse médio de ${stress.recent.toFixed(0)}/10. Técnicas de respiração ativam o sistema nervoso parassimpático e reduzem cortisol em 15 minutos.`,
          action: 'Reserve 5 minutos após o almoço para respiração diafragmática profunda.',
          action_type: 'habit',
        });
      }
    }

    // --- 4. Work deadline context ---
    if (contextCodes.has('work_deadline')) {
      recs.push({
        type: 'context',
        priority: stress?.recent >= 6 ? 'high' : 'medium',
        title: 'Gerencie o estresse do prazo',
        reason: `Você tem um deadline ativo. Sob pressão contínua, pausas planejadas aumentam produtividade em até 25% e reduzem o risco de burnout pós-entrega.`,
        action: 'Técnica Pomodoro: 25 min de foco intenso + 5 min de pausa ativa (alongamento, água). Após 4 ciclos, pausa longa de 20 min.',
        action_type: 'habit',
      });
    }

    // --- 5. Movement / Steps ---
    if (steps) {
      const stepCount = Math.round(steps.recent);
      if (stepCount < 4000) {
        recs.push({
          type: 'movement',
          priority: 'high',
          title: 'Movimento urgente',
          reason: `Média de ${stepCount.toLocaleString('pt-BR')} passos/dia — muito abaixo do mínimo recomendado de 7.000. Sedentarismo intensifica ansiedade e reduz HRV.`,
          action: 'Caminhada de 20 min ao meio-dia e 10 min após o jantar. Qualquer movimento conta.',
          action_type: 'immediate',
        });
      } else if (stepCount < 7000) {
        recs.push({
          type: 'movement',
          priority: 'medium',
          title: 'Aumente os passos diários',
          reason: `Média de ${stepCount.toLocaleString('pt-BR')} passos/dia, ${(7000 - stepCount).toLocaleString('pt-BR')} abaixo da meta. Caminhar 30 min por dia reduz risco cardiovascular e melhora qualidade do sono.`,
          action: 'Adicione uma caminhada de 15 min no intervalo do almoço ou uma volta no quarteirão após o jantar.',
          action_type: 'habit',
        });
      }
    }

    // --- 6. Journaling when mood is low ---
    if (mood && mood.recent < 5) {
      recs.push({
        type: 'journaling',
        priority: 'medium',
        title: 'Escreva sobre o que está sentindo',
        reason: `Humor médio de ${mood.recent.toFixed(0)}/10 nesta semana. Escrita terapêutica ajuda a externalizar pensamentos, reduz ruminação e melhora clareza emocional.`,
        action: 'Reserve 10 minutos para escrever livremente — sem julgamento, sem edição. Qual pensamento está mais ocupando sua mente?',
        action_type: 'immediate',
      });
    }

    // --- 7. Social connection when energy is low ---
    if (energy && energy.recent < 4 && !contextCodes.has('work_deadline')) {
      recs.push({
        type: 'social',
        priority: 'low',
        title: 'Reconecte-se com alguém de confiança',
        reason: `Energia baixa (${energy.recent.toFixed(0)}/10) combinada com isolamento pode amplificar sintomas ansiosos. Conexão social tem efeito comprovado na recuperação do equilíbrio emocional.`,
        action: 'Envie uma mensagem para alguém próximo. Bastam 15 minutos de conversa real — presencial ou por voz.',
        action_type: 'habit',
      });
    }

    // --- 8. PSS refill ---
    if (pss) {
      const pssScore = parseFloat(pss.total_score);
      const daysSince = Math.floor((Date.now() - new Date(pss.completed_at)) / 86400000);
      if (pssScore >= 27 && daysSince >= 7) {
        recs.push({
          type: 'questionnaire',
          priority: 'high',
          title: 'Refaça o PSS-10',
          reason: `Seu último PSS foi ${pssScore}/40 (estresse elevado), há ${daysSince} dias. Refazer permite comparar e identificar tendências antes que o quadro se agrave.`,
          action: 'PSS-10 leva menos de 3 minutos. 10 perguntas, resposta imediata.',
          action_type: 'questionnaire',
          questionnaire_code: 'PSS',
        });
      }
    }

    // --- 9. GAD-7 refill ---
    if (gad) {
      const gadScore = parseFloat(gad.total_score);
      const daysSince = Math.floor((Date.now() - new Date(gad.completed_at)) / 86400000);
      if (gadScore >= 10 && daysSince >= 7) {
        recs.push({
          type: 'questionnaire',
          priority: 'medium',
          title: 'Refaça o GAD-7',
          reason: `Seu último GAD-7 foi ${gadScore}/21 (ansiedade ${gadScore >= 15 ? 'moderada-severa' : 'moderada'}), há ${daysSince} dias. Monitorar evolução é essencial para ajustar estratégias.`,
          action: 'GAD-7: 7 perguntas, menos de 2 minutos.',
          action_type: 'questionnaire',
          questionnaire_code: 'GAD7',
        });
      }
    }

    // --- 10. First questionnaire CTA (new users) ---
    if (!pss && !gad && recs.length === 0) {
      recs.push({
        type: 'questionnaire',
        priority: 'medium',
        title: 'Responda seus primeiros questionários',
        reason: 'Questionários clínicos representam 70% do cálculo de risco. Sem eles, a análise é baseada apenas em sinais fisiológicos e fica incompleta.',
        action: 'Comece pelo PSS-10 — 10 perguntas, menos de 3 minutos. Resultado imediato.',
        action_type: 'questionnaire',
        questionnaire_code: 'PSS',
      });
    }

    // --- 11. Professional consultation for high risk ---
    if (riskScore >= 60 && riskLevel !== 'stable') {
      recs.push({
        type: 'professional',
        priority: 'high',
        title: 'Considere agendar uma consulta',
        reason: `Score de risco ${Math.round(riskScore)}% com múltiplos sinais alterados. Uma conversa com psicólogo permite estratégias personalizadas antes que o quadro se agrave.`,
        action: 'Veja os especialistas disponíveis pelo plano CarePlus na seção Tratamento. Consulta pode ser agendada em 48h.',
        action_type: 'appointment',
      });
    }

    // --- 12. Progress recognition ---
    const improving = [];
    if (hrv?.pct != null && hrv.pct > 10)      improving.push('HRV');
    if (sleep?.pct != null && sleep.pct > 10)   improving.push('sono');
    if (mood?.pct != null && mood.pct > 15)     improving.push('humor');
    if (stress?.pct != null && stress.pct < -15) improving.push('estresse');
    if (improving.length >= 2) {
      recs.push({
        type: 'achievement',
        priority: 'low',
        title: `Progresso: ${improving.slice(0, 2).join(' e ')} melhoraram`,
        reason: `${improving.slice(0, 2).join(' e ')} mostraram melhora esta semana. Pequenas vitórias consistentes produzem resultados duradouros.`,
        action: 'Mantenha a rotina atual. Consistência supera intensidade em saúde mental.',
        action_type: 'habit',
      });
    }

    // --- 13. HR elevation ---
    if (hr && hr.pct != null && hr.pct > 15) {
      recs.push({
        type: 'movement',
        priority: 'medium',
        title: 'FC em repouso elevada',
        reason: `Sua FC em repouso aumentou ${hr.pct.toFixed(0)}% (atual: ${hr.recent.toFixed(0)} bpm). FC elevada em repouso é associada a estresse crônico e sedentarismo.`,
        action: 'Exercício aeróbico moderado (20 min de caminhada rápida) reduz FC em repouso em 2–4 semanas.',
        action_type: 'habit',
      });
    }

    const ORDER = { high: 0, medium: 1, low: 2 };
    return recs.sort((a, b) => (ORDER[a.priority] ?? 99) - (ORDER[b.priority] ?? 99)).slice(0, 5);
  }

  _buildWeeklyNarrative(risk, trends, questionnaires) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    const fmt = (d) => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });

    const sleep = this._getSignalValue(trends, 'sleep_duration');
    const hrv   = this._getSignalValue(trends, 'HRV');
    const stress = this._getSignalValue(trends, 'stress_level');
    const riskScore = risk ? parseFloat(risk.risk_score) : null;

    const highlights = [];
    const positives  = [];

    if (sleep) {
      if (sleep.recent < 6.5) {
        highlights.push(`sono médio de ${sleep.recent.toFixed(1)}h — abaixo do recomendado`);
      } else if (sleep.recent >= 7.5) {
        positives.push(`sono de qualidade: média de ${sleep.recent.toFixed(1)}h`);
      }
    }
    if (hrv?.pct != null) {
      if (hrv.pct < -15) {
        highlights.push(`HRV caiu ${Math.abs(hrv.pct).toFixed(0)}% vs semana anterior`);
      } else if (hrv.pct > 10) {
        positives.push(`HRV melhorou ${hrv.pct.toFixed(0)}% — sinal de recuperação`);
      }
    }
    if (stress?.recent >= 7) {
      highlights.push(`estresse auto-relatado elevado: ${stress.recent.toFixed(0)}/10`);
    }
    if (questionnaires.length >= 2) {
      positives.push('você completou múltiplos questionários — ótimo para a precisão da análise');
    }

    let summary = '';
    if (highlights.length === 0 && positives.length > 0) {
      summary = `Boa semana! Os seus indicadores estão estáveis. ${positives[0]}.`;
    } else if (highlights.length > 0) {
      summary = `Esta semana apresentou alguns sinais de atenção: ${highlights.join(' e ')}.`;
      if (positives.length > 0) {
        summary += ` Por outro lado, ${positives[0]}.`;
      }
    } else {
      summary = 'Continue registrando seus sinais diariamente para uma análise mais precisa.';
    }

    let nextFocus;
    if ((sleep?.recent ?? 8) < 6.5) {
      nextFocus = 'Priorize o sono esta semana: horário fixo para dormir, sem telas 1h antes, quarto mais frio.';
    } else if (hrv?.pct != null && hrv.pct < -15) {
      nextFocus = 'Reserve 5–10 minutos por dia para respiração profunda — inspire 4s, segure 4s, expire 6s.';
    } else if (riskScore >= 60) {
      nextFocus = 'Seu score de risco está elevado. Considere agendar uma conversa com o psicólogo pelo plano CarePlus.';
    } else if (stress?.recent >= 7) {
      nextFocus = 'Incorpore pausas conscientes ao longo do dia — meditação de 5 min após o almoço faz diferença acumulada.';
    } else {
      nextFocus = 'Mantenha a rotina e continue monitorando — consistência diária é mais valiosa do que esforços intensos e isolados.';
    }

    return {
      period: `${fmt(weekStart)}–${fmt(now)}`,
      risk_score: riskScore ? Math.round(riskScore) : null,
      summary,
      highlights,
      positives,
      next_week_focus: nextFocus,
    };
  }
}

export default new InsightsService();
