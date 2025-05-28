// frontend api for rag.js
import axios from "axios";

const ragApi = axios.create({
    baseURL: "http://localhost/api/rag_message",
    headers: {
        "Content-Type": "application/json"
    },
})

// 測試 API 連接
export const testConnection = async (userId) => {
    const response = await ragApi.get(`/test/${userId}`);
    return response.data;
}

// 取得使用者所有 RAG 訊息歷史
export const getRAGHistory = async (userId) => {
    const response = await ragApi.get(`/history/${userId}`);
    return response.data;
}

// 取得使用者所有 RAG 訊息歷史（別名，保持向後相容）
export const getRagMessageHistory = async (userId) => {
    const response = await ragApi.get(`/history/${userId}`);
    return response.data;
}

// 根據 userId 和 sessionId 取得特定會話的訊息歷史
export const getRagMessageBySession = async (userId, sessionId) => {
    const response = await ragApi.get(`/session/${userId}/${sessionId}`);
    return response.data;
}

// 根據 userId 和 sessionId 取得 RAGFlow session ID
export const getRagflowSessionId = async (userId, sessionId) => {
    const response = await ragApi.get(`/ragflow-session/${userId}/${sessionId}`);
    return response.data;
}

// 根據 userId 取得所有會話列表
export const getUserSessions = async (userId) => {
    const response = await ragApi.get(`/sessions/${userId}`);
    return response.data;
}