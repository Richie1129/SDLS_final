require('dotenv').config()
const express = require('express');
const path = require('path');
const sequelize = require('./util/database');
const bodyParser = require('body-parser');
const cors = require("cors");
const { Op } = require('sequelize');
const Sequelize = require('sequelize');
// const moment = require('moment-timezone');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const { upload } = require('./middlewares/uploadMiddleware'); // 引用上傳中介軟體
const { Socket } = require('dgram');
const server = http.createServer(app);
const Task = require('./models/task');
const Column = require('./models/column');
const Kanban = require('./models/kanban');
const Node = require('./models/node');
const Node_relation = require('./models/node_relation');
const Chatroom_message = require('./models/chatroom_message');
const Rag_message = require('./models/rag_message')
const Project = require('./models/project')
const QuestionMessage = require('./models/question_message')
const Announcement = require('./models/announcement');
const axios = require('axios');
const https = require('https');
const { rm } = require('fs');

const agent = new https.Agent({
    rejectUnauthorized: false, // 忽略證書驗證
});

const API_KEY = "ragflow-U0ZTc4MzdlZTJjYjExZWZiMzcyMDI0Mm"; // 從前端程式碼中提取的 API Key


const io = new Server(server, {
    cors: {
        origin: ['http://localhost'],
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        credentials: true
    },
}); 

app.use(cors({
    origin: ['http://localhost'],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.options('*', cors()); // 處理所有路由的預檢請求
app.set('io', io); // 確保在 socket.io 初始化後掛載
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// 👇 確保 Express 解析 JSON
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
// 靜態資源服務
app.use('/api/daily_file', express.static(path.join(__dirname, 'daily_file')));
console.log('Static file directory:', path.join(__dirname, 'daily_file'));


// 🔹 確保事件監聽器不會重複綁定
function ensureListener(socket, event, handler) {
    if (socket.listenerCount(event) === 0) {
        socket.on(event, handler);
    }
}

io.on("connection", (socket) => {
    console.log(`${socket.id} a user connected`);

    // 加入房間類型的事件，使用 `once()` 確保只執行一次
    socket.once("join_room", (data) => {
        socket.join(data);
        console.log(`${socket.id} joined room ${data}`);
    });

    socket.once("join_QuestionRoom", (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined QuestionRoom ${roomId}`);
    });

    socket.once("join_project", (data) => {
        socket.join(data);
        console.log(`${socket.id} joined project ${data}`);
    });

    //send message
    ensureListener(socket, "send_message", async (data) => {
        console.log(data);
        try {
            // 存儲消息到數據庫
            await Chatroom_message.create({
                message: data.message,
                author: data.author,
                userId: data.creator,
                projectId: data.room
            });
        } catch (error) {
            console.error("保存消息時出錯：", error);
        }
        socket.to(data.room).emit("receive_message", data);
    });
    // send QuestionMessage
    ensureListener(socket, "send_QuestionMessage", async (data) => {
        console.log("Question Message Received:", data);
        try {
            // 存儲消息到數據庫
            await QuestionMessage.create({
                message: data.message,
                author: data.author,
                questionId: data.questionId
            });
            // 發送消息到同一聊天室的其他用户

        } catch (error) {
            console.error("保存提问消息時出錯：", error);
        }
        socket.to(data.questionId).emit("receive_QuestionMessage", data);
    });
    // send rag_message
    ensureListener(socket, "rag_message", async (data) => {
        console.log("接收到的資料：", data); // 打印接收到的資料
        try {
            // 確保 creator 是有效的數字
            const userId = parseInt(data.creator) || 1;
            console.log("使用的 userId:", userId); // 記錄實際使用的 userId
            
            // 獲取用戶名稱，如果沒有則使用預設值
            const userName = data.userName || data.author || "未知用戶";
            console.log("使用的用戶名稱:", userName); // 記錄實際使用的用戶名稱
            
            // 獲取 sessionId，如果沒有則設為 null
            const sessionId = data.sessionId || null;
            console.log("使用的 sessionId:", sessionId); // 記錄實際使用的 sessionId
            
            // 獲取 RAGFlow session ID（從 RAGFlow 回應中提取）
            const ragflowSessionId = data.ragflowSessionId || null;
            console.log("使用的 RAGFlow sessionId:", ragflowSessionId);
            
            if (data.messageType === 'input') {
                // 當接收到 input_message 時，創建新的資料庫紀錄，並儲存其 ID
                const newMessage = await Rag_message.create({
                    input_message: data.message,  // 儲存 input_message
                    author: data.author,
                    userId: userId,  // 使用確認過的 userId
                    userName: userName,  // 儲存用戶名稱
                    sessionId: sessionId  // 儲存 sessionId
                });
    
                // 將訊息的 ID 返回前端，便於後續 response_message 更新
                socket.emit('input_stored', { id: newMessage.id });
            } else if (data.messageType === 'response') {
                // 當接收到 response_message 時，根據前端返回的 messageId 進行更新
                await Rag_message.update(
                    {
                        response_message: data.message,  // 更新 response_message
                        author: data.author || 'system',  // 如果未提供 author，設為 'system'
                        userName: userName,  // 更新用戶名稱
                        sessionId: sessionId,  // 更新 sessionId
                        ragflow_session_id: ragflowSessionId  // 更新 RAGFlow session ID
                    },
                    {
                        where: {
                            id: data.messageId,  // 根據 messageId 來匹配對應的 input_message
                            userId: userId  // 使用確認過的 userId
                        }
                    }
                );
            }
        } catch (error) {
            console.error("保存消息時出錯：", error);
        }
    
        // 將訊息發送到對應的房間
        if (data.room) {
            socket.to(data.room).emit("receive_rag_message", data);
        }
    });
    //create card
    socket.on("taskItemCreated", async (data) => {
        try {
            const { selectedcolumn, item, kanbanData, projectId, user } = data;
            const extractedOwner = user?.username || "未知";
            const columnId = kanbanData[selectedcolumn]?.id;

            const creatTask = await Task.create({
                title: item.title,
                content: item.content,
                labels: item.labels || [],
                assignees: item.assignees || [],
                owner: extractedOwner,  // 確保 owner 存在
                columnId: columnId,
            });
            console.log("creatTask", creatTask)
            const addIntoTaskArray = await Column.findByPk(creatTask.columnId)

            addIntoTaskArray.task = [...addIntoTaskArray.task, creatTask.id];

            await addIntoTaskArray.save()
                .then(() => console.log("success"))

            await Project.update({
                id: projectId
            }, {
                where: {
                    id: projectId
                }
            });

            io.to(projectId).emit("taskItems", addIntoTaskArray);
        } catch (error) {
            console.error("❌ 創建任務錯誤:", error);
        }
    });
    
    //update card
    ensureListener(socket, "cardUpdated", async (data) => {
        const { cardData, index, columnIndex, kanbanData, projectId } = data;
        try {
            const updateTask = await Task.update({
                ...cardData,
                files: cardData.files || [], // 確保 files 欄位存在
                images: cardData.images || [] // 確保 images 欄位存在
            }, {
                where: {
                    id: cardData.id
                }
            });
            await Project.update({
                id: projectId
            }, {
                where: {
                    id: projectId
                }
            });
            io.to(projectId).emit("taskItem", updateTask);
        } catch (error) {
            console.error("更新卡片失敗:", error);
        }
    });
    //Delete card
    ensureListener(socket, "cardDelete", async (data) => {
        const { cardData, index, columnIndex, kanbanData, projectId } = data;

        // Step 1: Retrieve the column and update it
        try {
            const column = await Column.findOne({
                where: {
                    id: columnIndex
                }
            });

            if (column) {
                // Filter out the task ID from the tasks array

                const updatedTasks = column.task.filter(taskId => taskId !== cardData.id);

                // Update the column with the new tasks array
                await column.update({ task: updatedTasks });

                // Step 2: Destroy the task in the Task table after updating the column
                const updateTask = await Task.destroy({
                    where: {
                        id: cardData.id
                    }
                });
                await Project.update({
                    id: projectId
                }, {
                    where: {
                        id: projectId
                    }
                });
                // Emit the updated task information to all clients
                // io.sockets.emit("taskItem", updateTask);
                io.to(projectId).emit("taskItem", updateTask);

            } else {
                console.error('Column not found or column tasks undefined');
                // Optionally emit an error or handle it as necessary
            }
        } catch (error) {
            console.error('Error handling card delete:', error);
            // Handle errors and possibly emit error information to clients
        }
    });
    //drag card
    ensureListener(socket, "cardItemDragged", async (data) => {
        const { destination, source, kanbanData, projectId } = data;
        const dragItem = {
            ...kanbanData[source.droppableId].task[source.index],
        };
        kanbanData[source.droppableId].task.splice(source.index, 1);
        kanbanData[destination.droppableId].task.splice(
            destination.index,
            0,
            dragItem
        );
        // io.sockets.emit("dragtaskItem", kanbanData);
        io.to(projectId).emit("dragtaskItem", kanbanData);

        const sourceColumn = kanbanData[source.droppableId].task.map(item => item.id);
        const destinationColumn = kanbanData[destination.droppableId].task.map(item => item.id);
        await Project.update({
            id: projectId
        }, {
            where: {
                id: projectId
            }
        });
        await Column.update({ task: sourceColumn }, {
            where: {
                id: kanbanData[source.droppableId].id
            }
        });
        await Column.update({ task: destinationColumn }, {
            where: {
                id: kanbanData[destination.droppableId].id
            }
        });
        await Task.update({ columnId: kanbanData[destination.droppableId].id }, {
            where: {
                id: dragItem.id
            }
        });
    });
    //create column
    ensureListener(socket, "ColumnCreated", async (data) => {
        try {
            const { projectId, newGroupName } = data;
            const createColumn = await Column.create({
                name: newGroupName,
                task: [],
                kanbanId: projectId
            })

            const addIntoColumnArray = await Kanban.findByPk(projectId)
            addIntoColumnArray.column = [...addIntoColumnArray.column, createColumn.id];
            await addIntoColumnArray.save()
                .then(() => console.log("success"))
            // io.sockets.emit("ColumnCreatedSuccess", addIntoColumnArray);
            await Project.update({
                id: projectId
            }, {
                where: {
                    id: projectId
                }
            });
            io.to(projectId).emit("ColumnCreatedSuccess", addIntoColumnArray);

        } catch (error) {
            console.error("處理 ColumnCreated 時出錯：", error);
        }
    })
    //drag column
    ensureListener(socket, "columnOrderChanged", async (data) => {
        const { kanbanData, kanbanId } = data;

        // 發送更新事件以及打印日誌
        // io.sockets.emit("columnOrderUpdated", kanbanData);
        io.to(kanbanId).emit("columnOrderUpdated", kanbanData);

        // console.log("kanbanData", kanbanData);
        // console.log("kanbanId", kanbanId);

        // 提取每個列的id到一个數组中
        const columnIds = kanbanData.map(column => column.id);
        // console.log("Column IDs:", columnIds);

        // 更新Kanban表中的columns字段
        try {
            await Kanban.update({ column: columnIds }, {
                where: {
                    id: kanbanId
                }
            });
            await Project.update({
                id: kanbanId
            }, {
                where: {
                    id: kanbanId
                }
            });
            console.log("Columns updated successfully in Kanban table.");
        } catch (error) {
            console.error("Error updating columns in Kanban table:", error);
        }
    });
    //Delete column
    ensureListener(socket, "ColumnDelete", async (data) => {
        const { columnData, kanbanId } = data;
        // console.log("columnData:", columnData);
        // console.log("kanbanId:", kanbanId);

        try {
            // Step 1: Update the Kanban table by removing the column ID from the columns array
            const kanban = await Kanban.findOne({
                where: {
                    id: kanbanId
                }
            });

            if (kanban) {
                const updatedColumns = kanban.column.filter(columnId => columnId !== columnData.id);
                await kanban.update({ column: updatedColumns });

                // Step 2: Delete all tasks associated with the column
                try {
                    // 首先從 columnData.task 中提取所有任務的 ID
                    const taskIds = columnData.task.map(task => task.id);

                    // 然后使用這些 ID 来删除 Task 表中的相關紀錄
                    const deleteTasks = await Task.destroy({
                        where: {
                            id: {
                                [Op.in]: taskIds // 使用 Op.in 来指定一组 ID
                            }
                        }
                    });

                    console.log("已成功删除任務，任務ID:", taskIds);
                } catch (error) {
                    console.error("删除任務時發生錯誤:", error);
                }

                // Step 3: Delete the column itself
                const deleteColumn = await Column.destroy({
                    where: {
                        id: columnData.id
                    }
                });
                await Project.update({
                    id: kanbanId
                }, {
                    where: {
                        id: kanbanId
                    }
                });
                // Emit the updated kanban and column info to all clients
                // io.sockets.emit("columnDeleted", { kanbanId, updatedColumns, deletedColumnId: columnData.id });
                io.to(kanbanId).emit("columnDeleted", { kanbanId, updatedColumns, deletedColumnId: columnData.id });

                console.log("Column and its tasks deleted successfully.");
            } else {
                console.error("Kanban not found with ID:", kanbanId);
                // Optionally emit an error or handle it as necessary
            }
        } catch (error) {
            console.error("Error handling column delete:", error);
            // Handle errors and possibly emit error information to clients
        }
    });
    //Create Submit
    ensureListener(socket, 'taskSubmitted', (data) => {
        console.log('Task submitted:', data);
        // 將事件廣播到所有連接的客戶端，除了發送消息的客戶端
        // io.sockets.emit("taskItems", addIntoTaskArray);

        socket.broadcast.emit('refreshKanban', data);
    });
    //create nodes
    ensureListener(socket, "nodeCreate", async (data) => {
        const { title, content, ideaWallId, owner, from_id, projectId, colorindex } = data;
        const createdNode = await Node.create({
            title: title,
            content: content,
            ideaWallId: ideaWallId,
            owner: owner,
            colorindex: colorindex
        });
        if (from_id) {
            const nodeRelation = await Node_relation.create({
                from_id: from_id,
                to_id: createdNode.id,
                ideaWallId: ideaWallId
            })
        }
        await Project.update({
            id: projectId
        }, {
            where: {
                id: projectId
            }
        });
        // io.sockets.emit("nodeUpdated", createdNode);
        io.to(projectId).emit("nodeUpdated", createdNode);

    })
    //Update nodes
    ensureListener(socket, "nodeUpdate", async (data) => {
        const { title, content, id, projectId } = data;
        const createdNode = await Node.update(
            {
                title: title,
                content: content
            },
            {
                where: {
                    id: id
                }
            }
        );
        await Project.update({
            id: projectId
        }, {
            where: {
                id: projectId
            }
        });
        // io.sockets.emit("nodeUpdated", createdNode);
        io.to(projectId).emit("nodeUpdated", createdNode);

    })
    //Delete nodes
    ensureListener(socket, "nodeDelete", async (data) => {
        const { id, projectId } = data;
        const deleteNode = await Node.destroy(
            {
                where: {
                    id: id
                }
            }
        );
        await Project.update({
            id: projectId
        }, {
            where: {
                id: projectId
            }
        });
        io.sockets.emit("nodeUpdated", deleteNode);
        // io.to(projectId).emit("nodeUpdated", deleteNode);


    })
    // 廣播公告
    ensureListener(socket, "emitAnnouncement", async (data) => {
        console.log("收到公告廣播請求:", data);
        const { title, content, author, projectId } = data;

        try {
            // 儲存公告至資料庫
            const newAnnouncement = await Announcement.create({
                title,
                content,
                author,
                projectId: projectId === 'all' ? null : projectId,
            });

            console.log("公告已成功儲存並廣播:", newAnnouncement);

            // 廣播到所有用戶或特定房間
            if (projectId === 'all' || !projectId) {
                io.emit("receiveAnnouncement", newAnnouncement);
            } else {
                io.to(projectId.toString()).emit("receiveAnnouncement", newAnnouncement);
            }
        } catch (error) {
            console.error("公告儲存或廣播失敗:", error.message);
        }
    });

    socket.on("disconnect", () => {
        console.log(`${socket.id} a user disconnected`);
        socket.removeAllListeners();  // 這行確保所有監聽器被移除，防止記憶體洩漏
    });    
});

// 新增檔案上傳路由
app.post('/api/upload', upload.array('files', 10), (req, res) => {
    console.log('Uploaded files:', req.files); // 打印文件信息
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const files = req.files.map((file) => ({
            url: `/daily_file/${file.filename}`,
            originalName: file.originalname,
            mimeType: file.mimetype,
        }));

        res.status(200).json({ files });
    } catch (error) {
        console.error('檔案上傳失敗:', error);
        res.status(500).json({ message: '檔案上傳失敗', error: error.message });
    }
});

app.post('/proxy/api/v1/chats/:chatId/sessions', async (req, res) => {
    try {
        const { chatId } = req.params;
        console.log("req.body", req.body)
        console.log("chatId", chatId)
        console.log("testingCHaTTTTTTTTTTT")
        const response = await axios.post(
            `https://140.115.126.193/api/v1/chats/${chatId}/sessions`,
            req.body,
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
                httpsAgent: agent, // 忽略證書驗證
            }
        );
        console.log("response", response)
        console.log("-----------------------------")
        res.json(response.data);
    } catch (error) {
        console.error("代理請求失敗 (sessions):", error.message);
        res.status(500).json({ message: "代理請求失敗", error: error.message });
    }
});

app.post('/proxy/api/v1/chats/:chatId/completions', async (req, res) => {
    try {
        const { chatId } = req.params;
        const response = await axios.post(
            `https://140.115.126.193/api/v1/chats/${chatId}/completions`,
            req.body,
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
                httpsAgent: agent, // 忽略證書驗證
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error("代理請求失敗 (completions):", error.message);
        res.status(500).json({ message: "代理請求失敗", error: error.message });
    }
});

// 新增：DELETE 會話的代理路由
app.delete('/proxy/api/v1/chats/:chatId/sessions', async (req, res) => {
    try {
        const { chatId } = req.params;
        console.log("刪除會話代理請求 - chatId:", chatId);
        console.log("req.body:", req.body);
        
        const response = await axios.delete(
            `https://140.115.126.193/api/v1/chats/${chatId}/sessions`,
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
                data: req.body, // DELETE 請求的 body 在 axios 中使用 data 參數
                httpsAgent: agent, // 忽略證書驗證
            }
        );
        console.log("RAGFlow 刪除會話回應:", response.data);
        res.json(response.data);
    } catch (error) {
        console.error("代理請求失敗 (delete sessions):", error.message);
        console.error("錯誤詳情:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            message: "代理請求失敗", 
            error: error.message,
            details: error.response?.data || null
        });
    }
});

//api routes
app.use('/api/users', require('./routes/user'));
app.use('/api/projects', require('./routes/project'))
app.use('/api/kanbans', require('./routes/kanban'))
app.use('/api/ideaWall', require('./routes/ideaWall'))
app.use('/api/node', require('./routes/node'))
app.use('/api/daily', require('./routes/daily'))
app.use('/api/submit', require('./routes/submit'))
app.use('/api/stage', require('./routes/stage'))
app.use('/api/chatroom', require('./routes/chatroom'))
app.use('/api/question', require('./routes/question'))
app.use('/api/announcements', require('./routes/announcement'));
app.use('/api/rag_message', require('./routes/rag_message'));

//error handling
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({ message: message });
});

// sync database
sequelize.sync({ alter: true })  // {force:true} {alter:true}
    .then(result => {
        console.log("Database connected");
        console.log("Database structure synced");
    })
    .catch(err => console.log(err));

server.listen(3000);
