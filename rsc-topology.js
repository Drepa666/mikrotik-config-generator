/* ============================================================
   rsc-topology.js v2 — парсер контекстного формату .rsc
   ============================================================ */
'use strict';

function parseRscTopology(text) {
  var r = {
    identity:'', bridges:{}, vlans:{}, ips:[], routes:[],
    dhcp:[], pools:{}, vpn:[], pppoe:[], ipsec:[], wireless:[],
  };

  function mp(line, param) {
    var re = new RegExp('(?:^|\\s)' + param + '=([^\\s]+)', 'i');
    var m = line.match(re);
    if (!m) return null;
    return m[1].replace(/^["']|["']$/g, '').replace(/\\$/, '');
  }
  function net(cidr) {
    if (!cidr) return '';
    var p = cidr.split('/'), ip = p[0], prefix = parseInt(p[1]||'24',10);
    var o = ip.split('.').map(Number);
    if (o.length!==4) return cidr;
    var mask = prefix===0?0:((~0<<(32-prefix))>>>0);
    var n = (((o[0]<<24)|(o[1]<<16)|(o[2]<<8)|o[3])>>>0)&mask;
    return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.')+'/'+prefix;
  }

  /* ── Парсимо контекстний формат ── */
  var lines = text.split('\n');
  var ctx = '';  /* поточна секція */

  /* Об'єднуємо рядки з \ продовженням */
  var joined = [];
  var buf = '';
  lines.forEach(function(raw) {
    var line = raw.replace(/\r$/, '');
    if (line.trimRight().endsWith('\\')) {
      buf += line.trimRight().slice(0, -1) + ' ';
    } else {
      buf += line;
      joined.push(buf.trim());
      buf = '';
    }
  });
  if (buf.trim()) joined.push(buf.trim());

  joined.forEach(function(line) {
    if (!line || line.startsWith('#')) return;

    /* Зміна контексту */
    if (line.startsWith('/')) {
      /* Перевіряємо однорядкові команди з повним шляхом */
      if (/^\/system identity set/i.test(line)) {
        var m = line.match(/name=["']?([^"'\s\\]+)/i);
        if (m) r.identity = m[1];
      }
      if (/^\/ip address add/i.test(line)) {
        var addr = mp(line,'address'), iface = mp(line,'interface');
        if (addr && iface) r.ips.push({address:addr, interface:iface, network:net(addr)});
      }
      if (/^\/interface bridge add/i.test(line)) {
        var n = mp(line,'name');
        if (n && !r.bridges[n]) r.bridges[n] = {ports:[]};
      }
      if (/^\/interface bridge port add/i.test(line)) {
        var b = mp(line,'bridge'), p = mp(line,'interface');
        if (b&&p){if(!r.bridges[b]) r.bridges[b]={ports:[]}; r.bridges[b].ports.push(p);}
      }
      if (/^\/interface vlan add/i.test(line)) {
        var n=mp(line,'name');
        if(n) r.vlans[n]={id:mp(line,'vlan-id'),interface:mp(line,'interface')};
      }
      if (/^\/interface wireguard add/i.test(line)) {
        r.vpn.push({type:'WireGuard',name:mp(line,'name')||'wg0',port:mp(line,'listen-port')||'51820'});
      }
      if (/^\/interface pppoe-client add/i.test(line)) {
        r.pppoe.push({name:mp(line,'name')||'pppoe-out',interface:mp(line,'interface')||'ether1'});
      }
      if (/^\/ip dhcp-server add/i.test(line)) {
        r.dhcp.push({name:mp(line,'name'),interface:mp(line,'interface'),pool:mp(line,'address-pool')});
      }
      if (/^\/ip pool add/i.test(line)) {
        var n=mp(line,'name'),rng=mp(line,'ranges'); if(n) r.pools[n]=rng;
      }
      if (/^\/ip ipsec peer add/i.test(line)) {
        var p=mp(line,'address')||mp(line,'name'); if(p) r.ipsec.push({peer:p});
      }
      if (/^\/ip dhcp-client add/i.test(line)) {
        var i=mp(line,'interface');
        if(i) r.ips.push({address:'DHCP',interface:i,network:'dynamic'});
      }
      if (/^\/interface wireless$/i.test(line.split(' ')[0]+' '+(line.split(' ')[1]||''))) {
        /* просто зберігаємо контекст */
      }

      /* Встановлюємо контекст */
      ctx = line.replace(/\s+set\s.*/i,'').replace(/\s+add\s.*/i,'').toLowerCase();
      return;
    }

    /* Команди в контексті (рядки без / на початку) */
    if (!line.startsWith('/') && (line.startsWith('add ') || line.startsWith('set '))) {

      /* /interface bridge → add name=... */
      if (ctx === '/interface bridge') {
        if (line.startsWith('add ')) {
          var n = mp(line,'name');
          if (n && !r.bridges[n]) r.bridges[n] = {ports:[]};
        }
      }

      /* /interface bridge port → add bridge=... interface=... */
      if (ctx === '/interface bridge port') {
        if (line.startsWith('add ')) {
          var b = mp(line,'bridge'), p = mp(line,'interface');
          if (b&&p){if(!r.bridges[b]) r.bridges[b]={ports:[]}; r.bridges[b].ports.push(p);}
        }
      }

      /* /interface vlan → add name=... vlan-id=... interface=... */
      if (ctx === '/interface vlan') {
        if (line.startsWith('add ')) {
          var n=mp(line,'name');
          if(n) r.vlans[n]={id:mp(line,'vlan-id'),interface:mp(line,'interface')};
        }
      }

      /* /interface wireguard → add name=... listen-port=... */
      if (ctx === '/interface wireguard') {
        if (line.startsWith('add ')) {
          r.vpn.push({type:'WireGuard',name:mp(line,'name')||'wg0',port:mp(line,'listen-port')||'51820'});
        }
      }

      /* /interface pppoe-client → add name=... interface=... */
      if (ctx === '/interface pppoe-client') {
        if (line.startsWith('add ')) {
          r.pppoe.push({name:mp(line,'name')||'pppoe-out',interface:mp(line,'interface')||'ether1'});
        }
      }

      /* /interface wireless → set ... ssid=... */
      if (ctx === '/interface wireless') {
        var ssid = mp(line,'ssid');
        var band = mp(line,'band');
        if (ssid) r.wireless.push({ssid:ssid, band:band||''});
      }

      /* /ip address → add address=... interface=... */
      if (ctx === '/ip address') {
        if (line.startsWith('add ')) {
          var addr=mp(line,'address'), iface=mp(line,'interface');
          if(addr&&iface) r.ips.push({address:addr,interface:iface,network:net(addr)});
        }
      }

      /* /ip pool → add name=... ranges=... */
      if (ctx === '/ip pool') {
        if (line.startsWith('add ')) {
          var n=mp(line,'name'),rng=mp(line,'ranges'); if(n) r.pools[n]=rng;
        }
      }

      /* /ip dhcp-server → add name=... interface=... address-pool=... */
      if (ctx === '/ip dhcp-server') {
        if (line.startsWith('add ') && mp(line,'interface')) {
          r.dhcp.push({name:mp(line,'name'),interface:mp(line,'interface'),pool:mp(line,'address-pool')});
        }
      }

      /* /ip dhcp-client → add interface=... */
      if (ctx === '/ip dhcp-client') {
        if (line.startsWith('add ')) {
          var i=mp(line,'interface');
          if(i) r.ips.push({address:'DHCP',interface:i,network:'dynamic'});
        }
      }

      /* /ip route → add dst-address=... gateway=... */
      if (ctx === '/ip route') {
        if (line.startsWith('add ')) {
          var d=mp(line,'dst-address'),g=mp(line,'gateway');
          if(d&&g) r.routes.push({dst:d,gateway:g,distance:mp(line,'distance')||'1'});
        }
      }

      /* /system identity → set name=... */
      if (ctx === '/system identity') {
        var m=line.match(/name=["']?([^"'\s\\]+)/i); if(m) r.identity=m[1];
      }

      /* /ip ipsec peer → add address=... */
      if (ctx === '/ip ipsec peer') {
        if (line.startsWith('add ')) {
          var p=mp(line,'address')||mp(line,'name'); if(p) r.ipsec.push({peer:p});
        }
      }
    }
  });

  return r;
}

function renderRscTopology(p) {
  var name = p.identity || 'MikroTik';
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function rect(x,y,w,h,fill,stroke,rx){
    return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(rx||8)+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>';
  }
  function txt(x,y,s,sz,col,anc,fw){
    return '<text x="'+x+'" y="'+y+'" font-size="'+(sz||12)+'" fill="'+(col||'#e6edf3')+'" text-anchor="'+(anc||'middle')+'" font-weight="'+(fw||'normal')+'">'+esc(s)+'</text>';
  }
  function ln(x1,y1,x2,y2,col,dash,mk){
    return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+(col||'#5fd0a5')+'" stroke-width="2"'+(dash?' stroke-dasharray="'+dash+'"':'')+(mk?' marker-end="url(#'+mk+')"':'')+'/>';
  }

  /* WAN */
  var wans = [];
  p.pppoe.forEach(function(x){ wans.push({name:x.name,type:'PPPoE',ip:''}); });
  p.ips.forEach(function(x){
    if(x.address==='DHCP') wans.push({name:x.interface,type:'DHCP',ip:'dynamic'});
  });
  if(!wans.length) wans.push({name:'ether1',type:'WAN',ip:''});

  /* LAN bridges */
  var lans = Object.keys(p.bridges).map(function(bn){
    var ip   = p.ips.find(function(i){return i.interface===bn;});
    var dhcp = p.dhcp.find(function(d){return d.interface===bn;});
    var pool = dhcp&&dhcp.pool&&p.pools[dhcp.pool]?p.pools[dhcp.pool]:'';
    return {name:bn, ip:ip?ip.address:'—', ports:p.bridges[bn].ports, pool:pool};
  });

  /* Якщо bridge немає — шукаємо інтерфейси з IP (не WAN) */
  if(!lans.length){
    p.ips.forEach(function(x){
      if(x.address!=='DHCP'&&!wans.find(function(w){return w.name===x.interface;})){
        lans.push({name:x.interface,ip:x.address,ports:[],pool:''});
      }
    });
  }

  /* Wi-Fi SSID */
  var wifiInfo = p.wireless.length ? p.wireless[0].ssid : '';

  var W=920;
  var lanCols = Math.max(lans.length,1);
  var H = Math.max(560, 380 + lanCols*50 + Object.keys(p.vlans).length*90 + p.vpn.length*80 + p.ipsec.length*80);

  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 '+W+' '+H+'" style="font-family:sans-serif;background:#0a1017;border-radius:10px;">';
  svg+='<defs>';
  svg+='<marker id="a1" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#5fd0a5"/></marker>';
  svg+='<marker id="a2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#e6b35a"/></marker>';
  svg+='<marker id="a3" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#9b87f5"/></marker>';
  svg+='</defs>';

  /* Internet */
  var IX=460,IY=52;
  svg+=rect(IX-70,IY-24,140,46,'#1c2a37','#e6b35a');
  svg+=txt(IX,IY+5,'🌐 Internet',13,'#e6b35a');

  /* WAN */
  var wanY=155, wanSp=Math.min(200,700/Math.max(wans.length,1));
  var wanX0=IX-(wans.length-1)*wanSp/2;
  wans.forEach(function(w,i){
    var wx=wanX0+i*wanSp;
    svg+=ln(IX,IY+22,wx,wanY-24,'#e6b35a','','a2');
    svg+=rect(wx-78,wanY-24,156,50,'#2a1e10','#e6b35a');
    svg+=txt(wx,wanY+1,'📡 '+w.name,12,'#e6b35a');
    svg+=txt(wx,wanY+17,w.type+(w.ip?' · '+w.ip:''),9,'#8ea3b0');
  });

  /* Router */
  var RX=460,RY=268;
  wans.forEach(function(w,i){
    svg+=ln(wanX0+i*wanSp,wanY+26,RX,RY-34,'#e6b35a','5,3','a2');
  });
  svg+=rect(RX-105,RY-34,210,68,'#16212c','#5fd0a5',10);
  svg+=txt(RX,RY-10,'🔌 '+name,14,'#5fd0a5','middle','700');
  svg+=txt(RX,RY+10,'RouterOS 7.x  |  RB952Ui-5ac2nD',9,'#8ea3b0');
  if(wifiInfo) svg+=txt(RX,RY+26,'📶 '+wifiInfo,9,'#5fd0a5');

  /* LAN bridges */
  var lanY=400, lanSp=Math.min(240,840/Math.max(lans.length,1));
  var lanX0=RX-(lans.length-1)*lanSp/2;
  lans.forEach(function(l,i){
    var lx=lanX0+i*lanSp;
    svg+=ln(RX,RY+34,lx,lanY-30,'#5fd0a5','','a1');
    svg+=rect(lx-95,lanY-30,190,80,'#0d2a1a','#5fd0a5');
    svg+=txt(lx,lanY-10,'🔀 '+l.name,12,'#5fd0a5','middle','600');
    svg+=txt(lx,lanY+8,l.ip,11,'#e6edf3');
    if(l.pool) svg+=txt(lx,lanY+24,'DHCP: '+l.pool,9,'#8ea3b0');
    if(l.ports.length){
      var wired=l.ports.filter(function(p){return p.startsWith('ether');});
      var wifi=l.ports.filter(function(p){return p.startsWith('wlan')||p.startsWith('wifi');});
      if(wired.length) svg+=txt(lx,lanY+40,'🔌 '+wired.join(', '),8,'#4a7060');
      if(wifi.length)  svg+=txt(lx,lanY+(wired.length?52:40),'📶 '+wifi.join(', '),8,'#4a6070');
    }

    /* Clients box */
    var cy=lanY+130;
    svg+=ln(lx,lanY+50,lx,cy-16,'#2a3b48','3,3');
    svg+=rect(lx-60,cy-16,120,36,'#1c2a37','#2a3b48');
    svg+=txt(lx,cy+6,'💻 Clients',11,'#8ea3b0');
  });

  /* VLANs */
  var vlKeys=Object.keys(p.vlans);
  var vlY=lanY+200;
  vlKeys.forEach(function(vn,i){
    var v=p.vlans[vn];
    var vx=160+i*220;
    var ip2=p.ips.find(function(x){return x.interface===vn;});
    svg+=ln(RX,RY+34,vx,vlY-22,'#9b87f5','4,4','a3');
    svg+=rect(vx-90,vlY-22,180,52,'#1a1430','#9b87f5');
    svg+=txt(vx,vlY+2,'🏷️ VLAN '+(v.id||'?')+' · '+vn,11,'#9b87f5','middle','600');
    svg+=txt(vx,vlY+18,ip2?ip2.address:'—',10,'#e6edf3');
  });

  /* VPN */
  p.vpn.forEach(function(v,i){
    var vx=790,vy=RY-10+i*80;
    svg+=ln(RX+105,RY,vx-80,vy,'#9b87f5','5,5','a3');
    svg+=rect(vx-80,vy-22,160,48,'#1a1430','#9b87f5');
    svg+=txt(vx,vy,'🔒 '+v.type,11,'#9b87f5','middle','600');
    svg+=txt(vx,vy+16,'port: '+v.port,10,'#8ea3b0');
  });

  /* IPsec */
  p.ipsec.forEach(function(s,i){
    var vx=790,vy=RY-10+(p.vpn.length+i)*80;
    svg+=ln(RX+105,RY,vx-80,vy,'#e0665a','5,5','a3');
    svg+=rect(vx-80,vy-22,160,48,'#2a1010','#e0665a');
    svg+=txt(vx,vy,'🔐 IPsec',11,'#e0665a','middle','600');
    svg+=txt(vx,vy+16,s.peer,10,'#8ea3b0');
  });

  /* Легенда */
  var LY=H-44;
  svg+=txt(20,LY,'Легенда:',10,'#4a6070','start');
  svg+=ln(76,LY-4,102,LY-4,'#e6b35a','','a2'); svg+=txt(107,LY,'WAN',10,'#e6b35a','start');
  svg+=ln(140,LY-4,166,LY-4,'#5fd0a5','','a1'); svg+=txt(171,LY,'LAN / Bridge',10,'#5fd0a5','start');
  svg+=ln(255,LY-4,281,LY-4,'#9b87f5','4,3');   svg+=txt(286,LY,'VPN/VLAN',10,'#9b87f5','start');

  svg+='</svg>';
  return svg;
}

function initRscTopology() {
  var btn=document.getElementById('btn-rsc-topo');
  if(!btn){console.warn('[rsc-topology] btn-rsc-topo not found');return;}

  var modal=document.createElement('div');
  modal.id='rsc-topo-modal';
  modal.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;align-items:center;justify-content:center;padding:20px;';

  var inner=document.createElement('div');
  inner.style.cssText='background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:20px;max-width:980px;width:100%;max-height:90vh;overflow-y:auto;';
  inner.innerHTML=
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'+
    '<h3 style="margin:0;color:#5fd0a5;font-size:14px;">🗺️ Топологія з .rsc файлу</h3>'+
    '<button id="rsc-topo-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 12px;border-radius:6px;cursor:pointer;">✕ Закрити</button>'+
    '</div>'+
    '<div id="rsc-topo-svg"></div>'+
    '<div style="margin-top:10px;font-size:11px;color:#4a6070;text-align:center;">Топологія згенерована з аналізу .rsc конфігурації</div>';

  modal.appendChild(inner);
  document.body.appendChild(modal);

  document.getElementById('rsc-topo-close').addEventListener('click',function(){modal.style.display='none';});
  modal.addEventListener('click',function(e){if(e.target===modal)modal.style.display='none';});

  btn.addEventListener('click',function(){
    var rscText='';
    var ta=document.getElementById('rsc-input');
    if(ta&&ta.value.trim()) rscText=ta.value.trim();
    if(!rscText){var out=document.getElementById('output');if(out)rscText=(out.textContent||out.innerText||'').trim();}
    if(!rscText){alert('Вставте .rsc конфіг у поле аналізу!');return;}

    var parsed=parseRscTopology(rscText);
    console.log('[rsc-topology] parsed:', parsed);
    document.getElementById('rsc-topo-svg').innerHTML=renderRscTopology(parsed);
    modal.style.display='flex';
  });

  console.log('[rsc-topology] v2 ready');
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',initRscTopology);
}else{
  initRscTopology();
}
