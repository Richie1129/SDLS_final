import React from 'react';

const stages = [
  {
    title: '進度看板分析',
    phase: '定標',
    subPhase: '提出研究目的',
    cards: [
      { label: '卡片總數', value: 16 },
      { label: '列表卡片數量(待處理)', value: 6 },
      { label: '列表卡片數量(處理中)', value: 5 },
      { label: '列表卡片數量(完成)', value: 5 },
    ],
  },
  {
    title: '想法延伸分析',
    phase: '定標',
    subPhase: '提出研究目的',
    cards: [
      { label: '節點總數', value: 26 },
      { label: '新節點', value: 11 },
      { label: '延伸節點', value: 15 },
    ],
  },
];

const studentProgress = [
  { name: '蔡狄澄', phase: '定標', subPhase: '提出研究目的', status: '線上', statusColor: 'text-green-500' },
  { name: '洪英峯', phase: '定標', subPhase: '提出研究目的', status: '離線', statusColor: 'text-red-500' },
];

const ManageStudent = () => {
  return (
    <div className="max-w-7xl mx-auto my-10 p-6 bg-gray-50 shadow-md rounded-lg">
      {/* 置中標題 */}
      <h1 className="text-3xl font-extrabold mb-6 text-teal-600 text-center">
        進度與分析
      </h1>

      <div className="grid grid-cols-2 gap-6">
        {/* 左半邊 - 學生進度表 */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 text-center">
            學生進度
          </h2>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">學生</th>
                  <th className="border p-2">目前階段</th>
                  <th className="border p-2">目前子階段</th>
                  <th className="border p-2">狀態</th>
                </tr>
              </thead>
              <tbody>
                {studentProgress.map((student, i) => (
                  <tr key={i} className="text-center hover:bg-gray-50">
                    <td className="border p-2">{student.name}</td>
                    <td className="border p-2">{student.phase}</td>
                    <td className="border p-2">{student.subPhase}</td>
                    <td
                      className={`border p-2 font-bold ${student.statusColor}`}
                    >
                      {student.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 右半邊 - 進度看板分析與想法延伸分析 */}
        <div className="flex flex-col gap-6">
          {stages.map((stage, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
              {/* 標題 */}
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">
                {stage.title}
              </h2>
              {/* 階段與子階段 */}
              <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 font-medium">目前階段</p>
                  <p className="text-lg font-bold text-gray-800 whitespace-nowrap">
                    {stage.phase}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 font-medium">目前子階段</p>
                  <p className="text-lg font-bold text-gray-800 whitespace-nowrap">
                    {stage.subPhase}
                  </p>
                </div>
              </div>
              {/* 直方圖 */}
              <div className="flex justify-center items-end h-64 mt-6 border-t border-gray-300">
                {stage.cards.map((item, i) => (
                  <div key={i} className="flex flex-col items-center mx-2">
                    <div
                      className="bg-teal-500 text-white flex items-center justify-center rounded-lg"
                      style={{
                        height: `${item.value * 8}px`,
                        width: '50px',
                      }}
                    >
                      {item.value}
                    </div>
                    <div className="mt-2 text-sm text-gray-700 font-medium text-center whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageStudent;
