import axios from 'axios';
import {redirect, useNavigate} from "react-router-dom";
import React from 'react';

const request = () => {

    // axiosInstance.get('/some-endpoint')
    //     .then(response => {
    //         // setData(response.data);
    //     })
    //     .catch(error => {
    //         console.error('Error fetching data:', error);
    //     });

    return <div>HOME</div>
}

const axiosInstance = axios.create({
    // baseURL: 'http://127.0.0.1:9915',
    timeout: 1000,
    // headers: {'Content-Type': 'application/json'},
});
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token'); // 从 localStorage 获取 token
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // 将 token 添加到请求头
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {

            window.location.href = '/login'; // 当收到401错误时跳转到登录页
        }
        return Promise.reject(error);
    }
);

axiosInstance.isSuccess = (response) => {
    return response.status === 200 && response.data.success
}
axiosInstance.isSuccess = (response, callback) => {
    const success = response.status === 200 && response.data.success;
    if (success && callback) {
        callback();
    }
    return success
}

export default axiosInstance;
