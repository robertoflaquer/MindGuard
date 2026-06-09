// controllers/wearableController.js
import appleHealthParser from '../services/appleHealthParser.js';
import { query } from '../config/database.js';
import logger from '../config/logger.js';
import axios from 'axios';
import AdmZip from 'adm-zip';

class WearableController {
  async importAppleHealth(req, res, next) {
    try {
      const userId = req.user.userId;

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado. Envie o export.xml do Apple Health.' });
      }

      let xmlContent;
      if (req.file.originalname.endsWith('.zip') || req.file.mimetype === 'application/zip') {
        const zip = new AdmZip(req.file.buffer);
        const xmlEntry = zip.getEntries().find(e => e.entryName.endsWith('export.xml') || e.entryName === 'apple_health_export/export.xml');
        if (!xmlEntry) {
          return res.status(422).json({ success: false, error: 'Arquivo ZIP não contém export.xml. Extraia o ZIP e envie apenas o arquivo export.xml.' });
        }
        xmlContent = xmlEntry.getData().toString('utf-8');
      } else {
        xmlContent = req.file.buffer.toString('utf-8');
      }

      let parsed;
      try {
        parsed = appleHealthParser.parse(xmlContent);
      } catch (parseError) {
        return res.status(422).json({ success: false, error: parseError.message });
      }

      if (parsed.signals.length === 0) {
        return res.status(200).json({
          success: true,
          data: { imported: 0, summary: parsed.summary, message: 'Nenhum dado relevante encontrado no arquivo.' },
        });
      }

      // Resolve signal type IDs
      const typesResult = await query(`SELECT id, name FROM signal_types WHERE is_active = TRUE`);
      const typeMap = {};
      typesResult.rows.forEach(r => { typeMap[r.name] = r.id; });

      // Insert signals (skip unknown types and duplicates in last 2 hours)
      let inserted = 0;
      const skipped = [];
      for (const s of parsed.signals) {
        const typeId = typeMap[s.signalType];
        if (!typeId) { skipped.push(s.signalType); continue; }

        try {
          await query(
            `INSERT INTO user_signals (user_id, signal_type_id, value, timestamp, confidence_score, source_metadata)
             VALUES ($1, $2, $3, $4, 0.85, '{"source":"apple_health"}')
             ON CONFLICT DO NOTHING`,
            [userId, typeId, s.value, s.timestamp]
          );
          inserted++;
        } catch { /* skip duplicates */ }
      }

      logger.info({ userId, inserted, total: parsed.signals.length }, 'Apple Health import completed');

      // Fire-and-forget: trigger baseline → risk recalculation
      if (inserted > 0 && process.env.PYTHON_API_URL) {
        const pythonUrl = process.env.PYTHON_API_URL;
        Promise.all([
          axios.post(`${pythonUrl}/baseline/calculate`, { user_id: userId }).catch(() => {}),
        ]).then(() => {
          axios.post(`${pythonUrl}/risk/calculate`, { user_id: userId }).catch(() => {});
        });
      }

      res.status(200).json({
        success: true,
        data: {
          imported: inserted,
          total_parsed: parsed.signals.length,
          summary: parsed.summary,
          message: `${inserted} registros importados com sucesso do Apple Health.`,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Apple Health import failed');
      next(error);
    }
  }
}

export default new WearableController();
