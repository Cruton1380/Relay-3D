// relay-3d/hud/Minimap.jsx
import React, { useRef, useEffect } from 'react';
import './Minimap.css';

/**
 * Minimap - Bottom right coordination basin overview
 */
export default function Minimap({ nodes = [], edges = [] }) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = 'rgba(10, 14, 39, 0.9)';
    ctx.fillRect(0, 0, width, height);

    // Draw edges
    edges.forEach((edge) => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);

      if (fromNode && toNode) {
        const from = projectTo2D(fromNode.position, width, height);
        const to = projectTo2D(toNode.position, width, height);

        ctx.strokeStyle = `rgba(${hexToRgb(edge.color || 0xFFFFFF)}, 0.5)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    });

    // Draw core
    ctx.fillStyle = 'rgba(255, 229, 127, 0.8)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw nodes
    nodes.forEach((node) => {
      const pos = projectTo2D(node.position, width, height);
      const nodeColor = node.color || 0xFFD700;

      // Node glow
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 8);
      gradient.addColorStop(0, `rgba(${hexToRgb(nodeColor)}, 0.8)`);
      gradient.addColorStop(1, `rgba(${hexToRgb(nodeColor)}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Node core
      ctx.fillStyle = `rgba(${hexToRgb(nodeColor)}, 1)`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [nodes, edges]);

  // Project 3D position to 2D minimap
  function projectTo2D(pos3d, width, height) {
    const scale = 50;
    const x = width / 2 + pos3d[0] * scale;
    const y = height / 2 + pos3d[2] * scale; // Use Z for Y in top-down view
    return { x, y };
  }

  // Convert hex color to RGB string
  function hexToRgb(hex) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `${r}, ${g}, ${b}`;
  }

  return (
    <div className="relay-minimap">
      <div className="minimap-label">COORDINATION BASIN</div>
      <canvas
        ref={canvasRef}
        width={180}
        height={180}
        className="minimap-canvas"
      />
    </div>
  );
}
