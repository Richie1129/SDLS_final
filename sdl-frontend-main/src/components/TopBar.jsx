import React, { useState, useEffect, useContext } from 'react';
import { IoIosNotificationsOutline } from "react-icons/io";
import { BsChevronDown, BsPlusCircleDotted } from "react-icons/bs";
import { TbBell } from "react-icons/tb"; // 引入鈴鐺圖示
import { AiOutlineDashboard } from "react-icons/ai"; // 引入專案總覽圖示(原)
import { LuLayoutDashboard } from "react-icons/lu";
import { getProjectUser } from '../api/users';
import { getProject } from '../api/project';
import { useQuery } from 'react-query';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { GrFormClose } from "react-icons/gr";
import Modal from './Modal';
import Swal from 'sweetalert2';
import { socket } from '../utils/socket';
import { Context } from '../context/context';

export default function TopBar() {
  const [projectUsers, setProjectUsers] = useState([{ id: "", username: "" }]);
  const [projectInfo, setProjectInfo] = useState({});
  const [referralCodeModalOpen, setReferralCodeModalOpen] = useState(false);
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([
    { id: 1, title: '新通知1', description: '這是第一則通知的簡單描述。', isRead: false },
    { id: 2, title: '新通知2', description: '這是第二則通知的簡單描述。', isRead: true },
    { id: 3, title: '新通知3', description: '這是第三則通知的簡單描述。', isRead: false },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newNotificationModalOpen, setNewNotificationModalOpen] = useState(false); // 控制新增公告的 Modal

  const role = localStorage.getItem("role") || "guest"; // 預設值為 "guest"，避免空值
  const { currentStageIndex, setCurrentStageIndex, currentSubStageIndex, setCurrentSubStageIndex } = useContext(Context);

  const getProjectUserQuery = useQuery("getProjectUser", () => getProjectUser(projectId), {
    onSuccess: setProjectUsers,
    enabled: !!projectId,
  });

  const getProjectQuery = useQuery("getProject", () => getProject(projectId), {
    onSuccess: (data) => {
      setProjectInfo(data);
      localStorage.setItem('currentStage', data.currentStage);
      localStorage.setItem('currentSubStage', data.currentSubStage);
      setCurrentStageIndex(data.currentStage);
      setCurrentSubStageIndex(data.currentSubStage);
    },
    enabled: !!projectId,
  });

  const cleanStage = () => {
    localStorage.removeItem('currentStage');
    localStorage.removeItem('currentSubStage');
    localStorage.removeItem('stageEnd');
  };

  const handleLogout = () => {
    Swal.fire({
      title: "登出",
      text: "確定要登出嗎?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#5BA491",
      cancelButtonColor: "#d33",
      confirmButtonText: "確定",
      cancelButtonText: "取消",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        socket.disconnect();
        navigate("/");
      }
    });
  };

  const handleNotificationClick = (id) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, isRead: true } : notification
    );
    setNotifications(updatedNotifications);
  };

  const handleAddNotification = () => {
    setNewNotificationModalOpen(true);
  };

  const handleSaveNotification = (newTitle, newDescription) => {
    const newNotification = {
      id: notifications.length + 1,
      title: newTitle,
      description: newDescription,
      isRead: false,
    };
    setNotifications([...notifications, newNotification]);
    setNewNotificationModalOpen(false);
  };

  if (location.pathname === "/homepage") {
    return (
      <div className="fixed z-40 h-16 w-full bg-[#FFFFFF] flex items-center justify-between pr-5 border-b-2">
        <Link to="/homepage" className="flex px-5 items-center font-bold font-Mulish text-2xl">
          <img src="/SDLS_LOGOO.jpg" alt="Logo" className="h-14 w-auto" />
        </Link>
        <div className="flex items-center">
          <h3 className="font-bold p-1 mr-2 rounded-lg mx-3">
            {localStorage.getItem("username")}
          </h3>
          <div className="relative flex items-center">
          <button
            className="flex items-center justify-center mr-4 cursor-pointer"
            onClick={() => navigate("/overView")}
          >
            <LuLayoutDashboard size={24} />
          </button>
          </div>
          <div className="relative">
            <TbBell size={24} className="ml-2 cursor-pointer" onClick={() => setShowNotifications(!showNotifications)} />
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">通知</h3>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-center mb-2 p-2 border-b cursor-pointer"
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-sm font-bold">{notification.title}</h4>
                          <p className="text-xs text-gray-500">{notification.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 老師角色顯示新增公告按鈕 */}
                  {role === "teacher" && (
                    <button
                      className="w-full mt-2 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600"
                      onClick={handleAddNotification}
                    >
                      + 新公告
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="ml-3 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-md p-2 font-semibold">
            登出
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed z-40 h-16 w-full bg-[#FFFFFF] flex items-center justify-between pr-5 border-b-2">
      <div className="flex items-center">
        <Link to="/homepage" className="flex px-5 items-center font-bold font-Mulish text-2xl">
          <img src="/SDLS_LOGOO.jpg" alt="Logo" className="h-14 w-auto" />
        </Link>
        <p className="font-bold text-xl text-teal-900">{projectInfo.name}</p>
      </div>
      <div className="flex items-center">
        <h3 className="font-bold cursor-pointer p-1 mr-2 rounded-lg mx-3">
          {localStorage.getItem("username")}
        </h3>
        <div className="relative">
          <TbBell size={24} className="ml-2 cursor-pointer" onClick={() => setShowNotifications(!showNotifications)} />
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">通知</h3>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center mb-2 p-2 border-b cursor-pointer"
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-sm font-bold">{notification.title}</h4>
                        <p className="text-xs text-gray-500">{notification.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {role === "teacher" && (
                  <button
                    className="w-full mt-2 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600"
                    onClick={handleAddNotification}
                  >
                    + 新公告
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="ml-3 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-md p-2 font-semibold">
          登出
        </button>
      </div>
      <Modal open={newNotificationModalOpen} onClose={() => setNewNotificationModalOpen(false)}>
        <div className="p-6 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
          <h3 className="text-2xl font-semibold mb-6 text-center">新增公告</h3>
          <form>
            {/* 標題輸入 */}
            <div className="mb-4">
              <label htmlFor="newTitle" className="block text-sm font-medium text-gray-700 mb-1">
                標題
              </label>
              <input
                type="text"
                id="newTitle"
                placeholder="請輸入公告標題"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            {/* 內容輸入 */}
            <div className="mb-4">
              <label htmlFor="newDescription" className="block text-sm font-medium text-gray-700 mb-1">
                內容
              </label>
              <textarea
                id="newDescription"
                placeholder="請輸入公告內容"
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg"
              ></textarea>
            </div>
            {/* 發佈按鈕 */}
            <div className="flex justify-between">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                onClick={() => setNewNotificationModalOpen(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={() => {
                  const newTitle = document.getElementById("newTitle").value;
                  const newDescription = document.getElementById("newDescription").value;
                  handleSaveNotification(newTitle, newDescription);
                }}
              >
                發佈
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}