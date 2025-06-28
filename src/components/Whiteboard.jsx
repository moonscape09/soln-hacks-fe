'use client';

import React, { useState, useRef } from 'react';
import { Stage, Layer, Circle, Line, Text, Rect } from 'react-konva';

const BOARD_BG = '#f7f8fa';
const TOOLBAR_BG = '#fff';
const TOOLBAR_SHADOW = '0 2px 12px rgba(0,0,0,0.07)';
const BUTTON_BG = '#2563eb';
const BUTTON_BG_ACTIVE = '#1e40af';
const BUTTON_COLOR = '#fff';

const Whiteboard = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [lines, setLines] = useState([]);
  const isDrawingRef = useRef(false);

  // Pan state
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const pointerStart = useRef({ x: 0, y: 0 });

  const [shapes] = useState([
    {
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 120,
      height: 70,
      color: '#60a5fa',
      shadow: true,
      cornerRadius: 16,
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

  const [texts] = useState([
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

  // Pan handlers
  const handleStageMouseDown = (e) => {
    if (drawingMode) {
      handleMouseDown(e);
      return;
    }
    setIsPanning(true);
    panStart.current = { ...stagePos };
    const pos = e.target.getStage().getPointerPosition();
    pointerStart.current = { x: pos.x, y: pos.y };
  };

  const handleStageMouseMove = (e) => {
    if (drawingMode) {
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
    if (drawingMode) {
      handleMouseUp(e);
      return;
    }
    setIsPanning(false);
  };

  // Drawing handlers
  const handleMouseDown = (e) => {
    if (!drawingMode) return;
    isDrawingRef.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x - stagePos.x, pos.y - stagePos.y] }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawingRef.current || !drawingMode) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    const newLines = lines.slice(0, -1);
    lastLine.points = lastLine.points.concat([point.x - stagePos.x, point.y - stagePos.y]);
    setLines([...newLines, lastLine]);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
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
          gap: 24,
          zIndex: 2,
        }}
      >
        <button
          onClick={() => setDrawingMode(!drawingMode)}
          style={{
            background: drawingMode ? BUTTON_BG_ACTIVE : BUTTON_BG,
            color: BUTTON_COLOR,
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontWeight: 600,
            fontSize: 18,
            cursor: 'pointer',
            boxShadow: drawingMode
              ? '0 2px 8px rgba(37,99,235,0.15)'
              : '0 1px 4px rgba(0,0,0,0.04)',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
        >
          {drawingMode ? '✋ Exit Pen Mode' : '🖊️ Enter Pen Mode'}
        </button>
        <span
          style={{
            color: '#64748b',
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: 0.1,
          }}
        >
          {drawingMode ? 'Draw: drag to draw' : 'Pan: drag to move board'}
        </span>
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
            cursor: drawingMode ? 'crosshair' : 'grab',
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
                    draggable={!drawingMode}
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
                    cornerRadius={shape.cornerRadius || 12}
                    shadowBlur={shape.shadow ? 16 : 0}
                    shadowColor={shape.color}
                    draggable={!drawingMode}
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
                draggable={!drawingMode}
              />
            ))}

            {lines.map((line, i) => (
              <Line
                key={`free-${i}`}
                points={line.points}
                stroke="#2563eb"
                strokeWidth={3}
                tension={0.5}
                lineCap="round"
                globalCompositeOperation="source-over"
                shadowBlur={4}
                shadowColor="#2563eb"
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default Whiteboard;
