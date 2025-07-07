import React from 'react';
import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import LoginPage from "./components/login/LoginPage";
import Home from "./components/home/Home"; // 假设你有一个主页组件
import DataManagement from "./components/data/DataManagement";

const AppRouter = () => (
    <Router>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/data" element={<DataManagement />} />
            <Route path="/" element={<Navigate to="/home" />} />
        </Routes>
    </Router>
);

export default AppRouter;
