import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import ColorPicker from './ColorPicker';
import AssignMember from './AssignMember';
import { getProjectUser } from '../../../api/users';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import Swal from 'sweetalert2';
import { GrFormClose } from "react-icons/gr";
import { FiEdit } from "react-icons/fi";
import { AiOutlineTag } from "react-icons/ai";
import { BsFillPersonFill } from "react-icons/bs";
import { Draggable } from 'react-beautiful-dnd';
import { socket } from '../../../utils/socket';
import toast, { Toaster } from 'react-hot-toast';


function Carditem({ data, index, columnIndex }) {
  const [open, setOpen] = useState(false)
  const [tagModalopen, setTagModalOpen] = useState(false)
  const [assignMemberModalopen, setAssignMemberModalOpen] = useState(false)
  const { projectId } = useParams();
  const [cardData, setCardData] = useState({
    "id": "",
    "title": "",
    "content": "",
    "labels": [],
    "assignees": [],
    "columnId": ""
  })
  const personImg = [
    '/public/person/man1.png', '/public/person/man2.png', '/public/person/man3.png',
    '/public/person/man4.png', '/public/person/man5.png', '/public/person/man6.png',
    '/public/person/woman1.png', '/public/person/woman2.png', '/public/person/woman3.png'
  ];
  const [menberData, setMenberData] = useState([]);
  const [labelData, setLabelData] = useState([]);

  const getProjectUserQuery = useQuery("getProjectUser", () => getProjectUser(projectId),
    {
      onSuccess: setMenberData,
      enabled: !!projectId
    }
  );

  useEffect(() => {
    // console.log('Initial data passed to Carditem:', data);
    setCardData(data);
  }, [data])

  const cardDataReset = () => {
    if (open === true) {
      setCardData(data);
    };
  }

  const cardHandleChange = (e) => {
    const { name, value } = e.target;
    setCardData(prev => ({
      ...prev,
      [name]: value
    }));
  }
  const cardHandleSubmit = () => {

    if (cardData.title.trim() !== "") {
      socket.emit("cardUpdated", { cardData, columnIndex, index, projectId });
      setOpen(false);
    } else {
      toast.error("請填寫卡片標題!");
    }
  }
  const cardHandleDelete = () => {

    Swal.fire({
      title: "刪除",
      text: "確定要刪除卡片嗎?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#5BA491",
      cancelButtonColor: "#d33",
      confirmButtonText: "確定",
      cancelButtonText: "取消"
    }).then((result) => {
      if (result.isConfirmed) {
        socket.emit("cardDelete", { cardData, columnIndex, index, projectId });
        setOpen(false);
      }
    });


  }
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
  return (
    <>
      <Draggable draggableId={data.id.toString()} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`item-container  p-2 rounded-lg mb-2 w-full shadow-lg hover:skew-y-2 ${snapshot.isDragging ? "dragging bg-customgreen/90 text-white" : "bg-white"}`}
            style={{
              ...provided.draggableProps.style,
              // 添加额外的样式调整，如必要的偏移或其他
            }}
          >
            <div className='flex justify-between'>
              <p className='text-base font-semibold truncate' style={{ maxWidth: '150px' }}>{data.title}</p>
              <FiEdit onClick={() => setOpen(true)} className='w-5 h-5 cursor-pointer' />
            </div>
            <div>
              <p className='truncate'>{data.content}</p>
            </div>
            <div className="flex justify-end items-center space-x-1">
              {data.assignees && data.assignees.map((assignee, index) => {
                const imgIndex = parseInt(assignee.id) % 9;
                const userImg = personImg[imgIndex];
                return (
                  <img src={userImg} alt="Person" className="w-8 h-8 my-1 overflow-hidden rounded-full shadow-xl object-cover" title={assignee.username} key={index} />
                )

              })}
            </div>


          </div>
        )}
      </Draggable>
      {/* <div className='flex justify-between'>
        <span className='flex text-base font-semibold'>{data.title}</span>
        <FiEdit onClick={() => {
          setOpen(true);
        }} className='w-5 h-5 cursor-pointer' />
      </div>
      <div className=" flex justify-end items-center space-x-1">
        {
          data.assignees &&
          data?.assignees.map((assignee, index) => {
            return (
              <div key={index} className={`w-8 h-8 bg-slate-100 border-[1px] border-slate-400 rounded-full flex items-center text-center p-2 shadow-xl text-xs overflow-hidden cursor-default`}>
                {assignee.username}
              </div>
            )
          })
        }
      </div> */}
      {
        cardData &&
        <Modal open={open} onClose={() => setOpen(false)} opacity={true} position={"justify-center items-center"}>
          <div className='flex justify-between'>
            <div className='flex flex-col w-2/3'>
              <input className=" rounded outline-none ring-2 p-1 ring-customgreen w-full mb-3"
                type="text"
                placeholder="title"
                name='title'
                value={cardData.title}
                onChange={cardHandleChange}
              />
              <textarea className=" rounded outline-none ring-2 ring-customgreen w-full p-1"
                rows={3}
                placeholder="Task info"
                name='content'
                value={cardData.content}
                onChange={cardHandleChange}
              />
            </div>
            <div className='flex flex-col w-1/3 ml-4'>
              {/* <button onClick={() => setTagModalOpen(true)} className="flex justify-start items-center w-full h-7 mb-2 bg-customgray rounded font-bold text-xs sm:text-sm text-black/60">
                <AiOutlineTag className='w-3 h-3 sm:w-5 sm:h-5 mx-2 text-black' />
                標籤
              </button> */}
              <button onClick={() => setAssignMemberModalOpen(true)} className="flex justify-start items-center w-full h-7 mb-2 bg-customgray rounded font-bold text-xs sm:text-sm text-black/60">
                <BsFillPersonFill className='w-3 h-3 sm:w-5 sm:h-5 mx-2 text-black' />
                指派成員
              </button>
            </div>
          </div>
          <div className='flex justify-between mt-2'>
            <div className='flex flex-col w-1/3'>
              {/* <p className="flex justify-start items-center w-full h-7 m-1 font-bold text-sm sm:text-base text-black/60 ">
                標籤
              </p>
              {
                cardData.labels &&
                cardData.labels.map((label, index) => {
                  return (
                    <div key={index} className={` ${label.bgcolor} p-2 rounded-full ${label.textcolor} text-xs font-bold text-center flex items-center w-fit h-6`}>
                      {label.content}
                    </div>
                  )
                })
              } */}
              <p className="flex justify-start items-center w-full h-7 m-1 font-bold text-sm sm:text-base text-black/60">
                指派成員
              </p>
              <div className='flex flex-row'>
                {
                  cardData.assignees &&
                  cardData.assignees.map((assignee, index) => {
                    const imgIndex = parseInt(assignee.id) % 9;
                    const userImg = personImg[imgIndex];
                    return (
                      <Tooltip key={index} children={""} content={`${assignee.username}`}>
                        <div className="relative w-8 h-8 rounded-full shadow-xl">
                          <img src={userImg} alt="Person" className="w-8 h-8  overflow-hidden rounded-full shadow-xl object-cover" key={index} />
                        </div>
                      </Tooltip>
                    )
                  })
                }
              </div>
            </div>
            <div className='flex flex-row items-end w-1/3 ml-4'>

              <button className="flex justify-center items-center w-full h-7 mb-2 bg-[#fa3c3c] rounded font-bold text-xs sm:text-sm text-white mr-2"
                onClick={cardHandleDelete}>
                刪除
              </button>
              <button className="flex justify-center items-center w-full h-7 mb-2 bg-customgreen rounded font-bold text-xs sm:text-sm text-white mr-2"
                onClick={cardHandleSubmit}
              >
                儲存
              </button>
              <button className="flex justify-center items-center w-full h-7 mb-2 bg-customgray rounded font-bold text-xs sm:text-sm text-black/60 mr-2"
                onClick={() => {
                  setOpen(false);
                  cardDataReset();
                }}>
                取消
              </button>
            </div>
          </div>
        </Modal>
      }
      {/* tag modal */}
      {/* {
        <Modal open={tagModalopen} onClose={() => setTagModalOpen(false)} opacity={false} position={"justify-end items-center m-3"}>
          <button onClick={() => setTagModalOpen(false)} className=' absolute top-1 right-1 rounded-lg bg-white hover:bg-slate-200'>
            <GrFormClose className=' w-6 h-6' />
          </button>
          <ColorPicker />
        </Modal>
      } */}
      {/* AssignMember modal */}
      {
        <Modal open={assignMemberModalopen} onClose={() => setAssignMemberModalOpen(false)} opacity={false} position={"justify-end items-center m-3"}>
          <button onClick={() => setAssignMemberModalOpen(false)} className=' absolute top-1 right-1 rounded-lg bg-white hover:bg-slate-200'>
            <GrFormClose className=' w-6 h-6' />
          </button>
          <AssignMember menberData={menberData} setMenberData={setMenberData} setCardData={setCardData} cardHandleSubmit={cardHandleSubmit} />
        </Modal>
      }
      <Toaster />
    </>
  )
}

export default React.memo(Carditem);
