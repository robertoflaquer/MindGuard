# services/correlation_engine.py
from datetime import datetime, timedelta
from config.database import db
from services.deviation_analyzer import DeviationAnalyzer

# Sinais onde queda é ruim (inversamente relacionados ao risco)
_LOW_BAD  = frozenset(['HRV', 'sleep_duration', 'energy_level', 'mood', 'sleep_quality'])
# Sinais onde alta é ruim (diretamente relacionados ao risco)
_HIGH_BAD = frozenset(['stress_level', 'HR_resting'])

# Thresholds populacionais: usados quando não existe baseline pessoal
# scale=None → unidade livre (horas, ms, bpm); scale=10 → escala 0-10
_ABSOLUTE = {
    'stress_level':   {'high_bad': True,  'warn': 6.0, 'critical': 8.0,  'scale': 10.0},
    'mood':           {'high_bad': False, 'warn': 4.0, 'critical': 2.0,  'scale': 10.0},
    'energy_level':   {'high_bad': False, 'warn': 4.0, 'critical': 2.0,  'scale': 10.0},
    'sleep_quality':  {'high_bad': False, 'warn': 4.0, 'critical': 2.0,  'scale': 10.0},
    'sleep_duration': {'high_bad': False, 'warn': 6.0, 'critical': 4.0,  'scale': None},
    'HRV':            {'high_bad': False, 'warn': 30.0,'critical': 20.0, 'scale': None},
}


class CorrelationEngine:
    def __init__(self):
        self.deviation_analyzer = DeviationAnalyzer()

    def correlate_signals(self, user_id: str):
        """
        Correlaciona múltiplos sinais para detectar padrões de risco.
        Quando não há baseline pessoal, usa thresholds populacionais como fallback.
        """
        query = """
            SELECT
                st.id AS signal_type_id,
                st.name AS signal_type,
                us.value,
                us.timestamp
            FROM user_signals us
            JOIN signal_types st ON us.signal_type_id = st.id
            WHERE us.user_id = %s
              AND us.timestamp >= NOW() - INTERVAL '24 hours'
              AND us.is_outlier = FALSE
            ORDER BY us.timestamp DESC
        """
        recent_signals = db.execute_query(query, (user_id,))

        if not recent_signals:
            return {'status': 'no_data', 'convergence_count': 0, 'contributing_signals': {}}

        # Mantém apenas o valor mais recente por tipo
        signal_map = {}
        for s in recent_signals:
            if s['signal_type'] not in signal_map:
                signal_map[s['signal_type']] = {
                    'signal_type_id': s['signal_type_id'],
                    'value': float(s['value']),
                    'timestamp': s['timestamp'],
                }

        contributing_signals = {}
        convergence_count = 0

        for signal_type, data in signal_map.items():
            deviation = self.deviation_analyzer.analyze_deviation(
                user_id=user_id,
                signal_type_id=data['signal_type_id'],
                current_value=data['value'],
            )

            if deviation['status'] == 'success':
                is_sig = deviation['is_significant']
                direction = deviation['direction']
                # Direção é considerada "ruim" (risky) apenas quando piora o sinal:
                # - sinais onde QUEDA é ruim (HRV, sono, energia, humor, qualidade sono)
                # - sinais onde ALTA é ruim (estresse, FC repouso)
                is_risky = is_sig and (
                    (direction == 'down' and signal_type in _LOW_BAD) or
                    (direction == 'up'   and signal_type in _HIGH_BAD)
                )
                contributing_signals[signal_type] = {
                    'value': data['value'],
                    'baseline': deviation['baseline_value'],
                    'percent_change': deviation['percent_change'],
                    'direction': direction,
                    'is_significant': is_sig,
                    'is_risky': is_risky,
                }
                # Convergência conta apenas desvios em direção ruim
                if is_risky:
                    convergence_count += 1

            elif deviation['status'] == 'no_baseline':
                # Sem baseline pessoal → verifica thresholds populacionais
                # O fallback só retorna quando o valor está em zona de risco absoluto
                fallback = self._absolute_threshold_check(signal_type, data['value'])
                if fallback:
                    contributing_signals[signal_type] = {
                        'value': data['value'],
                        'baseline': None,
                        'percent_change': fallback['simulated_pct'],
                        'direction': fallback['direction'],
                        'is_significant': True,
                        'is_risky': True,
                    }
                    convergence_count += 1

        # Calcula weighted_score a partir dos sinais em direção ruim
        signal_weights = self._get_signal_weights()
        weighted_score = 0.0

        for signal_type, data in contributing_signals.items():
            if data.get('is_risky'):
                weight = signal_weights.get(signal_type, 1.0)
                weighted_score += abs(data['percent_change']) * weight

        return {
            'status': 'success',
            'convergence_count': convergence_count,
            'contributing_signals': contributing_signals,
            'weighted_score': round(weighted_score, 2),
        }

    # ─────────────────────────────────────────────────────── #

    def _absolute_threshold_check(self, signal_type: str, value: float):
        """
        Calcula risco absoluto quando não existe baseline pessoal.
        Retorna simulação de percent_change proporcional à gravidade.
        """
        cfg = _ABSOLUTE.get(signal_type)
        if cfg is None:
            return None

        high_bad = cfg['high_bad']
        warn     = cfg['warn']
        scale    = cfg['scale']

        is_risky = (high_bad and value >= warn) or (not high_bad and value <= warn)
        if not is_risky:
            return None

        if high_bad:
            ref_range = (scale - warn) if scale else warn
            pct = ((value - warn) / ref_range) * 85 + 15 if ref_range > 0 else 50
            direction = 'up'
        else:
            ref_range = warn
            pct = ((warn - value) / ref_range) * 85 + 15 if ref_range > 0 else 50
            direction = 'down'

        return {
            'simulated_pct': min(round(pct, 1), 100.0),
            'direction': direction,
        }

    def _get_signal_weights(self):
        return {
            'HRV':           1.2,
            'stress_level':  1.3,
            'sleep_duration':1.1,
            'sleep_quality': 1.0,
            'energy_level':  0.9,
            'mood':          1.0,
            'HR_resting':    0.8,
            'steps':         0.6,
        }

    def get_correlation_summary(self, user_id: str, days: int = 7):
        cutoff = (datetime.now() - timedelta(days=days)).date()
        query = """
            SELECT
                COUNT(DISTINCT detection_date) as days_with_deviations,
                COUNT(*) as total_deviations,
                AVG(ABS(percent_change)) as avg_deviation
            FROM deviations
            WHERE user_id = %s
              AND is_significant = TRUE
              AND detection_date >= %s
        """
        result = db.execute_query(query, (user_id, cutoff))
        return result[0] if result else {}
