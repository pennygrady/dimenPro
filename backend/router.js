// routes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const iconv = require('iconv-lite');

const router = express.Router();

// 设置文件存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // 指定文件上传目录
    },
    filename: (req, file, cb) => {
        // 确保文件名为 UTF-8 编码
        const originalName = iconv.decode(Buffer.from(file.originalname, 'latin1'), 'utf8');
        cb(null, originalName); // 保留原始文件名
    },
});

const upload = multer({ storage });

// 创建上传路由
router.post('/api/upload', upload.single('file'), (req, res) => {
    console.log('File uploaded:', {
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
    });
    res.json({ message: 'File uploaded successfully' });
});

// 创建文件信息路由
router.get('/api/files', (req, res) => {
    fs.readdir('uploads/', (err, files) => {
        if (err) {
            return res.status(500).json({ message: '无法读取文件' });
        }

        const fileInfos = files.map(file => {
            const stats = fs.statSync(path.join('uploads', file));
            return {
                name: file,
                size: stats.size,
                mimetype: path.extname(file),
                url: `/api/download/${encodeURIComponent(file)}` // 下载链接
            };
        });

        res.json(fileInfos);
    });
});

// 创建文件下载路由
router.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    res.download(filePath, filename, (err) => {
        if (err) {
            res.status(404).json({ message: '文件未找到' });
        }
    });
});

module.exports = router; // 导出路由