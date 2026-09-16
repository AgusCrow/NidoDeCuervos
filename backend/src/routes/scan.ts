import { Router, Request, Response } from 'express';
import { processNfcScan } from '../rpgEngine';

const router = Router();

// POST /api/v1/scan/nfc
router.post('/nfc', async (req: Request, res: Response) => {
  try {
    const { nfcUid, bypassCooldown } = req.body;
    if (!nfcUid) return res.status(400).json({ error: 'nfcUid es requerido' });

    const scanResult = await processNfcScan(nfcUid, Boolean(bypassCooldown));
    return res.json({ success: true, result: scanResult });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
