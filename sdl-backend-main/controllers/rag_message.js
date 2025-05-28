// controller for rag_message
const Rag_message = require('../models/rag_message');

// 根據 userId 取得所有 RAG 訊息歷史
exports.getRagMessageHistory = async (req, res) => {
    const userId = req.params.userId;
    console.log("取得用戶 RAG 訊息歷史，userId:", userId);

    try {
        const messages = await Rag_message.findAll({
            attributes: ['id', 'userId', 'userName', 'input_message', 'response_message', 'sessionId', 'createdAt'],
            where: { userId: userId },
            order: [['createdAt', 'ASC']]
        });

        console.log("找到的訊息數量:", messages.length);
        res.status(200).json(messages);
    } catch (err) {
        console.error("取得歷史紀錄錯誤:", err);
        res.status(500).json({ error: '無法取得歷史紀錄' });
    }
};

// 根據 userId 和 sessionId 取得特定會話的訊息歷史
exports.getRagMessageBySession = async (req, res) => {
    const { userId, sessionId } = req.params;
    console.log("取得特定會話的 RAG 訊息，userId:", userId, "sessionId:", sessionId);

    try {
        const messages = await Rag_message.findAll({
            attributes: ['id', 'userId', 'userName', 'input_message', 'response_message', 'sessionId', 'createdAt'],
            where: { 
                userId: userId,
                sessionId: sessionId 
            },
            order: [['createdAt', 'ASC']]
        });

        console.log("找到的會話訊息數量:", messages.length);
        res.status(200).json(messages);
    } catch (err) {
        console.error("取得會話歷史紀錄錯誤:", err);
        res.status(500).json({ error: '無法取得會話歷史紀錄' });
    }
};

// 根據 userId 取得所有不同的 sessionId（用於顯示會話列表）
exports.getUserSessions = async (req, res) => {
    const userId = req.params.userId;
    console.log("取得用戶的所有會話列表，userId:", userId);

    try {
        // 先獲取所有該用戶的訊息，然後在 JavaScript 中處理去重
        const messages = await Rag_message.findAll({
            attributes: ['sessionId', 'userName', 'createdAt'],
            where: { 
                userId: userId,
                sessionId: { [require('sequelize').Op.not]: null }
            },
            order: [['createdAt', 'DESC']]
        });

        // 在 JavaScript 中進行去重處理
        const sessionMap = new Map();
        
        messages.forEach(message => {
            if (!sessionMap.has(message.sessionId)) {
                sessionMap.set(message.sessionId, {
                    sessionId: message.sessionId,
                    userName: message.userName,
                    lastActivity: message.createdAt
                });
            }
        });

        // 轉換為數組並按時間排序
        const sessions = Array.from(sessionMap.values()).sort(
            (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)
        );

        console.log("找到的會話數量:", sessions.length);
        res.status(200).json(sessions);
    } catch (err) {
        console.error("取得會話列表錯誤:", err);
        res.status(500).json({ error: '無法取得會話列表' });
    }
};

// 測試端點
exports.testConnection = async (req, res) => {
    const userId = req.params.userId;
    console.log("測試連接，userId:", userId);
    
    try {
        const count = await Rag_message.count({
            where: { userId: userId }
        });
        
        res.status(200).json({ 
            message: "連接成功", 
            userId: userId,
            totalMessages: count 
        });
    } catch (err) {
        console.error("測試連接錯誤:", err);
        res.status(500).json({ error: '測試連接失敗', details: err.message });
    }
};