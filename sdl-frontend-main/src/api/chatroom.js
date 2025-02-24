import axios from "axios";

const chatroomApi = axios.create({
    baseURL: "http://140.115.126.45/api/chatroom",
    headers: {
        "Content-Type": "application/json"
    },
})

export const getChatroomHistory = async (projectId) => {
    const response = await chatroomApi.get(`/history/${projectId}`);
    return response.data;
}