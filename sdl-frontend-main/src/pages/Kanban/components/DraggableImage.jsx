import React, { useState, useRef, useEffect } from "react";
import { socket } from "../../../utils/socket";

const API_URL = "/proxy/api/v1/chats/a159fe08e2d411efb3910242ac120004"; // 指向後端代理
const API_KEY = "ragflow-U0ZTc4MzdlZTJjYjExZWZiMzcyMDI0Mm"; // 保持不變，後端已使用此 Key


const DraggableImage = () => {
  const initialPosition = { x: window.innerWidth - 100, y: window.innerHeight / 2 };
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [imageSrc, setImageSrc] = useState("/說話.png");
  const [showMessage, setShowMessage] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const imgRef = useRef(null);
  const chatEndRef = useRef(null);
  const messageTimeoutRef = useRef(null);

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    // 設定開場白
    const openingMessage =
      "嗨！我是一位專門輔導高中生科學探究與實作的自然科學導師。我會用適合高中生的語言，保持專業的同時，幫助你探索自然科學的奧秘，並引導你選擇一個有興趣的科展主題，以及更深入了解你的研究問題。什麼可以幫到你的嗎？";
    setHistory([{ question: null, answer: openingMessage }]);

    // 每 10 秒顯示一次訊息
    messageTimeoutRef.current = setInterval(() => {
      if (!showChat) {
        setShowMessage(true);
      }
    }, 10000);

    return () => clearInterval(messageTimeoutRef.current);
  }, [, showChat]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prevPosition) => ({
        x: window.innerWidth - 100, // 保持貼齊右側
        y: prevPosition.y, // 保持原來的 Y 軸位置
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleImageClick = () => {
      setShowMessage(false);
      setShowChat(true);
  };

  // 建立新的 session
  const createSession = async () => {
    try {
      const sessionPayload = { name: "Test Session" };
      console.log("建立新 session，payload:", sessionPayload);
      
      const sessionResponse = await fetch(`${API_URL}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(sessionPayload),
      });

      if (!sessionResponse.ok) {
        throw new Error(`Session 請求失敗: ${sessionResponse.statusText}`);
      }
      
      const sessionData = await sessionResponse.json();
      const newSessionId = sessionData?.data?.id;

      if (!newSessionId) {
        throw new Error("無法取得 session_id");
      }

      setSessionId(newSessionId);
      console.log("成功建立 session ID:", newSessionId);
      return newSessionId;
    } catch (error) {
      console.error("建立 session 失敗:", error);
      throw error;
    }
  };

  // 發送問題並處理回應
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSubmitting(true); // 禁用按鈕，顯示送出中
    let currentSessionId = sessionId;

    try {
      // 如果還沒有 session ID，先建立一個
      if (!currentSessionId) {
        currentSessionId = await createSession();
      }

      // 發送對話請求
      const payload = {
        question,
        stream: false,
        session_id: currentSessionId,
      };

      console.log("使用 session ID:", currentSessionId, "發送問題:", question);

      const response = await fetch(`${API_URL}/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      const answer = data?.data?.answer || "無法取得回答";

      // 更新訊息記錄
      setHistory((prevHistory) => [...prevHistory, { question, answer }]);

      // 從 localStorage 獲取用戶信息
      const userId = localStorage.getItem('id') || '1';
      const userName = localStorage.getItem('username') || '未知用戶';
      const projectId = localStorage.getItem('projectId') || 'default';
      
      console.log('發送訊息的用戶資訊:', { userId, userName, projectId });

      // 發送輸入訊息到後端的 socket，包含用戶資訊
      socket.emit("rag_message", {
        messageType: "input",
        message: question,
        author: userName || "用戶",
        creator: userId,
        room: projectId,
        userName: userName,
        sessionId: currentSessionId
      });

      // 處理後端回傳的訊息 ID，並將回答存回 socket
      socket.once("input_stored", (storedData) => {
        socket.emit("rag_message", {
          messageType: "response",
          message: answer,
          author: "科學助手",
          creator: userId,
          messageId: storedData.id,
          room: projectId,
          userName: userName,
          sessionId: currentSessionId
        });
      });

      setQuestion(""); // 清空輸入框
    } catch (error) {
      console.error("處理訊息失敗:", error);
      // 如果是因為 session 問題，重置 sessionId 讓下次重新建立
      if (error.message.includes("session")) {
        setSessionId(null);
      }
    } finally {
      setIsSubmitting(false); // 啟用按鈕
    }
  };
  
  // 滾動到最新訊息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <>
      <img
        ref={imgRef} // 參考 (Ref)，用於操作 DOM 元素
        src={imageSrc} // 設定圖片來源
        alt="draggable" // 圖片的替代文字
        style={{
          position: "fixed", // 固定位置，不隨滾動改變
          left: `${position.x}px`, // X 軸位置
          top: `${position.y + 150}px`, // Y 軸位置
          cursor: "pointer", // 滑鼠樣式設為可點擊
          userSelect: "none", // 禁止選取
          zIndex: 1000, // 控制層級，確保圖片在其他元素之上
          width: "80px", // 設定圖片寬度
          height: "80px", // 設定圖片高度
          transition: "left 0.5s ease, top 0.5s ease", // 平滑移動動畫
        }}
        onClick={handleImageClick} // 點擊圖片時觸發的事件
      />

      {showMessage && ( // 如果 showMessage 為 true，則顯示提示訊息
        <div
          style={{
            position: "fixed", // 固定位置
            left: `${position.x - 250}px`, // 使訊息顯示在圖片左側
            top: `${position.y + 150}px`, // Y 軸位置與圖片對齊
            backgroundColor: "#5BA491", // 設定背景顏色
            color: "white", // 設定文字顏色
            padding: "10px", // 內距
            borderRadius: "10px", // 圓角
            fontSize: "14px", // 文字大小
            boxShadow: "0px 4px 6px rgba(0,0,0,0.1)", // 陰影效果
            cursor: "pointer", // 設定為可點擊
            zIndex: 1001, // 層級比圖片高，確保顯示在圖片上方
          }}
          onClick={handleImageClick} // 點擊時可能會關閉或觸發其他功能
        >
          有什麼問題需要我幫你解答的嗎？
        </div>
      )}

      {showChat && ( // 如果 showChat 為 true，則顯示對話框
        <div
          style={{
            position: "fixed", // 固定位置
            left: `${position.x - 350}px`, // 讓對話框顯示在圖片左側
            top: `${position.y - 200}px`, // 讓對話框與圖片對齊
            width: "350px", // 設定對話框寬度
            height: "500px", // 設定對話框高度
            backgroundColor: "white", // 設定背景顏色
            borderRadius: "10px", // 設定圓角
            boxShadow: "0px 4px 10px rgba(0,0,0,0.2)", // 設定陰影效果
            padding: "10px", // 內距
            display: "flex", // 使用 flex 排版
            flexDirection: "column", // 垂直排列內容
            zIndex: 1002, // 層級最高，確保對話框顯示在最上層
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "16px", color: "#5BA491" }}>科學助手</h3>
            <button onClick={() => setShowChat(false)} style={{ border: "none", background: "transparent", fontSize: "16px", cursor: "pointer", color: "#5BA491" }}>✖</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "5px", fontSize: "14px" }}>
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

          <form
            onSubmit={handleSubmit}
            className="p-4 bg-white border-t flex items-center"
            >
            <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="輸入您的問題..."
                className="flex-1 p-2 border border-gray-300 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 mr-4"
            />
            <button
                type="submit"
                className={`py-1 px-3 rounded-lg shadow transition-all text-white ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#5BA491] hover:bg-[#4a9076]"
                }`}
                disabled={isSubmitting}
            >
                {isSubmitting ? "送出中..." : "送出"}
            </button>
            </form>
        </div>
      )}
    </>
  );
};

export default DraggableImage;