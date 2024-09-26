import React, { useState, useEffect } from 'react';
import { socket } from '../../utils/socket';  // 導入 socket
import { FaPlus } from "react-icons/fa6";  // 導入 FaPlus icon

const API_KEY = "ragflow-hhYjNjMzdhNzU5YTExZWY4ZTdmMDI0Mm";
const CREATE_CONVERSATION_URL = "http://140.115.126.193/v1/api/new_conversation";
const COMPLETION_URL = "http://140.115.126.193/v1/api/completion";

const Rag = () => {
  const [conversationId, setConversationId] = useState(null);
  const [conversationMessage, setConversationMessage] = useState('無預設開場白。');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState([]); // 用來存放當前會話的歷史紀錄
  const [allConversations, setAllConversations] = useState([]); // 存放所有會話的歷史紀錄
  const [messageId, setMessageId] = useState(null); // 儲存訊息 ID 或 createdAt

  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  // 初始化會話並顯示歡迎訊息
  const initializeConversation = async () => {
    try {
      const response = await fetch(CREATE_CONVERSATION_URL, {
        method: 'GET',
        headers: headers,
      });
      const data = await response.json();
      console.log("創建會話 API 回應:", data);

      if (data && data.data && data.data.id) {
        const newConversation = {
          id: data.data.id,
          firstInput: '',  // 不需要將歡迎訊息作為用戶的輸入
          messages: [],
        };
        setConversationId(newConversation.id);
        setHistory([{ question: "", answer: "你好！我是你的科學探究小幫手，有什麼可以幫到你的嗎？" }]);
      } else {
        setConversationMessage('創建會話失敗，請稍後再試。');
      }
    } catch (error) {
      console.error("創建會話失敗:", error);
      setConversationMessage('創建會話失敗，請稍後再試。');
    }
  };

  // 提交問題
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!conversationId) {
      setAnswer("會話尚未初始化，請先建立新會話。");
      return;
    }

    if (!question.trim()) {
      return;  // 如果問題為空，不做任何處理
    }

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
      
      console.log("API 回應:", data); 

      if (data && data.data && data.data.answer) {
        const newAnswer = data.data.answer;
        setAnswer(newAnswer);

        // 發送輸入訊息到後端的 socket，並儲存回傳的 messageId
        socket.emit('rag_message', {
          messageType: 'input',
          message: question,
          author: 'user',
          creator: 1
        });

        // 收到後端傳回的 messageId 並儲存
        socket.on('input_stored', (storedData) => {
          setMessageId(storedData.id);

          // 發送回應訊息到後端的 socket，帶上儲存的 messageId
          socket.emit('rag_message', {
            messageType: 'response',
            message: newAnswer,
            author: 'system',
            creator: 1,
            messageId: storedData.id  // 這裡將 messageId 傳回，便於更新 response_message
          });
        });

        // 更新當前會話的歷史紀錄
        setHistory((prevHistory) => [
          ...prevHistory,
          { question, answer: newAnswer },
        ]);

        setQuestion(''); // 清空輸入框
      } else if (data.retcode === 102) {
        setAnswer("會話不存在，請重新建立新會話。");
      } else {
        setAnswer("回應中沒有 'data' 或 'answer' 欄位。");
      }
    } catch (error) {
      console.error("獲取回答失敗：", error);
      setAnswer(`獲取回答失敗，請稍後再試。`);
    }
  };
  // 開啟新會話
  const handleNewConversation = () => {
    initializeConversation();
  };

  useEffect(() => {
    initializeConversation();
    socket.on('receive_rag_message', (data) => {
      console.log('收到的訊息:', data);
      setHistory((prevHistory) => [
        ...prevHistory,
        { question: data.input_message, answer: data.response_message },
      ]);
    });

    return () => {
      socket.off('receive_rag_message');
    };
  }, []);

  return (
    <div className="flex h-screen">
      <div className="w-1/3 bg-gray-200 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-right pr-2">歷史紀錄</h2>
        <button
          className="w-full bg-[#5BA491] text-white font-bold py-2 px-4 rounded-md hover:bg-[#5BA491]/90 mb-4 flex items-center justify-center"
          onClick={handleNewConversation}
        >
          <FaPlus className="mr-2" />
          新會話
        </button>
        <div className="space-y-4">
          {allConversations.length > 0 ? (
            allConversations.map((conv, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow"
                onClick={() => setConversationId(conv.id)}
              >
                <p><strong>第一個輸入:</strong> {conv.firstInput}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">尚無歷史紀錄</p>
          )}
        </div>
      </div>

      <div className="w-2/3 bg-white p-4 flex flex-col">
        <div className="flex-grow overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">聊天室</h2>
          {history.length > 0 ? (
            history.map((item, index) => (
              <div key={index} className="space-y-4">
                {item.question && (
                  <div className="flex justify-end">
                    <div className="p-4 bg-blue-200 rounded-lg w-3/4">
                      <p className="text-lg"><strong>你/妳：</strong> {item.question}</p>
                    </div>
                  </div>
                )}
                {item.answer && (
                  <div className="flex justify-start">
                    <div className="p-4 bg-green-200 rounded-lg w-3/4">
                      <p className="text-lg"><strong>小幫手：</strong> {item.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-lg">尚無聊天紀錄</p>
          )}
        </div>
        
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
