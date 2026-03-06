import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authMiddleware } from '@api/middleware/auth.middleware';
import { uploadSingle } from '@api/middleware/upload.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { RequestContext } from '@core/context/RequestContext';
import { config } from '../../config';
import { UploadService } from './upload.service';
import {
  uploadBodySchema,
  uploadQuerySchema,
  uploadIdParamSchema,
} from '@api/validators/upload.validator';

const router = Router();
const uploadService = new UploadService();

router.use(authMiddleware);

/**
 * Re-enter RequestContext from req.user.
 * Multer's callback-based stream processing breaks the AsyncLocalStorage
 * context chain established by authMiddleware, so we restore it here.
 */
function withContext<T>(req: Request, fn: () => Promise<T>): Promise<T> {
  const user = req.user!;
  return RequestContext.run(
    {
      userId: user.userId,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      rolePermissions: user.rolePermissions,
      requestId: randomUUID(),
      locale: user.locale ?? config.DEFAULT_LOCALE,
    },
    fn
  );
}

// POST /api/v1/uploads — Upload a file
router.post(
  '/',
  uploadSingle,
  asyncWrapper(async (req: Request, res: Response) => {
    const upload = await withContext(req, async () => {
      const { entityType, entityId } = uploadBodySchema.parse(req.body);
      return uploadService.upload(req.file!, entityType, entityId);
    });
    res.status(201).json({
      success: true,
      data: {
        _id: upload._id,
        fileName: upload.filename,
        originalName: upload.filename,
        mimeType: upload.mimetype,
        size: upload.size,
        url: upload.url,
        entityType: upload.entityType,
        entityId: upload.entityId,
        uploadedBy: upload.uploadedBy,
        createdAt: upload.createdAt,
      },
    });
  })
);

// GET /api/v1/uploads — List files for an entity
router.get(
  '/',
  asyncWrapper(async (req: Request, res: Response) => {
    const uploads = await withContext(req, async () => {
      const { entityType, entityId } = uploadQuerySchema.parse(req.query);
      return uploadService.listByEntity(entityType, entityId);
    });
    res.json({
      success: true,
      data: uploads.map((u) => ({
        _id: u._id,
        fileName: u.filename,
        originalName: u.filename,
        mimeType: u.mimetype,
        size: u.size,
        url: u.url,
        entityType: u.entityType,
        entityId: u.entityId,
        uploadedBy: u.uploadedBy,
        createdAt: u.createdAt,
      })),
    });
  })
);

// GET /api/v1/uploads/:id/download — Get presigned download URL
router.get(
  '/:id/download',
  asyncWrapper(async (req: Request, res: Response) => {
    const result = await withContext(req, async () => {
      const { id } = uploadIdParamSchema.parse(req.params);
      return uploadService.getDownloadUrl(id);
    });
    res.json({ success: true, data: result });
  })
);

// DELETE /api/v1/uploads/:id — Soft-delete a file
router.delete(
  '/:id',
  asyncWrapper(async (req: Request, res: Response) => {
    await withContext(req, async () => {
      const { id } = uploadIdParamSchema.parse(req.params);
      await uploadService.delete(id);
    });
    res.json({ success: true, message: 'File deleted' });
  })
);

export { router as uploadRouter };
