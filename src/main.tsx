import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/public-sans';
import '@fontsource-variable/fraunces';
import './styles.css';
import { AppProvider } from './lib/store';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><AppProvider><App /></AppProvider></BrowserRouter></React.StrictMode>,
);
