//conrollers/announcement.js
const Announcement = require('../models/announcement');
const Project = require('../models/project');
const User = require('../models/user');

// 發佈公告
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, author, projectId } = req.body;

        console.log("接收到的請求數據:", { title, content, author, projectId });

        if (!title || !content || !author || projectId === undefined) {
            console.log("缺少必要字段:", { title, content, author, projectId });
            return res.status(400).json({ message: '缺少必要欄位', missingFields: { title, content, author, projectId } });
        }

        const newAnnouncement = await Announcement.create({
            title,
            content,
            author,
            projectId: projectId === 'all' ? null : projectId,
        });

        if (newAnnouncement) {
            console.log("公告成功儲存至資料庫:", newAnnouncement);
        } else {
            console.error("公告儲存至資料庫失敗: 未返回新記錄");
        }

        if (!projectId || projectId === 'all') {
            req.app.get('io').emit('receiveAnnouncement', newAnnouncement);
        } else {
            req.app.get('io').to(projectId.toString()).emit('receiveAnnouncement', newAnnouncement);
        }

        res.status(201).json({ message: '公告發布成功', announcement: newAnnouncement });
    } catch (error) {
        console.error("公告儲存失敗，出錯資訊:", error.message, error.stack);
        res.status(500).json({ message: '公告發布失敗', error: error.message, stack: error.stack });
    }
};


// 獲取公告
exports.getAnnouncements = async (req, res) => {
    try {
        console.log("正在加載所有公告...");

        // 不使用任何過濾條件，返回所有公告
        const announcements = await Announcement.findAll({
            order: [['createdAt', 'DESC']], // 按時間倒序排列
        });

        console.log("公告列表加載成功:", announcements);

        // 返回公告列表
        res.status(200).json({ announcements });
    } catch (error) {
        console.error('無法加載公告:', error);
        res.status(500).json({ message: '載入公告失敗', error: error.message });
    }
};

// exports.getAnnouncements = async (req, res) => {
//     try {
//         const { projectId } = req.query;

//         console.log("正在加載公告，projectId:", projectId);

//         // 根據 projectId 過濾公告
//         const whereCondition = projectId === 'all' || !projectId
//             ? {}
//             : { projectId };

//         const announcements = await Announcement.findAll({
//             where: whereCondition,
//             order: [['createdAt', 'DESC']], // 按時間倒序排列
//         });

//         console.log("公告列表加載成功:", announcements);
//         res.status(200).json({ announcements });
//     } catch (error) {
//         console.error('無法加載公告:', error);
//         res.status(500).json({ message: '載入公告失敗', error: error.message });
//     }
// };

