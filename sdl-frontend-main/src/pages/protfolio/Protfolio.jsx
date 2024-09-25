
import React, { useState, useEffect } from 'react';
import { AiTwotoneFolderAdd } from "react-icons/ai";
import { GrFormClose } from "react-icons/gr";
import { useQuery, useQueryClient } from 'react-query';
import { getAllSubmit } from '../../api/submit';
import { useParams } from 'react-router-dom';
import Loader from '../../components/Loader';
import FolderModal from './components/folderModal';
import dateFormat from 'dateformat';
import ProtfoliioIcon from "../../assets/AnimationProtfoliio.json";
import Lottie from "lottie-react";
import { socket } from '../../utils/socket';

import { AiOutlineCloudDownload } from "react-icons/ai";
import FileDownload from 'js-file-download';

export default function Protfolio() {
    const [stagePortfolio, setStagePortfolio] = useState([]);
    const [folderModalOpen, setFolderModalOpen] = useState(false);
    const [modalData, setModalData] = useState({});
    const { projectId } = useParams();
    const [activeItemId, setActiveItemId] = useState(null); // 新增状态以追踪当前被点击的项目 ID
    const [showEmptyMessage, setShowEmptyMessage] = useState(false);
    let portfolioItemsWithTitles = [];


    
    const {
        isLoading,
        isError,
        data: portfolioData
      } = useQuery("protfolioDatas", () => getAllSubmit(
          { params: { projectId: projectId } }),
          {
            onSuccess: (data) => {
              setStagePortfolio(data);
              setShowEmptyMessage(data.length === 0);
            }
          }
      );
    useEffect(() => {
      const timer = setTimeout(() => {
        if (portfolioItemsWithTitles.length === 0 && !isLoading && !isError) {
          setShowEmptyMessage(true);
        }
      }, 500); // 延迟500毫秒显示空状态消息
    
      return () => clearTimeout(timer);
    }, [portfolioItemsWithTitles.length, isLoading, isError]);
    
    
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
    // 加入首行文字
    stagePortfolio.forEach((item, index) => {
        if (index % 3 === 0) {
            // 每三個項目前插入一個文字物件，使用splice方法
            const titleIndex = Math.floor(index / 3);
            const title = insertTitles[titleIndex];
            if (title) {
                portfolioItemsWithTitles.push({ type: 'title', content: title });
            }
        }
        portfolioItemsWithTitles.push({ type: 'item', content: item });
    });

    const downloadFile = () => {
        if (modalData.fileData && modalData.fileData.data) {
            // 将 Buffer 转换为 Uint8Array
            const buffer = new Uint8Array(modalData.fileData.data);
            // 创建 Blob 对象
            const blob = new Blob([buffer], { type: "application/octet-stream" });
            // 触发文件下载
            FileDownload(blob, "downloaded-file.png"); // 请根据实际文件类型调整 MIME 类型和文件名
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
        <div className='min-w-full min-h-screen h-screen'>
            <div className='flex-grow'>
                <div className='flex flex-col my-5 pl-20 pr-5 sm:px-20 py-16 w-full h-screen justify-start items-start'>
                    {/* <h3 className='text-lg font-bold mb-4'>歷程檔案</h3> */}
                    <div className=' flex flex-wrap justify-start items-center w-full mb-5 pr-80'>
                        {
                            isLoading ? <Loader /> :
                                isError ? <p className=' font-bold text-2xl'>{isError.message}</p> :
                                    // stagePortfolio.map(item => {
                                    portfolioItemsWithTitles.length === 0 ? (
                                        
                                            showEmptyMessage && (
                                              <div className="flex flex-col items-center justify-center w-full h-full my-5">
                                                <Lottie className="w-96" animationData={ProtfoliioIcon} />
                                                <p className="text-lg text-zinc-600 font-bold mt-2">目前還未新增歷程檔案，快和小組成員互相討論並記錄討論結果吧 !</p>
                                              </div>
                                            )
                                          
                                    ) : (

                                        portfolioItemsWithTitles.map((item, index) => {
                                            if (item.type === 'title') {
                                                return (
                                                    <React.Fragment key={`title-${index}`}>
                                                        <div className="w-full mb-3">
                                                            <h3 className="text-xl font-bold">{item.content}</h3>
                                                        </div>
                                                        <div className="w-full h-0.5 bg-[#5BA491] mb-3 mr-5"></div>
                                                    </React.Fragment>
                                                );
                                            } else {
                                                const { id, stage, createdAt } = item.content;
                                                const description = stageDescriptions[stage];
                                                if (!description) return null; // 如果stage不在stageDescriptions中，则不渲染


                                                const isActive = id === activeItemId;
                                                return (
                                                    <div
                                                        className={`flex mx-3 mb-3 transition duration-500 ease-in-out transform ${isActive ? 'scale-105 bg-[#487e6c]' : 'bg-[#5BA491]'} rounded-lg`}
                                                        key={id}
                                                        style={{
                                                            minWidth: 'calc(33.333% - 2rem)', maxWidth: 'calc(33.333% - 2rem)'
                                                        }}
                                                    >
                                                        <button
                                                            className="inline-flex items-center justify-center w-full h-28  text-white  font-semibold rounded-lg p-5 mx-5 text-base flex-col"
                                                            onClick={() => {
                                                                setActiveItemId(id);
                                                                setFolderModalOpen(true);
                                                                setModalData(item.content);
                                                                console.log(item);
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-center">
                                                                <AiTwotoneFolderAdd size={30} className="mr-2" />
                                                                {/* <span>{stage}</span> */}
                                                                <span className="ml-2 text-lg">{description}</span>
                                                            </div>
                                                            <div className="mt-5 text-sm text-white">
                                                                <span className='mr-2'>完成時間</span>
                                                                {dateFormat(createdAt, "yyyy/mm/dd")}
                                                            </div>
                                                        </button>
                                                    </div>
                                                )
                                            }
                                        })
                                    )
                            // })
                        }
                    </div>
                </div>
            </div>

            <div className={`w-[400px] h-full fixed right-0 top-16 bg-white shadow-lg transform ease-in-out duration-300 ${folderModalOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <button onClick={() => setFolderModalOpen(false)} className="absolute top-1 right-1 rounded-lg bg-white hover:bg-slate-200">
                    <GrFormClose className="w-6 h-6" />
                </button>
                <div className="flex flex-col justify-start items-center w-full p-4">
                    <div className="text-center py-2">
                        <h2 className="text-xl font-bold text-[#5BA491]">{stageDescriptions[modalData.stage]}</h2>
                        <span className="text-sm text-gray-600">階段: {modalData.stage}</span>
                    </div>
                    {
                        modalData.content ?
                            Object.entries(JSON.parse(modalData.content)).map((element, index) => (
                                <div className="mt-3 p-4 bg-gray-100 rounded-lg w-full" key={index}>
                                    <span className="font-bold text-lg text-gray-700">{element[0]}:</span>
                                    <p className="text-gray-600">{element[1]}</p>
                                </div>
                            ))
                            : <p className="text-gray-700">沒有可顯示的內容</p>
                    }
                    {modalData.fileData && (
                        <>
                            <div className="mt-3 p-4 bg-gray-100 rounded-lg w-full">
                                <span className="font-bold text-lg text-gray-700">附加檔案:</span>
                                <p className="text-gray-600">{modalData.fileName}</p>
                            </div>
                            <button
                                className="mt-3 inline-flex items-center justify-center px-4 py-2 bg-[#5BA491] text-white rounded-md hover:bg-[#487e6c] transition-colors duration-300 ease-in-out"
                                onClick={() => {
                                    if (modalData.fileData && modalData.fileData.data && modalData.fileName) {
                                        console.log("modalData", modalData)
                                        // // 将 Buffer 转换为 Uint8Array
                                        // const buffer = new Uint8Array(modalData.fileData.data);
                                        // // 创建 Blob 对象
                                        // const blob = new Blob([buffer], { type: modalData.mimetype });


                                        // 将 Buffer 转换为 Uint8Array
                                        const buffer = new Uint8Array(modalData.fileData.data);
                                        // 创建 Blob 对象
                                        const blob = new Blob([buffer], { type: "application/octet-stream" });

                                        // 触发文件下载
                                        FileDownload(blob, modalData.fileName);
                                    }
                                }}
                            >
                                <AiOutlineCloudDownload size={32} className="text-white mr-1" />
                                <span>下載附件</span>
                            </button>
                        </>
                    )}
                    {isLoading && <Loader />}
                    {isError && <p>載入錯誤</p>}
                </div>
            </div>
        </div>
    )
}
