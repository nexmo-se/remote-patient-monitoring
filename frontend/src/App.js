import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import './App.css';
import IndexPage from "pages/IndexPage"
import SessionProvider from "contexts/session";
import MessageProvider from "contexts/message";
import NursePage from 'pages/NursePage';
import PatientPage from 'pages/PatientPage';

function App() {
  return (
  <Router>
    <SessionProvider>
    <MessageProvider>
      <Routes>
        <Route path="/" element={<IndexPage/>}></Route>
        <Route path="/nurse" element={<NursePage/>}></Route>
        <Route path="/patient" element={<PatientPage/>}></Route>
      </Routes>
      </MessageProvider>
    </SessionProvider>
  </Router>
  );
}

export default App;
