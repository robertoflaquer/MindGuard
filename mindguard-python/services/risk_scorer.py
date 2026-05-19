# services/risk_scorer.py
import os
import json
from datetime import datetime
from config.database import db
from config.logger import get_logger
from services.correlation_engine import CorrelationEngine

logger = get_logger(__name__)

SIGNAL_NAMES = {
    'HRV':            'Variabilidade Cardíaca (HRV)',
    'HR_resting':     'Frequência Cardíaca em Repouso',
    'sleep_duration': 'Duração do Sono',
    'sleep_quality':  'Qualidade do Sono',
    'stress_level':   'Nível de Estresse',
    'energy_level':   'Nível de Energia',
    'mood':           'Humor',
    'steps':          'Passos Diários',
}

# ── PSS (Cohen, 1983) ─────────────────────────────────────
PSS_LOW_MAX      = 13   # 0-13  → baixo
PSS_MODERATE_MAX = 26   # 14-26 → moderado
PSS_MAX          = 40   # 27-40 → alto

# ── CBI — escala 0-4 por item, 19 itens, max=76 ──────────
CBI_MAX          = 76
CBI_MODERATE     = 29   # 38 %
CBI_HIGH         = 51   # 67 %
CBI_FORCE_ELEV   = 46   # 61 % → pelo menos elevated_risk
CBI_FORCE_HIGH   = 58   # 76 % → high_risk

# ── OLBI — escala 0-4 por item, 16 itens, max=64 ─────────
OLBI_MAX         = 64
OLBI_MODERATE    = 29   # 45 %
OLBI_HIGH        = 45   # 70 %
OLBI_FORCE_ELEV  = 45   # 70 % → pelo menos elevated_risk
OLBI_FORCE_HIGH  = 54   # 84 % → high_risk

# ── DAILY_CHECKIN — 3 itens (humor+energia invertidos, estresse direto), max=30
DC_MAX           = 30
DC_MODERATE      = 10   # 33 %
DC_HIGH          = 20   # 67 %
DC_FORCE_ELEV    = 18   # 60 % → pelo menos elevated_risk
DC_FORCE_HIGH    = 24   # 80 % → high_risk

# Pesos por questionário (normalizados para os disponíveis)
QUESTIONNAIRE_WEIGHTS = {'PSS': 0.45, 'CBI': 0.27, 'OLBI': 0.18, 'DAILY_CHECKIN': 0.10}


class RiskScorer:
    def __init__(self):
        self.correlation_engine = CorrelationEngine()
        self.convergence_threshold = int(os.getenv('RISK_CONVERGENCE_THRESHOLD', '2'))
        self.high_risk_threshold   = float(os.getenv('HIGH_RISK_THRESHOLD', '70'))
        self.attention_threshold   = float(os.getenv('ATTENTION_THRESHOLD', '40'))

    # ────────────────────────────────────────────────────── #
    #  ENTRY POINT
    # ────────────────────────────────────────────────────── #

    def calculate_risk(self, user_id: str):
        """
        Calcula risco combinando questionários (70%) + sinais vitais (30%).
        Pesos dos questionários: PSS=50%, CBI=30%, OLBI=20% (normalizados).
        """
        # ── 1. Sinais vitais ──────────────────────────────
        correlation = self.correlation_engine.correlate_signals(user_id)
        has_signals = correlation['status'] == 'success'

        if has_signals:
            convergence_count    = correlation['convergence_count']
            contributing_signals = correlation['contributing_signals']
            weighted_score       = correlation['weighted_score']
            base_signal_risk     = min(weighted_score / 2, 100)
            convergence_mult     = 1.0 + (convergence_count * 0.2)
            signal_risk          = min(base_signal_risk * convergence_mult, 100)
        else:
            convergence_count    = 0
            contributing_signals = {}
            signal_risk          = 0

        # ── 2. Questionários ──────────────────────────────
        pss_data  = self._get_questionnaire_score(user_id, 'PSS',           7)
        cbi_data  = self._get_questionnaire_score(user_id, 'CBI',          14)
        olbi_data = self._get_questionnaire_score(user_id, 'OLBI',         14)
        dc_data   = self._get_questionnaire_score(user_id, 'DAILY_CHECKIN', 1)

        questionnaire_risk = self._get_combined_questionnaire_risk(pss_data, cbi_data, olbi_data, dc_data)
        has_questionnaire  = questionnaire_risk is not None

        # ── 3. Combinação ────────────────────────────────
        if has_questionnaire:
            combined_risk = 0.70 * questionnaire_risk + 0.30 * signal_risk
        elif has_signals:
            combined_risk = signal_risk  # sem questionários: só sinais, menor confiança
        else:
            return {
                'status': 'insufficient_data',
                'message': 'Dados insuficientes. Registre sinais ou responda um questionário.',
                'risk_score': 0,
            }

        # ── 4. Ajuste de contexto ────────────────────────
        context_adjustment = self._get_context_adjustment(user_id)
        final_risk = min(combined_risk * context_adjustment, 100)

        # ── 5. Nível de risco ────────────────────────────
        risk_level = self._determine_risk_level(
            final_risk, convergence_count, pss_data, cbi_data, olbi_data, dc_data
        )

        # ── 6. Explicação ────────────────────────────────
        explanation = self._generate_explanation(
            risk_level=risk_level,
            convergence_count=convergence_count,
            contributing_signals=contributing_signals,
            pss_data=pss_data,
            cbi_data=cbi_data,
            olbi_data=olbi_data,
            dc_data=dc_data,
        )

        # ── 7. Ação recomendada ──────────────────────────
        recommended_action = self._get_recommended_action(risk_level, pss_data, cbi_data, olbi_data)

        # ── 8. Confiança ─────────────────────────────────
        confidence_level = self._calculate_confidence(
            convergence_count, contributing_signals, pss_data, cbi_data, olbi_data, dc_data
        )

        # ── 9. Salvar ────────────────────────────────────
        assessment_id = self._save_risk_assessment(
            user_id=user_id,
            risk_level=risk_level,
            risk_score=final_risk,
            confidence_level=confidence_level,
            contributing_signals=contributing_signals,
            convergence_count=convergence_count,
            primary_explanation=explanation['primary'],
            secondary_factors=explanation['secondary'],
            recommended_action=recommended_action,
            requires_professional_review=risk_level in ['high_risk', 'elevated_risk'],
        )

        return {
            'status': 'success',
            'assessment_id': assessment_id,
            'risk_level': risk_level,
            'risk_score': round(final_risk, 2),
            'confidence_level': round(confidence_level, 2),
            'convergence_count': convergence_count,
            'primary_explanation': explanation['primary'],
            'secondary_factors': explanation['secondary'],
            'recommended_action': recommended_action,
            'contributing_signals': contributing_signals,
            'pss_score':  pss_data['score']  if pss_data  else None,
            'cbi_score':  cbi_data['score']  if cbi_data  else None,
            'olbi_score': olbi_data['score'] if olbi_data else None,
            'dc_score':   dc_data['score']   if dc_data   else None,
        }

    # ────────────────────────────────────────────────────── #
    #  BUSCA DE QUESTIONÁRIOS
    # ────────────────────────────────────────────────────── #

    def _get_questionnaire_score(self, user_id: str, code: str, window_days: int):
        """Busca a resposta mais recente dentro da janela de dias."""
        query = """
            SELECT qr.total_score, qr.completed_at
            FROM questionnaire_responses qr
            JOIN questionnaire_types qt ON qr.questionnaire_type_id = qt.id
            WHERE qr.user_id = %s
              AND qt.code = %s
              AND qr.is_valid = TRUE
              AND qr.completed_at >= NOW() - INTERVAL '%s days'
            ORDER BY qr.completed_at DESC
            LIMIT 1
        """ % ('%s', '%s', window_days)
        result = db.execute_query(query, (user_id, code))
        if not result:
            return None
        return {'score': float(result[0]['total_score']), 'completed_at': result[0]['completed_at']}

    # ────────────────────────────────────────────────────── #
    #  CONVERSÃO DE SCORES PARA RISCO (0-100)
    # ────────────────────────────────────────────────────── #

    def _pss_to_risk_score(self, pss: float) -> float:
        """PSS 0-40 → risco 0-100 (thresholds Cohen 1983)."""
        if pss <= PSS_LOW_MAX:
            return (pss / PSS_LOW_MAX) * 25
        elif pss <= PSS_MODERATE_MAX:
            return 25 + ((pss - PSS_LOW_MAX) / (PSS_MODERATE_MAX - PSS_LOW_MAX)) * 40
        else:
            return 65 + ((pss - PSS_MODERATE_MAX) / (PSS_MAX - PSS_MODERATE_MAX)) * 35

    def _cbi_to_risk_score(self, cbi: float) -> float:
        """CBI 0-76 → risco 0-100."""
        if cbi <= CBI_MODERATE:
            return (cbi / CBI_MODERATE) * 25
        elif cbi <= CBI_HIGH:
            return 25 + ((cbi - CBI_MODERATE) / (CBI_HIGH - CBI_MODERATE)) * 40
        else:
            return 65 + ((cbi - CBI_HIGH) / (CBI_MAX - CBI_HIGH)) * 35

    def _olbi_to_risk_score(self, olbi: float) -> float:
        """OLBI 0-64 → risco 0-100."""
        if olbi <= OLBI_MODERATE:
            return (olbi / OLBI_MODERATE) * 25
        elif olbi <= OLBI_HIGH:
            return 25 + ((olbi - OLBI_MODERATE) / (OLBI_HIGH - OLBI_MODERATE)) * 40
        else:
            return 65 + ((olbi - OLBI_HIGH) / (OLBI_MAX - OLBI_HIGH)) * 35

    def _daily_checkin_to_risk_score(self, dc: float) -> float:
        """DAILY_CHECKIN 0-30 → risco 0-100 (humor+energia invertidos no backend)."""
        if dc <= DC_MODERATE:
            return (dc / DC_MODERATE) * 25
        elif dc <= DC_HIGH:
            return 25 + ((dc - DC_MODERATE) / (DC_HIGH - DC_MODERATE)) * 40
        else:
            return 65 + ((dc - DC_HIGH) / (DC_MAX - DC_HIGH)) * 35

    def _get_combined_questionnaire_risk(self, pss_data, cbi_data, olbi_data, dc_data=None):
        """Combina os scores disponíveis com pesos normalizados."""
        available = {}
        if pss_data:  available['PSS']           = self._pss_to_risk_score(pss_data['score'])
        if cbi_data:  available['CBI']           = self._cbi_to_risk_score(cbi_data['score'])
        if olbi_data: available['OLBI']          = self._olbi_to_risk_score(olbi_data['score'])
        if dc_data:   available['DAILY_CHECKIN'] = self._daily_checkin_to_risk_score(dc_data['score'])

        if not available:
            return None

        total_weight = sum(QUESTIONNAIRE_WEIGHTS[k] for k in available)
        return sum(QUESTIONNAIRE_WEIGHTS[k] * v for k, v in available.items()) / total_weight

    # ────────────────────────────────────────────────────── #
    #  NÍVEL DE RISCO
    # ────────────────────────────────────────────────────── #

    def _determine_risk_level(self, risk_score: float, convergence_count: int,
                               pss_data, cbi_data, olbi_data, dc_data=None):
        # PSS: forçar elevação
        if pss_data:
            pss = pss_data['score']
            if pss >= 33:
                return 'high_risk'
            if pss >= 27 and risk_score < self.attention_threshold:
                return 'elevated_risk'

        # CBI: forçar elevação
        if cbi_data:
            cbi = cbi_data['score']
            if cbi >= CBI_FORCE_HIGH:
                return 'high_risk'
            if cbi >= CBI_FORCE_ELEV and risk_score < self.attention_threshold:
                return 'elevated_risk'

        # OLBI: forçar elevação
        if olbi_data:
            olbi = olbi_data['score']
            if olbi >= OLBI_FORCE_HIGH:
                return 'high_risk'
            if olbi >= OLBI_FORCE_ELEV and risk_score < self.attention_threshold:
                return 'elevated_risk'

        # DAILY_CHECKIN: forçar elevação (dia muito difícil confirma risco)
        if dc_data:
            dc = dc_data['score']
            if dc >= DC_FORCE_HIGH:
                return 'high_risk'
            if dc >= DC_FORCE_ELEV and risk_score < self.attention_threshold:
                return 'elevated_risk'

        # Score numérico
        if risk_score >= self.high_risk_threshold:
            return 'high_risk'
        elif risk_score >= self.attention_threshold:
            if convergence_count >= 3:
                return 'elevated_risk'
            return 'attention'
        return 'stable'

    def _get_context_adjustment(self, user_id: str):
        query = """
            SELECT ct.default_weight_adjustment
            FROM user_contexts uc
            JOIN context_types ct ON uc.context_type_id = ct.id
            WHERE uc.user_id = %s
              AND uc.is_active = TRUE
              AND (uc.end_date IS NULL OR uc.end_date >= CURRENT_DATE)
        """
        contexts = db.execute_query(query, (user_id,))
        if not contexts:
            return 1.0
        adjustment = contexts[0]['default_weight_adjustment']
        if adjustment and 'HRV' in adjustment:
            return float(adjustment.get('HRV', 1.0))
        return 1.0

    # ────────────────────────────────────────────────────── #
    #  EXPLICAÇÃO
    # ────────────────────────────────────────────────────── #

    def _generate_explanation(self, risk_level: str, convergence_count: int,
                               contributing_signals: dict,
                               pss_data, cbi_data, olbi_data, dc_data=None):
        secondary = []

        # Fatores de questionários
        if dc_data:
            dc = dc_data['score']
            if dc <= DC_MODERATE:
                secondary.append(f"Check-in {dc:.0f}/30 — dia tranquilo")
            elif dc <= DC_HIGH:
                secondary.append(f"Check-in {dc:.0f}/30 — dia moderado")
            else:
                secondary.append(f"Check-in {dc:.0f}/30 — dia difícil")

        if pss_data:
            pss = pss_data['score']
            if pss <= PSS_LOW_MAX:
                secondary.append(f"PSS {pss:.0f}/40 — estresse percebido baixo")
            elif pss <= PSS_MODERATE_MAX:
                secondary.append(f"PSS {pss:.0f}/40 — estresse percebido moderado")
            else:
                secondary.append(f"PSS {pss:.0f}/40 — estresse percebido elevado")

        if cbi_data:
            cbi = cbi_data['score']
            if cbi <= CBI_MODERATE:
                secondary.append(f"CBI {cbi:.0f}/76 — burnout baixo")
            elif cbi <= CBI_HIGH:
                secondary.append(f"CBI {cbi:.0f}/76 — burnout moderado")
            else:
                secondary.append(f"CBI {cbi:.0f}/76 — burnout elevado")

        if olbi_data:
            olbi = olbi_data['score']
            if olbi <= OLBI_MODERATE:
                secondary.append(f"OLBI {olbi:.0f}/64 — esgotamento/desengajamento baixo")
            elif olbi <= OLBI_HIGH:
                secondary.append(f"OLBI {olbi:.0f}/64 — esgotamento/desengajamento moderado")
            else:
                secondary.append(f"OLBI {olbi:.0f}/64 — esgotamento/desengajamento elevado")

        # Fatores de sinais vitais — APENAS sinais em direção ruim
        risky_signals = []
        improving_signals = []
        if contributing_signals:
            for signal, data in contributing_signals.items():
                if not data['is_significant']:
                    continue
                name = SIGNAL_NAMES.get(signal, signal)
                pct  = abs(data['percent_change'])
                if data.get('is_risky'):
                    direction_pt = 'queda' if data['direction'] == 'down' else 'alta'
                    risky_signals.append(signal)
                    secondary.append(f"⚠ {name}: {direction_pt} de {pct:.1f}%")
                else:
                    direction_pt = 'queda' if data['direction'] == 'down' else 'alta'
                    improving_signals.append(signal)
                    secondary.append(f"✓ {name}: {direction_pt} de {pct:.1f}% (melhora)")

        # Sinaliza quando o risco é predominantemente dirigido por questionários
        has_questionnaire_data = any([pss_data, cbi_data, olbi_data, dc_data])
        signal_risk_is_low = len(risky_signals) == 0

        # Explicação principal — prioridade: CBI/OLBI alto > PSS alto > sinais > questionários
        has_high_burnout = (
            (cbi_data  and cbi_data['score']  >= CBI_HIGH) or
            (olbi_data and olbi_data['score'] >= OLBI_HIGH)
        )
        has_high_stress = pss_data and pss_data['score'] >= PSS_MODERATE_MAX + 1

        if risk_level == 'stable':
            if signal_risk_is_low and improving_signals:
                primary = "Sinais do dia estão positivos. Continue assim!"
            else:
                primary = "Todos os indicadores estão dentro do padrão normal. Continue assim!"

        elif risk_level == 'attention':
            if has_high_stress:
                primary = f"Estresse percebido elevado (PSS {pss_data['score']:.0f}/40). Fique atento."
            elif risky_signals:
                name = SIGNAL_NAMES.get(risky_signals[0], risky_signals[0])
                primary = f"Detectamos desvio em {name}. Fique atento."
            elif has_questionnaire_data and signal_risk_is_low:
                primary = "Questionários recentes indicam atenção moderada. Continue monitorando."
            else:
                primary = f"Detectamos desvios em {convergence_count} indicadores."

        elif risk_level == 'elevated_risk':
            if has_high_burnout and has_high_stress:
                primary = "Burnout e estresse elevados detectados. Ação recomendada."
            elif has_high_burnout:
                tool = 'CBI' if (cbi_data and cbi_data['score'] >= CBI_HIGH) else 'OLBI'
                primary = f"Burnout elevado detectado ({tool}). Ação recomendada."
            elif has_high_stress:
                primary = f"Estresse percebido alto (PSS {pss_data['score']:.0f}/40). Ação recomendada."
            elif risky_signals:
                primary = f"Múltiplos sinais alterados ({len(risky_signals)} indicadores). Ação recomendada."
            elif dc_data and dc_data['score'] >= DC_FORCE_ELEV:
                primary = f"Check-in do dia indica momento difícil ({dc_data['score']:.0f}/30). Seus sinais físicos estão melhorando — continue assim."
            elif pss_data and pss_data['score'] >= PSS_MODERATE_MAX:
                primary = f"Estresse percebido moderado-alto (PSS {pss_data['score']:.0f}/40) detectado em questionário recente."
            else:
                primary = "Questionários recentes indicam atenção elevada. Sinais físicos dentro do normal."

        elif risk_level == 'high_risk':
            if pss_data and pss_data['score'] >= 33:
                primary = f"Estresse percebido muito alto (PSS {pss_data['score']:.0f}/40). Revisão profissional necessária."
            elif has_high_burnout:
                primary = "Burnout severo detectado. Revisão profissional necessária."
            else:
                primary = "Risco elevado detectado. Revisão profissional necessária."

        else:
            primary = "Avaliação em andamento."

        return {'primary': primary, 'secondary': secondary}

    # ────────────────────────────────────────────────────── #
    #  AÇÃO RECOMENDADA
    # ────────────────────────────────────────────────────── #

    def _get_recommended_action(self, risk_level: str, pss_data, cbi_data, olbi_data):
        high_stress  = pss_data  and pss_data['score']  >= PSS_MODERATE_MAX + 1
        high_burnout = (
            (cbi_data  and cbi_data['score']  >= CBI_HIGH) or
            (olbi_data and olbi_data['score'] >= OLBI_HIGH)
        )

        if high_stress or high_burnout:
            action_mapping = {
                'stable':        'meditation_short',
                'attention':     'meditation_short',
                'elevated_risk': 'specialist_psychologist',
                'high_risk':     'specialist_psychiatrist',
            }
        else:
            action_mapping = {
                'stable':        'breathing_exercise',
                'attention':     'meditation_short',
                'elevated_risk': 'specialist_psychologist',
                'high_risk':     'specialist_psychiatrist',
            }

        action_code = action_mapping.get(risk_level, 'breathing_exercise')
        result = db.execute_query(
            "SELECT id FROM action_types WHERE code = %s LIMIT 1", (action_code,)
        )
        return result[0]['id'] if result else None

    # ────────────────────────────────────────────────────── #
    #  CONFIANÇA
    # ────────────────────────────────────────────────────── #

    def _calculate_confidence(self, convergence_count: int, contributing_signals: dict,
                               pss_data, cbi_data, olbi_data, dc_data=None) -> float:
        signal_count = len(contributing_signals)
        q_count = sum(1 for d in [pss_data, cbi_data, olbi_data, dc_data] if d is not None)

        if q_count >= 3:
            base = 0.85
        elif q_count == 2:
            base = 0.75
        elif q_count == 1:
            base = 0.60 + min(signal_count / 10.0, 0.10)
        else:
            base = min(signal_count / 5.0, 0.70)

        convergence_boost = min(convergence_count * 0.05, 0.10)
        return min(base + convergence_boost, 1.0)

    # ────────────────────────────────────────────────────── #
    #  SALVAR
    # ────────────────────────────────────────────────────── #

    def _save_risk_assessment(self, user_id, risk_level, risk_score, confidence_level,
                               contributing_signals, convergence_count,
                               primary_explanation, secondary_factors,
                               recommended_action, requires_professional_review):
        risk_level_result = db.execute_query(
            "SELECT id FROM risk_levels WHERE code = %s LIMIT 1", (risk_level,)
        )
        if not risk_level_result:
            logger.error("Risk level '%s' not found in database", risk_level)
            return None

        risk_level_id = risk_level_result[0]['id']

        query = """
            INSERT INTO risk_assessments (
                user_id, risk_level_id, assessment_date, assessment_timestamp,
                risk_score, confidence_level, contributing_signals,
                signal_convergence_count, primary_explanation, secondary_factors,
                recommended_action_id, requires_professional_review, escalation_triggered
            ) VALUES (
                %s, %s, CURRENT_DATE, NOW(), %s, %s, %s, %s, %s, %s, %s, %s, FALSE
            )
            RETURNING id
        """

        result = db.execute_query(query, (
            user_id, risk_level_id, risk_score, confidence_level,
            json.dumps(contributing_signals), convergence_count,
            primary_explanation, secondary_factors,
            recommended_action, requires_professional_review,
        ))

        if result:
            assessment_id = result[0]['id']
            logger.info("Assessment saved: ID %s, Level: %s, Score: %.1f", assessment_id, risk_level, risk_score)
            return assessment_id
        return None
