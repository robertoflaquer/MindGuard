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

    // --- Sleep recommendation ---
    const sleep = this._getSignalValue(trends, 'sleep_duration');
    if (sleep && sleep.recent < 6.5) {
      recs.push({
        type: 'sleep',
        priority: 'high',
        title: 'Priorize o sono esta semana',
        reason: `Sua média de sono nos últimos 7 dias foi de ${sleep.recent.toFixed(1)}h — abaixo do mínimo recomendado de 7h. Sono insuficiente amplifica todos os outros indicadores de risco.`,
        action: 'Tente ir para a cama 30 minutos mais cedo por 3 dias consecutivos.',
        action_type: 'quick_win',
      });
    } else if (sleep && sleep.pct != null && sleep.pct < -15) {
      recs.push({
        type: 'sleep',
        priority: 'medium',
        title: 'Seu sono piorou esta semana',
        reason: `A duração média do sono caiu ${Math.abs(sleep.pct).toFixed(0)}% comparado à semana anterior (${sleep.recent.toFixed(1)}h vs ${sleep.prev?.toFixed(1)}h).`,
        action: 'Evite telas 1h antes de dormir e mantenha o mesmo horário para dormir e acordar.',
        action_type: 'habit',
      });
    }

    // --- HRV / Stress recommendation ---
    const hrv = this._getSignalValue(trends, 'HRV');
    const stress = this._getSignalValue(trends, 'stress_level');
    if (hrv && hrv.pct != null && hrv.pct < -20) {
      recs.push({
        type: 'breathing',
        priority: 'high',
        title: 'Exercício de respiração (5 min)',
        reason: `Sua HRV caiu ${Math.abs(hrv.pct).toFixed(0)}% esta semana. Isso indica ativação do sistema nervoso simpático — seu corpo está em modo de alerta prolongado.`,
        action: 'Inspire por 4s, segure por 4s, expire por 6s. Repita 5 vezes, 3× ao dia.',
        action_type: 'immediate',
      });
    } else if (stress && stress.recent >= 7) {
      recs.push({
        type: 'breathing',
        priority: 'medium',
        title: 'Pausa consciente — respiração',
        reason: `Seu nível de estresse médio foi ${stress.recent.toFixed(0)}/10 nos últimos dias. Técnicas de respiração reduzem cortisol em 15–20 minutos.`,
        action: 'Reserve 5 minutos após o almoço para respiração diafragmática profunda.',
        action_type: 'habit',
      });
    }

    // --- Questionnaire recommendation ---
    const qMap = {};
    questionnaires.forEach(q => { qMap[q.code] = q; });
    const pss = qMap['PSS'];
    const gad = qMap['GAD7'];

    if (pss) {
      const pssScore = parseFloat(pss.total_score);
      const daysSince = Math.floor((Date.now() - new Date(pss.completed_at)) / 86400000);
      if (pssScore >= 27 && daysSince >= 7) {
        recs.push({
          type: 'questionnaire',
          priority: 'high',
          title: 'Refaça o PSS-10',
          reason: `Seu último PSS foi ${pssScore}/40 (estresse elevado), há ${daysSince} dias. Refazer ajuda a monitorar se a situação está melhorando ou piorando.`,
          action: 'Responder o PSS-10 leva menos de 3 minutos.',
          action_type: 'questionnaire',
          questionnaire_code: 'PSS',
        });
      }
    }

    if (!pss && !gad && recs.length === 0) {
      recs.push({
        type: 'questionnaire',
        priority: 'medium',
        title: 'Responda seus primeiros questionários',
        reason: 'Questionários clínicos são o componente mais importante do cálculo de risco (70% do score). Sem eles, a análise é incompleta.',
        action: 'Comece pelo PSS-10 — 10 perguntas, menos de 3 minutos.',
        action_type: 'questionnaire',
        questionnaire_code: 'PSS',
      });
    }

    // --- Professional consultation for high risk ---
    if (riskScore >= 60 && riskLevel !== 'stable') {
      recs.push({
        type: 'professional',
        priority: 'high',
        title: 'Considere agendar uma consulta',
        reason: `Com um score de ${Math.round(riskScore)}%, uma conversa com psicólogo pode ajudar a identificar estratégias personalizadas antes que a situação se agrave.`,
        action: 'Veja os especialistas disponíveis na seção Tratamento.',
        action_type: 'appointment',
      });
    }

    // --- Movement recommendation ---
    const steps = this._getSignalValue(trends, 'steps');
    if (steps && steps.recent < 5000) {
      recs.push({
        type: 'movement',
        priority: 'low',
        title: 'Inclua uma caminhada diária',
        reason: `Sua média de passos foi ${Math.round(steps.recent)} esta semana. Caminhar 20–30 minutos reduz cortisol e melhora a qualidade do sono.`,
        action: 'Uma caminhada de 20 min após o jantar já faz diferença.',
        action_type: 'habit',
      });
    }

    // Sort by priority
    const ORDER = { high: 0, medium: 1, low: 2 };
    return recs.sort((a, b) => (ORDER[a.priority] ?? 99) - (ORDER[b.priority] ?? 99)).slice(0, 4);
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

    const nextFocus = highlights.includes('sono') || (sleep?.recent ?? 8) < 6.5
      ? 'Foque em melhorar o sono: evite cafeína após 14h e estabeleça um ritual noturno.'
      : hrv?.pct != null && hrv.pct < -15
      ? 'Reserve 5–10 minutos por dia para respiração profunda ou meditação guiada.'
      : 'Mantenha a rotina e continue monitorando — consistência é a chave.';

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
