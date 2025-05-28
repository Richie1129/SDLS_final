//backend routes for rag_message
const router = require('express').Router();
const controller = require('../controllers/rag_message'); // 确保路径正确

// 測試連接
router.get('/test/:userId', controller.testConnection);

// 获取用戶所有 RAG 訊息歷史
router.get('/history/:userId', controller.getRagMessageHistory);

// 根據 userId 和 sessionId 取得特定會話的訊息歷史
router.get('/session/:userId/:sessionId', controller.getRagMessageBySession);

// 根據 userId 取得所有會話列表
router.get('/sessions/:userId', controller.getUserSessions);

module.exports = router;