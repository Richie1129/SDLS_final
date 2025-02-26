import { io } from "socket.io-client";

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://sdls.sdlswuret.systems';

export const socket = io(URL, {
    autoConnect: false 
});