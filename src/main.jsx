import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'modern-normalize/modern-normalize.css';
import './styles.css';
import App from './App.jsx';
import { initState } from './state.js';

initState();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);