import React, { useState, useEffect, useRef } from 'react'
import { GrFormClose, GrSend } from "react-icons/gr";
import { useParams } from 'react-router-dom';
import { socket } from '../utils/socket';
import { TbSend } from "react-icons/tb";
import { useLocation } from 'react-router-dom';
import { getChatroomHistory } from '../api/chatroom';  // 引入API函数

export default function ChatRoom({ chatRoomOpen, setChatRoomOpen }) {
    const [currentMessage, setCurrentMessage] = useState("");
    const { projectId } = useParams();
    const [messageList, setMessageList] = useState([]);
    const bottomRef = useRef(null);
    const personImg = [
        '/public/person/man1.png', '/public/person/man2.png', '/public/person/man3.png',
        '/public/person/man4.png', '/public/person/man5.png', '/public/person/man6.png',
        '/public/person/woman1.png', '/public/person/woman2.png', '/public/person/woman3.png'
    ];


    function formatTime(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');  // 月份是从0开始的
        const year = date.getFullYear();
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours.toString().padStart(2, '0') : '12'; // 将0小时转换为12
        const dateString = `${year}-${month}-${day}`;
        const timeString = `${hours}:${minutes} ${ampm}`;

        // 假设你有一个方式来确定是否需要显示日期
        // 比如，你可以比较消息的日期和当前日期，如果不同，则显示日期
        const today = new Date();
        const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

        // return dateString === todayString ? timeString : `${dateString} ${timeString}`;
        return `${dateString} ${timeString}`;
    }
    const sendMessage = async () => {
        // 使用trim()方法确保去除了前后空格
        if (currentMessage.trim() !== "") {
            const messageData = {
                room: projectId,
                author: localStorage.getItem("username"),
                creator: localStorage.getItem("id"),
                message: currentMessage.trim(),  // 也可以在这里直接发送去除空格后的消息
                createdAt: formatTime(new Date())  // 使用格式化函数
            };
            socket.emit("send_message", messageData);
            setMessageList(prev => [...prev, messageData]);
            setCurrentMessage("");  // 清空输入框
        }
    }

    useEffect(() => {
        // 当聊天室打开且projectId有效时，加载历史消息
        if (chatRoomOpen && projectId) {
            const loadHistory = async () => {
                try {
                    const history = await getChatroomHistory(projectId);
                    const formattedHistory = history.map(message => ({
                        ...message,
                        createdAt: formatTime(new Date(message.createdAt)) // 使用UTC时间转换
                    }));
                    console.log(formattedHistory[0].createdAt)
                    setMessageList(formattedHistory);
                } catch (error) {
                    console.error('Failed to fetch chatroom history:', error);
                }
            };
            loadHistory();
        }
    }, [projectId, chatRoomOpen]);  // 依赖projectId和chatRoomOpen

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messageList]);

    useEffect(() => {
        function receive_message(data) {
            setMessageList(prev => [...prev, data])
            console.log(data);
        }

        if (chatRoomOpen === true) {
            socket.emit("join_room", projectId);
            console.log("join_room");
        }
        socket.on("receive_message", receive_message)
        return () => {
            socket.off('receive_message', receive_message);
        };
    }, [socket, chatRoomOpen, projectId]);

    return (
        <div className={`z-50 w-[350px] h-[460px] fixed left-0 bottom-0 border-2 p-0 rounded-lg shadow-xl bg-slate-100 transform transition-all duration-500 ${chatRoomOpen ? "translate-x-0 translate-y-0 visible" : "-translate-x-full translate-y-full invisible"}`}>
            <div className='h-[31px] w-full flex justify-between text-base font-semibold p-1 rounded-t-lg bg-slate-300 text-slate-600'>
                <span className='pl-2 '>小組討論區</span>
                <button onClick={() => { setChatRoomOpen(false) }} className='cursor-pointer rounded-lg hover:bg-gray-200 '>
                    <GrFormClose size={20} />
                </button>
            </div>
            <div className='h-[390px] w-full py-3 relative overflow-x-hidden overflow-y-scroll scrollbar-thin scrollbar-thumb-slate-400/70 scrollbar-track-slate-200 scrollbar-thumb-rounded-full scrollbar-track-rounded-full'>
                {/* {
                    messageList.map((messages, index) => {
                        const imgIndex = parseInt(messages.userId) % 9;
                        const currentImgIndex = parseInt(messages.creator) % 9;
                        const userImg = personImg[imgIndex];
                        const currentUserImg = personImg[currentImgIndex];
                        const isCurrentUser = messages.author === localStorage.getItem("username");

                        return (
                            <div key={index} className={`flex h-auto p-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                                <div className={`flex items-center ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                                    <img src={currentUserImg ? currentUserImg : userImg} className="w-8 h-8 rounded-full mx-2" />
                                    <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                                        <div className={`shadow-md w-fit max-w-[240px] rounded-lg text-white flex items-center break-all px-3 py-2 ${isCurrentUser ? "bg-[#5BA491]" : "bg-sky-700"}`}>
                                            {messages.message}
                                        </div>
                                        <div className='text-xs mt-1 text-gray-500'>
                                            {messages.createdAt} | {messages.author}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                        );
                    })
                } */}
                {messageList.reduce((acc, messages, index) => {
                    const currentDate = new Date(messages.createdAt);
                    const dateString = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;

                    const today = new Date();
                    const todayString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
                    // console.log("todayString", todayString)
                    // console.log("dateString", dateString)
                    const isNewDay = acc.lastDate !== dateString;
                    const imgIndex = parseInt(messages.userId) % 9;
                    const currentImgIndex = parseInt(messages.creator) % 9;
                    const userImg = personImg[imgIndex];
                    const currentUserImg = personImg[currentImgIndex];
                    const isCurrentUser = messages.author === localStorage.getItem("username");
                    if (isNewDay) {
                        acc.elements.push(
                            <div key={`date-${dateString}`} className="text-center font-semibold py-2 my-1 text-sm">
                                {dateString === todayString ? "-今天-" : `- ${dateString} -`}
                            </div>
                        );
                    }
                    acc.lastDate = dateString;
                    acc.elements.push(
                        <div key={index} className={`flex h-auto p-1 ${messages.author === localStorage.getItem("username") ? "justify-end" : "justify-start"}`}>
                            <div className={`flex items-center ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                                <img src={currentUserImg ? currentUserImg : userImg} className="w-8 h-8 rounded-full mx-2" />
                                <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                                    <div className={`shadow-md w-fit max-w-[240px] rounded-lg text-white flex items-center break-all px-3 py-2 ${isCurrentUser ? "bg-[#5BA491]" : "bg-sky-700"}`}>
                                        {messages.message}
                                    </div>
                                    <div className='text-xs mt-1 text-gray-500'>
                                        {messages.createdAt.split(' ')[1] + ' ' + messages.createdAt.split(' ')[2]} | {messages.author}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                    return acc;
                }, { elements: [], lastDate: "" }).elements}

                <div ref={bottomRef} />
            </div>
            <div className=' h-[35px] w-full flex justify-between text-base p-0 border-t-2 bg-slate-50'>
                <input
                    type="text"
                    value={currentMessage} // 确保绑定了currentMessage状态
                    className='w-10/12 outline-none p-1'
                    onChange={e => setCurrentMessage(e.target.value)}
                    onKeyDown={e => { e.key === "Enter" && sendMessage() }}
                />
                <button
                    className='mx-auto'
                    onClick={sendMessage}
                >
                    <TbSend size={20} />
                </button>
            </div>
        </div>
    )
}
