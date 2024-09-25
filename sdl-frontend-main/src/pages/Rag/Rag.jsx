import React, { useState, useEffect } from 'react';

const API_KEY = "ragflow-hhYjNjMzdhNzU5YTExZWY4ZTdmMDI0Mm";
const CREATE_CONVERSATION_URL = "http://140.115.126.193/v1/api/new_conversation";
const COMPLETION_URL = "http://140.115.126.193/v1/api/completion";

const Rag = () => {
  const [conversationId, setConversationId] = useState(null);
  const [conversationMessage, setConversationMessage] = useState('無預設開場白。');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState([]); // 用來存放歷史紀錄

  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  // 初始化會話
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        const response = await fetch(CREATE_CONVERSATION_URL, {
          method: 'GET',
          headers: headers,
          params: { user_id: 'user123' },
        });
        const data = await response.json();
        setConversationId(data.data.id);
        setConversationMessage(data.data.message?.[0]?.content || '無預設開場白。');
      } catch (error) {
        setConversationMessage('創建會話失敗，請稍後再試。');
      }
    };

    if (!conversationId) {
      initializeConversation();
    }
  }, [conversationId]);

  // 提交問題
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      conversation_id: conversationId,
      messages: [
        {
          role: 'user',
          content: question,
        },
      ],
      quote: false,
      stream: false,
    };

    try {
      const response = await fetch(COMPLETION_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      const newAnswer = data?.data?.answer || "回應中沒有 'data' 或 'answer' 欄位。";
      setAnswer(newAnswer);

      // 更新歷史紀錄
      setHistory((prevHistory) => [
        ...prevHistory,
        { question, answer: newAnswer },
      ]);
      setQuestion(''); // 清空輸入框
    } catch (error) {
      setAnswer(`獲取回答失敗，請稍後再試。`);
    }
  };

  return (
    <div className="flex h-screen">
      {/* 左側的歷史紀錄區域 */}
      <div className="w-1/3 bg-gray-200 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-right pr-2">歷史紀錄</h2> {/* 調整為右對齊，並增加 padding */}
        <div className="space-y-4">
          {history.length > 0 ? (
            history.map((item, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow">
                <p><strong>問題:</strong> {item.question}</p>
                <p><strong>回答:</strong> {item.answer}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">尚無歷史紀錄</p>
          )}
        </div>
      </div>

      {/* 右側的聊天室區域 */}
      <div className="w-2/3 bg-white p-4 flex flex-col">
        <div className="flex-grow overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">聊天室</h2>
          {history.length > 0 ? (
            history.map((item, index) => (
              <div key={index} className="space-y-4">
                {/* 問題在右邊 */}
                <div className="flex justify-end">
                  <div className="p-4 bg-blue-200 rounded-lg w-3/4">
                    <p className="text-lg"><strong>問題:</strong> {item.question}</p>
                  </div>
                </div>
                {/* 回答在左邊 */}
                <div className="flex justify-start">
                  <div className="p-4 bg-green-200 rounded-lg w-3/4">
                    <p className="text-lg"><strong>回答:</strong> {item.answer}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-lg">尚無聊天紀錄</p>
          )}
        </div>
        
        {/* 表單提交區域 */}
        <form onSubmit={handleSubmit} className="mt-4">
          <input
            type="text"
            id="question"
            name="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="請輸入您的問題"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 mb-4"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600"
          >
            送出
          </button>
        </form>
      </div>
    </div>
  );
};

export default Rag;
