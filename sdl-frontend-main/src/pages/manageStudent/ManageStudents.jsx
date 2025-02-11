import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getKanbanColumns } from "../../api/kanban";
import { getNodes, getNodeRelation } from "../../api/nodes";
import { getIdeaWall } from "../../api/ideaWall";

const ManageStudent = () => {
  const { projectId } = useParams();
  const parsedProjectId = projectId ? parseInt(projectId, 10) : null;
  const [ideaWallIds, setIdeaWallIds] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [nodeRelations, setNodeRelations] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!parsedProjectId) {
      console.warn("❌ projectId 未定義");
      return;
    }

    const fetchData = async () => {
      try {
        console.log("📢 取得 Kanban Columns, projectId:", parsedProjectId);
        const columnData = await getKanbanColumns(parsedProjectId);
        console.log("✅ 取得的 Column Data:", columnData);

        if (columnData && columnData.length > 0) {
          let allTasks = [];
          columnData.forEach(column => {
            column.task.forEach(task => {
              allTasks.push({
                ...task,
                columnId: column.id,
                status: column.name
              });
            });
          });

          allTasks.sort((a, b) => a.columnId - b.columnId);
          setTasks(allTasks);
          console.log("📋 最終 Tasks 數據:", allTasks);
        } else {
          console.warn("❌ 此專案沒有對應的 column");
        }

        console.log("📢 取得 IdeaWall Data, projectId:", parsedProjectId);
        const ideaWallData = await getIdeaWall(parsedProjectId, "1-1");
        console.log("✅ 取得的 IdeaWall Data:", ideaWallData);

        if (ideaWallData && ideaWallData.id) {
          const fetchedIdeaWallIds = [ideaWallData.id]; 
          setIdeaWallIds(fetchedIdeaWallIds);
          console.log("📢 取得 Nodes, ideaWallIds:", fetchedIdeaWallIds);

          const nodePromises = fetchedIdeaWallIds.map(id => getNodes(id));
          const allNodeData = await Promise.all(nodePromises);
          const mergedNodes = allNodeData.flat();
          setNodes(mergedNodes);
          console.log("✅ Nodes Data:", mergedNodes);

          // 取得節點關聯
          console.log("📢 取得 Node 關聯, ideaWallIds:", fetchedIdeaWallIds);
          const relationPromises = fetchedIdeaWallIds.map(id => getNodeRelation(id));
          const allRelationData = await Promise.all(relationPromises);
          const mergedRelations = allRelationData.flat();
          setNodeRelations(mergedRelations);
          console.log("✅ Node Relations Data:", mergedRelations);
        } else {
          console.warn("❌ 無法獲取 IdeaWall IDs");
        }

      } catch (error) {
        console.error("❌ 載入數據失敗:", error);
      }
    };

    fetchData();
  }, [parsedProjectId]);

  // 🔹 建立關聯對照表
  const relationMap = {};
  nodeRelations.forEach(relation => {
    if (!relationMap[relation.from]) {
      relationMap[relation.from] = [];
    }
    relationMap[relation.from].push(relation.to);
  });

  return (
    <div className="h-screen w-screen overflow-auto p-6 bg-gray-50">
      <h1 className="text-3xl font-extrabold mb-6 text-teal-600 text-center">
        小組學生管理
      </h1>

      {/* 🌟 讓整個頁面滾動，而不是單一區塊 */}
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 節點數據表 */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">想法牆統計</h2>
          <div className="overflow-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">擁有者</th>
                  <th className="border p-2">標題</th>
                  <th className="border p-2">建立時間</th>
                  <th className="border p-2">延伸節點</th>
                </tr>
              </thead>
              <tbody>
                {nodes.length > 0 ? (
                  (() => {
                    // 🔹 計算 rowSpan
                    const ownerRowSpan = {};
                    nodes.forEach((node) => {
                      ownerRowSpan[node.owner] = (ownerRowSpan[node.owner] || 0) + 1;
                    });

                    let processedOwners = new Set();

                    return nodes.map((node, index) => (
                      <tr key={node.id} className="text-center hover:bg-gray-50">
                        {processedOwners.has(node.owner) ? null : (
                          <td className="border p-2" rowSpan={ownerRowSpan[node.owner]}>
                            {node.owner}
                          </td>
                        )}
                        {processedOwners.add(node.owner) && null}

                        <td className="border p-2">{node.title}</td>
                        <td className="border p-2">{node.createdAt ? new Date(node.createdAt).toLocaleString() : "N/A"}</td>
                        <td className={`border p-2 ${relationMap[node.id]?.length > 0 ? "font-bold" : ""}`}>
                          {relationMap[node.id]?.length > 0
                            ? relationMap[node.id]
                                .map(id => {
                                  const foundNode = nodes.find(n => n.id === id);
                                  return foundNode ? foundNode.title : `節點 ${id}`;
                                })
                                .join(", ")
                            : "無延伸節點"}
                        </td>
                      </tr>
                    ));
                  })()
                ) : (
                  <tr>
                    <td colSpan="4" className="border p-2 text-center">無節點數據</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 進度看板統計 */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">進度看板統計</h2>
          <div className="overflow-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">狀態</th>
                  <th className="border p-2">標題</th>
                  <th className="border p-2">內容</th>
                  <th className="border p-2">負責人</th>
                  <th className="border p-2">建立時間</th>
                  <th className="border p-2">圖片</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.sort((a, b) => a.columnId - b.columnId).reduce((acc, task, index, array) => {
                    const prevTask = array[index - 1];
                    const showStatus = !prevTask || prevTask.status !== task.status;
                    return [
                      ...acc,
                      <tr key={task.id} className="text-center hover:bg-gray-50">
                        {showStatus && (
                          <td className="border p-2" rowSpan={array.filter(t => t.status === task.status).length}>
                            {task.status}
                          </td>
                        )}
                        <td className="border p-2">{task.title}</td>
                        <td className="border p-2">{task.content || "無內容"}</td>
                        <td className={`border p-2 ${task.assignees?.length > 0 ? "font-bold" : ""}`}>
                          {task.assignees?.length > 0 
                            ? task.assignees.map(a => a.username).join(", ") 
                            : "未指派"}
                        </td>
                        <td className="border p-2">{task.createdAt ? new Date(task.createdAt).toLocaleString() : "N/A"}</td>
                        <td className="border p-2">
                          {task.images?.length > 0 ? (
                            <img src={task.images[0]} alt="任務圖片" className="w-16 h-16 mx-auto" />
                          ) : "無圖片"}
                        </td>
                      </tr>
                    ];
                  }, [])
                ) : (
                  <tr>
                    <td colSpan="6" className="border p-2 text-center">無任務數據</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageStudent;