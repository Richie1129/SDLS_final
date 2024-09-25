import React, { useState, useEffect, useRef } from 'react';  // 引入 useEffect
import { createChatroom, createMessage, getAllChatrooms, getUserChatrooms, getMessages, deleteChatroom } from '../../api/question';
import { useParams } from 'react-router-dom';
import { socket } from '../../utils/socket';
import Lottie from "lottie-react";
import Select_icon from "../../assets/AnimationQuestionSelect.json";
import { RxCross2 } from "react-icons/rx";
import Swal from 'sweetalert2';
import { TbSend } from "react-icons/tb";

export default function AskQuestion() {
    const [currentChat, setCurrentChat] = useState([]);
    const [chats, setChats] = useState([]);
    const { projectId } = useParams();
    const [message, setMessage] = useState('');
    const userRole = localStorage.getItem('role');  // 從本地存儲獲取使用者角色
    const [selectedChatId, setSelectedChatId] = useState(null); // 新增狀態來追蹤選擇的聊天室ID
    const [newTitle, setNewTitle] = useState('');  // 新提問標題的狀態
    const [AddindQuestion, setAddindQuestion] = useState(false);  // 新提問標題的狀態

    
    // 用於初始化和更新聊天列表的函數
    // const fetchChats = async () => {
    //     const data = await getAllChatrooms(projectId);
    //     setChats(data);
    // };

    const fetchChats = async () => {
        try {
            let data;
            if (userRole === 'teacher') {
                data = await getAllChatrooms(projectId);
            } else if (userRole === 'student') {
                data = await getUserChatrooms(projectId, localStorage.getItem("id"));
            }
            setChats(data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    // 裝載組件時抓取聊天室列表
    useEffect(() => {
        fetchChats();
    }, [projectId, userRole]);  // 當 projectId 變化時重新執行此函數

    const refreshMessages = async (chatId) => {
        console.log("chatId", chatId)
        const updatedMessages = await getMessages(chatId); // 獲取最新消息
        console.log("updatedMessages", updatedMessages)
        const updatedChat = chats.find(chat => chat.id === chatId);
        console.log("updatedChat", updatedChat)
        setCurrentChat({ ...updatedChat, messages: updatedMessages });
    };

    const toggleAddQuiestionInput = () => {
        setAddindQuestion(!AddindQuestion); // 切換輸入框的顯示狀態
    };


    const addNewChatroom = async () => {
        if (newTitle) {
            const newChat = {
                title: newTitle,
                userId: localStorage.getItem("id"),
                projectId
            };

            await createChatroom(newChat);
            await fetchChats();  // 重新獲取列表以更新 UI
            setNewTitle('');  // 清空輸入框
            toggleAddQuiestionInput();
        }
    };
    const fetchMessages = async (chat) => {
        const messages = await getMessages(chat.id); // 通過 API 獲取特定聊天室的消息
        setCurrentChat({ ...chat, messages }); // 更新當前聊天室的狀態，包括消息
        setSelectedChatId(chat.id); // 設置當前選擇的聊天室ID
    };


    useEffect(() => {
        if (currentChat) {
            socket.emit("join_QuestionRoom", currentChat.id);

            socket.on("receive_QuestionMessage", (data) => {
                console.log("Received message:", data);
                refreshMessages(currentChat.id);  // 可以直接將data加入當前聊天中，而不是重新請求所有消息
            });
        }

        return () => {
            socket.off("receive_QuestionMessage");
        };
    }, [currentChat, socket]);

    const sendMessage = async () => {
        // console.log(chat)
        if (message && currentChat) {
            const data = {
                message: message,
                author: localStorage.getItem("role"),
                questionId: currentChat.id
            };
            socket.emit("send_QuestionMessage", data);
            setCurrentChat(prev => {
                return { ...prev, messages: [...(prev.messages || []), data] };
            });
            setMessage('');

        }
    };


    const handleDeleteChatroom = async (questionId) => {
        // await deleteChatroom(questionId);
        // fetchChats();  // Refresh the list after deletion

        Swal.fire({
            title: '確定要刪除這個聊天室嗎？',
            text: "你將無法恢復此操作！",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#5BA491',
            cancelButtonColor: '#d33',
            confirmButtonText: '確定',
            cancelButtonText: '取消'
        }).then((result) => {
            if (result.isConfirmed) {
                // 如果用戶確認刪除
                deleteChatroom(questionId).then(() => {
                    fetchChats();  // 刷新聊天室列表
                    setCurrentChat([]);
                    Swal.fire(
                        '已刪除！',
                        '聊天室已被刪除。',
                        'success'
                    );
                }).catch((error) => {
                    // 處理錯誤情況
                    Swal.fire(
                        '錯誤',
                        '無法刪除聊天室：' + error.message,
                        'error'
                    );
                });
            }
        });
    };

    return (
        <div className="flex flex-col h-screen my-5 pl-20 pr-5 py-16 bg-gray-50">
            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/3 bg-gray-100 overflow-auto p-3">

                    <div className="shadow-md rounded-lg mb-4 p-4 flex justify-between items-center bg-white">
                        {AddindQuestion ? <>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => {
                                    setNewTitle(e.target.value);
                                    console.log(newTitle)
                                }
                                }
                                placeholder="輸入新提問標題"
                                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#5BA491]"
                            />
                            <div>
                                <button
                                    onClick={addNewChatroom}
                                    className="font-bold py-2 px-4 rounded bg-[#5BA491] text-white hover:bg-[#5BA491]/80 transition duration-300"
                                >
                                    新增
                                </button>
                                <button

                                    onClick={toggleAddQuiestionInput}
                                    className="flex-center p-2 py-1"
                                >
                                    <RxCross2 />
                                </button>
                            </div>

                        </> :
                            <>
                                <h1 className="text-xl font-bold" style={{ color: '#5BA491' }}>提問聊天室</h1>

                                <button
                                    onClick={toggleAddQuiestionInput}
                                    className="font-bold py-2 px-4 rounded bg-[#5BA491] text-white hover:bg-[#5BA491]/80 transition duration-300"
                                >
                                    新增提問
                                </button>
                            </>
                        }
                    </div>
                    {chats.map(chat => (
                        <div key={chat.id}
                            className={`p-3 mb-2 rounded shadow flex justify-between items-center cursor-pointer ${selectedChatId === chat.id ? "bg-[#5BA491]/80 text-white font-semibold" : "bg-white"} hover:bg-[#5BA491]/50 transition duration-300`}
                            onClick={() => fetchMessages(chat)}>
                            <span className="flex-1">{chat.title}</span>
                            {selectedChatId === chat.id && (
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteChatroom(chat.id) }} className="flex items-center justify-center text-red-500 hover:text-red-700">
                                    <RxCross2 size={24} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="w-2/3 flex flex-col bg-white shadow-lg rounded-lg m-3">
                    {currentChat.length === 0 ? (
                        <div className="flex flex-col items-center gap-12 justify-center h-full">
                            <Lottie className="w-96" animationData={Select_icon} />
                            <p className="text-xl font-bold">請選擇左側聊天室列表</p>
                        </div>

                    ) : (
                        <>
                            <div className="px-4 py-2 text-white text-lg font-semibold rounded-t-lg" style={{ backgroundColor: '#5BA491' }}>
                                {currentChat.title}
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                {currentChat?.messages?.map((m, index) => (
                                    <div key={index} className={`flex items-start ${m.author === 'teacher' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[80%] p-2 my-2 rounded shadow ${m.author === 'teacher' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                            {m.message} <br />
                                            <small className="text-xs text-gray-600">{m.author}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex p-2 border-t h-16">
                                <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                                    className="border p-2 mr-2 rounded w-full transition duration-300 focus:outline-none focus:ring ring-[#5BA491]/60"
                                    placeholder="輸入訊息..."
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                                <button onClick={sendMessage} style={{ color: 'white' }} className=" font-bold bg-[#5BA491] px-4 rounded hover:bg-[#5BA491]/80 transition duration-300">
                                    <TbSend size={20} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}