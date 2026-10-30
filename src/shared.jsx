import React from 'react';
export async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options, headers: { ...(options.body && !(options.body instanceof File) ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
  const result = await response.json();
  if (!response.ok) { const error = new Error(result.error || 'Não foi possível carregar.'); error.details = result.details; error.status = response.status; throw error; }
  return result;
}
export function External({ href, children, ...props }) { return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>; }
export function Brand({ handle = '@DevGuijas' }) { return <a className="brand" href="/" aria-label="Página inicial"><span className="brand-symbol" aria-hidden="true">&lt;/&gt;</span>{handle}<span className="brand-dot">.</span></a>; }
