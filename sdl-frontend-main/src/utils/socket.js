import { io } from "socket.io-client";

const URL = process.env.NODE_ENV === 'production' ? undefined : 'https://science2.lazyinwork.com/';

export const socket = io(URL, {
    autoConnect: false 
});