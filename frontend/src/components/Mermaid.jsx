import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
});

export default function Mermaid({ chart }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && chart) {
      mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart)
        .then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        })
        .catch((e) => {
          console.error('Mermaid rendering failed', e);
          if (containerRef.current) {
            containerRef.current.innerHTML = `<div style="color: #ef4444; padding: 1rem; border: 1px solid #ef4444; border-radius: 8px;">Mermaid Error: ${e.message}</div>`;
          }
        });
    }
  }, [chart]);

  return <div ref={containerRef} className="mermaid-container" style={{ margin: '1rem 0', display: 'flex', justifyContent: 'center' }} />;
}
