import React, {useEffect} from 'react'

export default function TaskHint({stageInfo}) {
    const {name, description, currentStage, currentSubStage} = stageInfo;

    return (
        (name && description && currentStage && currentSubStage) ?
        <div className='bg-gray-100 p-3 rounded-md shadow-md flex flex-col overflow-auto w-full h-fit max-h-[80vh]'>
            <h4 className=' flex mb-2 justify-center text-xl text-gray-600 font-bold'>
                {currentStage}-{currentSubStage}{name}
            </h4>
            <span className='flex text-lg font-bold'>任務說明</span>
            <span className=' text-md my-3 text-base leading-6 font-bold'>{description}</span>
        </div>
        : 
        <h4 className=' flex mb-2 justify-center text-xl text-gray-600 font-bold'>
            Loading
        </h4>
    )
}
