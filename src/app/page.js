'use client';

import dynamic from "next/dynamic";

// Dynamically import client-side component
const Whiteboard = dynamic(() => import("../components/Whiteboard.jsx"), {
  ssr: false, // Prevent SSR, since Konva requires window
});

export default function Home() {
  return (
    <html>
      <body>
        <main>
      <h1 style={{ textAlign: "center", padding: "1rem" }}>
        🧠 SDGSketch Whiteboard
      </h1>
      <Whiteboard />
    </main>
      </body>
    </html>
  );
}
