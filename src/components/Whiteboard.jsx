'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Circle, Line, Text, Rect, RegularPolygon, Ring, Arc, Arrow, Wedge } from 'react-konva';
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
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [promptText, setPromptText] = useState("");


  const [drawMode, setDrawMode] = useState(DRAW_MODES.PAN);
  const [lines, setLines] = useState([]);
  const isDrawingRef = useRef(false);

  // Pan state
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const pointerStart = useRef({ x: 0, y: 0 });

  const [shapes] = useState([
  // --- Sun (wedge rays + center) ---
  { "type": "wedge", "x": 700, "y": 80, "radius": 40, "angle": 60, "rotation": 20, "color": "orange", "stroke": "gold", "strokeWidth": 1 },
  { "type": "wedge", "x": 700, "y": 80, "radius": 40, "angle": 60, "rotation": 140, "color": "orange", "stroke": "gold", "strokeWidth": 1 },
  { "type": "wedge", "x": 700, "y": 80, "radius": 40, "angle": 60, "rotation": 260, "color": "orange", "stroke": "gold", "strokeWidth": 1 },
  { "type": "circle", "x": 700, "y": 80, "radius": 20, "color": "yellow", "stroke": "gold", "strokeWidth": 2 },

  // --- Grass/Lawn ---
  { "type": "rectangle", "x": 0, "y": 300, "width": 800, "height": 200, "color": "#a8e6cf" },

  // --- House Base ---
  { "type": "rectangle", "x": 200, "y": 250, "width": 200, "height": 120, "color": "#f4a261", "stroke": "black", "strokeWidth": 2 },
  { "type": "text", "x": 260, "y": 310, "text": "Home" },

  // --- Roof (regular polygon as triangle) ---
  { "type": "regularPolygon", "x": 300, "y": 230, "sides": 3, "radius": 115, "rotation": 0, "color": "#b5651d", "stroke": "black", "strokeWidth": 2 },

  // --- Windows ---
  { "type": "rectangle", "x": 225, "y": 270, "width": 30, "height": 30, "color": "#e0f7fa", "stroke": "black" },
  { "type": "rectangle", "x": 345, "y": 270, "width": 30, "height": 30, "color": "#e0f7fa", "stroke": "black" },

  // --- Door ---
  { "type": "rectangle", "x": 285, "y": 300, "width": 30, "height": 70, "color": "#deb887", "stroke": "black" },

  // --- Tree Trunk ---
  { "type": "rectangle", "x": 100, "y": 280, "width": 20, "height": 60, "color": "#8B4513" },

  // --- Tree Foliage (circle leaves) ---
  { "type": "circle", "x": 110, "y": 260, "radius": 30, "color": "green", "stroke": "darkgreen" },

  // --- Fence (picket style using vertical lines) ---
  { "type": "line", "points": [180, 370, 180, 330], "stroke": "white", "strokeWidth": 4 },
  { "type": "line", "points": [190, 370, 190, 330], "stroke": "white", "strokeWidth": 4 },
  { "type": "line", "points": [200, 370, 200, 330], "stroke": "white", "strokeWidth": 4 },
  { "type": "line", "points": [210, 370, 210, 330], "stroke": "white", "strokeWidth": 4 },
  { "type": "line", "points": [220, 370, 220, 330], "stroke": "white", "strokeWidth": 4 },
  { "type": "line", "points": [230, 370, 230, 330], "stroke": "white", "strokeWidth": 4 },

  // --- River ---
  { "type": "arc", "x": 600, "y": 400, "innerRadius": 0, "outerRadius": 120, "angle": 90, "rotation": 270, "color": "#00bcd4", "stroke": "#0077b6", "strokeWidth": 2 },

  // --- Scene Label ---
  { "type": "text", "x": 280, "y": 450, "text": "My Peaceful Sustainable Home", "fontSize": 18 }
]



);

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
  const handleContextMenu = (e) => {
    e.evt.preventDefault();
    setPopupPos({ x: e.evt.clientX, y: e.evt.clientY });
    setPopupVisible(true);
  };

  const handlePromptSubmit = async () => {
    setPopupVisible(false);

    // You can now send promptText to your backend LLM endpoint:
    // await fetch("/api/llm", { method: "POST", body: JSON.stringify({ prompt: promptText }) });

    console.log("Prompt sent to LLM:", promptText);
  };

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
          onContextMenu={handleContextMenu}
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
              }else if (shape.type === 'text') {
                return (
                  <Text
                  key={`text-${i}`}
                  x={shape.x}
                  y={shape.y}
                  text={shape.text}
                  fontSize={shape.fontSize}
                  fill={shape.color}
                  fontStyle={shape.fontStyle || 'normal'}
                  shadowBlur={shape.shadow ? 8 : 0}
                  shadowColor={shape.color}
                  draggable={drawMode === DRAW_MODES.PAN}
                />
                );
              }else if (shape.type === 'line') {
                return (
                  <Line
                  key={`free-${i}`}
                  points={shape.points}
                  stroke={shape.mode === DRAW_MODES.ERASER ? '#fff' : '#2563eb'}
                  strokeWidth={shape.mode === DRAW_MODES.ERASER ? 16 : 3}
                  tension={0.5}
                  lineCap="round"
                  globalCompositeOperation={shape.mode === DRAW_MODES.ERASER ? 'destination-out' : 'source-over'}
                  shadowBlur={shape.mode === DRAW_MODES.ERASER ? 0 : 4}
                  shadowColor={shape.mode === DRAW_MODES.ERASER ? undefined : '#2563eb'}
                  draggable={drawMode === DRAW_MODES.PAN}
                />
                );
              }else if (shape.type === 'arrow') {
                return (
                  <Arrow
                  key={`free-${i}`}
                  points={shape.points}
                  stroke={shape.mode === DRAW_MODES.ERASER ? '#fff' : '#2563eb'}
                  strokeWidth={shape.mode === DRAW_MODES.ERASER ? 16 : 3}
                  tension={0.5}
                  lineCap="round"
                  globalCompositeOperation={shape.mode === DRAW_MODES.ERASER ? 'destination-out' : 'source-over'}
                  shadowBlur={shape.mode === DRAW_MODES.ERASER ? 0 : 4}
                  shadowColor={shape.mode === DRAW_MODES.ERASER ? undefined : '#2563eb'}
                  draggable={drawMode === DRAW_MODES.PAN}
                />
                );
              }else if (shape.type === 'arc') {
                return (
                  <Arc
                    key={i}
                    x={shape.x}
                    y={shape.y}
                    innerRadius={shape.innerRadius}
                    outerRadius={shape.outerRadius}
                    fill={shape.color}
                    shadowBlur={shape.shadow ? 16 : 0}
                    shadowColor={shape.color}
                    angle = {shape.angle}
                    draggable={drawMode === DRAW_MODES.PAN}
                  />
                );
              }else if (shape.type === 'ring') {
                return (
                  <Ring
                    key={i}
                    x={shape.x}
                    y={shape.y}
                    innerRadius={shape.innerRadius}
                    outerRadius={shape.outerRadius}
                    fill={shape.color}
                    shadowBlur={shape.shadow ? 16 : 0}
                    shadowColor={shape.color}
                    draggable={drawMode === DRAW_MODES.PAN}
                  />
                );
              }else if (shape.type === 'regularPolygon') {
                return (
                  <RegularPolygon
                    key={i}
                    x={shape.x}
                    y={shape.y}
                    sides = {shape.sides}
                    radius = {shape.radius}
                    fill={shape.color}
                    shadowBlur={shape.shadow ? 16 : 0}
                    shadowColor={shape.color}
                    draggable={drawMode === DRAW_MODES.PAN}
                  />
                );
              }else if (shape.type === 'wedge') {
                return (
                  <Wedge
                    key={i}
                    x={shape.x}
                    y={shape.y}
                    radius={shape.radius}
                    rotation={shape.rotation}
                    fill={shape.color}
                    shadowBlur={shape.shadow ? 16 : 0}
                    shadowColor={shape.color}
                    angle = {shape.angle}
                    draggable={drawMode === DRAW_MODES.PAN}
                  />
                );
              }
              return null;
            })}

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
        {popupVisible && (
        <div
          style={{
            position: "absolute",
            top: popupPos.y,
            left: popupPos.x,
            background: "white",
            padding: "10px",
            boxShadow: "0 0 5px gray",
            borderRadius: "4px",
            zIndex: 10
          }}
        >
          <textarea
            rows={3}
            cols={30}
            placeholder="Ask the LLM to draw something..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
          />
          <br />
          <button onClick={handlePromptSubmit}>Submit</button>
          <button onClick={() => setPopupVisible(false)}>Cancel</button>
        </div>
      )}
      </div>
    </div>
  );
};

export default Whiteboard;
