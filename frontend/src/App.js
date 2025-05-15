import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import './App.css';
import IndexPage from "pages/IndexPage"
import SessionProvider from "contexts/session";
import MessageProvider from "contexts/message";
import HostPage from 'pages/HostPage';
import ParticipantPage from 'pages/ParticipantPage';

function App() {
  return (
  <Router>
    <SessionProvider>
    <MessageProvider>
      <Routes>
        <Route path="/" element={<IndexPage/>}></Route>
        <Route path="/host" element={<HostPage/>}></Route>
        <Route path="/participant" element={<ParticipantPage/>}></Route>
      </Routes>
      </MessageProvider>
    </SessionProvider>
  </Router>
  );
}

export default App;
