// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');
// const app = express();

// app.use(express.json());
// app.use(cors());

// const API_KEY = 'ragflow-hhYjNjMzdhNzU5YTExZWY4ZTdmMDI0Mm';
// const CREATE_CONVERSATION_URL = 'http://140.115.126.193/v1/api/new_conversation';
// const COMPLETION_URL = 'http://140.115.126.193/v1/api/completion';

// let conversationId = null;

// // 初始化會話
// const initializeConversation = async () => {
//     try {
//         const response = await axios.get(CREATE_CONVERSATION_URL, {
//             headers: {
//                 Authorization: `Bearer ${API_KEY}`,
//                 'Content-Type': 'application/json',
//             },
//             params: {
//                 user_id: 'user123', // 自定義用戶 ID
//             },
//         });

//         if (response.status === 200) {
//             const data = response.data;
//             conversationId = data.data.id;
//             const conversationMessage = data.data.message?.[0]?.content || '無預設開場白。';
//             return conversationMessage;
//         } else {
//             throw new Error('初始化會話失敗');
//         }
//     } catch (error) {
//         console.error('Error initializing conversation:', error.message);
//         return '創建會話失敗，請稍後再試。';
//     }
// };

// // 初始化會話路由
// app.get('/api/rag/initialize_conversation', async (req, res) => {
//     const conversationMessage = await initializeConversation();
//     res.json({ conversation_message: conversationMessage });
// });

// // 提交問題並獲取回答
// app.post('/api/rag/ask_question', async (req, res) => {
//     const { question } = req.body;

//     if (!conversationId) {
//         return res.status(400).json({ error: '會話未初始化' });
//     }

//     const payload = {
//         conversation_id: conversationId,
//         messages: [
//             {
//                 role: 'user',
//                 content: question,
//             },
//         ],
//         quote: false,
//         stream: false,
//     };

//     try {
//         const response = await axios.post(COMPLETION_URL, payload, {
//             headers: {
//                 Authorization: `Bearer ${API_KEY}`,
//                 'Content-Type': 'application/json',
//             },
//         });

//         if (response.status === 200) {
//             const answer = response.data.data?.answer || '回應中沒有 "answer" 欄位。';
//             res.json({ answer });
//         } else {
//             res.status(500).json({ error: `獲取回答失敗，狀態碼: ${response.status}` });
//         }
//     } catch (error) {
//         console.error('Error fetching answer:', error.message);
//         res.status(500).json({ error: '獲取回答失敗，請稍後再試。' });
//     }
// });

// // 啟動伺服器
// const PORT = process.env.PORT || 5173;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
