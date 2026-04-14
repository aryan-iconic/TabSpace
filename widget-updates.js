// Updated renderNotes function with variant support
function renderNotes_Updated(container, id, data) {
  if (!container) return;
  
  try {
    const notes = data.notes || [];
    const variant = data.variant || 'plain';
    const isMarkdown = variant === 'markdown';
    
    const badge = isMarkdown ? '📄 Markdown' : '📝 Plain';
    const bgColor = isMarkdown ? 'rgba(100,150,255,0.15)' : 'rgba(224,64,251,0.15)';
    
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:4px;flex-wrap:wrap;">
        <span style="font-weight:700;font-size:13px;">📝 Notes</span>
        <span style="font-size:10px;background:${bgColor};padding:2px 6px;border-radius:4px;color:var(--text);">${badge}</span>
        <span class="notes-add" data-notes-add="${id}" style="font-weight:700;color:var(--accent);cursor:pointer;">+</span>
      </div>
      <div class="notes-list" style="display:flex;flex-direction:column;gap:6px;overflow-y:auto;flex-grow:1;font-size:11px;">
        ${notes.length ? notes.map((n, i) => `
          <div style="background:rgba(255,255,255,0.05);padding:8px;border-radius:6px;border-left:3px solid var(--accent);display:flex;justify-content:space-between;align-items:flex-start;gap:6px;word-wrap:break-word;${isMarkdown ? 'font-family:monospace;' : ''}">
            <span style="flex-grow:1;word-break:break-word;">${isMarkdown ? '<code style=\"background:rgba(0,0,0,0.3);padding:2px 4px;border-radius:3px;font-size:0.9em;\">' + escapeHTML(n) + '</code>' : escapeHTML(n)}</span>
            <span class="note-del" data-note-del="${id}" data-note-index="${i}" style="cursor:pointer;opacity:0.6;flex-shrink:0;">✕</span>
          </div>
        `).join('') : '<div style=\"text-align:center;color:var(--text-muted);padding:12px;font-size:11px;\">No notes yet</div>'}
      </div>
    `;
    
    container.querySelectorAll('[data-note-del]').forEach(del => {
      del.addEventListener('click', () => {
        const widgetId = del.getAttribute('data-note-del');
        const idx = parseInt(del.getAttribute('data-note-index'));
        removeNote(widgetId, idx);
      });
    });
    
    const addBtn = container.querySelector('[data-notes-add]');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        addNote(addBtn.getAttribute('data-notes-add'));
      });
    }
  } catch(e) {
    Logger.error('renderNotes failed', e);
  }
}

// Updated renderTodo function with priority support
function renderTodo_Updated(container, id, data) {
  if (!container) return;
  
  try {
    const todos = data.todos || [];
    const variant = data.variant || 'simple';
    const isPriority = variant === 'priority';
    const count = todos.filter(t => !t.done).length;
    
    const badge = isPriority ? '⭐ Priority' : '✓ Simple';
    const bgColor = isPriority ? 'rgba(255,200,0,0.15)' : 'rgba(100,200,100,0.15)';
    
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:4px;flex-wrap:wrap;">
        <span style="font-weight:700;font-size:13px;">✅ To-Do</span>
        <span style="font-size:10px;background:${bgColor};padding:2px 6px;border-radius:4px;color:var(--text);">${badge}</span>
        <span style="font-size:11px;background:rgba(224,64,251,0.3);padding:2px 8px;border-radius:12px;font-weight:700;">${count}</span>
      </div>
      <div style="margin-bottom:6px;">
        <input class="todo-input" id="ti-${id}" placeholder="Add task..." maxlength="100" data-todo-input="${id}" style="width:100%;padding:6px;border-radius:6px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.05);color:var(--text);font-size:11px;box-sizing:border-box;">
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;overflow-y:auto;flex-grow:1;font-size:11px;">
        ${todos.length ? todos.map((t, i) => `
          <div data-todo-item="${id}" data-todo-index="${i}" style="display:flex;gap:6px;align-items:flex-start;padding:6px;background:rgba(255,255,255,0.05);border-radius:6px;cursor:pointer;transition:all 0.2s;${t.done ? 'opacity:0.5;text-decoration:line-through;' : ''}" data-todo-item="${id}" data-todo-index="${i}">
            <div style="width:16px;height:16px;border:2px solid var(--accent);border-radius:3px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${t.done ? 'var(--accent)' : 'transparent'};color:#fff;font-size:11px;">${t.done ? '✓' : ''}</div>
            ${isPriority && t.priority ? '<span style=\"width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;background:' + (t.priority === 'high' ? '#ff4081' : t.priority === 'medium' ? '#ffc107' : 'rgba(255,255,255,0.2)') + ';color:#fff;\">' + (t.priority === 'high' ? '!' : t.priority === 'medium' ? '-' : '○') + '</span>' : ''}
            <span style="flex-grow:1;word-break:break-word;">${escapeHTML(t.text)}</span>
            <span class="todo-del" data-todo-del="${id}" data-todo-index="${i}" style="cursor:pointer;opacity:0.6;flex-shrink:0;">✕</span>
          </div>
        `).join('') : '<div style=\"text-align:center;color:var(--text-muted);padding:12px;font-size:11px;\">No tasks yet</div>'}
      </div>
    `;
    
    const input = container.querySelector('[data-todo-input]');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') todoKeydown(e, id);
      });
    }
    
    container.querySelectorAll('[data-todo-item]').forEach(item => {
      item.addEventListener('click', () => {
        const widgetId = item.getAttribute('data-todo-item');
        const idx = parseInt(item.getAttribute('data-todo-index'));
        toggleTodo(widgetId, idx);
      });
    });
    
    container.querySelectorAll('[data-todo-del]').forEach(del => {
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        const widgetId = del.getAttribute('data-todo-del');
        const idx = parseInt(del.getAttribute('data-todo-index'));
        deleteTodo(null, widgetId, idx);
      });
    });
  } catch(e) {
    Logger.error('renderTodo failed', e);
  }
}
