import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OverView = () => {
  // 假資料
  const [view, setView] = useState('classOverview'); // "classOverview", "projectOverview", "teamOverview"
  const [selectedProject, setSelectedProject] = useState(null);
  const [filter, setFilter] = useState('ongoing'); // "ongoing", "completed"
  const navigate = useNavigate();

  const classData = {
    ongoingProjects: 3,
    completedProjects: 5,
    projects: [
        { id: 1, name: '研究氣候變化', progress: 80, description: '專注於研究氣候變化對全球和區域環境的影響，並探索可能的應對策略。', totalCards: 20, assignedCards: 15, unassignedCards: 5, ideaNodes: 15, status: 'ongoing' },
        { id: 2, name: '水質分析研究', progress: 50, description: '集中於水質分析研究，目的是識別水源中的污染物並提出淨化技術方案。', totalCards: 10, assignedCards: 7, unassignedCards: 3, ideaNodes: 8, status: 'ongoing' },
        { id: 3, name: '生態系統調查', progress: 100, description: '進行深入的生態系統調查，涵蓋生物多樣性和生態平衡的研究。', totalCards: 25, assignedCards: 20, unassignedCards: 0, ideaNodes: 20, status: 'completed' },
        { id: 4, name: '能源利用效率', progress: 100, description: '探討能源利用效率的提升，包括可再生能源的應用及優化技術。', totalCards: 30, assignedCards: 30, unassignedCards: 0, ideaNodes: 25, status: 'completed' },
    ],
    fastestProject: '生態系統調查',
    totalCards: 85,
    totalIdeaNodes: 63,
    totalAssignedCards: 0, // 新增屬性
    totalUnassignedCards: 0, // 新增屬性
  };

    // 計算卡片數量
    classData.totalAssignedCards = classData.projects.reduce((sum, project) => sum + project.assignedCards, 0);
    classData.totalUnassignedCards = classData.projects.reduce((sum, project) => sum + project.unassignedCards, 0);

    const projectDetails = {
        name: selectedProject?.name || '',
        progress: selectedProject?.progress || 0,
        description: selectedProject?.description || '',
        totalCards: selectedProject?.totalCards || 0,
        assignedCards: selectedProject?.assignedCards || 0,
        unassignedCards: selectedProject?.unassignedCards || 0,
        ideaNodes: selectedProject?.ideaNodes || 0,
        teamMembers: [
          { name: '蔡狄澄', tasksCompleted: 10, progress: 80, ideaContribution: 5, totalOnlineDuration: 10, lastOnline: new Date(Date.now() - 3600 * 1000) }, // 1小時前
          { name: '洪英峯', tasksCompleted: 8, progress: 70, ideaContribution: 4, totalOnlineDuration: 12, lastOnline: new Date(Date.now() - 5 * 60 * 1000) }, // 5分鐘前
        ],
      };

    const formatRelativeTime = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
          return `${diffInSeconds}秒前`;
        } else if (diffInSeconds < 3600) {
          return `${Math.floor(diffInSeconds / 60)}分鐘前`;
        } else if (diffInSeconds < 86400) {
          return `${Math.floor(diffInSeconds / 3600)}小時前`;
        } else {
          return `${Math.floor(diffInSeconds / 86400)}天前`;
        }
    };

    const filteredProjects = classData.projects.filter(project => project.status === filter);

  return (
    <div className="max-w-7xl mx-auto my-10 p-6 bg-gray-50 shadow-md rounded-lg">
      {view === 'classOverview' && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              className="bg-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-400 transition"
              onClick={() => navigate("/homepage")}
            >
              返回首頁
            </button>
            <h2 className="text-2xl font-semibold text-gray-700">班級總覽</h2>
          </div>
          <div className="flex justify-between items-center mb-4">
            <button
              className={`px-4 py-2 rounded-lg font-bold ${filter === 'ongoing' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setFilter('ongoing')}
            >
              進行中專案
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-bold ${filter === 'completed' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setFilter('completed')}
            >
              已完成專案
            </button>
          </div>
          <div className="mt-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="mb-4 p-4 border rounded-lg shadow">
                <h3 className="text-lg font-bold text-gray-700">{project.name}</h3>
                <p className="text-gray-600">{project.description}</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-teal-500 h-2.5 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-500">進度: {project.progress}%</p>
                <p className="text-sm text-gray-500">卡片總數: {project.totalCards} / 想法節點總數: {project.ideaNodes}</p>
                <p className="text-sm text-gray-500">已分配卡片數: {classData.totalAssignedCards} / 未分配卡片數: {classData.totalUnassignedCards}</p>
                <button
                  className="mt-2 bg-teal-500 text-white rounded-lg px-4 py-2 hover:bg-teal-600 transition"
                  onClick={() => {
                    setSelectedProject(project);
                    setView('projectOverview');
                  }}
                >
                  查看專案
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <p className="text-lg font-bold text-gray-700">進度最快專案組別: <span className="text-teal-600">{classData.fastestProject}</span></p>
            <p className="text-sm text-gray-500">卡片總數: {classData.totalCards} / 想法節點總數: {classData.totalIdeaNodes}</p>
          </div>
        </div>
      )}

      {view === 'projectOverview' && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <button
            className="mb-4 bg-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-400 transition"
            onClick={() => setView('classOverview')}
          >
            返回班級總覽
          </button>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">專案總覽 - {projectDetails.name}</h2>
          <p className="text-gray-600 mb-2">{projectDetails.description}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-teal-500 h-2.5 rounded-full"
              style={{ width: `${projectDetails.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">進度: {projectDetails.progress}%</p>
          <p className="text-sm text-gray-500">卡片總數: {projectDetails.totalCards} / 想法節點總數: {projectDetails.ideaNodes}</p>
          <p className="text-sm text-gray-500">已分配卡片數: {classData.totalAssignedCards} / 未分配卡片數: {classData.totalUnassignedCards}</p>
          <button
            className="mt-4 bg-teal-500 text-white rounded-lg px-4 py-2 hover:bg-teal-600 transition"
            onClick={() => setView('teamOverview')}
          >
            查看小組成員貢獻
          </button>
        </div>
      )}

      {view === 'teamOverview' && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <button
            className="mb-4 bg-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-400 transition"
            onClick={() => setView('projectOverview')}
          >
            返回專案總覽
          </button>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">小組成員貢獻 - {projectDetails.name}</h2>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full table-fixed border-collapse">
                <thead className="bg-gray-100">
                <tr>
                    <th className="border p-2">成員</th>
                    <th className="border p-2">任務完成數</th>
                    <th className="border p-2">進度</th>
                    <th className="border p-2">貢獻細節</th>
                    <th className="border p-2">最後上線</th>
                    <th className="border p-2">總上線時長</th>
                </tr>
                </thead>
                <tbody>
                {projectDetails.teamMembers.map((member, index) => (
                    <tr key={index} className="text-center hover:bg-gray-50">
                    <td className="border p-2">{member.name}</td>
                    <td className="border p-2">{member.tasksCompleted}</td>
                    <td className="border p-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-teal-500 h-2.5 rounded-full"
                            style={{ width: `${member.progress}%` }}
                        ></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{member.progress}%</p>
                    </td>
                    <td className="border p-2">想法數: {member.ideaContribution}</td>
                    <td className="border p-2">{formatRelativeTime(member.lastOnline)}</td>
                    <td className="border p-2">{member.totalOnlineDuration} 小時</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
        </div>
      )}
    </div>
  );
};

export default OverView;
