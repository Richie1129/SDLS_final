import React, { useState, useEffect, useRef } from "react";
import { socket } from "../../utils/socket";
import { getRagMessageHistory } from "../../api/rag";

const API_URL = "https://140.115.126.193/api/v1/chats/bbce13e4caa311efa78e0242ac120005";
const API_KEY = "ragflow-UzNzBjMTEyNzgyMjExZWZhM2MzMDI0Mm";

const Rag = () => {
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // 控制按鈕狀態
  const chatEndRef = useRef(null);

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };

  // 初始化開場白
  useEffect(() => {
    const openingMessage =
      "嗨！我是一位專門輔導高中生科學探究與實作的自然科學導師。我會用適合高中生的語言，保持專業的同時，幫助你探索自然科學的奧秘，並引導你選擇一個有興趣的科展主題，以及更深入了解你的研究問題。什麼可以幫到你的嗎？";
    setHistory([{ question: null, answer: openingMessage }]);
  }, []);

  // 發送問題並處理回應
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSubmitting(true); // 禁用按鈕，顯示送出中
    let sessionId;

    try {
      // Step 1: 獲取 session_id
      const sessionPayload = { name: "Test Session" };
      const sessionResponse = await fetch(`${API_URL}/sessions`, {
        method: "POST",
        headers,
        body: JSON.stringify(sessionPayload),
      });
      const sessionData = await sessionResponse.json();
      sessionId = sessionData?.data?.id;

      if (!sessionId) {
        console.error("無法取得 session_id");
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error("建立 session 失敗:", error);
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 2: 發送對話請求
      const payload = {
        question,
        stream: false,
        session_id: sessionId,
      };

      const response = await fetch(`${API_URL}/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      const answer = data?.data?.answer || "無法取得回答";

      // 更新訊息記錄
      setHistory((prevHistory) => [...prevHistory, { question, answer }]);

      // 發送輸入訊息到後端的 socket
      socket.emit("rag_message", {
        messageType: "input",
        message: question,
        author: "user",
        creator: 1,
      });

      // 處理後端回傳的訊息 ID，並將回答存回 socket
      socket.once("input_stored", (storedData) => {
        socket.emit("rag_message", {
          messageType: "response",
          message: answer,
          author: "system",
          creator: 1,
          messageId: storedData.id,
        });
      });

      setQuestion(""); // 清空輸入框
    } catch (error) {
      console.error("獲取回答失敗:", error);
    } finally {
      setIsSubmitting(false); // 啟用按鈕
    }
  };

  // 滾動到最新訊息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // useEffect(() => {
  //   // 測試 getRagMessageHistory 是否正常運作
  //   const fetchHistory = async () => {
  //     try {
  //       const response = await getRagMessageHistory(); // 呼叫 API 函式
  //       console.log("取得的歷史紀錄：", response); // 打印結果以確認
  //       setHistory(response); // 將取得的歷史紀錄設定到狀態中
  //     } catch (error) {
  //       console.error("無法取得歷史紀錄：", error); // 錯誤處理
  //     }
  //   };
  
  //   fetchHistory(); // 執行函式
  // }, []);
  
  return (
    <div className="flex h-screen">
      {/* 左側歷史紀錄 */}
      <aside className="w-1/3 bg-gray-100 p-64 border-r">
        {/* <h2 className="text-2xl font-bold mb-4 text-gray-700" >歷史紀錄</h2>
        <div className="space-y-4">
          {history.map((item, index) => (
            <div
              key={index}
              className="p-4 bg-white shadow rounded-lg hover:bg-gray-200 cursor-pointer"
            >
              {item.question && (
                <p className="text-gray-600 truncate">
                  <strong>問題:</strong> {item.question}
                </p>
              )}
              <p className="text-gray-600 truncate">
                <strong>回答:</strong> {item.answer}
              </p>
            </div>
          ))}
        </div> */}
      </aside>

      {/* 右側聊天室 */}
      <main className="w-2/3 flex flex-col">
        <div className="flex-grow p-6" style={{ backgroundColor: "#F0F0F0" }}>
        <h2 className="text-2xl font-bold text-gray-700" style={{ marginTop: "80px", marginBottom: "20px" }}>聊天室</h2>
          {history.map((item, index) => (
            <div key={index} className="space-y-4">
              {item.question && (
                <div className="flex justify-end">
                  <div
                    className="p-3 rounded-lg shadow max-w-lg"
                    style={{ backgroundColor: "#5BA491", color: "white" }}
                  >
                    <p>{item.question}</p>
                  </div>
                </div>
              )}
              {item.answer && (
                <div className="flex justify-start">
                  <div
                    className="p-3 rounded-lg shadow max-w-lg"
                    style={{ backgroundColor: "#F0F0F0", color: "#333" }}
                  >
                    <p>{item.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>

        {/* 輸入框 */}
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-white border-t flex items-center"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="輸入您的問題..."
            className="flex-1 p-3 border border-gray-300 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 mr-4"
          />
          <button
            type="submit"
            className={`py-2 px-6 rounded-lg shadow transition-all text-white ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#5BA491] hover:bg-[#4a9076]"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "送出中..." : "送出"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Rag;
