// routes/announcement.js
const router = require('express').Router();
const controller = require('../controllers/announcement');

// 發佈公告
router.post('/create', controller.createAnnouncement);
// 獲取公告
router.get('/', controller.getAnnouncements);

module.exports = router;