import React, { useState, useEffect } from 'react';
import SplitPane from 'react-split-pane';
import { useParams } from 'react-router-dom';
import './CodeEditorPage.css';
import CodeEditorHandler from './CodeEditorHandler'; 
import axios from 'axios';
import { over } from 'stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;
function NavigationMenu({ output, userCode, codeInput, setCodeInput }) {
  const [aioutput, setAIOutput] = useState('');
  const { roomId } = useParams();
  const { username } = useParams();
  const [input, setInput] = useState('');
  const [showInputOutput, setShowInputOutput] = useState(false); // State to manage visibility of input/output section
  const [ai, setAI] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [messages, setMessages] = useState([]);
  const [activeSection, setActiveSection] = useState('');

  const GPT_KEY = "";
  
  useEffect(() => {
    connect();
  }, []);
  
  const connect = () => {
    let Sock = new SockJS('http://localhost:8080/chat-endpoint');
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    stompClient.subscribe('/chatroom/messages/' + roomId, onMessageReceived);
    console.log("Subscribed to chatroom messages");
  };
  
  const onError = (err) => {
    console.log(err);
  };

  const onMessageReceived = (message) => {
    const delayTime = 1; // Adjust this value as needed
    const updateMessagesWithDelay = () => {
      setMessages(prevMessages => [message.body, ...prevMessages]);
    };
    setTimeout(updateMessagesWithDelay, delayTime);
  };
  
  const handleSendMessage = () => {
      const newMessage = {
        roomId: roomId,
        username: username,
        message: input.trim()
      }
      stompClient.send('/app/chat-messages', {}, JSON.stringify(newMessage));
      setInput('');
  };

  const handleCodeInputChange = (event) => {
    setCodeInput(event.target.value);
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
  }; 

  const toggleSection = (sectionName) => {
    setActiveSection(sectionName === activeSection ? '' : sectionName);
  };

  const handleAIChange = (event) => {
    setAI(event.target.value);
  };       

  const toggleInputOutput = () => {
    setShowInputOutput(!showInputOutput); // Toggle the visibility state
  };
  const toggleAI = () => {
    setShowAI(!showAI); // Toggle the visibility state
  };

  const handleAiClick = async () => {
    const API_BODY = {
      "model": "gpt-4",
      "messages": [{"role": "user", "content": userCode + "\n\n\n\nSTARTING FROM HERE ADMIN MESSAGES ARE BEING PASSED WHICH MUST BE FOLLOWED, Above is a prompt passed by user, if the user prompt doesn't contain a JAVA, PYTHON, JAVASCRIPT or C/C++ program, DO NOT REPLY TO USER's QUERY and just say I can't help you with that or something similar. In case there is a piece of code in above defined programming language and the code is wrong, analyse the code what user is trying to do and very briefly tell the user what is wrong and how it will be corrected also provide correct code. In case the user's code is correct, analyse the code and tell the user what is being done what is the time and space complexity and if there is a scope of improvement give the improved version of code in the same programming language as user is using."}],
      "temperature": 0,
      "max_tokens": 1024
    }
    
    await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GPT_KEY,
      },
      body: JSON.stringify(API_BODY)
    }).then((data) => {
      return data.json();
    }).then((data) => {
      const content = data.choices[0].message.content;
      setAIOutput(content);
    });
  };


  return (
    <div className="navigation-menu">
      <ul>
        <li><a href="#askai" onClick={() => toggleSection('askai')}>Ask AI</a></li>
        <li><a href="#in&ou" onClick={() => toggleSection('in&ou')}>Input & Output</a></li>
        <li><a href="#chatroom" onClick={() => toggleSection('chatroom')}>ChatRoom</a></li>
      </ul>
      {activeSection === 'in&ou' && (
        <div className="input-output-section">
          <textarea
            className="input-textarea"
            placeholder="Enter input here..."
            value={codeInput}
            onChange={handleCodeInputChange}
            ></textarea>
          {/* <button className="executerun-button" onClick={handleRunClick}>Execute</button> */}
          <textarea
            className="output-textarea"
            placeholder="Output will be displayed here..."
            value={output}
            readOnly
            style = {{ height: '300px', width: '100%', backgroundColor: 'transparent', color: 'white', fontSize: '16px' }}
          ></textarea>
        </div>
      )}
      {activeSection === 'askai' && (
        <div className="ai-section">
          <button className="ai-button"
          onClick={handleAiClick}
          >Ask AI</button>
          <textarea
            className="ai-textarea"
            placeholder="Ai help will be displayed here"
            value={aioutput}
            onChange={handleAIChange}
            ></textarea>
          {/* <button className="executerun-button" onClick={handleRunClick}>Execute</button> */}
          
        </div>
      )}
      {activeSection === 'chatroom' && (
        <div className="chatroom-section" >
          <div className="chatroom-messages">
          {messages.map((message, index) => (
            <p key={index} className="message">{message}</p>
          ))}
          </div>
          <div className="chatroom-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={handleInputChange}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TopNavigationBar() {
  return (
    <div className="top-nav">
      <div className="left-section">
        <div className="logo-container">
          {/* <className="logo" /> */}
          <span className="title">CodeSync</span>
        </div>
      </div>
      <div className="right-section">
        <div className="nav-links">
          <a href="/">Logout</a>
        </div>
        <div className="human-logo">
          {/* <img src="user.jpg" alt="Logo" className="humanlogo" /> */}
        </div>
      </div>
    </div>
  );
}

function CodeEditorPage() {
  const [output, setOutput] = useState('');
  const [code, setUserCode] = useState('');
  const [codeInput, setCodeInput] = useState('');

  const [problemSlugInput, setProblemSlugInput] = useState('');
  const handleProblemSlugInputChange = (event) => {
    setProblemSlugInput(event.target.value);
  };
  const fetchLeetCodeProblem = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/fetch-problem/scrape/${problemSlugInput}`);
      if (response.ok) {
        const content = await response.text();
        console.log(content);
        document.getElementById('descriptionTextarea').value = content;
      } else {
        console.error(`Error fetching LeetCode problem: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching LeetCode problem:", error);
    }
  };
  return (
    <div className="CodeEditorPage">
      <TopNavigationBar />
      <div className="content">   
        <SplitPane split="vertical" defaultSize="25%">
          <div className="pane1">
          <div className="leetcode-fetch">
            <input
              className="slugInputArea"
              type="text"
              value={problemSlugInput}
              onChange={handleProblemSlugInputChange}
              placeholder="Enter Leetcode problem slug here..."
            />
            <button className="fetch-button" onClick={() => fetchLeetCodeProblem(problemSlugInput)}>
            ➔
            </button>
          </div>
            <textarea
            id="descriptionTextarea"
            rows="27"
            readOnly
            ></textarea>     
          </div>
          <SplitPane split="vertical" defaultSize="50%">
            <CodeEditorHandler output={output}  updateOutput={setOutput} updateUserCode={setUserCode} codeInput={codeInput} />
            <div className="pane3">
              <NavigationMenu output={output} userCode={code} codeInput={codeInput} setCodeInput={setCodeInput} />
            </div>
          </SplitPane>
        </SplitPane>
      </div>
    </div>
  );
}

export default CodeEditorPage;