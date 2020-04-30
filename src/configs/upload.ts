import { resolve } from 'path';
import { randomBytes } from 'crypto';
import { diskStorage } from 'multer';

const tmpFolder = resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpFolder,

  storage: diskStorage({
    destination: tmpFolder,
    filename: (req, file, cb) => {
      const fileHash = randomBytes(10).toString('HEX');
      const fileName = `${fileHash}-${file.originalname}`;

      return cb(null, fileName);
    },
  }),
};
