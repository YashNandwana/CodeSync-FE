import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/worker-javascript';
import 'ace-builds/src-noconflict/ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/webpack-resolver';
import axios from 'axios';
import { over } from 'stompjs';
import SockJS from 'sockjs-client';
import CodeEditorPage from './CodeEditorPage'

const isBrowser = typeof window !== 'undefined';
if (isBrowser) {
  require('process/browser');
}

let stompClient = null;
export const CodeEditorHandler = ({ updateOutput, updateUserCode, codeInput }) => {

  const { roomId } = useParams();
  const { username } = useParams();
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [output, setOutput] = useState('');

 

  const connect = () => {
    let Sock = new SockJS('http://localhost:8080/ws-endpoint');
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    console.log("connected");
    stompClient.subscribe('/editor/code-updates/' + roomId, onCodeUpdate);
    console.log("subscribed");
  };
  
  const onError = (err) => {
    console.log(err);
  };

  const onCodeUpdate = (code) => {
    const content = code.body;
    console.log("Received code update:", content);
    setCode(content);
  };

  useEffect(() => {
    const aceScript = document.createElement('script');
    aceScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.js';
    aceScript.type = 'text/javascript';
    aceScript.async = true;
    
    document.body.appendChild(aceScript);
    connect();
    return () => {
      document.body.removeChild(aceScript);
    };
  }, []);


  const handleCodeChange = (newCode) => {
    const messageId = generateMessageId(); 
    const payload = {
      roomId: roomId,
      username: username,
      code: newCode,
      messageId: messageId,
    };
    setCode(newCode);
    updateUserCode(newCode);
    console.log(payload);
    if (stompClient && stompClient.connected) {
      stompClient.send('/app/update-code', {}, JSON.stringify(payload));
    } else {
      console.log("CLIENT NOT CONNECTED");
    }
  };
  function generateMessageId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${timestamp}`;
  }

  // Updated to manage language state correctly
  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const getLanguageId = (language) => {
    const languageMap = {
      javascript: 63,
      c_cpp: 54,
      java: 62,
      python: 71,
    };
    return languageMap[language] || 63;
  };

  const handleRunClick = async () => {
    const payload = {
      language_id: getLanguageId(selectedLanguage),
      source_code: code,
      stdin: codeInput, 
    };
    try {
      // Make a POST request to Judge0 API to submit the code
      const submissionResponse = await axios.post('https://judge0-ce.p.rapidapi.com/submissions', payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': '80bdee495emshba92524851b5f8dp199da9jsn8d472064a854'
        },
      });
      let token = submissionResponse.data.token;
      console.log(token);
      let output = '';
      let status = '';
      let jsonGetSolution = {
        status: { description: "Queue" },
        stderr: null,
        compile_output: null,
      };
      while (
        jsonGetSolution.status.description !== "Accepted" &&
        jsonGetSolution.stderr == null &&
        jsonGetSolution.compile_output == null
      ) {
        if (token) {
          let url = `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true`;
        const getSolution = await fetch(url, {
          method: "GET",
          headers: {
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            "X-RapidAPI-Key": "80bdee495emshba92524851b5f8dp199da9jsn8d472064a854",
            "content-type": "application/json",
          },
        });
        jsonGetSolution = await getSolution.json();
      }
    }
    if (jsonGetSolution.stdout) {
      const output = atob(jsonGetSolution.stdout);
        setOutput(output);
        updateOutput(output);
      } else if (jsonGetSolution.stderr) {
        const error = atob(jsonGetSolution.stderr);
        setOutput(error);
        updateOutput(error);
      } else {
        const compilation_error = atob(jsonGetSolution.compile_output);
        setOutput(compilation_error);
        updateOutput(compilation_error);
      }
    } catch (error) {
      setOutput(error.message);
    }
  };

  return (
    <div className="code-editor-handler ace-editor">
      {/* UI for selecting language */}
      <div className="language-selector">
        <select className='language-selector-dropdown'
          value={selectedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="c_cpp">C/C++</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
        </select>
      </div>
      
      <AceEditor
        mode={selectedLanguage}
        theme="monokai"
        onChange={handleCodeChange}
        value={code}
        name="code-editor"
        editorProps={{ $blockScrolling: true }}
        placeholder="Enter your code here..."
        width="100%"
        height="86%" // Adjust height as needed
        setOptions={{
          showPrintMargin: false,
          fontSize: 18,
        }}
      />
      
      {/* Button to trigger code execution */}
      <div className="run-button">
        <button onClick={handleRunClick}>Run Code</button>
      </div>
     
    </div>
  );
};

export default CodeEditorHandler;