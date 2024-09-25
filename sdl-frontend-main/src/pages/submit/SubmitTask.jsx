import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'react-query';
import { submitTask } from '../../api/submit';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { getSubStage } from '../../api/stage';
import CommonInput from './components/CommonInput';
import Loader from '../../components/Loader';
import { socket } from '../../utils/socket';
import Swal from 'sweetalert2';
import { getProject } from '../../api/project';
import CongratulationsMain_icon from "../../assets/AnimationCongratulationsMain.json";
import Congratulations_icon from "../../assets/AnimationCongratulations.json";
import Lottie from "lottie-react";
// import styles from "./bubble.module.css";

export default function SubmitTask() {
    const [taskData, setTaskData] = useState({});
    const [attachFile, setAttachFile] = useState(null);
    const navigate = useNavigate();
    const { projectId } = useParams();
    const [stageInfo, setStageInfo] = useState({ userSubmit: {} });
    const [isProjectEnded, setIsProjectEnded] = useState(false);

    const { mutate } = useMutation(submitTask, {
        onSuccess: (res) => {
            if (res.message === "done") {
                sucesssNotify("全部階段已完成")
                localStorage.setItem('stageEnd', "true")
            }
            sucesssNotify(res.message)
            localStorage.removeItem("currentStage");
            localStorage.removeItem("currentSubStage");
            socket.emit('taskSubmitted', { projectId: projectId, message: 'Task updated' });
            navigate(`/project/${projectId}/kanban`)
        },
        onError: (error) => {
            console.log(error);
            errorNotify(error.response.data.message)
        }
    })

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
            enabled: !!projectId
        }
    );

    const handleChange = e => {
        const { name, value } = e.target;
        const nameArray = Object.keys(stageInfo.userSubmit);
        setTaskData(prev => ({
            ...prev,
            [nameArray[name]]: value,
        }));
    }
    const handleAddFileChange = e => {
        // console.log(e.target.files)
        setAttachFile(e.target.files);
    }

    const handleSubmit = e => {
        e.preventDefault();  // 阻止表单默认行为
        let allFieldsFilled = true;
        for (const [key, type] of Object.entries(stageInfo.userSubmit)) {
            if (type !== "file" && (!taskData[key] || taskData[key].trim() === "")) {
                allFieldsFilled = false;
                break;
            }
        }
        if (!allFieldsFilled) {
            // 如果有未填写的字段，显示错误消息并返回
            toast.error("請確認所有欄位皆填寫完整!");
            return;
        }
    
        Swal.fire({
            title: "上傳",
            text: "確認紀錄當前階段成果?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#5BA491",
            cancelButtonColor: "#d33",
            confirmButtonText: "確定",
            cancelButtonText: "取消"
        }).then((result) => {
            if (result.isConfirmed) {
                e.preventDefault();
                const formData = new FormData();
                formData.append('projectId', projectId);
                formData.append('currentStage', localStorage.getItem('currentStage'));
                formData.append('currentSubStage', localStorage.getItem('currentSubStage'));
                formData.append('content', JSON.stringify(taskData));
                if (attachFile) {
                    for (let i = 0; i < attachFile.length; i++) {
                        formData.append("attachFile", attachFile[i])
                        console.log("attachFile[i]", attachFile)
                    }
                }
                for (let key in taskData) {
                    formData.append(key, taskData[key]);
                }
                mutate(formData);
            }
        });

    }
    const errorNotify = (toastContent) => toast.error(toastContent);
    const sucesssNotify = (toastContent) => toast.success(toastContent);
    // socket
    useEffect(() => {

        socket.connect();

    }, [socket])

    const projectQuery = useQuery(['getProject', projectId], () => getProject(projectId), {
        onSuccess: (data) => {
            console.log(data);
            setIsProjectEnded(data.ProjectEnd); // 假设返回的数据中包含 projectEnd 字段
        
        }
    });
    const BubbleText = () => {
        return (
          <h2 className="text-center text-5xl font-thin text-indigo-300">
            {"恭喜 ! 已經完成所有階段囉 ~".split("").map((child, idx) => (
              <span className={styles.hoverText} key={idx}>
                {child}
              </span>
            ))}
          </h2>
        );
      };

    return (
        isProjectEnded ?
            <div className='flex flex-col my-5 pl-20 pr-5 sm:px-20 py-16 w-full h-screen justify-center items-center'>
                <div className=' text-customgreen text-2xl font-bold'>恭喜 ! 已經完成所有階段囉 ~</div>
                <div className='flex mt-10 gap-20'>
                    <Lottie className="w-60" animationData={Congratulations_icon} />
                    <Lottie className="w-96" animationData={CongratulationsMain_icon} />
                    <Lottie className="w-60" animationData={Congratulations_icon} />
                </div>

            </div>
            :
            <div className='flex flex-col my-5 pl-20 pr-5 sm:px-20 py-16 w-full h-screen justify-center items-center'>
                {
                    getSubStageQuery.isLoading ? <Loader /> :
                        <div className='flex flex-col w-1/3 p-3 bg-white border-2 border-gray-200 rounded-lg'>
                            <h3 className=' font-bold text-xl text-center mb-3'>
                                {stageInfo.name}
                            </h3>
                            {Object.entries(stageInfo.userSubmit).map((element, index) => {
                                const name = element[0];
                                const type = element[1];
                                switch (type) {
                                    case "input":
                                        return <CommonInput key={index} handleChange={handleChange} type={type} name={name} index={index} />
                                        break;
                                    case "file":
                                        return <CommonInput key={index} handleChange={handleAddFileChange} type={type} name={name} index={index} />
                                        break;
                                    case "textarea":
                                        return <CommonInput key={index} handleChange={handleChange} type={type} name={name} index={index} />
                                        break;
                                }

                            })}
                            <div className='flex justify-end'>
                                <button onClick={e => { handleSubmit(e) }}
                                    className="mx-auto w-full h-7 my-3 bg-customgreen rounded font-bold text-xs sm:text-sm text-white">
                                    上傳
                                </button>
                            </div>
                        </div>
                }
                <Toaster />
            </div>
    )
}
