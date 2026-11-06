import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import 'modern-normalize/modern-normalize.css';
import './styles.css';
import App from './App.jsx';
import { initState } from './state.js';

initState();

const container = document.getElementById('root');

/* 容器里已经有服务器渲染的 HTML → 接管；是空的 → 从头渲染 */
if (container.hasChildNodes()) {
  hydrateRoot(container, <StrictMode><App /></StrictMode>);
} else {
  createRoot(container).render(<StrictMode><App /></StrictMode>);
}
