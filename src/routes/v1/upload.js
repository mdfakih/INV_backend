const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image files are allowed'));
  },
});

router.post('/', requireAuth, requireRole(['admin', 'manager']), (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.message.includes('File too large'))
        return res
          .status(400)
          .json({ success: false, message: 'File size must be less than 5MB' });
      if (err.message.includes('Only image files'))
        return res
          .status(400)
          .json({ success: false, message: 'Only image files are allowed' });
      return res
        .status(400)
        .json({ success: false, message: err.message || 'Upload failed' });
    }
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: 'No file provided' });
    const file = req.file;
    return res.json({
      success: true,
      data: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        path: `/uploads/${file.filename}`,
      },
    });
  });
});

module.exports = router;
