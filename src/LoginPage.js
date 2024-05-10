import React, { useState } from 'react';
import './LoginPage.css'; // Importing the corresponding CSS file
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  let allIds = new Set();

  function generateId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = '';
    while (allIds.has(result) || result === '') { 
      let counter = 0;
      while (counter < 10) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
      }
    }
    allIds.add(result);
    return result;
  }

  function handleJoinClick() {
    if (roomId === '' || allIds.has(roomId) === false) {
      alert("Please enter a valid room ID or create a new room");
      return;
    }
    console.log(`Joining room ${roomId} as ${username}`);
    navigate("/codeeditor/" + roomId);
  };

  return (
    <div className="LoginPage">

      <div className="logo-containerlogin">
        <img src="/codelogo.png" alt="Logo" className="logologin" />
        <h1>CodeSync</h1>
      </div>

      <div className="invitation-container">
        <p>Paste invitation room ID</p>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Room ID"
        />
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your Username"
        />
        <button onClick={handleJoinClick}>Join</button>
      </div>

      <div className="create-room-container">
        <p>If you don't have an invite, then create a <a href={`/codeeditor/${generateId()}`}>new room</a>.</p>
        {/* Add logic or a link to create a new room */}
      </div>

      <div className="divider">OR</div>

      <div className="single-room">
        <p>Don't want to collab, then join directly !!!</p>
        <button onClick={handleJoinClick}>Join</button>
      </div>
    </div>
  );
}

export default LoginPage;
