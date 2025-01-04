import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import { IoBulbOutline } from 'react-icons/io5';
import { FaRegLightbulb } from "react-icons/fa";
import { MdOutlineViewKanban } from "react-icons/md";
import { TiFolderOpen } from "react-icons/ti";
import { AiOutlineProject } from "react-icons/ai";
import { CgNotes, CgFolder } from "react-icons/cg";
import { BsBezier2, BsChatText, BsJournalText, BsFolder } from "react-icons/bs";
import { LuLayoutDashboard } from "react-icons/lu";
import { GrCompliance } from "react-icons/gr";
import { BiTask } from "react-icons/bi";
import { BsChatDots } from "react-icons/bs";
import { TbMessageQuestion } from "react-icons/tb";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
// import { socket } from '../utils/Socket';
import { Context } from '../context/context'
import { TbZoomQuestion } from "react-icons/tb";
import ChatRoom from './ChatRoom';
import { useQuery, useMutation, useQueryClient } from 'react-query';


const AnimatedHamburgerButton = () => {
    const [active, setActive] = useState(false);

    return (
        <MotionConfig
            transition={{
                duration: 0.5,
                ease: "easeInOut",
            }}
        >
            <motion.button
                initial={false}
                animate={active ? "open" : "closed"}
                onClick={() => setActive((pv) => !pv)}
                className="relative h-8 w-8 transition-colors hover:bg-white/20"
            >
                <motion.span
                    variants={VARIANTS.top}
                    className="absolute h-1 w-6 bg-zinc-800 rounded-full"  // 维持1单位的高度
                    style={{ y: "-50%", left: "50%", x: "-50%", top: "25%" }}
                />
                <motion.span
                    variants={VARIANTS.middle}
                    className="absolute h-1 w-6 bg-zinc-800 rounded-full"  // 维持1单位的高度
                    style={{ left: "50%", x: "-50%", top: "50%", y: "-50%" }}
                />
                <motion.span
                    variants={VARIANTS.bottom}
                    className="absolute h-1 w-6 bg-zinc-800 rounded-full"  // 维持1单位的高度
                    style={{
                        x: "-50%",
                        y: "50%",
                        bottom: "25%",
                        left: "50%",  // 将left修改为50%，确保与中间线条对齐
                    }}
                />
            </motion.button>
        </MotionConfig>
    );
};



const VARIANTS = {
    top: {
        open: {
            rotate: ["0deg", "0deg", "45deg"],
            top: ["25%", "50%", "50%"],
        },
        closed: {
            rotate: ["45deg", "0deg", "0deg"],
            top: ["50%", "50%", "25%"],
        },
    },
    middle: {
        open: {
            rotate: ["0deg", "0deg", "-45deg"],
        },
        closed: {
            rotate: ["-45deg", "0deg", "0deg"],
        },
    },
    bottom: {
        open: {
            rotate: ["0deg", "0deg", "45deg"],
            bottom: ["25%", "50%", "50%"],
            left: "50%",  // 在打开状态下对齐
        },
        closed: {
            rotate: ["45deg", "0deg", "0deg"],
            bottom: ["50%", "50%", "25%"],
            left: "50%",  // 确保在关闭状态下与其他线条完美对齐
        },
    },
};




export default function SideBar() {
    const location = useLocation();  // 從 react-router-dom 獲取當前位置
    const [open, setOpen] = useState(false);
    const [chatRoomOpen, setChatRoomOpen] = useState(false);
    const { projectId } = useParams();
    const { currentStageIndex, setCurrentStageIndex, currentSubStageIndex, setCurrentSubStageIndex } = useContext(Context)
    const role = localStorage.getItem("role"); // Get user role from localStorage

    const menus = [
        { name: "進度看板", link: `/project/${projectId}/kanban`, icon: MdOutlineViewKanban },
        { name: "想法延伸", link: `/project/${projectId}/ideaWall`, icon: FaRegLightbulb },
        { name: "反思日誌", link: `/project/${projectId}/reflection`, icon: CgNotes },
        // { name: "成果紀錄", link: `/project/${projectId}/submitTask`, icon: BiTask },
        { name: "歷程檔案", link: `/project/${projectId}/protfolio`, icon: TiFolderOpen },
        { name: "提問專區", link: `/project/${projectId}/askQuestion`, icon: TbMessageQuestion }
    ];

    if (role === "student") {
        menus.push({ name: "成果紀錄", link: `/project/${projectId}/submitTask`, icon: BiTask });
    }
    if (role === "teacher") {
        menus.push({ name: "學習儀錶板", link: `/project/${projectId}/manageIdeaWall`, icon: LuLayoutDashboard });
    }

    if (role === "teacher") {
        menus.push({ name: "學生管理", link: `/project/${projectId}/manageStudent`, icon: LuLayoutDashboard });
    }

    if (role === "student") {
        menus.push({ name: "探究幫手", link: `/project/${projectId}/rag`, icon: TbZoomQuestion });
    }

    const [stageInfo, setStageInfo] = useState({ name: "", description: "" });
    const currentStage = localStorage.getItem("currentStage");
    const currentSubStage = localStorage.getItem("currentSubStage");
    // 定義階段名稱和它們對應的索引
    const stages = [
        { name: "定標", index: 1 },
        { name: "擇策", index: 2 },
        { name: "監評", index: 3 },
        { name: "調節", index: 4 },
        { name: "歷程", index: 5 }
    ];
    const [selected, setSelected] = useState(0);
    
    const getStageColor = (stageIndex) => {
        if (parseInt(currentStageIndex) === stageIndex) {
            return '#5BA491'; // 当前阶段
        } else if (stageIndex < parseInt(currentStageIndex)) {
            return '#7C968F'; // 小于当前阶段的阶段
        } else {
            return '#BEBEBE'; // 其他阶段
        }
    };
    const getTextColor = (stageIndex) => {
        if (parseInt(currentStage) === stageIndex) {
            return 'text-white'; // 当前阶段
        } else if (stageIndex < parseInt(currentStage)) {
            return 'text-slate-200'; // 小于当前阶段的阶段
        } else {
            return 'text-slate-700'; // 其他阶段
        }
    };
    useEffect(() => {
        const findMenuIndex = menus.findIndex(menu => location.pathname.includes(menu.link));
        if (findMenuIndex !== -1) {
            setSelected(findMenuIndex);
        } else {
            setSelected(0);  // 如果沒有匹配的路徑，可以設置為首個菜單項或任何其他預設值
        }
    }, [location]);
    const NavItem = ({ children, selected, id, setSelected }) => {

        return (
            <motion.button
                className="hover:bg-slate-200 transition-colors relative"
                onClick={() => setSelected(id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <span className="block relative z-10">{children}</span>
                <AnimatePresence>
                    {selected && (
                        <motion.span
                            className="absolute inset-0 rounded-md bg-[#5BA491]/30 z-0"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        ></motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        );
    };


    return (
        <>
            <div className={` z-10 bg-[#FFF] absolute inset-y-0 pt-16 left-0 min-h-screen duration-500 border-r-2 ${open ? "w-40" : "w-16"}`}>
                <div className='flex flex-col justify-between h-full'>
                    <div>
                        <div className={`my-2  flex ${open ? "justify-end mr-2" : "justify-center"}`} onClick={() => setOpen(!open)}>
                            <AnimatedHamburgerButton size={26} className='cursor-pointer ml-1' />
                        </div>
                        <div className=' flex flex-col  relative'>

                            {
                                projectId === undefined ? <></> :
                                    menus?.map((menu, i) => (
                                        <NavItem key={i} selected={selected === i} id={i} setSelected={setSelected}>

                                            <Link to={menu?.link} key={i} className={` group flex items-center text-sm gap-3.5 font-medium p-3  rounded-sm ml-1`}>
                                                <div>{React.createElement(menu?.icon, { size: "26" })}</div>
                                                <h2 style={{ transitionDelay: `${i + 1}00ms`, }} className={`whitespace-pre duration-500 ${!open && "opacity-0 translate-x-28 overflow-hidden"}`}>
                                                    {menu?.name}
                                                </h2>
                                                <h2 className={`${open && 'hidden'} absolute left-14 bg-white font-semibold whitespace-pre text-gray-900 rounded-md drop-shadow-lg p-0 w-0  overflow-hidden group-hover:p-1  group-hover:w-fit`}>
                                                    {menu?.name}
                                                </h2>
                                            </Link>
                                        </NavItem>

                                    ))
                            }

                            {
                                projectId && (
                                    <div className={`mt-auto mb-4 transition-all duration-500 w-full overflow-hidden pt-4`}>
                                        <div className={`flex flex-col space-y-2`}>
                                            {stages.map((stage) => (
                                                <div key={stage.index} style={{ backgroundColor: `${getStageColor(stage.index)}` }} className={`h-8 w-full flex items-center justify-center ${getTextColor(stage.index)}`}>
                                                    {<span className='text-sm font-bold'>{stage.name}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                    {
                        projectId === undefined ? <></> :
                            <span onClick={() => setChatRoomOpen(true)} className="group flex items-center text-base gap-3.5 font-medium p-3  rounded-xl cursor-pointer bg-zinc-800 ">
                                <div className='ml-1'>
                                    <BsChatDots size={"26"} className={"text-white"} />
                                </div>
                                <h2 className={`whitespace-pre text-sm  ${!open && "opacity-0 translate-x-28 overflow-hidden"} text-white `}>
                                    聊天室
                                </h2>
                                <h2 className={`${open && 'hidden'} absolute left-14 bg-white font-semibold text-sm whitespace-pre rounded-md drop-shadow-lg p-0 w-0  overflow-hidden `}>
                                    聊天室
                                </h2>
                            </span>
                    }

                </div>
            </div>
            <ChatRoom chatRoomOpen={chatRoomOpen} setChatRoomOpen={setChatRoomOpen} />
        </>
    )
};
