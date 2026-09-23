'use strict';
/* ═══════════════════════════════════════════════════════
   rm-datagrid.js  — DataGrid enhancer for Router Manager
   Enhances .rm-table via MutationObserver
   Features: sort, multi-select, drag-drop, context menu,
             keyboard nav, column resize, bulk actions
   ═══════════════════════════════════════════════════════ */

window.RMDataGrid = (function() {

  /* ── State ── */
  var _state = {
    sortCol:   null,
    sortDir:   'asc',
    selected:  {},      /* { idx: true } */
    lastClick: -1,
    dragSrc:   null,
  };

  /* ── CSS inject (once) ── */
  function injectCSS() {
    if (document.getElementById('rm-dg-css')) return;
    var s = document.createElement('style');
    s.id = 'rm-dg-css';
    s.textContent = [
      '.rm-table { border-collapse:collapse; width:100%; }',
      '.rm-table th {',
      '  user-select:none; cursor:pointer; position:relative;',
      '  padding:8px 28px 8px 10px; background:#0d1a28;',
      '  border-bottom:2px solid #1c2a37; white-space:nowrap;',
      '  color:#8ea3b0; font-size:12px; font-weight:600;',
      '}',
      '.rm-table th:hover { background:#111f2e; color:#c9d8e4; }',
      '.rm-table th.dg-sort-asc::after  { content:" \\25B2"; color:#5fd0a5; }',
      '.rm-table th.dg-sort-desc::after { content:" \\25BC"; color:#5fd0a5; }',
      '.rm-table th .dg-resizer {',
      '  position:absolute; right:0; top:0; width:5px; height:100%;',
      '  cursor:col-resize; background:transparent;',
      '}',
      '.rm-table th .dg-resizer:hover { background:#2a3b48; }',
      '.rm-table td {',
      '  padding:7px 10px; border-bottom:1px solid #0d1a28;',
      '  font-size:13px; color:#c9d8e4;',
      '}',
      '.rm-table tr { transition:background .12s; }',
      '.rm-table tr:hover td { background:#0a1520; }',
      '.rm-table tr.dg-selected td { background:#0e1e30!important; }',
      '.rm-table tr.dg-selected td:first-child { border-left:3px solid #5fd0a5; }',
      '.rm-table tr.dg-drag-over td { border-top:2px solid #5fd0a5; }',
      '.rm-table tr.dg-dragging { opacity:.4; }',
      /* Checkbox column */
      '.dg-check-col { width:28px!important; padding:4px!important; }',
      '.dg-check { cursor:pointer; accent-color:#5fd0a5; width:14px; height:14px; }',
      /* Bulk toolbar */
      '#dg-bulk-bar {',
      '  display:none; align-items:center; gap:8px;',
      '  padding:6px 10px; background:#0a1a2a;',
      '  border:1px solid #1c2a37; border-radius:6px; margin-bottom:6px;',
      '}',
      '#dg-bulk-bar.dg-visible { display:flex; }',
      '#dg-bulk-bar span { color:#8ea3b0; font-size:12px; margin-right:4px; }',
      '.dg-bulk-btn {',
      '  background:#1a2a3a; border:1px solid #2a3b48; color:#c9d8e4;',
      '  border-radius:5px; padding:4px 10px; cursor:pointer; font-size:12px;',
      '}',
      '.dg-bulk-btn:hover { background:#1c3040; }',
      '.dg-bulk-btn.danger { color:#e08080; border-color:#3a2020; }',
      '.dg-bulk-btn.danger:hover { background:#2a1010; }',
      /* Context menu */
      '#dg-ctx-menu {',
      '  position:fixed; background:#0d1117; border:1px solid #2a3b48;',
      '  border-radius:8px; padding:4px 0; z-index:9999999;',
      '  box-shadow:0 8px 32px rgba(0,0,0,.8); min-width:160px;',
      '  display:none;',
      '}',
      '#dg-ctx-menu.dg-visible { display:block; }',
      '.dg-ctx-item {',
      '  padding:7px 16px; cursor:pointer; font-size:13px; color:#c9d8e4;',
      '  display:flex; align-items:center; gap:8px;',
      '}',
      '.dg-ctx-item:hover { background:#111f2e; }',
      '.dg-ctx-sep { height:1px; background:#1c2a37; margin:3px 0; }',
      '.dg-ctx-item.danger { color:#e08080; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── Context menu ── */
  function buildCtxMenu() {
    if (document.getElementById('dg-ctx-menu')) return;
    var m = document.createElement('div');
    m.id = 'dg-ctx-menu';
    document.body.appendChild(m);
    document.addEventListener('click', function() { hideCtx(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') hideCtx();
    });
  }

  function showCtx(x, y, items) {
    var m = document.getElementById('dg-ctx-menu');
    if (!m) return;
    m.innerHTML = '';
    items.forEach(function(item) {
      if (item === 'sep') {
        var s = document.createElement('div');
        s.className = 'dg-ctx-sep';
        m.appendChild(s);
        return;
      }
      var d = document.createElement('div');
      d.className = 'dg-ctx-item' + (item.danger ? ' danger' : '');
      d.innerHTML = (item.icon || '') + ' ' + item.label;
      d.onclick = function(e) {
        e.stopPropagation();
        hideCtx();
        if (item.action) item.action();
      };
      m.appendChild(d);
    });
    m.classList.add('dg-visible');
    /* Position */
    var mw = m.offsetWidth  || 180;
    var mh = m.offsetHeight || 200;
    var wx = window.innerWidth;
    var wy = window.innerHeight;
    m.style.left = (x + mw > wx ? wx - mw - 8 : x) + 'px';
    m.style.top  = (y + mh > wy ? wy - mh - 8 : y) + 'px';
  }

  function hideCtx() {
    var m = document.getElementById('dg-ctx-menu');
    if (m) m.classList.remove('dg-visible');
  }

  /* ── Bulk action bar ── */
  function ensureBulkBar(wrap) {
    var bar = wrap.querySelector('#dg-bulk-bar');
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'dg-bulk-bar';
    bar.innerHTML =
      '<span id="dg-sel-count">0 selected</span>' +
      '<button class="dg-bulk-btn" id="dg-bulk-enable">&#9654; Enable</button>' +
      '<button class="dg-bulk-btn" id="dg-bulk-disable">&#9646;&#9646; Disable</button>' +
      '<button class="dg-bulk-btn danger" id="dg-bulk-delete">&#128465; Delete</button>' +
      '<button class="dg-bulk-btn" id="dg-bulk-copy">&#128203; Copy</button>' +
      '<button class="dg-bulk-btn" id="dg-bulk-clear">&#10005; Clear</button>';
    wrap.insertBefore(bar, wrap.firstChild);
    return bar;
  }

  function updateBulkBar(wrap) {
    var bar = wrap.querySelector('#dg-bulk-bar');
    if (!bar) return;
    var count = Object.keys(_state.selected).length;
    var cnt   = bar.querySelector('#dg-sel-count');
    if (cnt) cnt.textContent = count + ' selected';
    if (count > 0) {
      bar.classList.add('dg-visible');
    } else {
      bar.classList.remove('dg-visible');
    }
    /* Update header checkbox */
    var allCb = wrap.querySelector('.dg-check-all');
    var rows  = wrap.querySelectorAll('.rm-table tr[data-idx]');
    if (allCb) {
      allCb.checked = count > 0 && count === rows.length;
      allCb.indeterminate = count > 0 && count < rows.length;
    }
  }

  /* ── Sort ── */
  function applySort(table, colIdx) {
    var tbody = [];
    var rows  = table.querySelectorAll('tr[data-idx]');
    rows.forEach(function(r) { tbody.push(r); });
    if (!tbody.length) return;

    var dir = 1;
    if (_state.sortCol === colIdx) {
      _state.sortDir = _state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      _state.sortCol = colIdx;
      _state.sortDir = 'asc';
    }
    dir = _state.sortDir === 'asc' ? 1 : -1;

    tbody.sort(function(a, b) {
      var ac = a.querySelectorAll('td')[colIdx];
      var bc = b.querySelectorAll('td')[colIdx];
      var av = ac ? ac.textContent.trim() : '';
      var bv = bc ? bc.textContent.trim() : '';
      /* Try numeric */
      var an = parseFloat(av);
      var bn = parseFloat(bv);
      if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
      return av.localeCompare(bv) * dir;
    });

    var parent = rows[0].parentNode;
    tbody.forEach(function(r) { parent.appendChild(r); });

    /* Update header classes */
    var ths = table.querySelectorAll('th');
    ths.forEach(function(th, i) {
      th.classList.remove('dg-sort-asc', 'dg-sort-desc');
      if (i === colIdx + 1) { /* +1 for checkbox col */
        th.classList.add(_state.sortDir === 'asc' ? 'dg-sort-asc' : 'dg-sort-desc');
      }
    });
  }

  /* ── Column resize ── */
  function addResizers(table) {
    var ths = table.querySelectorAll('th');
    ths.forEach(function(th) {
      if (th.querySelector('.dg-resizer')) return;
      var r = document.createElement('div');
      r.className = 'dg-resizer';
      th.appendChild(r);

      var startX, startW;
      r.addEventListener('mousedown', function(e) {
        startX = e.pageX;
        startW = th.offsetWidth;
        e.stopPropagation();
        e.preventDefault();
        function onMove(ev) {
          var w = Math.max(40, startW + ev.pageX - startX);
          th.style.width = w + 'px';
          th.style.minWidth = w + 'px';
        }
        function onUp() {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  /* ── Selection ── */
  function toggleSelect(row, idx, e) {
    if (e && e.shiftKey && _state.lastClick >= 0) {
      /* Range select */
      var table = row.closest('table');
      var rows  = table.querySelectorAll('tr[data-idx]');
      var from  = Math.min(_state.lastClick, idx);
      var to    = Math.max(_state.lastClick, idx);
      rows.forEach(function(r) {
        var ri = parseInt(r.dataset.idx);
        if (ri >= from && ri <= to) {
          _state.selected[ri] = true;
          r.classList.add('dg-selected');
          var cb = r.querySelector('.dg-check');
          if (cb) cb.checked = true;
        }
      });
    } else if (e && (e.ctrlKey || e.metaKey)) {
      /* Toggle single */
      if (_state.selected[idx]) {
        delete _state.selected[idx];
        row.classList.remove('dg-selected');
        var cb2 = row.querySelector('.dg-check');
        if (cb2) cb2.checked = false;
      } else {
        _state.selected[idx] = true;
        row.classList.add('dg-selected');
        var cb3 = row.querySelector('.dg-check');
        if (cb3) cb3.checked = true;
      }
    } else {
      /* Single select (clear others) */
      clearSelection(row.closest('table'));
      _state.selected[idx] = true;
      row.classList.add('dg-selected');
      var cb4 = row.querySelector('.dg-check');
      if (cb4) cb4.checked = true;
    }
    _state.lastClick = idx;
  }

  function clearSelection(table) {
    _state.selected = {};
    _state.lastClick = -1;
    if (!table) return;
    table.querySelectorAll('tr.dg-selected').forEach(function(r) {
      r.classList.remove('dg-selected');
      var cb = r.querySelector('.dg-check');
      if (cb) cb.checked = false;
    });
    var allCb = table.querySelector('.dg-check-all');
    if (allCb) { allCb.checked = false; allCb.indeterminate = false; }
  }

  /* ── Drag-and-drop ── */
  function enableDragDrop(table, onReorder) {
    table.addEventListener('dragstart', function(e) {
      var row = e.target.closest('tr[data-idx]');
      if (!row) return;
      _state.dragSrc = row;
      row.classList.add('dg-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    table.addEventListener('dragend', function(e) {
      var row = e.target.closest('tr[data-idx]');
      if (row) row.classList.remove('dg-dragging');
      table.querySelectorAll('.dg-drag-over').forEach(function(r) {
        r.classList.remove('dg-drag-over');
      });
      _state.dragSrc = null;
    });
    table.addEventListener('dragover', function(e) {
      e.preventDefault();
      var row = e.target.closest('tr[data-idx]');
      if (!row || row === _state.dragSrc) return;
      table.querySelectorAll('.dg-drag-over').forEach(function(r) {
        r.classList.remove('dg-drag-over');
      });
      row.classList.add('dg-drag-over');
    });
    table.addEventListener('drop', function(e) {
      e.preventDefault();
      var target = e.target.closest('tr[data-idx]');
      if (!target || !_state.dragSrc || target === _state.dragSrc) return;

      var srcIdx = parseInt(_state.dragSrc.dataset.idx);
      var dstIdx = parseInt(target.dataset.idx);

      /* Reorder in DOM */
      var parent = target.parentNode;
      if (srcIdx < dstIdx) {
        parent.insertBefore(_state.dragSrc, target.nextSibling);
      } else {
        parent.insertBefore(_state.dragSrc, target);
      }

      table.querySelectorAll('.dg-drag-over').forEach(function(r) {
        r.classList.remove('dg-drag-over');
      });

      if (typeof onReorder === 'function') {
        onReorder(srcIdx, dstIdx);
      }
    });
  }

  /* ── Keyboard navigation ── */
  function enableKeyboard(table, wrap) {
    table.setAttribute('tabindex', '0');
    table.addEventListener('keydown', function(e) {
      var rows = Array.from(table.querySelectorAll('tr[data-idx]'));
      if (!rows.length) return;

      var selIdxs = Object.keys(_state.selected).map(Number);
      var cur = selIdxs.length ? Math.min.apply(null, selIdxs) : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var next = cur + 1;
        if (next >= rows.length) next = 0;
        clearSelection(table);
        var r = rows[next];
        if (r) {
          _state.selected[parseInt(r.dataset.idx)] = true;
          r.classList.add('dg-selected');
          r.scrollIntoView({ block: 'nearest' });
        }
        updateBulkBar(wrap);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = cur - 1;
        if (prev < 0) prev = rows.length - 1;
        clearSelection(table);
        var r2 = rows[prev];
        if (r2) {
          _state.selected[parseInt(r2.dataset.idx)] = true;
          r2.classList.add('dg-selected');
          r2.scrollIntoView({ block: 'nearest' });
        }
        updateBulkBar(wrap);
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        rows.forEach(function(r) {
          var idx = parseInt(r.dataset.idx);
          _state.selected[idx] = true;
          r.classList.add('dg-selected');
          var cb = r.querySelector('.dg-check');
          if (cb) cb.checked = true;
        });
        updateBulkBar(wrap);
      } else if (e.key === 'Escape') {
        clearSelection(table);
        updateBulkBar(wrap);
      }
    });
  }

  /* ── Add checkbox column ── */
  function addCheckboxColumn(table, wrap) {
    /* Header checkbox */
    var headerRow = table.querySelector('tr:first-child');
    if (!headerRow || headerRow.querySelector('.dg-check-col')) return;

    var th = document.createElement('th');
    th.className = 'dg-check-col';
    th.innerHTML = '<input type="checkbox" class="dg-check dg-check-all">';
    headerRow.insertBefore(th, headerRow.firstChild);

    var allCb = th.querySelector('.dg-check-all');
    allCb.addEventListener('change', function() {
      var rows = table.querySelectorAll('tr[data-idx]');
      rows.forEach(function(r) {
        var idx = parseInt(r.dataset.idx);
        var cb  = r.querySelector('.dg-check');
        if (allCb.checked) {
          _state.selected[idx] = true;
          r.classList.add('dg-selected');
          if (cb) cb.checked = true;
        } else {
          delete _state.selected[idx];
          r.classList.remove('dg-selected');
          if (cb) cb.checked = false;
        }
      });
      updateBulkBar(wrap);
    });

    /* Row checkboxes */
    var rows = table.querySelectorAll('tr[data-idx]');
    rows.forEach(function(row) {
      if (row.querySelector('.dg-check-col')) return;
      var td = document.createElement('td');
      td.className = 'dg-check-col';
      td.innerHTML = '<input type="checkbox" class="dg-check">';
      row.insertBefore(td, row.firstChild);

      var cb = td.querySelector('.dg-check');
      cb.addEventListener('change', function(e) {
        e.stopPropagation();
        var idx = parseInt(row.dataset.idx);
        if (cb.checked) {
          _state.selected[idx] = true;
          row.classList.add('dg-selected');
        } else {
          delete _state.selected[idx];
          row.classList.remove('dg-selected');
        }
        updateBulkBar(wrap);
      });
    });
  }

  /* ── Context menu items builder ── */
  function buildCtxItems(wrap, table, rowIdx) {
    var selectedIds = getSelectedIds(table);
    var count = selectedIds.length;
    var singleRow = table.querySelector('tr[data-idx="' + rowIdx + '"]');

    return [
      {
        icon: '&#9654;',
        label: 'Enable' + (count > 1 ? ' (' + count + ')' : ''),
        action: function() { bulkAction(wrap, table, 'enable'); }
      },
      {
        icon: '&#9646;&#9646;',
        label: 'Disable' + (count > 1 ? ' (' + count + ')' : ''),
        action: function() { bulkAction(wrap, table, 'disable'); }
      },
      'sep',
      {
        icon: '&#9998;',
        label: 'Edit',
        action: function() {
          if (singleRow) {
            var editBtn = singleRow.querySelector('[data-action="edit"]');
            if (editBtn) editBtn.click();
          }
        }
      },
      {
        icon: '&#128203;',
        label: 'Copy row',
        action: function() { copyRowToClipboard(singleRow); }
      },
      'sep',
      {
        icon: '&#128465;',
        label: 'Delete' + (count > 1 ? ' (' + count + ')' : ''),
        danger: true,
        action: function() { bulkAction(wrap, table, 'delete'); }
      }
    ];
  }

  /* ── Get selected IDs ── */
  function getSelectedIds(table) {
    var ids = [];
    Object.keys(_state.selected).forEach(function(idx) {
      var row = table.querySelector('tr[data-idx="' + idx + '"]');
      if (row) {
        var btn = row.querySelector('[data-id]');
        if (btn) ids.push({ id: btn.dataset.id, row: row, idx: parseInt(idx) });
      }
    });
    return ids;
  }

  /* ── Bulk actions ── */
  function bulkAction(wrap, table, action) {
    var items = getSelectedIds(table);
    if (!items.length) return;

    if (action === 'delete') {
      if (!confirm('Delete ' + items.length + ' item(s)?')) return;
      items.forEach(function(item) {
        var delBtn = item.row.querySelector('[data-action="del"]');
        if (delBtn) delBtn.click();
      });
    } else if (action === 'enable') {
      items.forEach(function(item) {
        var toggleBtn = item.row.querySelector('[data-action="toggle"]');
        if (toggleBtn && toggleBtn.dataset.disabled === 'true') toggleBtn.click();
      });
    } else if (action === 'disable') {
      items.forEach(function(item) {
        var toggleBtn = item.row.querySelector('[data-action="toggle"]');
        if (toggleBtn && toggleBtn.dataset.disabled !== 'true') toggleBtn.click();
      });
    }
    clearSelection(table);
    updateBulkBar(wrap);
  }

  /* ── Copy row to clipboard ── */
  function copyRowToClipboard(row) {
    if (!row) return;
    var cells = row.querySelectorAll('td');
    var parts = [];
    cells.forEach(function(td) {
      if (td.classList.contains('dg-check-col')) return;
      if (td.querySelector('[data-action]')) return;
      parts.push(td.textContent.trim());
    });
    navigator.clipboard.writeText(parts.join('\t')).catch(function() {});
  }

  /* ── Main enhance function ── */
  function enhance(wrap) {
    var table = wrap.querySelector('table.rm-table');
    if (!table || table._dgEnhanced) return;
    table._dgEnhanced = true;

    /* Reset state */
    _state.selected  = {};
    _state.lastClick = -1;
    _state.sortCol   = null;

    /* Add checkbox column */
    addCheckboxColumn(table, wrap);

    /* Add bulk bar */
    var bar = ensureBulkBar(wrap);

    /* Bulk bar buttons */
    var enBtn  = bar.querySelector('#dg-bulk-enable');
    var disBtn = bar.querySelector('#dg-bulk-disable');
    var delBtn = bar.querySelector('#dg-bulk-delete');
    var cpBtn  = bar.querySelector('#dg-bulk-copy');
    var clBtn  = bar.querySelector('#dg-bulk-clear');

    if (enBtn)  enBtn.onclick  = function() { bulkAction(wrap, table, 'enable'); };
    if (disBtn) disBtn.onclick = function() { bulkAction(wrap, table, 'disable'); };
    if (delBtn) delBtn.onclick = function() { bulkAction(wrap, table, 'delete'); };
    if (cpBtn)  cpBtn.onclick  = function() {
      var items = getSelectedIds(table);
      if (items[0]) copyRowToClipboard(items[0].row);
    };
    if (clBtn)  clBtn.onclick  = function() {
      clearSelection(table);
      updateBulkBar(wrap);
    };

    /* Sort headers */
    var ths = table.querySelectorAll('th');
    ths.forEach(function(th, i) {
      if (th.classList.contains('dg-check-col')) return;
      /* Last th = actions, no sort */
      var isActions = th.style.textAlign === 'right' ||
                      th.textContent.trim() === '' ||
                      i === ths.length - 1;
      if (!isActions) {
        th.style.cursor = 'pointer';
        th.addEventListener('click', function() {
          /* col index without checkbox col */
          applySort(table, i - 1);
        });
      }
    });

    /* Add resizers */
    addResizers(table);

    /* Row events: click for select, contextmenu */
    var rows = table.querySelectorAll('tr[data-idx]');
    rows.forEach(function(row) {
      row.setAttribute('draggable', 'true');

      row.addEventListener('click', function(e) {
        /* Don't select when clicking action buttons or checkbox */
        if (e.target.closest('[data-action]')) return;
        if (e.target.closest('.dg-check-col')) return;
        var idx = parseInt(row.dataset.idx);
        toggleSelect(row, idx, e);
        updateBulkBar(wrap);
      });

      row.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        var idx = parseInt(row.dataset.idx);
        /* Select this row if not already selected */
        if (!_state.selected[idx]) {
          clearSelection(table);
          _state.selected[idx] = true;
          row.classList.add('dg-selected');
          var cb = row.querySelector('.dg-check');
          if (cb) cb.checked = true;
          updateBulkBar(wrap);
        }
        showCtx(e.clientX, e.clientY, buildCtxItems(wrap, table, idx));
      });
    });

    /* Drag-and-drop */
    enableDragDrop(table, function(srcIdx, dstIdx) {
      /* Optional: trigger REST move if available */
      console.log('[DataGrid] row moved: ' + srcIdx + ' -> ' + dstIdx);
    });

    /* Keyboard navigation */
    enableKeyboard(table, wrap);

    console.log('[DataGrid] enhanced table with ' + rows.length + ' rows');
  }

  /* ── Observer: watch #rm-table-wrap for changes ── */
  function observe() {
    injectCSS();
    buildCtxMenu();

    function tryEnhance() {
      var wraps = document.querySelectorAll('#rm-table-wrap, .rm-table-wrap');
      wraps.forEach(function(wrap) { enhance(wrap); });
    }

    /* Enhance on mutation */
    var obs = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.type === 'childList') {
          var wrap = m.target.closest('#rm-table-wrap, .rm-table-wrap')
                  || (m.target.id === 'rm-table-wrap' ? m.target : null)
                  || (m.target.classList && m.target.classList.contains('rm-table-wrap')
                      ? m.target : null);
          if (wrap) {
            setTimeout(function() { enhance(wrap); }, 50);
          }
          /* Also check if target is rm-content */
          if (m.target.id === 'rm-content' || m.target.id === 'rm-table-wrap') {
            setTimeout(tryEnhance, 100);
          }
        }
      });
    });

    obs.observe(document.body, { childList: true, subtree: true });

    /* Initial enhance */
    setTimeout(tryEnhance, 500);
  }

  return { observe: observe, enhance: enhance };

})();

/* Auto-start */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window.RMDataGrid.observe();
  });
} else {
  window.RMDataGrid.observe();
}

console.log('[DataGrid] rm-datagrid.js loaded');
