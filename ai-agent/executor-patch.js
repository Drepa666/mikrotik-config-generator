// PATCH
window.__execPatch = {
  parseCommands: function(text) {
    var cmds = [];
    var lines = text.split('\n');
    var inBlock = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.indexOf('```') === 0) { inBlock = !inBlock; continue; }
      if (inBlock && line && line.charAt(0) !== '#') cmds.push(line);
    }
    if (cmds.length === 0) {
      for (var j = 0; j < lines.length; j++) {
        var l = lines[j].trim();
        if (l.charAt(0) === '/') cmds.push(l);
      }
    }
    return cmds;
  },
  executeOne: function(cmd, onResult) {
    var router = window.getActiveRouter ? window.getActiveRouter() : null;
    if (!router) { onResult({ ok: false, error: 'Немає роутера' }); return; }
    var cleanCmd = cmd.replace(/\\/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('[Executor] cmd:', cleanCmd);
    window.sshCall(router, cleanCmd)
      .then(function(d) {
        console.log('[Executor] result type:', typeof d, d);
        var out = typeof d === 'string' ? d
                : (d && d.text)   ? d.text
                : (d && d.output) ? d.output
                : (d && d.result) ? d.result
                : (d && d.error)  ? d.error
                : JSON.stringify(d);
        onResult({ ok: true, output: out || 'OK' });
      })
      .catch(function(e) { onResult({ ok: false, error: String(e) }); });
  }
};
