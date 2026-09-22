/* Патч localStorage — виконати ОДИН РАЗ в консолі */
(function fixRouters() {
  try {
    var routers = JSON.parse(localStorage.getItem('rm-routers') || '[]');
    var form    = JSON.parse(localStorage.getItem('rm-form-saved') || '{}');
    console.log('Поточні роутери:', JSON.stringify(routers));
    console.log('Збережений логін:', form);
    routers.forEach(function(r) {
      console.log('Router:', r.id, r.ip, 'user:', r.user, 'pass:', r.pass ? '***' : 'EMPTY');
      /* Якщо пароль порожній — беремо з form-saved */
      if (!r.pass && form.pass) {
        r.pass = form.pass;
        console.log('Патч пароля для', r.ip, 'з form-saved ✅');
      }
      /* Якщо user = admin але form каже admin1 */
      if (r.user === 'admin' && form.user && form.user !== 'admin') {
        r.user = form.user;
        console.log('Патч user для', r.ip, ':', r.user, '✅');
      }
    });
    localStorage.setItem('rm-routers', JSON.stringify(routers));
    console.log('rm-routers оновлено ✅', routers);
  } catch(e) { console.error('Помилка:', e); }
})();
