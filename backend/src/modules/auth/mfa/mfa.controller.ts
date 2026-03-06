import { Request, Response } from 'express';
import { MfaService } from './mfa.service';
import {
  mfaVerifySetupSchema,
  mfaVerifyLoginSchema,
  mfaRecoverySchema,
  mfaDisableSchema,
} from '@api/validators/mfa.validator';

const mfaService = new MfaService();

export const mfaController = {
  async setup(_req: Request, res: Response): Promise<void> {
    const result = await mfaService.generateSetup();
    res.json({ success: true, data: result });
  },

  async verifySetup(req: Request, res: Response): Promise<void> {
    const { code } = mfaVerifySetupSchema.parse(req.body);
    const result = await mfaService.verifySetup(code);
    res.json({
      success: true,
      data: {
        ...result,
        message: 'MFA enabled successfully. Save your recovery codes.',
      },
    });
  },

  async verifyLogin(req: Request, res: Response): Promise<void> {
    const { mfaToken, code } = mfaVerifyLoginSchema.parse(req.body);
    const result = await mfaService.verifyLoginCode(mfaToken, code);
    res.json({ success: true, data: result });
  },

  async recovery(req: Request, res: Response): Promise<void> {
    const { mfaToken, recoveryCode } = mfaRecoverySchema.parse(req.body);
    const result = await mfaService.useRecoveryCode(mfaToken, recoveryCode);
    res.json({ success: true, data: result });
  },

  async disable(req: Request, res: Response): Promise<void> {
    const { code } = mfaDisableSchema.parse(req.body);
    await mfaService.disable(code);
    res.json({ success: true, data: { message: 'MFA disabled successfully' } });
  },
};
