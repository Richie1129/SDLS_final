// // controller for rag_message
// const Rag_message = require('../models/rag_message');

// exports.getRagMessageHistory = async (req, res) => {
//     const userId = req.params.userId;
//     console.log("rag_message", Rag_message); // 確認模型是否正確載入

//     try {
//         const messages = await Rag_message.findAll({
//             attributes: [ 'userId', 'input_message', 'response_message'], // 指定抓取的欄位
//             where: { userId: userId },
//             order: [['createdAt', 'ASC']] // 按照建立時間排序
//         });

//         console.log(messages); // 確認結果
//         res.status(200).json(messages); // 回傳抓取的資料
//     } catch (err) {
//         console.error(err); // 錯誤處理
//         res.status(500).json({ error: '無法取得歷史紀錄' });
//     }
// };