import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { AiOutlineCloudDownload } from "react-icons/ai";
import { GrFormClose } from "react-icons/gr";
import Modal from '../../../components/Modal';
import FileDownload from 'js-file-download'
import Loader from '../../../components/Loader';
import { getSubmitAttachment } from '../../../api/submit';

export default function FolderModal({folderModalOpen, setFolderModalOpen, modalData}) {
    const [ queryFetch, setQueryFetch ] = useState(false);
    const { id, content, filename } = modalData; 

    const {
        isLoading,
        isError,
    } = useQuery( "getSubmitAttachment", () => getSubmitAttachment(
        id,
        { responseType:"blob"}
        ),
        {
            onSuccess: (data)=>{
                FileDownload(data, filename)
                setQueryFetch(prev => !prev);
            },
            enabled: !!queryFetch
        }
    );
    return (
        <Modal open={folderModalOpen} onClose={() => setFolderModalOpen(false)} opacity={true} position={"justify-center items-center"}> 
            <button onClick={() => setFolderModalOpen(false)} className=' absolute top-1 right-1 rounded-lg bg-white hover:bg-slate-200'>
                <GrFormClose  className=' w-6 h-6'/>
            </button> 
            <div className='flex flex-col justify-start items-center w-full'>
                <div className='flex flex-col mx-3 w-full'>
                    {
                        content ?
                        Object.entries(JSON.parse(content)).map((element, index) =>{
                            const name = element[0];
                            const content = element[1];
                            return(
                                <div className='mt-3' key={index}>
                                <span className=' font-bold text-base '>{name}:</span>
                                <span className=' font-bold text-base '>{content}</span>
                                </div>
                            )
                            
                        }):
                        <></>
                    }
                </div>
                {
                    filename? 
                    <button 
                        className="inline-flex items-center bg-white hover:bg-slate-200/80 text-slate-400 border-2 border-slate-400 font-semibold rounded-md p-1 mt-3 sm:px-4 text-base  min-w-[100px]"
                        onClick={() => {
                            setQueryFetch(prev => !prev);
                            console.log("123");
                        }}
                    >
                        <AiOutlineCloudDownload size={32} className=" text-black mr-1"/> 
                        <span>
                            下載附件
                        </span>
                    </button>:
                    <></>
                }
            </div>
        </Modal>
    )
}
