import React, { useState, useEffect, useContext } from 'react';
import { AiTwotoneFolderAdd, AiOutlineCloudDownload, AiOutlineUpload } from "react-icons/ai";
import { GrFormClose } from "react-icons/gr";
import { useQuery, useQueryClient } from 'react-query';
import { getAllSubmit, updateSubmitTask, updateSubmitAttachment } from '../../api/submit';
import { useParams } from 'react-router-dom';
import Loader from '../../components/Loader';
import dateFormat from 'dateformat';
import ProtfoliioIcon from "../../assets/AnimationProtfoliio.json";
import Lottie from "lottie-react";
import { socket } from '../../utils/socket';
import FileDownload from 'js-file-download';
import { BiSave } from "react-icons/bi";
import Swal from "sweetalert2";
import { Context } from '../../context/context';

export default function Protfolio() {
    const { currentStageIndex } = useContext(Context);
    const [stagePortfolio, setStagePortfolio] = useState([]);
    const [portfolioItemsWithTitles, setPortfolioItemsWithTitles] = useState([]);
    const [folderModalOpen, setFolderModalOpen] = useState(false);
    const [modalData, setModalData] = useState({});
    const { projectId } = useParams();
    const [activeItemId, setActiveItemId] = useState(null);
    const [showEmptyMessage, setShowEmptyMessage] = useState(false);
    const [editableContent, setEditableContent] = useState("");
    const queryClient = useQueryClient();
    
    const {
        isLoading,
        isError,
        data: portfolioData
    } = useQuery("protfolioDatas", () => getAllSubmit({ params: { projectId: projectId } }), {
        onSuccess: (data) => {
            setStagePortfolio(data);
            setShowEmptyMessage(data.length === 0);
        }
    });

    useEffect(() => {
      const timer = setTimeout(() => {
        if (portfolioItemsWithTitles.length === 0 && !isLoading && !isError) {
          setShowEmptyMessage(true);
        }
      }, 500); // 延迟500毫秒显示空状态消息
    
      return () => clearTimeout(timer);
    }, [portfolioItemsWithTitles.length, isLoading, isError]);

    // 當 modalData 更新時，解析 JSON 並初始化狀態
    useEffect(() => {
        if (modalData.content) {
            try {
                setEditableContent(JSON.parse(modalData.content));
            } catch (error) {
                console.error("解析 JSON 失敗:", error);
                setEditableContent({});
            }
        }
    }, [modalData]);

    // 變更特定欄位的內容
    const handleChange = (key, value) => {
        setEditableContent((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // 儲存修改後的內容
    const handleSave = async () => {
        try {
            await updateSubmitTask(modalData.id, { content: JSON.stringify(editableContent) });
    
            Swal.fire({
                icon: "success",
                title: "儲存成功！",
                text: "內容已成功儲存",
                confirmButtonColor: "#5BA491",
            });
    
            setFolderModalOpen(false);
        } catch (error) {
            console.error("儲存失敗:", error);
    
            Swal.fire({
                icon: "error",
                title: "儲存失敗",
                text: "請稍後再試",
                confirmButtonColor: "#d33",
            });
        }
    };
    
    const stageDescriptions = {
        "1-1": "提出研究主題",
        "1-2": "提出研究目的",
        "1-3": "提出研究問題",
        "2-1": "訂定研究構想表",
        "2-2": "設計研究記錄表",
        "2-3": "規劃研究排程",
        "3-1": "進行嘗試性研究",
        "3-2": "分析資列與繪圖",
        "3-3": "撰寫研究結果",
        "4-1": "檢視研究進度",
        "4-2": "進行研究討論",
        "4-3": "撰寫研究結論"
    };
    const insertTitles = ["定標", "擇策", "監評", "調節"];

    useEffect(() => {
        if (stagePortfolio.length > 0) {
            const itemsWithTitles = [];
            stagePortfolio.forEach((item, index) => {
                if (index % 3 === 0) {
                    const titleIndex = Math.floor(index / 3);
                    const title = insertTitles[titleIndex];
                    if (title) {
                        itemsWithTitles.push({ type: 'title', content: title });
                    }
                }
                itemsWithTitles.push({ type: 'item', content: item });
            });
            setPortfolioItemsWithTitles(itemsWithTitles);
        }
    }, [stagePortfolio]);

    const downloadFile = () => {
        if (modalData.fileData && modalData.fileData.data) {
            // 將 Buffer 轉換為 Uint8Array
            const buffer = new Uint8Array(modalData.fileData.data);
            // 創建 Blob 對象
            const blob = new Blob([buffer], { type: "application/octet-stream" });
            // 觸發文件下載
            FileDownload(blob, "downloaded-file.png"); // 請根據實際文件類型調整 MIME 類型和文件名
        }
    };

    // 加入檔案變更處理
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('attachFile', file);  // 欄位名稱要跟後端 upload.array 的 key 一致
    try {
      await updateSubmitAttachment(modalData.id, formData);
      Swal.fire({ icon: 'success', title: '檔案重新上傳成功', confirmButtonColor: '#5BA491' });
      // 更新列表
      queryClient.invalidateQueries('protfolioDatas');
      setFolderModalOpen(false);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: '重新上傳失敗', text: '請稍後再試', confirmButtonColor: '#d33' });
    }
  };

    // socket
    useEffect(() => {
        socket.connect();
        // socket.on("receive_message", receive_message);

        // return () => {
        //     socket.disconnect();
        // }
    }, [socket])

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                    <h1 className="text-xl font-semibold text-gray-800">歷程檔案</h1>
                </div>
            </div>

            <div className="pt-16 pl-16 h-screen overflow-hidden">
                <div className="h-full overflow-y-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader />
                            </div>
                        ) : isError ? (
                            <div className="text-center py-12">
                                <p className="text-red-500 font-medium">{isError.message}</p>
                            </div>
                        ) : portfolioItemsWithTitles.length === 0 ? (
                            showEmptyMessage && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Lottie className="w-64 sm:w-96" animationData={ProtfoliioIcon} />
                                    <p className="mt-6 text-lg text-gray-600 text-center max-w-md">
                                        目前還未新增歷程檔案，快和小組成員互相討論並記錄討論結果吧！
                                    </p>
                                </div>
                            )
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Timeline Navigation */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-lg shadow-sm p-5 sticky top-24 border border-gray-200">
                                        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                            <span className="h-6 w-1.5 bg-teal-500 rounded-full mr-3"></span>
                                            階段導航
                                        </h2>
                                        <nav className="space-y-5">
                                            {insertTitles.map((title, index) => (
                                                <div key={index} className="relative">
                                                    <div className="flex items-center mb-3">
                                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                                            index < parseInt(currentStageIndex) - 1 ? 'bg-green-500' : 
                                                            index === parseInt(currentStageIndex) - 1 ? 'bg-teal-500' : 
                                                            'bg-gray-200'
                                                        }`}>
                                                            {index < parseInt(currentStageIndex) - 1 && 
                                                                <span className="text-white text-xs">✓</span>
                                                            }
                                                        </div>
                                                        <h3 className={`ml-2 font-medium ${
                                                            index < parseInt(currentStageIndex) ? 'text-gray-900' : 'text-gray-500'
                                                        }`}>{title}</h3>
                                                    </div>
                                                    
                                                    {index < insertTitles.length - 1 && (
                                                        <div className="absolute left-2 top-4 w-[1px] h-full bg-gray-200"></div>
                                                    )}
                                                    
                                                    <div className="pl-7 space-y-2">
                                                        {stagePortfolio
                                                            .filter(item => Math.floor(item.stage.split('-')[0]) === index + 1)
                                                            .map(item => (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        setActiveItemId(item.id);
                                                                        setFolderModalOpen(true);
                                                                        setModalData(item);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors relative ${
                                                                        activeItemId === item.id
                                                                            ? 'bg-teal-500 text-white shadow-sm'
                                                                            : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                                                                    }`}
                                                                >
                                                                    {activeItemId === item.id && (
                                                                        <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white"></span>
                                                                    )}
                                                                    {stageDescriptions[item.stage]}
                                                                </button>
                                                            ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </nav>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="lg:col-span-3">
                                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                        {activeItemId && (
                                            <div className="p-6">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h2 className="text-xl font-bold text-gray-900">
                                                            {stageDescriptions[modalData.stage]}
                                                        </h2>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            階段: {modalData.stage}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setFolderModalOpen(false);
                                                            setActiveItemId(null);
                                                        }}
                                                        className="text-gray-400 hover:text-gray-500 transition-colors"
                                                    >
                                                        <GrFormClose size={24} />
                                                    </button>
                                                </div>

                                                {/* Content Form */}
                                                <div className="space-y-4">
                                                    {Object.entries(editableContent).map(([key, value], index) => (
                                                        <div key={index} className="space-y-2">
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                {key}
                                                            </label>
                                                            <textarea
                                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                                                rows={4}
                                                                value={value}
                                                                onChange={(e) => handleChange(key, e.target.value)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* File Section */}
                                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                        <div>
                                                            <h3 className="text-sm font-medium text-gray-700">附加檔案</h3>
                                                            {modalData.fileName && (
                                                                <p className="text-sm text-gray-500 mt-1">{modalData.fileName}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row gap-2">
                                                            {modalData.fileData && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (modalData.fileData && modalData.fileData.data && modalData.fileName) {
                                                                            const buffer = new Uint8Array(modalData.fileData.data);
                                                                            const blob = new Blob([buffer], { type: "application/octet-stream" });
                                                                            FileDownload(blob, modalData.fileName);
                                                                        }
                                                                    }}
                                                                    className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600"
                                                                >
                                                                    <AiOutlineCloudDownload className="mr-2" />
                                                                    下載
                                                                </button>
                                                            )}
                                                            <label className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600 cursor-pointer">
                                                                <AiOutlineUpload className="mr-2" />
                                                                {modalData.fileData ? "重新上傳" : "上傳檔案"}
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    onChange={handleFileChange}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setFolderModalOpen(false);
                                                            setActiveItemId(null);
                                                        }}
                                                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                    >
                                                        取消
                                                    </button>
                                                    <button
                                                        onClick={handleSave}
                                                        className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-500 hover:bg-teal-600"
                                                    >
                                                        儲存
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
