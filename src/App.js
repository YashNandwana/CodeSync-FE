import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import CodeEditorPage from './CodeEditorPage'; // Import the CodeEditorPage component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/codeeditor/:roomId" element={<CodeEditorPage />} /> {/* Render CodeEditorPage when URL is "/codeeditor" */}
      </Routes>
    </Router>
  );
}

export default App;




