import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../../components/Modal';
import IdeaWallSideBar from './components/IdeaWallSideBar';
import TopBar from '../../components/TopBar';
import { Network } from 'vis-network';
import { visNetworkOptions as option } from '../../utils/visNetworkOptions'
import svgConvertUrl from '../../utils/svgConvertUrl';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getIdeaWall } from '../../api/ideaWall';
import { getNodes, getNodeRelation } from '../../api/nodes';
import { socket } from '../../utils/socket';
import SideBar from '../../components/SideBar';
import toast, { Toaster } from 'react-hot-toast';
import Lottie from "lottie-react";
import Adding_icon from "../../assets/AnimationAddingNode.json";
import Timer from './components/Timer';

export default function IdeaWall() {
    const container = useRef(null);
    const url = svgConvertUrl("node");
    const { projectId } = useParams();
    const [nodes, setnodes] = useState([]);
    const [nodeData, setNodeData] = useState({});
    const [edges, setEdges] = useState([]);
    const [createOptionModalOpen, setCreateOptionModalOpen] = useState(false);
    const [buildOnOptionModalOpen, setBuildOnOptionModalOpen] = useState(false);
    const [createNodeModalOpen, setCreateNodeModalOpen] = useState(false);
    const [updateNodeModalOpen, setUpdateNodeModalOpen] = useState(false);
    const [canvasPosition, setCanvasPosition] = useState({});
    const [ideaWallInfo, setIdealWallInfo] = useState({ id: "1", name: "", type: "" })
    const [selectNodeInfo, setSelectNodeInfo] = useState({ id: "", title: "", content: "", owner: "", createdAt: "", ideaWallId: "", projectId: projectId });
    const [buildOnNodeId, setBuildOnId] = useState("")
    const [tempid, setTempId] = useState("")
    const [projectUsers, setProjectUsers] = useState([{ id: "", username: "" }]);
    const [hovering, setHovering] = useState(false);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const userId = localStorage.getItem("id");
    const colors = [
        "#5BA491", "#26547C", "#F25757", "#AF7A6D", "#183446", "#9395D3", "#FF6542", "#78290F", "#DEA47E", "#9DACFF", "#2F3061", "#FFD166"
    ];

    const ideaWallInfoQuery = useQuery(
        'ideaWallInfo',
        // () => getIdeaWall(projectId, `${currentStage}-${currentSubStage}`),
        () => getIdeaWall(projectId, "1-1"),
        {
            onSuccess: (data) => {

                setIdealWallInfo(data)
                if (data) {
                    const { id } = data
                    setTempId(id)
                }
            },
        }
    )
    const getNodesQuery = useQuery({
        queryKey: ['ideaWallDatas', tempid],
        queryFn: () => getNodes(tempid),
        // The query will not execute until the userId exists
        onSuccess: setnodes,
        enabled: !!tempid,
        // staleTime: 5 * 60 * 1000,
        retryOnMount: false
    });

    const getNodeRelationQuery = useQuery({
        queryKey: ['ideaWallEdgesDatas', tempid],
        queryFn: () => getNodeRelation(tempid),
        // The query will not execute until the userId exists
        onSuccess: setEdges,
        enabled: !!tempid,
        retryOnMount: false
    });

    // convert node to svg
    useEffect(() => {
        const temp = [];
        nodes.map((item) => {
            const nodeColor = colors[item.colorindex - 1 % colors.length]; // Use modulo to cycle through colors if index exceeds array length

            item.image = svgConvertUrl(item.title, item.owner, item.createdAt, nodeColor);


            item.shape = "image";
            temp.push(item);
        });
    }, [nodes]);

    // socket
    useEffect(() => {
        function nodeUpdateEvent(data) {
            if (data) {
                console.log(data);
                getNodesQuery.refetch();
                getNodeRelationQuery.refetch();
                // setnodes(prevNodes => [...prevNodes, data]); // 假設data是新節點信息

            }
        }
        socket.connect();
        socket.emit("join_project", projectId);

        socket.on("nodeUpdated", nodeUpdateEvent);
        return () => {
            socket.off("nodeUpdated", nodeUpdateEvent);

            // socket.disconnect();
        }
    }, [socket, projectId])

    // vis network
    useEffect(() => {
        const network =
            container.current &&
            new Network(container.current, { nodes, edges }, option);

        network?.on("click", () => {
            setCreateOptionModalOpen(false);
            setBuildOnOptionModalOpen(false);
        })

        network?.on("doubleClick", () => {
        })

        network?.on("oncontext", (properties) => {
            const { pointer, event, nodes } = properties;
            event.preventDefault();
            const x_coordinate = pointer.DOM.x;
            const y_coordinate = pointer.DOM.y;
            const oncontextSelectNode = network.getNodeAt({ x: x_coordinate, y: y_coordinate })
            if (oncontextSelectNode) {
                setBuildOnOptionModalOpen(true);
                setBuildOnId(oncontextSelectNode)
            } else {
                setCreateOptionModalOpen(true);
            }
            setCanvasPosition({ x: x_coordinate, y: y_coordinate })
        })

        network?.on("selectNode", ({ nodes: selectNodes }) => {
            setUpdateNodeModalOpen(true);
            let nodeId = selectNodes[0];
            let nodeInfo = nodes.filter(item => item.id === nodeId)
            setSelectNodeInfo(nodeInfo[0])
        })

        return () => {
            network?.off("click", ({ event }) => {
                console.log(event);
            })
            network?.off("selectNode", ({ event }) => {
                console.log(event);
            })
        }
    }, [container, nodes, edges]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "title") {
            setTitle(value);
        } else if (name === "content") {
            setContent(value);
        }


        setNodeData((prevData) => ({
            ...prevData,
            [name]: value,
            ideaWallId: ideaWallInfo.id,
            owner: localStorage.getItem("username"),
            from_id: buildOnNodeId,
            projectId: projectId,
            colorindex: userId
        }));
    };

    const handleUpdataChange = (e) => {
        const { name, value } = e.target;
        setSelectNodeInfo((prevData) => ({
            ...prevData,
            [name]: value,
            ideaWallId: ideaWallInfo.id,
            owner: localStorage.getItem("username"),
            projectId: projectId,
            colorindex: userId
        }));
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault()
        if (title.trim() !== "" && content.trim() !== "") {
            setCreateNodeModalOpen(false);
            socket.emit('nodeCreate', nodeData);
            setBuildOnId("");
        } else {
            toast.error("標題及內容請填寫完整!");
        }
    }
    const handleUpdateSubmit = (e) => {
        e.preventDefault()
        if (selectNodeInfo.title.trim() !== "" && selectNodeInfo.content.trim() !== "") {
            setUpdateNodeModalOpen(false)
            socket.emit('nodeUpdate', selectNodeInfo)
        } else {
            toast.error("標題及內容請填寫完整!");
        }
    }

    const handleDelete = (e) => {
        e.preventDefault()
        setUpdateNodeModalOpen(false)
        socket.emit('nodeDelete', selectNodeInfo)

    }

    const handleMouseEnter = () => {
        setHovering(true);
    };

    const handleMouseLeave = () => {
        setHovering(false);
    };

    return (
        <div>
            <div ref={container} className=' h-screen w-full pl-[70px] pt-[70px]' />
            {/* create option */}
            <Modal open={createOptionModalOpen} onClose={() => setCreateOptionModalOpen(false)} opacity={false} modalCoordinate={canvasPosition} custom={"w-25 h-12"}>
                <div>
                    <button onClick={() => {
                        setNodeData({}) // 重置 nodeData 状态
                        setTitle("")
                        setContent("")
                        setCreateOptionModalOpen(false)
                        setCreateNodeModalOpen(true)
                    }} className='w-full h-full p-2 rounded-md bg-white hover:bg-slate-100 text-sm'>
                        建立想法
                    </button>
                    <button onClick={() => setCreateOptionModalOpen(false)} className='w-full h-full p-2 rounded-md bg-white hover:bg-slate-100 text-sm'>
                        取消
                    </button>
                </div>
            </Modal>
            {/* build on */}
            <Modal open={buildOnOptionModalOpen} onClose={() => setBuildOnOptionModalOpen(false)} opacity={false} modalCoordinate={canvasPosition} custom={"w-30 h-15"}>
                <div>
                    <button onClick={() => {
                        setNodeData({}) // 重置 nodeData 状态
                        setTitle("")
                        setContent("")
                        setBuildOnOptionModalOpen(false)
                        setCreateNodeModalOpen(true)
                    }} className='w-full h-full p-2 rounded-md bg-white hover:bg-slate-100 text-sm'>
                        延伸想法
                    </button>
                    <button onClick={() => setBuildOnOptionModalOpen(false)} className='w-full h-full p-2 rounded-md bg-white hover:bg-slate-100 text-sm'>
                        取消
                    </button>
                </div>
            </Modal>
            {/* create modal */}
            <Modal open={createNodeModalOpen} onClose={() => setCreateNodeModalOpen(false)} opacity={false} position={"justify-center items-center"}>
                <div className='flex flex-col p-3'>
                    <h3 className=' font-bold text-base mb-3'>建立想法</h3>
                    <p className=' font-bold text-base mb-3'>標題</p>
                    <input className=" rounded outline-none ring-2 p-1 ring-customgreen w-full mb-3"
                        type="text"
                        placeholder="標題"
                        name='title'
                        value={title}
                        onChange={handleChange}
                    />
                    <p className=' font-bold text-base mb-3'>內容</p>
                    <textarea className=" rounded outline-none ring-2 ring-customgreen w-full p-1 resize-none overflow-auto"
                        rows={5}
                        placeholder="內容"
                        name='content'
                        value={content}
                        onChange={handleChange}
                    />
                </div>
                <div className='flex justify-end m-2'>
                    <button onClick={() => setCreateNodeModalOpen(false)} className="mx-auto w-full h-7 mb-2 bg-customgray rounded font-bold text-xs sm:text-sm text-black/60 mr-2" >
                        取消
                    </button>
                    <button onClick={handleCreateSubmit} style={{ backgroundColor: "#5BA491" }} className="mx-auto w-full h-7 mb-2  rounded font-bold text-xs sm:text-sm text-white">
                        新增
                    </button>

                </div>
            </Modal>
            {/* update modal */}
            {
                selectNodeInfo &&
                <Modal open={updateNodeModalOpen} onClose={() => setUpdateNodeModalOpen(false)} opacity={false} position={"justify-center items-center"}>
                    <div className='flex flex-col p-3'>
                        <h3 className=' font-bold text-base mb-3'>檢視便利貼</h3>
                        <p className=' font-bold text-base mb-3'>標題</p>
                        <input className=" rounded outline-none ring-2 p-1 ring-customgreen w-full mb-3"
                            type="text"
                            placeholder="標題"
                            name='title'
                            value={selectNodeInfo.title}
                            onChange={handleUpdataChange}
                            disabled={localStorage.getItem("username") !== selectNodeInfo.owner}
                        />
                        <p className=' font-bold text-base mb-3'>內容</p>
                        <textarea className=" rounded outline-none ring-2 ring-customgreen w-full p-1 resize-none overflow-auto"
                            rows={5}
                            placeholder="內容"
                            name='content'
                            value={selectNodeInfo.content}
                            onChange={handleUpdataChange}
                            disabled={localStorage.getItem("username") !== selectNodeInfo.owner}
                        />
                        <p className=' font-bold text-base mt-3'>建立者: {selectNodeInfo.owner}</p>
                    </div>
                    {
                        localStorage.getItem("username") === selectNodeInfo.owner ?
                            (
                                <div className='flex flex-row justify-between m-2'>
                                    <button onClick={handleDelete} className="w-16 h-7 bg-red-500 rounded font-bold text-sm sm:text-bas text-white mr-2" >
                                        刪除
                                    </button>
                                    <div className='flex'>
                                        <button onClick={() => setUpdateNodeModalOpen(false)} className="w-16 h-7  bg-customgray rounded font-bold text-sm sm:text-bas text-black/60 mr-2" >
                                            取消
                                        </button>
                                        <button onClick={handleUpdateSubmit} className="w-16 h-7 bg-customgreen rounded font-bold text-sm sm:text-bas text-white">
                                            儲存
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className='flex justify-end m-2'>
                                    <button onClick={() => setUpdateNodeModalOpen(false)} className="mx-auto w-1/3 h-7 mb-2 bg-customgreen rounded font-bold text-xs sm:text-base text-white mr-2" >
                                        關閉
                                    </button>
                                </div>
                            )
                    }
                </Modal>
            }
            <Timer />
            <button
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => {
                    setNodeData({});  // 重置 nodeData 状态
                    setTitle("");
                    setContent("");
                    setCreateOptionModalOpen(false);
                    setCreateNodeModalOpen(true);
                }}
                aria-label="新增節點"
                className={`fixed bottom-5 right-5 flex items-center justify-center text-2xl transition duration-300 ${hovering ?"scale-110" : "scale-100" } `}
            >
                <Lottie
                    className="w-28"
                    animationData={Adding_icon}
                    loop={false}
                    autoplay={false}
                />
            </button>
            <Toaster />
        </div>
    )
}