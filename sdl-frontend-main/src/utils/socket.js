import { io } from "socket.io-client";

const URL = process.env.NODE_ENV === 'production' ? undefined : 'https://science.lazyinwork.com/';

export const socket = io({
    autoConnect: false 
});