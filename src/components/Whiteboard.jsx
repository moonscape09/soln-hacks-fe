'use client';

import React, { useState, useRef } from 'react';
import { Stage, Layer, Circle, Line, Text } from 'react-konva';

const Whiteboard = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false); // toggle pen tool
  const [lines, setLines] = useState([]);
  const isDrawingRef = useRef(false);

  const [shapes] = useState([
    { type: 'circle', x: 200, y: 150, radius: 50, fill: 'skyblue' },
    { type: 'text', x: 170, y: 145, text: 'Root' },
    { type: 'line', points: [200, 200, 150, 300] },
    { type: 'circle', x: 150, y: 350, radius: 40, fill: 'pink' },
    { type: 'text', x: 135, y: 345, text: 'Left' },
  ]);

  const handleMouseDown = (e) => {
    if (!drawingMode) return;
    isDrawingRef.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawingRef.current || !drawingMode) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    const newLines = lines.slice(0, -1);

    lastLine.points = lastLine.points.concat([point.x, point.y]);
    setLines([...newLines, lastLine]);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  return (
    <div>
      <div style={{ textAlign: 'center', margin: '10px' }}>
        <button onClick={() => setDrawingMode(!drawingMode)}>
          {drawingMode ? '✋ Exit Pen Mode' : '🖊️ Enter Pen Mode'}
        </button>
      </div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight - 80}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
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
                  fill={shape.fill}
                  draggable={!drawingMode}
                />
              );
            } else if (shape.type === 'text') {
              return (
                <Text
                  key={i}
                  x={shape.x}
                  y={shape.y}
                  text={shape.text}
                  fontSize={18}
                  fill="black"
                  draggable={!drawingMode}
                />
              );
            } else if (shape.type === 'line') {
              return (
                <Line
                  key={i}
                  points={shape.points}
                  stroke="black"
                  strokeWidth={2}
                  lineCap="round"
                  lineJoin="round"
                />
              );
            } else {
              return null;
            }
          })}

          {lines.map((line, i) => (
            <Line
              key={`free-${i}`}
              points={line.points}
              stroke="red"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation="source-over"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default Whiteboard;
