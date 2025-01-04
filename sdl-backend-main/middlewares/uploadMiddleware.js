const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 確認 daily_file 資料夾存在
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../daily_file');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const originalFileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, `${Date.now()}-${originalFileName}`);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('application/')) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'));
        }
    },
});

module.exports = { upload };
