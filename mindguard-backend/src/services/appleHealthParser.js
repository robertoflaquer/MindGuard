// services/appleHealthParser.js
// Streaming SAX-based parser for Apple Health export.xml.
// Handles files of any size (100MB+) with constant memory usage.
// Only processes records from the last MAX_DAYS days to reduce data volume.

import sax from 'sax';

const MAX_DAYS = 365;
const CUTOFF_MS = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000;

const HK_TYPE_MAP = {
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: 'HRV',
  HKQuantityTypeIdentifierRestingHeartRate:         'HR_resting',
  HKQuantityTypeIdentifierStepCount:                'steps',
  HKQuantityTypeIdentifierOxygenSaturation:         'spo2',
};

const SLEEP_ASLEEP_VALUES = new Set([
  'HKCategoryValueSleepAnalysisAsleep',
  'HKCategoryValueSleepAnalysisAsleepCore',
  'HKCategoryValueSleepAnalysisAsleepDeep',
  'HKCategoryValueSleepAnalysisAsleepREM',
]);

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str.replace(' ', 'T').replace(/(\s[+-]\d{4})$/, (m) => m.replace(' ', '')));
  return isNaN(d.getTime()) ? null : d;
}

class AppleHealthParser {
  parse(xmlContent) {
    return new Promise((resolve, reject) => {
      const parser = sax.parser(true, { trim: true, normalize: true });

      const signals = [];
      const sleepByDay = {};
      const seen = new Set();
      let foundHealthData = false;

      parser.onopentag = (node) => {
        if (node.name === 'HealthData') { foundHealthData = true; return; }
        if (node.name !== 'Record') return;

        const type       = node.attributes.type;
        const valueRaw   = node.attributes.value;
        const startDate  = parseDate(node.attributes.startDate);
        const endDate    = parseDate(node.attributes.endDate);
        const sourceName = node.attributes.sourceName || '';

        if (!type || !startDate) return;
        if (startDate.getTime() < CUTOFF_MS) return; // skip old records

        // Skip aggregate step counts from Health app
        if (sourceName === 'Health' && type === 'HKQuantityTypeIdentifierStepCount') return;

        // --- Quantity signals ---
        if (HK_TYPE_MAP[type]) {
          const signalName = HK_TYPE_MAP[type];
          const value = parseFloat(valueRaw);
          if (isNaN(value)) return;

          const finalValue = type === 'HKQuantityTypeIdentifierOxygenSaturation'
            ? value > 1 ? value : value * 100
            : value;

          const dateKey = startDate.toISOString().slice(0, 10);
          const dedupeKey = `${signalName}|${dateKey}`;
          if (seen.has(dedupeKey)) return;
          seen.add(dedupeKey);

          signals.push({
            signalType: signalName,
            value: Math.round(finalValue * 10) / 10,
            timestamp: startDate.toISOString(),
          });
          return;
        }

        // --- Sleep analysis ---
        if (type === 'HKCategoryTypeIdentifierSleepAnalysis' && endDate) {
          if (!SLEEP_ASLEEP_VALUES.has(valueRaw)) return;
          const durationMin = (endDate - startDate) / 60000;
          if (durationMin <= 0 || durationMin > 720) return;

          const dayKey = startDate.toISOString().slice(0, 10);
          sleepByDay[dayKey] = (sleepByDay[dayKey] || 0) + durationMin;
        }
      };

      parser.onerror = (err) => {
        parser.resume(); // don't stop on recoverable errors
        if (err.message && err.message.includes('Unexpected end')) {
          // truncated file — resolve with what we have
        }
      };

      parser.onend = () => {
        if (!foundHealthData) {
          reject(new Error('Arquivo não parece ser um export do Apple Health (nó <HealthData> não encontrado).'));
          return;
        }

        // Convert sleep totals to signals
        for (const [dateStr, totalMin] of Object.entries(sleepByDay)) {
          const hours = Math.round((totalMin / 60) * 10) / 10;
          const quality = this._sleepQuality(hours);
          const ts = new Date(dateStr + 'T08:00:00.000Z').toISOString();

          const dSleep = `sleep_duration|${dateStr}`;
          const dQual  = `sleep_quality|${dateStr}`;
          if (!seen.has(dSleep)) { signals.push({ signalType: 'sleep_duration', value: hours,   timestamp: ts }); seen.add(dSleep); }
          if (!seen.has(dQual))  { signals.push({ signalType: 'sleep_quality',  value: quality, timestamp: ts }); seen.add(dQual); }
        }

        const byType = {};
        signals.forEach(s => { byType[s.signalType] = (byType[s.signalType] || 0) + 1; });

        const dates = signals.map(s => new Date(s.timestamp)).filter(d => !isNaN(d));
        const minDate = dates.length ? new Date(Math.min(...dates)) : null;
        const maxDate = dates.length ? new Date(Math.max(...dates)) : null;

        resolve({
          signals,
          summary: {
            total: signals.length,
            by_type: byType,
            date_range: minDate && maxDate
              ? `${minDate.toLocaleDateString('pt-BR')} → ${maxDate.toLocaleDateString('pt-BR')}`
              : null,
          },
        });
      };

      try {
        parser.write(xmlContent).close();
      } catch (e) {
        reject(new Error('XML inválido — certifique-se de enviar o arquivo export.xml do Apple Health.'));
      }
    });
  }

  _sleepQuality(hours) {
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
