import React, { useState, createContext } from 'react'
export const Context = createContext()

export const ContextProvider = (props) => {

        const [currentStageIndex, setCurrentStageIndex] = useState(parseInt(localStorage.getItem("currentStage"), 10) || 1);
        const [currentSubStageIndex, setCurrentSubStageIndex] = useState(parseInt(localStorage.getItem("currentSubStage"), 10) || 1);
        return (
            <Context.Provider value={{ currentStageIndex, setCurrentStageIndex, currentSubStageIndex, setCurrentSubStageIndex}}>
                {props.children}
            </Context.Provider>
        )
    }