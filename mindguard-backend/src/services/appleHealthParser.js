// services/appleHealthParser.js
// Parses Apple Health export.xml and extracts signals relevant to MindGuard.
// The export.xml file is structured as:
//   <HealthData>
//     <Record type="HKQuantityTypeIdentifierHeartRateVariabilitySDNN" value="..." startDate="..." endDate="..." />
//     ...
//     <Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisAsleep" startDate="..." endDate="..." />
//     ...
//   </HealthData>

import { XMLParser } from 'fast-xml-parser';

// Maps Apple Health HK types to MindGuard signal names
const HK_TYPE_MAP = {
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: 'HRV',
  HKQuantityTypeIdentifierRestingHeartRate:         'HR_resting',
  HKQuantityTypeIdentifierStepCount:                'steps',
  HKQuantityTypeIdentifierOxygenSaturation:         'spo2',
};

// Sleep categories that count as "asleep"
const SLEEP_ASLEEP_VALUES = new Set([
  'HKCategoryValueSleepAnalysisAsleep',
  'HKCategoryValueSleepAnalysisAsleepCore',
  'HKCategoryValueSleepAnalysisAsleepDeep',
  'HKCategoryValueSleepAnalysisAsleepREM',
]);

function parseDate(str) {
  // Apple Health dates: "2024-05-10 22:15:30 -0300"
  if (!str) return null;
  const d = new Date(str.replace(' ', 'T').replace(/(\s[+-]\d{4})$/, (m) => m.replace(' ', '')));
  return isNaN(d.getTime()) ? null : d;
}

class AppleHealthParser {
  parse(xmlContent) {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseAttributeValue: true,
    });

    let parsed;
    try {
      parsed = parser.parse(xmlContent);
    } catch (e) {
      throw new Error('XML inválido — certifique-se de enviar o arquivo export.xml do Apple Health.');
    }

    const healthData = parsed?.HealthData;
    if (!healthData) throw new Error('Arquivo não parece ser um export do Apple Health (nó <HealthData> não encontrado).');

    const records = Array.isArray(healthData.Record) ? healthData.Record : healthData.Record ? [healthData.Record] : [];

    const signals = [];
    const sleepByDay = {}; // date string → total asleep minutes

    for (const rec of records) {
      const type       = rec.type;
      const valueRaw   = rec.value;
      const startDate  = parseDate(rec.startDate);
      const endDate    = parseDate(rec.endDate);
      const sourceName = rec.sourceName || '';

      if (!type || !startDate) continue;

      // Skip Apple Health app aggregate entries that duplicate wearable data
      if (sourceName === 'Health' && type === 'HKQuantityTypeIdentifierStepCount') continue;

      // --- Quantity signals ---
      if (HK_TYPE_MAP[type]) {
        const signalName = HK_TYPE_MAP[type];
        const value = parseFloat(valueRaw);
        if (isNaN(value)) continue;

        // HRV: Apple Watch reports in ms, keep as-is
        // HR: in bpm, keep as-is
        // Steps: daily total, keep as-is
        // SpO2: stored as fraction (0.97), convert to %
        const finalValue = type === 'HKQuantityTypeIdentifierOxygenSaturation'
          ? value > 1 ? value : value * 100
          : value;

        signals.push({
          signalType: signalName,
          value: Math.round(finalValue * 10) / 10,
          timestamp: startDate.toISOString(),
        });
        continue;
      }

      // --- Sleep analysis ---
      if (type === 'HKCategoryTypeIdentifierSleepAnalysis' && endDate) {
        if (!SLEEP_ASLEEP_VALUES.has(valueRaw)) continue;
        const durationMin = (endDate - startDate) / 60000;
        if (durationMin <= 0 || durationMin > 720) continue; // sanity: max 12h per session

        // Use the date when sleep started (could be previous day)
        const dayKey = startDate.toISOString().slice(0, 10);
        sleepByDay[dayKey] = (sleepByDay[dayKey] || 0) + durationMin;
      }
    }

    // Convert sleep totals to daily duration + quality signals
    for (const [dateStr, totalMin] of Object.entries(sleepByDay)) {
      const hours = Math.round((totalMin / 60) * 10) / 10;
      const quality = this._sleepQuality(hours);
      const ts = new Date(dateStr + 'T08:00:00.000Z').toISOString(); // morning of wake-up

      signals.push({ signalType: 'sleep_duration', value: hours,   timestamp: ts });
      signals.push({ signalType: 'sleep_quality',  value: quality, timestamp: ts });
    }

    // Deduplicate: keep one entry per (signalType, dateKey)
    const seen = new Set();
    const deduped = signals.filter(s => {
      const key = `${s.signalType}|${s.timestamp.slice(0, 10)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Build summary
    const byType = {};
    deduped.forEach(s => { byType[s.signalType] = (byType[s.signalType] || 0) + 1; });

    const dates = deduped.map(s => new Date(s.timestamp)).filter(d => !isNaN(d));
    const minDate = dates.length ? new Date(Math.min(...dates)) : null;
    const maxDate = dates.length ? new Date(Math.max(...dates)) : null;

    return {
      signals: deduped,
      summary: {
        total: deduped.length,
        by_type: byType,
        date_range: minDate && maxDate
          ? `${minDate.toLocaleDateString('pt-BR')} → ${maxDate.toLocaleDateString('pt-BR')}`
          : null,
      },
    };
  }

  _sleepQuality(hours) {
    // Maps sleep duration to a subjective quality score (1–10)
    if (hours >= 8.0) return 9;
    if (hours >= 7.5) return 8;
    if (hours >= 7.0) return 7;
    if (hours >= 6.5) return 6;
    if (hours >= 6.0) return 5;
    if (hours >= 5.0) return 4;
    if (hours >= 4.0) return 3;
    return 2;
  }
}

export default new AppleHealthParser();
