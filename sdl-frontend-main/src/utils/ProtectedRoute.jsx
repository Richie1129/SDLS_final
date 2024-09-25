import React, { useEffect, useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Loader from '../components/Loader';

export const ProtectedLogin = () => {
    const auth = localStorage.getItem("accessToken");
    return (
        !auth ? <Outlet /> : auth ? <Navigate to='/homepage'/> : <Loader />
    )
}

export const ProtectedRoute = () => {
    const auth = localStorage.getItem("accessToken");
    return (
        auth ? <Outlet /> : !auth ? <Navigate to='/'/> : <Loader />
    )
}