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
        // 先嘗試取得基本欄位
        let attributes = ['id', 'userId', 'userName', 'input_message', 'response_message', 'sessionId', 'createdAt'];
        
        // 檢查是否存在 ragflow_session_id 欄位
        try {
            const tableDescription = await Rag_message.describe();
            if (tableDescription.ragflow_session_id) {
                attributes.push('ragflow_session_id');
                console.log("已包含 ragflow_session_id 欄位");
            } else {
                console.log("ragflow_session_id 欄位尚未存在，使用基本欄位");
            }
        } catch (describeError) {
            console.log("無法檢查表結構，使用基本欄位:", describeError.message);
        }

        const messages = await Rag_message.findAll({
            attributes: attributes,
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
        res.status(500).json({ error: '無法取得會話歷史紀錄', details: err.message });
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

// 根據 userId 和 sessionId 取得 RAGFlow session ID
exports.getRagflowSessionId = async (req, res) => {
    const { userId, sessionId } = req.params;
    console.log("取得 RAGFlow session ID，userId:", userId, "sessionId:", sessionId);

    try {
        // 先檢查 ragflow_session_id 欄位是否存在
        const tableDescription = await Rag_message.describe();
        
        if (!tableDescription.ragflow_session_id) {
            console.log("ragflow_session_id 欄位尚未存在於資料庫中");
            return res.status(200).json({ ragflow_session_id: null });
        }

        const message = await Rag_message.findOne({
            attributes: ['ragflow_session_id'],
            where: { 
                userId: userId,
                sessionId: sessionId,
                ragflow_session_id: { [require('sequelize').Op.not]: null }
            },
            order: [['createdAt', 'ASC']]
        });

        const ragflowSessionId = message ? message.ragflow_session_id : null;
        console.log("找到的 RAGFlow session ID:", ragflowSessionId);
        
        res.status(200).json({ ragflow_session_id: ragflowSessionId });
    } catch (err) {
        console.error("取得 RAGFlow session ID 錯誤:", err);
        
        // 如果是因為欄位不存在的錯誤，返回 null 而不是錯誤
        if (err.message && err.message.includes('column') && err.message.includes('ragflow_session_id')) {
            console.log("ragflow_session_id 欄位不存在，返回 null");
            return res.status(200).json({ ragflow_session_id: null });
        }
        
        res.status(500).json({ error: '無法取得 RAGFlow session ID', details: err.message });
    }
};