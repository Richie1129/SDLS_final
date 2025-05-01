import axios from "axios";

const stageApi = axios.create({
    baseURL: "https://science2.lazyinwork.com/api/stage",
    headers:{
        "Content-Type":" application/json"
    },
})

export const getSubStage = async (currentStage) => {
    const response = await stageApi.post("/",currentStage )
    return response.data
}