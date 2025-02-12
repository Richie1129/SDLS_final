import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus } from "react-icons/fi";
import { v4 as uuidv4 } from 'uuid';
import Carditem from './components/Carditem';
import TaskHint from './components/TaskHint';
import Loader from '../../components/Loader';
import { FaPlus } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import { StrictModeDroppable as Droppable } from '../../utils/StrictModeDroppable';
import SubStageComponent from '../../components/SubStageBar';
import Swal from 'sweetalert2';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getKanbanColumns, getKanbanTasks, addCardItem } from '../../api/kanban';
import { getSubStage } from '../../api/stage';
import { socket } from '../../utils/socket';
import DraggableImage from "./components/DraggableImage"; // 確保路徑正確

export default function Kanban() {
  const [kanbanData, setKanbanData] = useState([]);
  const [newCard, setNewCard] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedcolumn, setSelectedcolumn] = useState(0);
  const { projectId } = useParams();
  const [stageInfo, setStageInfo] = useState({ name: "", description: "" });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAddGroupInput, setShowAddGroupInput] = useState(false); // 新增狀態
  const [newGroupName, setNewGroupName] = useState('');
  const currentStage = localStorage.getItem("currentStage");
  const currentSubStage = localStorage.getItem("currentSubStage");


  const {
    isLoading: kanbanIsLoading,
    isError: kanbansIsError,
    error: KanbansError,
    data: KanbansData,
  } = useQuery(
    ['kanbanDatas', projectId],
    () => getKanbanColumns(projectId),
    {
      onSuccess: setKanbanData
    }
  );
  // 在Kanban组件中
  useEffect(() => {
    socket.on('refreshKanban', (data) => {
      console.log('Refreshing Kanban board for project:', data.projectId);
      // 使用react-query的invalidateQueries方法刷新数据
      queryClient.invalidateQueries(['kanbanDatas', data.projectId]);
    });

    return () => {
      // socket.off('refreshKanban');
    };
  }, [socket, queryClient]);

  const getSubStageQuery = useQuery("getSubStage", () => getSubStage({
    projectId: projectId,
    currentStage: localStorage.getItem("currentStage"),
    currentSubStage: localStorage.getItem("currentSubStage")
  }),
    {
      onSuccess: (data) => {
        setStageInfo(prev => ({
          ...prev,
          ...data,
          currentStage: localStorage.getItem("currentStage"),
          currentSubStage: localStorage.getItem("currentSubStage")
        }));
      },
      enabled: !!localStorage.getItem("currentStage")
    }
  );


  useEffect(() => {
    function KanbanUpdateEvent(data) {
      if (data) {
        console.log("KanbanUpdateEvent:",data);
        queryClient.invalidateQueries(['kanbanDatas', projectId]);
      }
    }
    function kanbanDragEvent(data) {
      if (data) {
        console.log(data);
        setKanbanData(data)
      }
    }
    socket.connect();
    socket.emit("join_project", projectId);

    socket.on("taskItems", KanbanUpdateEvent);
    socket.on("taskItem", KanbanUpdateEvent);
    socket.on("dragtaskItem", kanbanDragEvent);
    socket.on("columnOrderUpdated", kanbanDragEvent);
    socket.on("ColumnCreatedSuccess", KanbanUpdateEvent);
    socket.on("columnDeleted", KanbanUpdateEvent);
    return () => {
      socket.off('taskItems', KanbanUpdateEvent);
      socket.off('taskItem', KanbanUpdateEvent);
      socket.off("dragtaskItem", kanbanDragEvent);
      socket.off("columnOrderUpdated", kanbanDragEvent);
      socket.off('ColumnCreatedSuccess', KanbanUpdateEvent);
      socket.off('columnDeleted', KanbanUpdateEvent);

    };
  }, [socket, projectId]);

  useEffect(() => {
    if (!currentStage || !currentSubStage) {
      navigate(0);
    }
  }, [currentStage, currentSubStage, navigate])


  const onDragEnd = useCallback((result) => {
    const { destination, source, type } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    if (type === 'COLUMN') {
      const newKanbanData = Array.from(kanbanData);
      const [reorderedColumn] = newKanbanData.splice(source.index, 1);
      newKanbanData.splice(destination.index, 0, reorderedColumn);

      setKanbanData(newKanbanData);
      socket.emit('columnOrderChanged', {
        kanbanData: newKanbanData,
        kanbanId: projectId,
      });

    } else if (type === 'CARD') {
      socket.emit('cardItemDragged', {
        destination,
        source,
        kanbanData,
        projectId
      })

    }
  }, [kanbanData]);

  const handleChange = (e) => {
    setNewCard(e.target.value);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newCard.length === 0) {
      setShowForm(false);
    }
    else {
      const item = {
        title: newCard,
        content: "",
        labels: [],
        assignees: []
      }

      const username = localStorage.getItem("username"); // ✅ 取得 localStorage 裡的 username
      console.log("🟢 Sending taskItemCreated with user:", username);

      socket.emit("taskItemCreated", {
        selectedcolumn,
        item,
        kanbanData,
        projectId,
        user: { username } // ✅ 確保 `user` 被傳遞
      });
      setShowForm(false);
      setNewCard("");
    }

  }

  const toggleAddGroupInput = () => {
    setShowAddGroupInput(!showAddGroupInput); // 切換輸入框的顯示狀態
  };

  // 新增列表
  const handleAddGroup = () => {
    if (newGroupName.trim() !== '') {
      socket.emit("ColumnCreated", {
        projectId,
        newGroupName
      });
      socket.on("ColumnCreatedSuccess", async () => {
        // 使與看板資料相關的查詢失效，以觸發重新獲取
        try {
          const updatedKanbanData = await getKanbanColumns(projectId);
          console.log("updatedKanbanData:", updatedKanbanData)
          setKanbanData(updatedKanbanData); // 使用最新數據更新狀態
        } catch (error) {
          console.error("獲取看板列數據失敗：", error);
        }
        // 清空輸入框並隱藏新增群組的輸入框
        setNewGroupName('');
        setShowAddGroupInput(false);
      });

    }
  };
  const handleDeleteColumn = (columnData) => {
    Swal.fire({
      title: "刪除",
      text: "列表中的卡片將一併刪除，確定要刪除嗎?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#5BA491",
      cancelButtonColor: "#d33",
      confirmButtonText: "確定",
      cancelButtonText: "取消"
    }).then((result) => {
      if (result.isConfirmed) {
        console.log(columnData)
        socket.emit("ColumnDelete", {
          columnData,
          kanbanId: projectId
        });
        Swal.fire(
          '已刪除！',
          '看板列表已被刪除。',
          'success'
      );
      }
    });
  }

  return (
    <div style={{ display: 'inline-flex' }} className="layout__wrapper min-w-full h-full bg-white" >
      <DraggableImage/>
      <div className="card p-8 w-full px-20">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="header mb-4">
            <h1 className="text-2xl text-gray">Kanban</h1>
          </div>

          <Droppable droppableId="all-droppables" type='COLUMN' direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex space-x-4 overflow-x-auto h-[calc(100vh-12rem)] scrollbar-none overflow-y-hidden" // 添加 overflow-x-auto 以啟用水平滾動
                style={{ display: 'inline-flex', flexDirection: 'row', paddingBottom: '1rem' }} // 確保列是水平排列的，並且底部有足夠空間
              >
                {!showAddGroupInput && (
                  <button className="bg-[#5BA491] hover:bg-[#5BA491]/90 w-60 h-24 flex flex-row items-center rounded-lg border-none p-7" onClick={toggleAddGroupInput}>
                    <FaPlus className="text-white m-3" />
                    <b className="text-base text-white">
                      新增列表
                    </b>
                  </button>


                )}
                {showAddGroupInput && (
                  <div className="group-container">
                    <div className="flex flex-col store-container  w-60 h-24 bg-slate-100 px-4 py-3 rounded-lg mb-2">
                      <input
                        type="text"
                        placeholder="輸入列表標題..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="text-sm border border-gray-300 p-2 w-52 rounded-md mb-2"
                      />
                      <div className='flex justify-start items-center'>
                        <button
                          onClick={handleAddGroup}
                          className="bg-[#5BA491] hover:bg-[#5BA491]/80 p-2 text-sm text-white font-bold py-1 px-4 rounded transition ease-in-out duration-300"
                        >
                          新增列表
                        </button>
                        <button

                          onClick={toggleAddGroupInput}
                          className="flex-center p-2 py-1"
                        >
                          <RxCross2 />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {
                  kanbanIsLoading ? <Loader /> :
                    kanbansIsError ? <p className=' font-bold text-2xl'>{kanbansIsError.message}</p> :
                      kanbanData.map((column, columnIndex) => (
                        <Draggable draggableId={`column-${column.id}`}
                          index={columnIndex}
                          key={column.id}>
                          {(provided) => (
                            <div
                              {...provided.draggableProps}
                              ref={provided.innerRef}
                              className="group-container w-60 h-fit bg-slate-50 rounded-lg shadow-lg"
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="store-container p-3 rounded-lg cursor-move flex justify-between items-center"
                              >
                                <h3 style={{ color: "#5BA491" }} className="text-lg font-semibold">
                                  {column.name}
                                </h3>
                                <button
                                  onClick={() => handleDeleteColumn(column)}
                                  className="text-[#494b4a] hover:text-[#494b4a]/60"
                                  title="删除列"
                                >
                                  <RxCross2 size={20} />
                                </button>
                              </div>
                              {
                                <Droppable droppableId={columnIndex.toString()} type='CARD'>
                                  {(provided,snapshot) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}  >
                                      <div className={`flex flex-col px-4 pb-1 overflow-y-auto max-h-[calc(100vh-21rem)] roun scrollbar-thin ${snapshot.isDraggingOver ? 'bg-customgreen/10' : 'bg-slate-50'}`}>

                                        <div className="items-container">
                                        {Array.isArray(column.task) && column.task.length > 0 &&
                                          column.task
                                            .filter(item => item && item.id) // 過濾掉 null 或 undefined
                                            .map((item, index) => (
                                              <Carditem
                                                key={item.id}
                                                index={index}
                                                data={item}
                                                columnIndex={column.id}
                                              />
                                            ))
                                        }
                                          {provided.placeholder}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Droppable>

                              }
                              {
                                showForm && selectedcolumn === columnIndex ? (
                                  <div className='flex flex-col store-container rounded-lg mb-2 px-4 pt-1'>
                                    <input
                                      className='text-sm border border-gray-300 p-2 w-52 rounded-md mb-2'
                                      rows={3}
                                      placeholder="輸入卡片標題..."
                                      onChange={handleChange}
                                    />
                                    <div className='flex justify-start items-center'>
                                      <button
                                        style={{ backgroundColor: "#5BA491" }}
                                        className='p-2 text-sm text-white font-bold py-1 px-4 rounded transition ease-in-out duration-300'
                                        onClick={handleSubmit}
                                      >
                                        新增
                                      </button>
                                      <button
                                        className="flex-center p-2 py-1"
                                        onClick={() => { setShowForm(false); }}
                                      >
                                        <RxCross2 />
                                      </button>
                                    </div>
                                  </div>

                                ) : (
                                  <div className="flex justify-start px-4 pt-1">
                                    <button
                                      onClick={() => { setSelectedcolumn(columnIndex); setShowForm(true); }}
                                      className="bg-[#5BA491] hover:bg-[#5BA491]/80 text-sm p-2 mb-2 text-white font-bold py-1 px-4 rounded transition ease-in-out duration-300"
                                    >
                                      新增卡片
                                    </button>
                                  </div>

                                )
                              }

                            </div>
                          )}
                        </Draggable>
                      ))}
                {provided.placeholder}
              </div>
            )
            }
          </Droppable>
        </DragDropContext >
      </div>

    </div >
  )
}

