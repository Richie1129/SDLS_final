import React, { useState, useEffect } from 'react';
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import { StrictModeDroppable as Droppable } from '../../utils/StrictModeDroppable';
import { FaPlus } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { getKanbanColumns } from '../../api/kanban';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { socket } from '../../utils/socket';

//columnsData
const DATA = [
  {
    id: "0e2f0db1-5457-46b0-949e-8032d2f9997a",
    name: "待辦事項",
    items: [
      { id: "26fd50b3-3841-496e-8b32-73636f6f4197", name: "確定研究問題" },
      { id: "b0ee9d50-d0a6-46f8-96e3-7f3f0f9a2525", name: "確定研究目的" },
    ],
    tint: 1,
  },
  {
    id: "487f68b4-1746-438c-920e-d67b7df46247",
    name: "進行中",
    items: [
      { id: "95ee6a5d-f927-4579-8c15-2b4eb86210ae", name: "提出研究問題" },
      { id: "5bee94eb-6bde-4411-b438-1c37fa6af364", name: "提出研究目的" },
    ],
    tint: 2,
  },
  {
    id: "25daffdc-aae0-4d73-bd31-43f73101e7c0",
    name: "完成",
    items: [
      { id: "960cbbcf-89a0-4d79-aa8e-56abbc15eacc", name: "確定研究主體" },
      { id: "d3edf796-6449-4931-a777-ff66965a025b", name: "提出研究主題" },
    ],
    tint: 3,
  },
];

export default function Kanban() {
  const [kanbanData, setKanbanData] = useState([]);
  const { projectId } = useParams();
  const [newCard, setNewCard] = useState("");

  const {
    isLoading: kanbanIsLoading,
    isError: kanbansIsError,
    error: KanbansError,
    data: KanbansData,
  } = useQuery(
    ['kanbanDatas', projectId],
    () => getKanbanColumns(projectId),
    {
      // onSuccess: setKanbanData
      onSuccess: (data) => {
        const formattedData = data.map((col) => ({
          ...col,
          id: col.id.toString(), // 確保 id 是字符串格式，因為 draggableId 需要字符串
          items: col.task, // 將 task 轉換為 items
          tint: parseInt(col.id, 10), // 假設 tint 根據 id 生成，這是一個示例，根據實際需要調整
        }));
        setKanbanData(formattedData);
      }
    }
  );


  const [stores, setStores] = useState(kanbanData);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeInputStoreId, setActiveInputStoreId] = useState(null); // 新增
  const [showAddGroupInput, setShowAddGroupInput] = useState(false); // 新增狀態

  useEffect(() => {
    setStores(kanbanData); // 當 kanbanData 更新時，同步更新 stores
  }, [kanbanData]); // 依賴列表中包括 kanbanData，這表示只有 kanbanData 變化時才執行這個 useEffect


  const handleDragAndDrop = (results) => {
    console.log(KanbansData);
    const { source, destination, type } = results;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    if (type === "group") {
      const reorderedStores = [...stores];

      const storeSourceIndex = source.index;
      const storeDestinatonIndex = destination.index;

      const [removedStore] = reorderedStores.splice(storeSourceIndex, 1);
      reorderedStores.splice(storeDestinatonIndex, 0, removedStore);

      return setStores(reorderedStores);
    }
    const itemSourceIndex = source.index;
    const itemDestinationIndex = destination.index;

    const storeSourceIndex = stores.findIndex(
      (store) => store.id === source.droppableId
    );
    const storeDestinationIndex = stores.findIndex(
      (store) => store.id === destination.droppableId
    );

    const newSourceItems = [...stores[storeSourceIndex].items];
    const newDestinationItems =
      source.droppableId !== destination.droppableId
        ? [...stores[storeDestinationIndex].items]
        : newSourceItems;

    const [deletedItem] = newSourceItems.splice(itemSourceIndex, 1);
    newDestinationItems.splice(itemDestinationIndex, 0, deletedItem);

    const newStores = [...stores];

    newStores[storeSourceIndex] = {
      ...stores[storeSourceIndex],
      items: newSourceItems,
    };
    newStores[storeDestinationIndex] = {
      ...stores[storeDestinationIndex],
      items: newDestinationItems,
    };

    setStores(newStores);
  };


  const handleAddItem = (groupId, itemName) => {
    const newStores = stores.map((store) => {
      if (store.id === groupId) {
        return {
          ...store,
          items: [...store.items, { id: Date.now().toString(), name: itemName }],
        };
      }
      return store;
    });
    setStores(newStores);
  };

  const handleAddGroup = () => {
    if (newGroupName.trim() !== '') {
      const newGroup = {
        id: Date.now().toString(),
        name: newGroupName,
        items: [],
        tint: stores.length + 1, // Assuming tint values are unique
      };

      setStores([...stores, newGroup]);
      setNewGroupName('');
      setShowAddGroupInput(false); // 新增列表後隱藏輸入框
    }
  };

  const toggleAddGroupInput = () => {
    // console.log(kanbanData)
    // console.log(stores)
    // stores.map((store, index) => (
    //   console.log(store.name)
    // ))
    setShowAddGroupInput(!showAddGroupInput); // 切換輸入框的顯示狀態
  };

  return (
    <div style={{ display: 'inline-flex' }} className="layout__wrapper min-w-full h-full bg-white" >
      <div className="card p-8 w-full px-20">
        <DragDropContext onDragEnd={handleDragAndDrop}>
          <div className="header mb-4">
            <h1 className="text-2xl text-gray">Kanban</h1>
          </div>
          <Droppable droppableId="ROOT" type="group" direction="horizontal" >
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex space-x-4 overflow-x-auto" // 添加 overflow-x-auto 以启用水平滚动
                style={{ display: 'inline-flex', flexDirection: 'row', paddingBottom: '1rem' }} // 确保列是水平排列的，并且底部有足够空间
              >
                {!showAddGroupInput && (
                  <button style={{ backgroundColor: "#5BA491" }} className="w-60 h-24 flex flex-row items-center rounded-lg border-none p-7" onClick={toggleAddGroupInput}>
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
                          style={{ backgroundColor: "#5BA491" }}
                          onClick={handleAddGroup}
                          className="p-2 text-sm text-white font-bold py-1 px-4 rounded transition ease-in-out duration-300"
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
                {stores.map((store, index) => (
                  <Draggable
                    draggableId={store.id}
                    index={index}
                    key={store.id}
                  >
                    {(provided) => (
                      <div
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                        className="group-container w-60 bg-slate-50 rounded-lg shadow-lg"
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="store-container  p-3 rounded-lg cursor-move "
                        >
                          <h3 style={{ color: "#5BA491" }} className="text-lg font-semibold">
                            {store.name}
                          </h3>
                        </div>
                        <StoreList {...store} onAddItem={handleAddItem} activeInputStoreId={activeInputStoreId} setActiveInputStoreId={setActiveInputStoreId} kanbanData={kanbanData} />
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}

function StoreList({ name, items, id, onAddItem, activeInputStoreId, setActiveInputStoreId, kanbanData }) {
  const [newItemName, setNewItemName] = useState('');
  // const [showAddItemInput, setShowAddItemInput] = useState(false); // 新增狀態來控制顯示


  const handleInputChange = (e) => {
    setNewItemName(e.target.value);
  };


  const handleAddItemClick = () => {
    // socket.connect();
    if (newItemName.trim() !== '') {
      onAddItem(id, newItemName);



      const itemInfo = {
        title: newItemName,
        content: "", // 根據需要添加內容
        labels: [], // 根據需要添加標籤
        assignees: [], // 根據需要添加負責人
      };
      // 使用 WebSocket 發送資訊
      console.log("Sending taskItemCreated event", { selectedColumn: id, item: itemInfo, kanbanData });
      socket.emit("taskItemCreated", {
        id, // 假設這裡的 id 就是選擇的列的 ID
        itemInfo,
        kanbanData, // 假設你需要發送整個看板的數據
      });
      setNewItemName('');
      setActiveInputStoreId(null); // 添加項目後關閉輸入框

    }
  };


  const toggleAddItemInput = () => {
    setActiveInputStoreId(activeInputStoreId === id ? null : id); // 切換顯示的輸入框
  };

  return (
    <Droppable droppableId={id}>
      {(provided) => (
        <div {...provided.droppableProps} ref={provided.innerRef}>
          <div className="flex flex-col px-4 pb-1">
            <div className="items-container">
              {items.map((item, index) => (
                <Draggable draggableId={item.id} index={index} key={item.id}>
                  {(provided) => (
                    <div
                      className="item-container bg-white p-2 rounded-lg mb-2 w-full shadow-lg "
                      {...provided.dragHandleProps}
                      {...provided.draggableProps}
                      ref={provided.innerRef}
                    >
                      <h4 className="text-sm">{item.name}</h4>
                    </div>
                  )}
                </Draggable>
              ))}

              {provided.placeholder}
            </div>
            {!(activeInputStoreId === id) && (
              <div className="flex justify-start">
                <button
                  style={{ backgroundColor: "#5BA491" }}
                  onClick={toggleAddItemInput}
                  className="text-sm p-2 mb-2 text-white font-bold py-1 px-4 rounded transition ease-in-out duration-300"
                >
                  新增卡片
                </button>
              </div>
            )}
            {activeInputStoreId === id && (
              <div className="flex flex-col store-container rounded-lg mb-2">
                <input
                  type="text"
                  placeholder="輸入卡片標題..."
                  value={newItemName}
                  onChange={handleInputChange}
                  className="text-sm border border-gray-300 p-2 w-52 rounded-md mb-2"
                />
                <div className='flex justify-start items-center'>
                  <button
                    style={{ backgroundColor: "#5BA491" }}
                    onClick={handleAddItemClick}
                    className="p-2 text-sm text-white font-bold py-1 px-4 rounded transition ease-in-out duration-300">
                    新增
                  </button>
                  <button
                    onClick={toggleAddItemInput}
                    className="flex-center p-2 py-1">
                    <RxCross2 />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
}


