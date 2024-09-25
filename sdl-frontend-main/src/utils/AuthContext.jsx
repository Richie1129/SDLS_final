import React, { useState, createContext } from "react";
const AuthContext = createContext([{}, ()=>{}]);

const AuthProvider = props => {
    const [state, setState] = useState({})
    
    return(
        <AuthContext.Provider value = {[state, setState]}>
            {props.children}
        </AuthContext.Provider>
    ) 
}
export  {AuthContext, AuthProvider};