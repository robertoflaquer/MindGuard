# services/baseline_calculator.py
import os
from datetime import datetime, timedelta
import numpy as np
from config.database import db
from config.logger import get_logger

logger = get_logger(__name__)

class BaselineCalculator:
    def __init__(self):
        self.min_days = int(os.getenv('BASELINE_MIN_DAYS', '7'))
        self.max_days = int(os.getenv('BASELINE_MAX_DAYS', '14'))
        self.min_samples = 5

    def calculate_baseline(self, user_id: str, signal_type_id: int):
        """
        Calculate baseline for a specific user and signal type.
        Uses median (more robust than mean) and removes outliers.
        """
        # Fetch recent signals
        end_date = datetime.now()
        start_date = end_date - timedelta(days=self.max_days)

        query = """
            SELECT value, timestamp
            FROM user_signals
            WHERE user_id = %s 
              AND signal_type_id = %s
              AND timestamp >= %s
              AND timestamp <= %s
              AND is_outlier = FALSE
            ORDER BY timestamp ASC
        """

        signals = db.execute_query(query, (user_id, signal_type_id, start_date, end_date))

        if len(signals) < self.min_samples:
            return {
                'status': 'insufficient_data',
                'message': f'Need at least {self.min_samples} samples, got {len(signals)}',
                'baseline_value': None
            }

        # Extract values
        values = np.array([float(s['value']) for s in signals])

        # Remove outliers using IQR method
        Q1 = np.percentile(values, 25)
        Q3 = np.percentile(values, 75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        clean_values = values[(values >= lower_bound) & (values <= upper_bound)]

        if len(clean_values) < self.min_samples:
            # Not enough clean data, use all
            clean_values = values

        # Calculate baseline (median is more robust)
        baseline_value = float(np.median(clean_values))
        baseline_std = float(np.std(clean_values))

        # Calculate rolling windows
        rolling_7d = self._calculate_rolling_average(values, 7)
        rolling_14d = float(np.median(clean_values))  # All data is ~14 days
        rolling_30d = rolling_14d  # Not enough data yet

        # Save to database
        self._save_baseline(
            user_id=user_id,
            signal_type_id=signal_type_id,
            baseline_value=baseline_value,
            baseline_std=baseline_std,
            rolling_7d=rolling_7d,
            rolling_14d=rolling_14d,
            rolling_30d=rolling_30d,
            sample_size=len(clean_values),
            period_start=start_date.date(),
            period_end=end_date.date()
        )

        return {
            'status': 'success',
            'baseline_value': baseline_value,
            'baseline_std': baseline_std,
            'rolling_7d': rolling_7d,
            'rolling_14d': rolling_14d,
            'sample_size': len(clean_values),
            'data_quality': len(clean_values) / len(values)
        }

    def _calculate_rolling_average(self, values, days):
        """Calculate rolling average for last N days"""
        if len(values) < days:
            return float(np.median(values))
        return float(np.median(values[-days:]))

    def _save_baseline(self, user_id, signal_type_id, baseline_value, baseline_std,
                      rolling_7d, rolling_14d, rolling_30d, sample_size,
                      period_start, period_end):
        """Save or update baseline in database"""
        
        data_quality = min(sample_size / 14.0, 1.0)
        next_update = period_end + timedelta(days=7)

        # Upsert: atualiza in-place se já existe, preservando o ID (evita quebrar FK de deviations)
        upsert_query = """
            INSERT INTO baselines (
                user_id, signal_type_id, baseline_value, baseline_std_dev,
                rolling_7d_value, rolling_14d_value, rolling_30d_value,
                calculation_method, sample_size, data_quality_score,
                period_start, period_end, is_current, next_update_date
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'median', %s, %s, %s, %s, TRUE, %s)
            ON CONFLICT (user_id, signal_type_id, is_current) DO UPDATE SET
                baseline_value     = EXCLUDED.baseline_value,
                baseline_std_dev   = EXCLUDED.baseline_std_dev,
                rolling_7d_value   = EXCLUDED.rolling_7d_value,
                rolling_14d_value  = EXCLUDED.rolling_14d_value,
                rolling_30d_value  = EXCLUDED.rolling_30d_value,
                sample_size        = EXCLUDED.sample_size,
                data_quality_score = EXCLUDED.data_quality_score,
                period_start       = EXCLUDED.period_start,
                period_end         = EXCLUDED.period_end,
                next_update_date   = EXCLUDED.next_update_date,
                updated_at         = NOW()
        """

        db.execute_query(upsert_query, (
            user_id, signal_type_id, baseline_value, baseline_std,
            rolling_7d, rolling_14d, rolling_30d,
            sample_size, data_quality,
            period_start, period_end, next_update
        ))

        logger.debug("Baseline saved for user %s, signal %s: %s", user_id, signal_type_id, baseline_value)

    def calculate_all_baselines(self, user_id: str):
        """Calculate baselines for all signal types for a user"""
        # Get all signal types
        query = "SELECT id, name FROM signal_types WHERE is_active = TRUE"
        signal_types = db.execute_query(query)

        results = {}
        for signal_type in signal_types:
            result = self.calculate_baseline(user_id, signal_type['id'])
            results[signal_type['name']] = result

        return results
