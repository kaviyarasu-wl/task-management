import multer from 'multer';
import { config } from '../../config';
import { BadRequestError } from '@core/errors/AppError';

const storage = multer.memoryStorage();

export const uploadSingle = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`File type ${file.mimetype} not allowed`));
    }
  },
}).single('file');
