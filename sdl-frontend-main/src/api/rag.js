import axios from "axios";

const ragApi = axios.create({
    baseURL: "http://localhost:3000/rag",
    headers: {
        "Content-Type": "application/json"
    },
})

export const getRAGHistory = async (userId) => {
    const response = await ragApi.get(`/history/${userId}`);
    return response.data;
}