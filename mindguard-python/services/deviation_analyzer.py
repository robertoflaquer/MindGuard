# services/deviation_analyzer.py
import os
from datetime import datetime, timedelta
from config.database import db
from config.logger import get_logger

logger = get_logger(__name__)

class DeviationAnalyzer:
    def __init__(self):
        self.significance_threshold = float(os.getenv('DEVIATION_THRESHOLD', '15.0'))

    def analyze_deviation(self, user_id: str, signal_type_id: int, current_value: float):
        """
        Analyze if current value deviates significantly from baseline.
        Returns deviation data with significance flag.
        """
        # Get current baseline
        query = """
            SELECT id, baseline_value, baseline_std_dev
            FROM baselines
            WHERE user_id = %s 
              AND signal_type_id = %s 
              AND is_current = TRUE
            LIMIT 1
        """

        baseline = db.execute_query(query, (user_id, signal_type_id))

        if not baseline or len(baseline) == 0:
            return {
                'status': 'no_baseline',
                'message': 'No baseline found for this signal type',
                'is_significant': False
            }

        baseline = baseline[0]
        baseline_value = float(baseline['baseline_value'])
        baseline_id = baseline['id']

        # Calculate deviation
        absolute_change = current_value - baseline_value
        percent_change = (absolute_change / baseline_value) * 100 if baseline_value != 0 else 0

        # Determine direction
        if abs(percent_change) < 1:
            direction = 'stable'
        elif percent_change > 0:
            direction = 'up'
        else:
            direction = 'down'

        # Check significance
        is_significant = abs(percent_change) >= self.significance_threshold

        # Save deviation
        deviation_id = self._save_deviation(
            user_id=user_id,
            signal_type_id=signal_type_id,
            baseline_id=baseline_id,
            current_value=current_value,
            baseline_value=baseline_value,
            absolute_change=absolute_change,
            percent_change=percent_change,
            is_significant=is_significant,
            direction=direction
        )

        return {
            'status': 'success',
            'deviation_id': deviation_id,
            'current_value': current_value,
            'baseline_value': baseline_value,
            'absolute_change': absolute_change,
            'percent_change': round(percent_change, 2),
            'is_significant': is_significant,
            'direction': direction,
            'threshold': self.significance_threshold
        }

    def _save_deviation(self, user_id, signal_type_id, baseline_id, current_value,
                    baseline_value, absolute_change, percent_change,
                    is_significant, direction):
        """Save deviation to database"""
        
        # First insert the deviation
        insert_query = """
            INSERT INTO deviations (
                user_id, signal_type_id, baseline_id,
                current_value, baseline_value, absolute_change, percent_change,
                is_significant, significance_threshold, direction,
                detection_date, adjusted_for_context
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_DATE, FALSE
            )
        """

        try:
            db.execute_query(insert_query, (
                user_id, signal_type_id, baseline_id,
                current_value, baseline_value, absolute_change, percent_change,
                is_significant, self.significance_threshold, direction
            ))
            
            # Then get the ID by fetching the latest deviation
            select_query = """
                SELECT id FROM deviations
                WHERE user_id = %s AND signal_type_id = %s
                ORDER BY detection_timestamp DESC
                LIMIT 1
            """
            result = db.execute_query(select_query, (user_id, signal_type_id))
            
            if result and len(result) > 0:
                return result[0]['id']
            return None
        except Exception as e:
            logger.error("Error saving deviation: %s", e)
            return None

    def get_recent_deviations(self, user_id: str, days: int = 7):
        """Get recent significant deviations for a user"""
        cutoff = (datetime.now() - timedelta(days=days)).date()
        query = """
            SELECT
                d.id,
                st.name AS signal_type,
                d.current_value,
                d.baseline_value,
                d.percent_change,
                d.direction,
                d.detection_date
            FROM deviations d
            JOIN signal_types st ON d.signal_type_id = st.id
            WHERE d.user_id = %s
              AND d.is_significant = TRUE
              AND d.detection_date >= %s
            ORDER BY d.detection_date DESC
        """
        return db.execute_query(query, (user_id, cutoff))

    def count_significant_deviations(self, user_id: str, days: int = 3):
        """Count how many significant deviations in recent days"""
        cutoff = (datetime.now() - timedelta(days=days)).date()
        query = """
            SELECT COUNT(DISTINCT signal_type_id) as count
            FROM deviations
            WHERE user_id = %s
              AND is_significant = TRUE
              AND detection_date >= %s
        """
        result = db.execute_query(query, (user_id, cutoff))
        return result[0] if result else {'count': 0}
