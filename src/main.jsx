import React from 'react';
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
if (location.pathname.startsWith('/admin')) {
  import('./Admin.jsx').then(({ Admin }) => root.render(<Admin/>));
} else {
  import('./Portfolio.jsx').then(({ Portfolio }) => root.render(<Portfolio/>));
}
