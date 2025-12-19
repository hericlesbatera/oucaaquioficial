import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const DebugPanel = () => {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [maxLogs] = useState(50);

  useEffect(() => {
    // Interceptar console.log
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (message, type = 'log') => {
      setLogs(prev => {
        const newLogs = [...prev, { message, type, time: new Date().toLocaleTimeString() }];
        return newLogs.slice(-maxLogs);
      });
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), 'log');
    };

    console.error = (...args) => {
      originalError(...args);
      addLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), 'error');
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), 'warn');
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [maxLogs]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-2 z-50 bg-red-600 text-white px-3 py-2 rounded text-xs font-bold"
      >
        DEBUG
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
      <div className="w-full h-1/2 bg-black text-white p-3 overflow-auto rounded-t-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">Console Logs</h3>
          <button onClick={() => setIsOpen(false)} className="text-red-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-1 font-mono text-xs">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`${
                log.type === 'error'
                  ? 'text-red-400'
                  : log.type === 'warn'
                  ? 'text-yellow-400'
                  : 'text-green-400'
              }`}
            >
              <span className="text-gray-500">[{log.time}]</span> {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
