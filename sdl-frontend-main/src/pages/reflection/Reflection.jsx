import React, { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import { GrFormClose } from "react-icons/gr";
import { useParams } from 'react-router-dom';
import { getAllPersonalDaily, createPersonalDaily, getAllTeamDaily, createTeamDaily, updatePersonalDaily, updateTeamDaily } from '../../api/reflection';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast, { Toaster } from 'react-hot-toast';
import Loader from '../../components/Loader';
import { FaPlus } from "react-icons/fa";
import personalDailyIcon from "../../assets/AnimationPersonalDaily.json";
import teamDailyIcon from "../../assets/AnimationTeamDaily.json";
import Lottie from "lottie-react";
import { socket } from '../../utils/socket';
import FileDownload from 'js-file-download';
import { AiOutlineCloudDownload } from "react-icons/ai";
import { GrCircleQuestion } from 'react-icons/gr';
// import { motion } from 'framer-motion';
import { motion, useMotionValue } from "framer-motion";
const imgs = [
    "/imgs/nature/1.jpg",
    "/imgs/nature/2.jpg",
    "/imgs/nature/3.jpg",
    "/imgs/nature/4.jpg",
    "/imgs/nature/5.jpg",
    "/imgs/nature/6.jpg",
    "/imgs/nature/7.jpg",
];
const ONE_SECOND = 1000;
const AUTO_DELAY = ONE_SECOND * 10;
const DRAG_BUFFER = 50;

const SPRING_OPTIONS = {
    type: "spring",
    mass: 3,
    stiffness: 400,
    damping: 50,
};
export default function Reflection() {
    const { projectId } = useParams();
    const [personalDaily, setPersonalDaily] = useState([]);
    const [teamDaily, setTeamDaily] = useState([]);
    const [dailyData, setDailyData] = useState({});
    const [attachFile, setAttachFile] = useState(null);
    const [selectedDaily, setSelectedDaily] = useState({ title: "", content: "" });
    const [inspectDailyModalOpen, setInspectDailyModalOpen] = useState(false);
    const [personalDailyModalOpen, setPersonalDailyModalOpen] = useState(false);
    const [teamDailyModalOpen, setTeamDailyModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [editingId, setEditingId] = useState(null); // 用來追蹤正在編輯的日誌ID

    const [imgIndex, setImgIndex] = useState(0);
    const [TeamImgIndex, setTeamImgIndex] = useState(0);

    const dragX = useMotionValue(0);
    const TeamDragX = useMotionValue(0);

    // 編輯按鈕的處理邏輯
    const handleEditClick = (item) => {
        console.log("編輯的日誌:", item); // 檢查這裡是否有正確的 `id`
        setTitle(item.title);
        setContent(item.content);
        setAttachFile(item.fileData);
        setEditingId(item.id); // 設定正在編輯的日誌ID
        setPersonalDailyModalOpen(true); // 開啟編輯模態框
    };

    // useEffect(() => {
    //     const intervalRef = setInterval(() => {
    //         const x = dragX.get();

    //         if (x === 0) {
    //             setImgIndex((pv) => {
    //                 if (pv === personalDaily.length - 1) {
    //                     return 0;
    //                 }
    //                 return pv + 1;
    //             });
    //         }
    //     }, AUTO_DELAY);

    //     return () => clearInterval(intervalRef);
    // }, []);

    const onDragEnd = () => {
        const x = dragX.get();

        if (x <= -DRAG_BUFFER && imgIndex < personalDaily.length - 1) {
            setImgIndex((pv) => pv + 1);
        } else if (x >= DRAG_BUFFER && imgIndex > 0) {
            setImgIndex((pv) => pv - 1);
        }
    };

    const TeamOnDragEnd = () => {
        const x = TeamDragX.get();

        if (x <= -DRAG_BUFFER && TeamImgIndex < teamDaily.length - 1) {
            setTeamImgIndex((pv) => pv + 1);
        } else if (x >= DRAG_BUFFER && TeamImgIndex > 0) {
            setTeamImgIndex((pv) => pv - 1);
        }
    };

    const toggleTooltip = () => {
        setIsTooltipVisible(!isTooltipVisible);
    };
    const closeTooltip = () => {
        setIsTooltipVisible(false);
    };

    const {
        isLoading,
        isError,
        error,
    } = useQuery("personalDaily", () => getAllPersonalDaily(
        { params: { userId: localStorage.getItem("id"), projectId: projectId } }),
        {
            onSuccess: setPersonalDaily,
            enabled: !!projectId
        }
    );

    const [showEmptyMessage, setShowEmptyMessage] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (personalDaily.length === 0 && teamDaily.length === 0 && !isLoading && !isError) {
                setShowEmptyMessage(true);
            }

        }, 20); // 延迟500毫秒显示空状态消息

        return () => clearTimeout(timer);
    }, [personalDaily.length, teamDaily.length, isLoading, isError]);

    const teamDailyQuery = useQuery({
        queryKey: ['teamDaily'],
        queryFn: () => getAllTeamDaily({ params: { projectId: projectId } }),
        onSuccess: setTeamDaily,
        enabled: !!projectId
    });

    const { mutate } = useMutation(createPersonalDaily, {
        onSuccess: (res) => {
            console.log(res);
            queryClient.invalidateQueries("personalDaily")
            sucesssNotify(res.message)
        },
        onError: (error) => {
            console.log(error);
            errorNotify(error.response.data.message)
        }
    })

    const { mutate: teamDailyMutate } = useMutation(createTeamDaily, {
        onSuccess: (res) => {
            console.log(res);
            queryClient.invalidateQueries(['teamDaily'])
            sucesssNotify(res.message)
        },
        onError: (error) => {
            console.log(error);
            errorNotify(error.response.data.message)
        }
    })

    const { mutate: updateDaily } = useMutation(({ id, ...data }) => updatePersonalDaily(id, data), {
        onSuccess: () => {
            queryClient.invalidateQueries("personalDaily");
            sucesssNotify("更新成功");
        },
        onError: (error) => {
            console.log(error);
            errorNotify("更新失敗");
        }
    });
    

    const handleSaveEdit = () => {
        if (!editingId) {
            toast.error("未選擇日誌");
            return;
        }
    
        const updatedData = {
            id: Number(editingId),  // 確保 id 是數字
            title: title,
            content: content
        };
    
        console.log("更新資料:", updatedData); // 確保這裡有 `id`
        updateDaily(updatedData); // 觸發 API 更新
        setPersonalDailyModalOpen(false);
    };
    
    
    const handleChange = e => {
        const { name, value } = e.target;
        setDailyData(prev => ({
            ...prev,
            [name]: value,
            userId: localStorage.getItem("id")
        }));
        if (name === 'title') setTitle(value);
        if (name === 'content') setContent(value);
    }
    const handleAddFileChange = e => {
        setAttachFile(e.target.files);
    }
    const handleCreatePersonalDaily = e => {
        e.preventDefault();
        if (title.trim() !== "" && content.trim() !== "") {
            const formData = new FormData();
            formData.append('projectId', projectId);
            if (attachFile) {
                for (let i = 0; i < attachFile.length; i++) {
                    formData.append("attachFile", attachFile[i])
                }
            }
            for (let key in dailyData) {
                formData.append(key, dailyData[key]);
            }
            console.log(...formData);
            mutate(formData);
            setPersonalDailyModalOpen(false);
        } else {
            toast.error("標題及內容請填寫完整!");
        }

    }
    // const handleChangeSelectDaily = e => {
    //     const { name, value } = e.target;
    //     setSelectedDaily(prev => ({
    //         ...prev,
    //         [name]: value,
    //     }));
    // }

    // const handleTeamDailyChange = e => {
    //     const { name, value } = e.target;
    //     setDailyData(prev => ({
    //         ...prev,
    //         [name]: value,
    //         userId: localStorage.getItem("id")
    //     }));
    // }

    const Tooltip = ({ children, content }) => {
        return (
            <div className='relative group'>
                {children}
                <div className='absolute  hidden group-hover:block'>
                    <div className='bg-gray-700 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap'>
                        {content}
                    </div>
                </div>
            </div>
        );
    };

    const handleCreateTeamDaily = e => {
        e.preventDefault();

        if (title.trim() !== "" && content.trim() !== "") {
            const formData = new FormData();
            formData.append('projectId', projectId);
            formData.append('creator', localStorage.getItem("username"));
            if (attachFile) {
                for (let i = 0; i < attachFile.length; i++) {
                    formData.append("attachFile", attachFile[i])
                }
            }
            for (let key in dailyData) {
                formData.append(key, dailyData[key]);
            }
            console.log(...formData);
            teamDailyMutate(formData);
            setTeamDailyModalOpen(false);

        } else {
            toast.error("標題及內容請填寫完整!");
        }


    }

    const errorNotify = (toastContent) => toast.error(toastContent);
    const sucesssNotify = (toastContent) => toast.success(toastContent);

    const fadeInOut = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 },
    }

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
            <div className='flex flex-row my-5 pl-20 pr-5 py-16 w-full h-screen justify-between items-between'>
                <div className='flex flex-col w-[45vw]'>
                    <div className='flex justify-start gap-6 items-center pl-3'>
                        <h3 className='text-xl font-bold'>個人日誌</h3>
                        <button onClick={() => {
                            setTitle("")
                            setContent("")
                            setAttachFile(null)
                            setPersonalDailyModalOpen(true)
                        }} className="flex items-center bg-customgreen hover:bg-customgreen/80 text-white font-semibold rounded-lg p-1 mr-1 sm:px-4 text-base min-w-[70px]">
                            <FaPlus />
                            <p className="ml-2">新增</p>
                        </button>
                    </div>
                    <div className='flex flex-wrap justify-center items-center mb-5'>
                        <div className='flex py-2  scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scrollbar-thumb-rounded-full'>
                            {
                                isLoading ? <Loader /> :
                                    isError ? <p className='text-base font-bold'>{error.message}</p> :
                                        personalDaily.length === 0 ? (
                                            showEmptyMessage && (
                                                <div className="flex flex-col items-center justify-center mx-80">
                                                    <Lottie className="w-64" animationData={personalDailyIcon} />
                                                    <p className=' font-bold text-zinc-600 text-lg'>還沒新增過個人日誌 ! 趕快新增你的第一個【個人日誌】吧 ~</p>
                                                </div>
                                            )) : (
                                            <div className="relative overflow-hidden w-[45vw] py-8">

                                                <motion.div
                                                    drag="x"
                                                    dragConstraints={{ left: 0, right: 0,}}
                                                    style={{ x: dragX, }}
                                                    animate={{ translateX: `-${imgIndex * 100}%`, }}
                                                    transition={SPRING_OPTIONS}
                                                    onDragEnd={onDragEnd}
                                                    className="flex cursor-grab j items-center active:cursor-grabbing"
                                                >
                                                    {
                                                        personalDaily.map((item, index) => (
                                                            <motion.div
                                                                key={index}
                                                                style={{ backgroundSize: "cover", backgroundPosition: "center", }}
                                                                animate={{ scale: imgIndex === index ? 1 : 0.9, }}
                                                                transition={SPRING_OPTIONS}
                                                                className="aspect-video w-full shrink-0 rounded-xl object-cover"
                                                            >
                                                                <div className='bg-white rounded-lg shadow-lg p-4 px-8 m-2 w-[40vw] h-full flex flex-col' key={index}>
                                                                    <h5 className='text-xl font-bold text-customgreen py-2'>{item.title}</h5>
                                                                    <div className='flex-grow overflow-auto mb-4'>
                                                                        <p className='text-gray-700 break-words'>{item.content}</p>
                                                                    </div>
                                                                    <div className='mt-auto'>
                                                                        {item.fileData && (
                                                                            <div className='flex justify-between items-center mb-2'>
                                                                                <span className="text-base text-gray-500">附加檔案: {item.filename}</span>
                                                                                <button
                                                                                    className="flex items-center justify-center px-3 py-1 bg-customgreen text-white rounded-md hover:bg-customgreen/80 transition-colors duration-300 ease-in-out"
                                                                                    onClick={() => {
                                                                                        const buffer = new Uint8Array(item.fileData.data);
                                                                                        const blob = new Blob([buffer], { type: "application/octet-stream" });
                                                                                        FileDownload(blob, item.filename);
                                                                                    }}
                                                                                >
                                                                                    <AiOutlineCloudDownload size={32} className="mr-2" />
                                                                                    下載
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                        <p className='text-base text-customgreen font-bold'>建立日期: {new Date(item.createdAt).toLocaleDateString()}</p>
                                                                        <button
                                                                            className="mt-2 bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600 transition-colors duration-300"
                                                                            onClick={() => handleEditClick(item)}
                                                                        >
                                                                            編輯
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))
                                                    }
                                                </motion.div>
                                                <div className="mt-4 flex w-full justify-center gap-2">
                                                    {personalDaily.map((_, idx) => {
                                                        return (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setImgIndex(idx)}
                                                                className={`h-3 w-3 rounded-full transition-colors ${idx === imgIndex ? "bg-customgreen" : "bg-neutral-500"
                                                                    }`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                        </div>
                    </div>
                </div>

                <div className='flex flex-col w-[45vw]'>
                    <div className='flex justify-start gap-6 items-center w-full pl-3'>
                        <h3 className='text-xl font-bold'>小組日誌</h3>
                        <button onClick={() => {
                            setTitle("")
                            setContent("")
                            setAttachFile(null)
                            setTeamDailyModalOpen(true)
                            setDailyData(prev => ({
                                ...prev,
                                type: "discuss"
                            }))
                        }} className="flex items-center bg-customgreen hover:bg-customgreen/80 text-white font-semibold rounded-lg p-1 mr-1 sm:px-4 text-base min-w-[70px]">
                            <FaPlus />
                            <p className="ml-2">新增</p>
                        </button>
                    </div>
                    <div className='  flex flex-wrap justify-center items-center w-full mb-5'>
                        <div className='flex py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scrollbar-thumb-rounded-full'>
                            {
                                teamDailyQuery.isLoading ? <Loader /> :
                                    teamDailyQuery.isError ? <p className=' text-base font-bold'>{error.message}</p> :

                                        teamDaily.length === 0 ? (
                                            showEmptyMessage && (
                                                <div className="flex flex-col items-center justify-center mx-80">
                                                    <Lottie className=" w-72" animationData={personalDailyIcon} />
                                                    <p className=' font-bold text-zinc-600 text-lg'>還沒新增過小組日誌 ! 趕快新增你的第一個【小組日誌】吧 ~</p>
                                                </div>
                                            )) : (
                                            < div className="relative overflow-hidden w-[45vw] py-8">
                                                <motion.div
                                                    drag="x"
                                                    dragConstraints={{ left: 0, right: 0,}}
                                                    style={{ x: TeamDragX, }}
                                                    animate={{ translateX: `-${TeamImgIndex * 100}%`, }}
                                                    transition={SPRING_OPTIONS}
                                                    onDragEnd={TeamOnDragEnd}
                                                    className="flex cursor-grab j items-center active:cursor-grabbing"
                                                >
                                                    {
                                                        teamDaily.map((item, index) => (
                                                            <motion.div
                                                                key={index}
                                                                style={{ backgroundSize: "cover", backgroundPosition: "center", }}
                                                                animate={{ scale: TeamImgIndex === index ? 1 : 0.9, }}
                                                                transition={SPRING_OPTIONS}
                                                                className="aspect-video w-full shrink-0 rounded-xl object-cover"
                                                            >
                                                                <div className='bg-white rounded-lg shadow-lg p-4 px-8 m-2 w-[40vw] h-full flex flex-col' key={index}>
                                                                    <h5 className='text-xl font-bold text-customgreen py-2'>{item.title}</h5>
                                                                    <div className='flex-grow overflow-auto mb-4'>
                                                                        <p className='text-gray-700 break-words'>{item.content}</p>
                                                                    </div>
                                                                    <div className='mt-auto'>
                                                                        {item.fileData && (
                                                                            <div className='flex justify-between items-center mb-2'>
                                                                                <span className="text-base text-gray-500">附加檔案: {item.filename}</span>
                                                                                <button
                                                                                    className="flex items-center justify-center px-3 py-1 bg-customgreen text-white rounded-md hover:bg-customgreen/80 transition-colors duration-300 ease-in-out"
                                                                                    onClick={() => {
                                                                                        const buffer = new Uint8Array(item.fileData.data);
                                                                                        const blob = new Blob([buffer], { type: "application/octet-stream" });
                                                                                        FileDownload(blob, item.filename);
                                                                                    }}
                                                                                >
                                                                                    <AiOutlineCloudDownload size={32} className="mr-2" />
                                                                                    下載
                                                                                </button>
                                                                            </div>
                                                                        )}

                                                                        <div className='flex justify-between text-base font-bold'>
                                                                            <p className='text-customgreen'>建立日期: {new Date(item.createdAt).toLocaleDateString()}</p>
                                                                            <p className='text-gray-500'>建立者: {item.creator}</p>
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            </motion.div>
                                                        ))
                                                    }
                                                </motion.div>
                                                <div className="mt-4 flex w-full justify-center gap-2">
                                                    {teamDaily.map((_, idx) => {
                                                        return (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setTeamImgIndex(idx)}
                                                                className={`h-3 w-3 rounded-full transition-colors ${idx === TeamImgIndex ? "bg-customgreen" : "bg-neutral-500"
                                                                    }`}
                                                            />
                                                        );
                                                    })}
                                                </div>

                                            </div>

                                        )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 個人反思日誌 */}
            <Modal open={personalDailyModalOpen} onClose={() => setPersonalDailyModalOpen(false)} opacity={true} position={"justify-center items-center"}>
                <button onClick={() => setPersonalDailyModalOpen(false)} className='absolute top-1 right-1 rounded-lg bg-white hover:bg-slate-200'>
                    <GrFormClose className='w-6 h-6' />
                </button>
                <div className='flex flex-col px-1'>
                    <h3 className='font-bold text-lg mb-3 text-center'>個人反思日誌</h3>
                    <div className='flex items-center mb-3'>
                        <p className='font-bold text-base'>日誌內容</p>
                        <button
                            onClick={toggleTooltip}
                            className='ml-2 p-1'>
                            <GrCircleQuestion className='w-4 h-4 text-customgreen hover:text-customgreen/60' />
                        </button>
                    </div>
                    {isTooltipVisible && (
                        <motion.div
                            className="absolute z-10 bg-white p-6 rounded shadow-lg text-sm"
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={fadeInOut}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <button onClick={closeTooltip} className='absolute top-1 right-1'>
                                <GrFormClose className='w-4 h-4' />
                            </button>
                            <p className=' font-bold text-base '>日誌內容可以撰寫以下項目:</p>
                            <ul>
                                <li className='  text-sm pt-2'>1.最近完成的進度內容。</li>
                                <li className='  text-sm '>2.完成的心得反思。</li>
                                <li className='  text-sm '>3.下次的預計完成的進度內容。</li>
                                <li className='  text-sm '>4.是否遇到新的問題。</li>
                            </ul>
                        </motion.div>
                    )}
                    <input className="rounded outline-none ring-2 p-1 ring-customgreen w-full mb-3"
                        type="text"
                        placeholder="日誌名稱..."
                        name='title'
                        value={title}
                        onChange={handleChange}
                        required
                    />
                    <textarea className="rounded outline-none ring-2 ring-customgreen w-full mb-3 p-1 resize-none overflow-auto"
                        rows={10}
                        placeholder="撰寫您的日誌..."
                        name='content'
                        value={content}
                        onChange={handleChange}
                    />
                    <input className="rounded outline-none ring-2 p-1 ring-customgreen w-full mb-3"
                        type="file"
                        name='filename'
                        onChange={handleAddFileChange}
                        multiple
                    />
                    <div className='flex justify-end m-2'>
                        <button
                            onClick={() => setPersonalDailyModalOpen(false)}
                            className="mx-auto w-full h-7 mb-2 bg-customgray rounded font-bold text-xs sm:text-sm text-black/60 mr-2">
                            取消
                        </button>
                        <button onClick={handleSaveEdit} type="submit" className="mx-auto w-full h-7 mb-2 bg-customgreen rounded font-bold text-xs sm:text-sm text-white">
                            儲存
                        </button>
                    </div>
                </div>
            </Modal>
            {/* 小組反思日誌 */}
            <Modal open={teamDailyModalOpen} onClose={() => setTeamDailyModalOpen(false)} opacity={true} position={"justify-center items-center"}>
                <button onClick={() => setTeamDailyModalOpen(false)} className='absolute top-1 right-1 rounded-lg bg-white hover:bg-slate-200'>
                    <GrFormClose className='w-6 h-6' />
                </button>
                <div className='flex flex-col px-1'>
                    <h3 className='font-bold text-lg mb-3 text-center'>小組反思日誌</h3>
                    <div className='flex items-center mb-3'>
                        <p className='font-bold text-base'>日誌內容</p>
                        <button
                            onClick={toggleTooltip}
                            className='ml-2 p-1 '>
                            <GrCircleQuestion className='w-4 h-4 text-customgreen hover:text-customgreen/60' />
                        </button>
                    </div>
                    {isTooltipVisible && (
                        <motion.div
                            className="absolute z-10 bg-white p-6 rounded shadow-lg text-sm"
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={fadeInOut}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <button onClick={closeTooltip} className='absolute top-1 right-1'>
                                <GrFormClose className='w-4 h-4' />
                            </button>
                            <p className=' font-bold text-base '>日誌內容可以撰寫以下項目:</p>
                            <ul>
                                <li className='  text-sm pt-2'>1.最近完成的進度內容。</li>
                                <li className='  text-sm '>2.完成的心得反思。</li>
                                <li className='  text-sm '>3.下次的預計完成的進度內容。</li>
                                <li className='  text-sm '>4.是否遇到新的問題。</li>
                            </ul>
                        </motion.div>
                    )}
                    <input className="rounded outline-none ring-2 p-1 ring-customgreen w-full mb-3"
                        type="text"
                        placeholder="日誌名稱..."
                        name='title'
                        value={title}
                        onChange={handleChange}
                        required
                    />
                    <textarea className="rounded outline-none ring-2 ring-customgreen w-full mb-3 p-1 resize-none overflow-auto"
                        rows={10}
                        placeholder="撰寫您的日誌..."
                        name='content'
                        value={content}
                        onChange={handleChange}
                    />
                    <input className="rounded outline-none ring-2 p-1 ring-customgreen w-full mb-3"
                        type="file"
                        name='filename'
                        onChange={handleAddFileChange}
                        multiple
                    />
                    <div className='flex justify-end m-2'>
                        <button
                            onClick={() => setTeamDailyModalOpen(false)}
                            className="mx-auto w-full h-7 mb-2 bg-customgray rounded font-bold text-xs sm:text-sm text-black/60 mr-2">
                            取消
                        </button>
                        <button onClick={e => {
                            handleCreateTeamDaily(e);
                        }}
                            type="submit"
                            className="mx-auto w-full h-7 mb-2 bg-customgreen rounded font-bold text-xs sm:text-sm text-white">
                            儲存
                        </button>
                    </div>
                </div>
            </Modal>
            {/* 檢視 */}
            {/* {
                selectedDaily &&
                <Modal open={inspectDailyModalOpen} onClose={() => setInspectDailyModalOpen(false)} opacity={true} position={"justify-center items-center"}>
                    <div className='flex flex-col p-3'>
                        <h3 className='  font-bold text-lg mb-3 text-center'>檢視日誌</h3>
                        <p className=' font-bold text-base mb-3'>標題</p>
                        <input className=" rounded outline-none ring-2 p-1 ring-customgreen w-full mb-3"
                            type="text"
                            placeholder="標題"
                            name='title'
                            value={selectedDaily.title}
                            onChange={handleChangeSelectDaily}
                            disabled
                        />
                        <p className=' font-bold text-base mb-3'>內容</p>
                        <textarea className=" rounded outline-none ring-2 ring-customgreen w-full p-1 resize-none overflow-auto"
                            rows={10}
                            placeholder="內容"
                            name='content'
                            value={selectedDaily.content}
                            onChange={handleChangeSelectDaily}
                            disabled
                        />
                        {selectedDaily.fileData && (
                            <div className='flex justify-between items-center p-3 bg-gray-100 rounded-lg mt-5'>
                                <span className="font-semibold text-gray-700">附加檔案: {selectedDaily.filename}</span>
                                <button
                                    className="flex items-center justify-center px-3 py-1 bg-[#5BA491] text-white rounded-md hover:bg-[#487e6c] transition-colors duration-300 ease-in-out"
                                    onClick={() => {
                                        const buffer = new Uint8Array(selectedDaily.fileData.data);
                                        const blob = new Blob([buffer], { type: "application/octet-stream" });
                                        FileDownload(blob, selectedDaily.filename);
                                    }}
                                >
                                    <AiOutlineCloudDownload size={24} className="mr-2" />
                                    下載附件
                                </button>
                            </div>
                        )}
                    </div>
                    <div className='flex justify-end m-2'>

                        <button onClick={() => setInspectDailyModalOpen(false)} className="inline-flex items-center justify-center px-4 py-2 bg-[#5BA491] text-white rounded-md hover:bg-[#487e6c] transition-colors duration-300 ease-in-out" >
                            關閉
                        </button>
                    </div>
                </Modal>
            } */}
            <Toaster />
        </div >

    )
}