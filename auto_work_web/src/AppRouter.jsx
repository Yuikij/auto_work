import React from 'react';
import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import OfflineHome from "./components/offline/OfflineHome"; // 离线版本主页

const AppRouter = () => (
    <Router>
        <Routes>
            <Route path="/home" element={<OfflineHome />} />
            <Route path="/" element={<Navigate to="/home" />} />
        </Routes>
    </Router>
);

export default AppRouter;
