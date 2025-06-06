import axios from "axios";


const nodeApi = axios.create({
    baseURL: "https://sdls.sdlswuret.systems/api/node",
    headers:{
        "Content-Type":" application/json"
    },
})

//node
export const getNodes = async (ideaWallId) => {
    const response = await nodeApi.get(`/${ideaWallId}`)
    return response.data
}

// export const createNode = async (data) => {
//     const response = await nodeApi.post("/", data)
//     return response.data
// }

export const getNodeRelation = async (ideaWallId) => {
    const response = await nodeApi.get(`/node_relation/${ideaWallId}`)
    return response.data
}

// export const createNodeRelation = async (data) => {
//     const response = await nodeApi.post("/node_relation", data)
//     return response.data
// }