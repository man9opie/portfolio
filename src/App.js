import React, { useState, useEffect, useRef } from "react";
import "./App.css";

export default function TerminalPortfolio() {
  const [output, setOutput] = useState([]); // [{ type, text }]
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [theme, setTheme] = useState("dark");
  const [isTyping, setIsTyping] = useState(true);
  const outputRef = useRef(null);
  const inputRef = useRef(null);

  // ======================
  // 可用命令
  // ======================
  const commands = {
    help: `Available commands:
  about      Show information about me
  projects   List my projects
  contact    How to reach me
  resume     View my resume
  theme      Toggle between dark and light mode
  clear      Clear the screen
  help       Show this help message`,

    about: `Hi, I'm Andi Chen 👋 I'm a recent graduate at Stony Brook University with a Computer Science degree. I am passionate about Full Stack development, ML, and cloud systems.`,

    projects: `Some of my projects:
  - RF Coil Array for 7T MRI
  - Cloud-Native Image Classifier (AWS + PyTorch)
  - Claims Management System (Django + HTMX)
  - Friend Recommendation Algorithm`,

    contact: `📧 andichen0111@gmail.com
🔗 LinkedIn: https://www.linkedin.com/in/andi-chen-9b0414238/
💻 GitHub: https://github.com/man9opie`,

    resume: `Opening resume... (simulated)
You can view it at: https://andichen.me/resume.pdf`,

    theme: (setTheme, theme) => {
      const newTheme = theme === "dark" ? "light" : "dark";
      setTheme(newTheme);
      return `Theme switched to ${newTheme} mode.`;
    },
  };

  // ======================
  // 启动打字机动画
  // ======================
  useEffect(() => {
    const introLines = [
      "Initializing system...",
      "Loading modules...",
      "Welcome to Andi's Terminal Portfolio!",
      "Type 'help' to get started."
    ];

    let i = 0, j = 0;
    let finished = false;
    const speed = 10;

    setOutput([{ type: "output", text: "" }]);
    setIsTyping(true);

    const interval = setInterval(() => {
      if (finished) return;

      if (i >= introLines.length) {
        finished = true;
        clearInterval(interval);
        setIsTyping(false);
        return;
      }

      const currentLine = introLines[i];
      setOutput((prev) => {
        const copy = [...prev];
        if (!copy[i]) copy[i] = { type: "output", text: "" };
        copy[i].text = currentLine.slice(0, j);
        return copy;
      });

      j++;
      if (j > currentLine.length) {
        j = 0;
        i++;
        if (i < introLines.length) {
          setOutput((prev) => [...prev, { type: "output", text: "" }]);
        } else {
          finished = true;
          clearInterval(interval);
          setTimeout(() => setIsTyping(false), 100);
        }
      }
    }, speed);

    return () => {
      finished = true;
      clearInterval(interval);
    };
  }, []);

  // ======================
  // 打字机输出函数
  // ======================
  const typeWriterOutput = async (text) => {
    setIsTyping(true);
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let j = 0;
      setOutput((prev) => [...prev, { type: "output", text: "" }]);
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          setOutput((prev) => {
            const copy = [...prev];
            copy[prev.length - 1].text = line.slice(0, j);
            return copy;
          });
          j++;
          if (j > line.length) {
            clearInterval(interval);
            resolve();
          }
        }, 15);
      });
    }
    setIsTyping(false);
  };

  // ======================
  // 执行命令
  // ======================
  const executeCommand = async (cmd) => {
    if (!cmd) return;
    if (cmd === "clear") {
      setOutput([]);
      return;
    }

    setOutput((prev) => [
      ...prev,
      { type: "input", text: `andi@terminal:~$ ${cmd}` },
    ]);

    const commandFunc = commands[cmd];
    if (commandFunc) {
      const result =
        typeof commandFunc === "function"
          ? commandFunc(setTheme, theme)
          : commandFunc;
      await typeWriterOutput(result);
    } else {
      await typeWriterOutput(`bash: ${cmd}: command not found`);
    }
  };

  // ======================
  // 输入与历史逻辑
  // ======================
  const handleKeyDown = (e) => {
    if (isTyping) return;
    if (e.key === "Enter") {
      executeCommand(command);
      setHistory((prev) => [...prev, command]);
      setHistoryIndex(history.length + 1);
      setCommand("");
    } else if (e.key === "ArrowUp") {
      if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
        setCommand(history[historyIndex - 1]);
      }
    } else if (e.key === "ArrowDown") {
      if (historyIndex < history.length - 1) {
        setHistoryIndex(historyIndex + 1);
        setCommand(history[historyIndex + 1]);
      } else {
        setCommand("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const matches = Object.keys(commands).filter((c) =>
        c.startsWith(command)
      );
      if (matches.length === 1) setCommand(matches[0]);
    }
  };

  // ======================
  // 点击空白聚焦输入框（可选文本时不聚焦）
  // ======================
  const handleMouseDown = (e) => {
    window._mouseDown = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e) => {
    const dx = Math.abs(e.clientX - (window._mouseDown?.x || 0));
    const dy = Math.abs(e.clientY - (window._mouseDown?.y || 0));
    const isSelection =
      dx > 3 || dy > 3 || window.getSelection().toString().length > 0;
    if (!isSelection && !isTyping) inputRef.current?.focus();
  };

  useEffect(() => {
    outputRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  // ======================
  // ✅ 检测并渲染可点击链接
  // ======================
  const renderWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="terminal-link">${url}</a>`;
    });
  };

  // ======================
  // 渲染部分
  // ======================
  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={`min-h-screen p-6 font-mono transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900 text-green-400"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="max-w-3xl mx-auto">
        <div id="output" className="whitespace-pre-wrap leading-relaxed select-text">
          {output.map((line, i) => (
            <div
              key={i}
              className={line.type === "input" ? "text-teal-400" : "text-green-400"}
              dangerouslySetInnerHTML={{ __html: renderWithLinks(line.text) }}
            />
          ))}
          <div ref={outputRef} />
        </div>

        {!isTyping && (
          <div className="flex items-center mt-2">
            <span className="text-teal-400 mr-2">andi@terminal:~$</span>
            <div className="inline-flex items-center">
              <span className="typed-text">{command}</span>
              <span className="custom-cursor" />
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                className="absolute opacity-0 w-0"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
