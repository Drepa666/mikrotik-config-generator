
(function cleanupRouters() {
  try {
    var routers  = JSON.parse(localStorage.getItem('rm-routers') || '[]');
    var activeId = localStorage.getItem('rm-active-router');
    var formSaved = JSON.parse(localStorage.getItem('rm-form-saved') || '{}');

    console.log('Всього роутерів:', routers.length);

    /* Знаходимо активний */
    var active = routers.find(function(r){ return r.id === activeId; })
              || routers[0];

    if (!active) {
      console.error('Активний роутер не знайдено!');
      return;
    }

    /* Виправляємо credentials */
    if (formSaved.user) active.user = formSaved.user;
    if (formSaved.pass) active.pass = formSaved.pass;

    console.log('Активний роутер:', active.ip,
      'user:', active.user,
      'pass:', active.pass ? '***' : 'EMPTY',
      'sshPort:', active.sshPort);

    /* Зберігаємо ТІЛЬКИ активний (якщо хочеш зберегти всі — закоментуй) */
    /* localStorage.setItem('rm-routers', JSON.stringify([active])); */

    /* АБО просто оновлюємо credentials активного */
    routers = routers.map(function(r) {
      if (r.id === activeId) {
        r.user = formSaved.user || r.user;
        r.pass = formSaved.pass || r.pass;
      }
      return r;
    });
    localStorage.setItem('rm-routers', JSON.stringify(routers));
    console.log('rm-routers оновлено ✅');
    console.log('Активний:', active.ip, active.user, active.sshPort);
  } catch(e) { console.error(e); }
})();
