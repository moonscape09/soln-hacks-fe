'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Circle, Line, Text, Rect } from 'react-konva';
import { Hand, Pencil, Eraser } from 'lucide-react';

const BOARD_BG = '#f7f8fa';
const TOOLBAR_BG = '#fff';
const TOOLBAR_SHADOW = '0 2px 12px rgba(0,0,0,0.07)';
const BUTTON_BG = '#2563eb';
const BUTTON_BG_ACTIVE = '#1e40af';
const BUTTON_COLOR = '#fff';

const DRAW_MODES = {
  PAN: 'pan',
  PEN: 'pen',
  ERASER: 'eraser',
};

const Whiteboard = () => {
  const [drawMode, setDrawMode] = useState(DRAW_MODES.PAN);
  const [lines, setLines] = useState([]);
  const isDrawingRef = useRef(false);

  // Pan state
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const pointerStart = useRef({ x: 0, y: 0 });

  const [shapes, setShapes] = useState([
    {
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 120,
      height: 70,
      color: '#60a5fa',
    },
    {
      type: 'rectangle',
      x: 260,
      y: 100,
      width: 120,
      height: 70,
      color: '#fbbf24',
      shadow: true,
      cornerRadius: 16,
    },
    {
      type: 'circle',
      x: 540,
      y: 200,
      radius: 50,
      color: '#f87171',
      shadow: true,
    },
  ]);

  const [texts, setTexts] = useState([
    {
      text: 'Hello, World!',
      x: 200,
      y: 350,
      fontSize: 32,
      color: '#7c3aed',
      fontStyle: 'bold',
      shadow: true,
    },
  ]);

  // useEffect(() => console.log(lines), [lines])
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState([]);
  const socketRef = useRef(null);

useEffect(() => {
  // only open once, and only for pen/eraser
  if (
    (drawMode === DRAW_MODES.PEN || drawMode === DRAW_MODES.ERASER) &&
    (!socketRef.current || socketRef.current.readyState > WebSocket.OPEN)
  ) {
    const socket = new WebSocket('ws://localhost:4000/ws');
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnected(true);
      appendLog('🔌 Connected');
      // flush any queued messages here if you implement buffering…
    });

    socket.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      appendLog(`📥 ${event.data}`);
      if (msg.type === 'draw_line') {
        setLines((prev) => [...prev, msg.line]);
      }
    });

    // socket.addEventListener('close', () => {
    //   setConnected(false);
    //   appendLog('🔌 Disconnected');
    // });

    socket.addEventListener('error', (err) => {
      appendLog('❗ WebSocket error');
      console.error(err);
    });
  }
  // optional: tear down when you go back to PAN
  if (drawMode === DRAW_MODES.PAN && socketRef.current) {
    socketRef.current.close();
  }
}, [drawMode]);

    // Helper to push to log
    const appendLog = (entry) => {
      setLog((l) => [...l, entry].slice(-50));
    };

    // 2. Function to send a JSON‐serializable payload
    const sendMessage = (payload) => {
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        const msg = JSON.stringify(payload);
        socket.send(msg);
        appendLog(`📤 ${msg}`);
      } else {
        appendLog('⚠️ Socket not open');
      }
    };

  // Pan handlers
  const handleStageMouseDown = (e) => {
    if (drawMode === DRAW_MODES.PEN || drawMode === DRAW_MODES.ERASER) {
      handleMouseDown(e);
      return;
    }
    setIsPanning(true);
    panStart.current = { ...stagePos };
    const pos = e.target.getStage().getPointerPosition();
    pointerStart.current = { x: pos.x, y: pos.y };
  };

  const handleStageMouseMove = (e) => {
    if (drawMode === DRAW_MODES.PEN || drawMode === DRAW_MODES.ERASER) {
      handleMouseMove(e);
      return;
    }
    if (!isPanning) return;
    const pos = e.target.getStage().getPointerPosition();
    const dx = pos.x - pointerStart.current.x;
    const dy = pos.y - pointerStart.current.y;
    setStagePos({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    });
  };

  const handleStageMouseUp = (e) => {
    if (drawMode === DRAW_MODES.PEN || drawMode === DRAW_MODES.ERASER) {
      handleMouseUp(e);
      return;
    }
    setIsPanning(false);
  };

  // Drawing handlers
  const handleMouseDown = (e) => {
    if (drawMode === DRAW_MODES.PEN) {
      isDrawingRef.current = true;
      const pos = e.target.getStage().getPointerPosition();
      setLines([...lines, {
        points: [pos.x - stagePos.x, pos.y - stagePos.y],
        stroke: '#2563eb',
        strokeWidth: 3,
        globalCompositeOperation: 'source-over',
        lineCap: 'round',
      }]);
    } else if (drawMode === DRAW_MODES.ERASER) {
      isDrawingRef.current = true;
      const pos = e.target.getStage().getPointerPosition();
      setLines([...lines, {
        points: [pos.x - stagePos.x, pos.y - stagePos.y],
        stroke: '#fff',
        strokeWidth: 16,
        globalCompositeOperation: 'destination-out',
        lineCap: 'round'
      }]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawingRef.current || (drawMode !== DRAW_MODES.PEN && drawMode !== DRAW_MODES.ERASER)) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    const newLines = lines.slice(0, -1);
    lastLine.points = lastLine.points.concat([point.x - stagePos.x, point.y - stagePos.y]);
    setLines([...newLines, lastLine]);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
    const recentLine = lines[lines.length - 1];
    sendMessage(recentLine);
  };

  // Responsive sizing
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 80,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 80,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        minHeight: '100vh',
        minWidth: '100vw',
        background: BOARD_BG,
        fontFamily: 'Inter, sans-serif',
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: TOOLBAR_BG,
          boxShadow: TOOLBAR_SHADOW,
          borderRadius: 16,
          padding: '16px 32px',
          maxWidth: 520,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          zIndex: 2,
        }}
      >
        <button
          onClick={() => setDrawMode(DRAW_MODES.PAN)}
          style={{
            background: drawMode === DRAW_MODES.PAN ? BUTTON_BG_ACTIVE : BUTTON_BG,
            color: BUTTON_COLOR,
            border: 'none',
            borderRadius: 8,
            padding: '10px',
            fontWeight: 600,
            fontSize: 20,
            cursor: 'pointer',
            boxShadow: drawMode === DRAW_MODES.PAN
              ? '0 2px 8px rgba(37,99,235,0.15)'
              : '0 1px 4px rgba(0,0,0,0.04)',
            transition: 'background 0.2s, box-shadow 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
          }}
          title="Pan"
        >
          <Hand size={24} />
        </button>
        <button
          onClick={() => setDrawMode(DRAW_MODES.PEN)}
          style={{
            background: drawMode === DRAW_MODES.PEN ? BUTTON_BG_ACTIVE : BUTTON_BG,
            color: BUTTON_COLOR,
            border: 'none',
            borderRadius: 8,
            padding: '10px',
            fontWeight: 600,
            fontSize: 20,
            cursor: 'pointer',
            boxShadow: drawMode === DRAW_MODES.PEN
              ? '0 2px 8px rgba(37,99,235,0.15)'
              : '0 1px 4px rgba(0,0,0,0.04)',
            transition: 'background 0.2s, box-shadow 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
          }}
          title="Pen"
        >
          <Pencil />
        </button>
        <button
          onClick={() => setDrawMode(DRAW_MODES.ERASER)}
          style={{
            background: drawMode === DRAW_MODES.ERASER ? BUTTON_BG_ACTIVE : BUTTON_BG,
            color: BUTTON_COLOR,
            border: 'none',
            borderRadius: 8,
            padding: '10px',
            fontWeight: 600,
            fontSize: 20,
            cursor: 'pointer',
            boxShadow: drawMode === DRAW_MODES.ERASER
              ? '0 2px 8px rgba(37,99,235,0.15)'
              : '0 1px 4px rgba(0,0,0,0.04)',
            transition: 'background 0.2s, box-shadow 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
          }}
          title="Eraser"
        >
          <Eraser />
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 0,
          overflow: 'hidden',
          boxShadow: 'none',
          margin: 0,
          maxWidth: '100vw',
          maxHeight: '100vh',
          zIndex: 1,
        }}
      >
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          x={stagePos.x}
          y={stagePos.y}
          onMouseDown={handleStageMouseDown}
          onMousemove={handleStageMouseMove}
          onMouseup={handleStageMouseUp}
          style={{
            background: '#fff',
            cursor:
              drawMode === DRAW_MODES.PEN
                ? 'crosshair'
                : drawMode === DRAW_MODES.ERASER
                ? 'cell'
                : 'grab',
            transition: 'background 0.2s',
            width: '100vw',
            height: '100vh',
            display: 'block',
          }}
        >
          <Layer>
            {shapes.map((shape, i) => {
              if (shape.type === 'circle') {
                return (
                  <Circle
                    key={i}
                    x={shape.x}
                    y={shape.y}
                    radius={shape.radius}
                    fill={shape.color}
                    shadowBlur={shape.shadow ? 16 : 0}
                    shadowColor={shape.color}
                    draggable={drawMode === DRAW_MODES.PAN}
                  />
                );
              } else if (shape.type === 'rectangle') {
                return (
                  <Rect
                    key={i}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    fill={shape.color}
                    cornerRadius={shape.cornerRadius}
                    shadowBlur={shape.shadow ? 16 : 0}
                    shadowColor={shape.color}
                    draggable={drawMode === DRAW_MODES.PAN}
                  />
                );
              }
              return null;
            })}

            {texts.map((textObj, i) => (
              <Text
                key={`text-${i}`}
                x={textObj.x}
                y={textObj.y}
                text={textObj.text}
                fontSize={textObj.fontSize}
                fill={textObj.color}
                fontStyle={textObj.fontStyle || 'normal'}
                shadowBlur={textObj.shadow ? 8 : 0}
                shadowColor={textObj.color}
                draggable={drawMode === DRAW_MODES.PAN}
              />
            ))}

            {lines.map((line, i) => (
              <Line
                key={`free-${i}`}
                points={line.points}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap={line.lineCap}
                globalCompositeOperation={line.globalCompositeOperation}
                // shadowBlur={line.mode === DRAW_MODES.ERASER ? 0 : 4}
                // shadowColor={line.mode === DRAW_MODES.ERASER ? undefined : '#2563eb'}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default Whiteboard;
