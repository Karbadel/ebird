import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles/fonts.css';
import './styles/industry.css';
import './styles/app.css';
import App from './App';

const el = document.getElementById('root');
if (!el) throw new Error('#root not found');

ReactDOM.createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
