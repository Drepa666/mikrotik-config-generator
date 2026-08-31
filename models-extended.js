'use strict';
/* models-extended.js — розширена база моделей MikroTik */
(function(){

  var EXT={
    'hap-lite':{label:'hAP lite (RB941-2nD)',wifi:'legacy',wanif:'ether1',lanports:'ether2,ether3,ether4',hint:'2.4 ГГц тільки (wlan1). ether1=WAN, ether2-4=LAN. 100 Мбіт.'},
    'hap-mini':{label:'hAP mini (RB931-2nD)',wifi:'legacy',wanif:'ether1',lanports:'ether2,ether3',hint:'2.4 ГГц тільки (wlan1). ether1=WAN, ether2-3=LAN. 100 Мбіт.'},
    'hap':{label:'hAP (RB951Ui-2nD)',wifi:'legacy',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5',hint:'2.4 ГГц (wlan1). ether5 PoE-out. 100 Мбіт.'},
    'hap-ax-lite':{label:'hAP ax lite (C52iG-5HaxD2HaxD)',wifi:'wifi6',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5',hint:'Wi-Fi 6: wifi1=5GHz, wifi2=2.4GHz. /interface wifi. RouterOS 7+.'},
    'hap-ax-lite-lte6':{label:'hAP ax lite LTE6',wifi:'wifi6',wanif:'lte1',wantype:'lte',lanports:'ether1,ether2,ether3,ether4',lte:true,hint:'Wi-Fi 6 + LTE6 (lte1=WAN). ether1-4=LAN. RouterOS 7+.'},
    'hap-be3':{label:'hAP be³ Media (Wi-Fi 7)',wifi:'wifi7',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5',hint:'Wi-Fi 7: wifi1=5GHz, wifi2=2.4GHz. /interface wifi. RouterOS 7.15+.'},
    'hex-s':{label:'hEX S (RB760iGS)',wifi:'none',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5',sfp:true,hint:'Без Wi-Fi. ether1=WAN, ether2-5=LAN, sfp1=SFP.'},
    'hex-poe':{label:'hEX PoE (RB960PGS)',wifi:'none',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5',sfp:true,poe:true,hint:'Без Wi-Fi. ether2-5 PoE-out passive. sfp1=SFP.'},
    'hex-poe-lite':{label:'hEX PoE lite (RB750UPr2)',wifi:'none',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5',poe:true,hint:'Без Wi-Fi. ether2-5 PoE-out passive 100 Мбіт.'},
    'l009-rm':{label:'L009UiGS-RM (без Wi-Fi)',wifi:'none',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5,ether6,ether7,ether8',sfp:true,hint:'Без Wi-Fi. 8 гігабіт + SFP+. 1U стійка. Наступник RB2011.'},
    'l009-wifi6':{label:'L009UiGS-2HaxD-IN (Wi-Fi 6)',wifi:'wifi6',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5,ether6,ether7,ether8',sfp:true,hint:'8 гігабіт + SFP+ + Wi-Fi 6 (wifi1/wifi2). RouterOS 7+.'},
    'rb3011':{label:'RB3011UiAS-RM',wifi:'none',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5,ether6,ether7,ether8,ether9,ether10',sfp:true,hint:'Без Wi-Fi. 10 гігабіт + SFP. 2 групи по 5 портів (різні чіпи!).'},
    'rb4011':{label:'RB4011iGS+RM',wifi:'none',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5,ether6,ether7,ether8,ether9,ether10',sfp:true,hint:'Без Wi-Fi. 10 гігабіт + SFP+. IPsec hardware acceleration.'},
    'rb4011-wifi':{label:'RB4011iGS+5HacQ2HnD-IN (Wi-Fi ac)',wifi:'legacy',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5,ether6,ether7,ether8,ether9,ether10',sfp:true,hint:'10 гігабіт + SFP+ + Wi-Fi ac (wlan1=5G/wlan2=2.4G).'},
    'rb5009':{label:'RB5009UG+S+IN',wifi:'none',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5,ether6,ether7,ether8',sfp:true,hint:'ether1-7=гігабіт, ether8=2.5G, sfp-sfpplus1=SFP+. ARM Cortex-A72.'},
    'rb5009-outdoor':{label:'RB5009UPr+S+OUT (вуличний)',wifi:'none',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5,ether6,ether7,ether8',sfp:true,poe:true,hint:'IP66, PoE-in/out. ether8=2.5G. SFP+.'},
    'ccr2004-sfp':{label:'CCR2004-1G-12S+2XS',wifi:'none',wanif:'sfp-sfpplus1',lanports:'',sfp:true,hint:'ether1=mgmt, 12x SFP+(10G), 2x SFP28(25G). ARM ISP core.'},
    'ccr2004-16g':{label:'CCR2004-16G-2S+',wifi:'none',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5,ether6,ether7,ether8,ether9,ether10,ether11,ether12,ether13,ether14,ether15,ether16',sfp:true,hint:'16 гігабіт + 2x SFP+. ARM Cortex-A72 quad-core.'},
    'ccr2116':{label:'CCR2116-12G-4S+',wifi:'none',wanif:'ether1',lanports:'ether2,ether3,ether4,ether5,ether6,ether7,ether8,ether9,ether10,ether11,ether12',sfp:true,hint:'12 гігабіт + 4x SFP+. 16-ядерний ARM. 1U rack.'},
    'ccr2216':{label:'CCR2216-1G-12XS-2XQ (флагман)',wifi:'none',wanif:'ether1',lanports:'',sfp:true,hint:'1G mgmt + 12x 25G SFP28 + 2x 100G QSFP28. ARM 16-ядер.'},
    'cap':{label:'cAP (RBcAP-2nD)',wifi:'legacy',wanif:'ether1',lanports:'',single:true,poe:true,hint:'1 порт ether1 PoE-in. Тільки 2.4 ГГц (wlan1). Стельова точка.'},
    'cap-ax':{label:'cAP ax (RBcAPGi-5HaxD2HaxD)',wifi:'wifi6',wanif:'ether1',lanports:'',single:true,poe:true,hint:'Wi-Fi 6 (wifi1/wifi2). PoE-in. Стельова точка. RouterOS 7+.'},
    'wap':{label:'wAP (RBwAP2nD)',wifi:'legacy',wanif:'ether1',lanports:'',single:true,poe:true,hint:'1 порт ether1. 2.4 ГГц (wlan1). Вуличний IP54. PoE-in.'},
    'wap-ax':{label:'wAP ax (RBwAPG-5HaxD2HaxD)',wifi:'wifi6',wanif:'ether1',lanports:'',single:true,poe:true,hint:'Wi-Fi 6 (wifi1/wifi2). гігабіт PoE-in. IP55. RouterOS 7+.'},
    'wap-lte':{label:'wAP LTE kit',wifi:'legacy',wanif:'lte1',wantype:'lte',lanports:'',single:true,poe:true,lte:true,hint:'LTE (lte1=WAN) + Wi-Fi ac (wlan1/wlan2). ether1=LAN. IP55.'},
    'audience':{label:'Audience (RBD25G-5HPacQD2HPnD)',wifi:'legacy',wanif:'ether1',lanports:'ether2',hint:'Wi-Fi ac (wlan1=5G/wlan2=2.4G). 2 гігабіт порти. Mesh.'},
    'audience-lte':{label:'Audience LTE6 kit',wifi:'legacy',wanif:'lte1',wantype:'lte',lanports:'ether1,ether2',lte:true,hint:'LTE6 (lte1=WAN) + Wi-Fi ac. ether1-2=LAN. Mesh.'},
    'sxt-5ac':{label:'SXT 5 ac (RBSXTG-5HPacD)',wifi:'legacy',wanif:'ether1',lanports:'',single:true,poe:true,mode:'station',hint:'ОДИН гігабіт ether1. wlan1=5GHz ac. Station або AP. PoE-in.'},
    'sxt-lite5':{label:'SXT Lite5',wifi:'legacy',wanif:'ether1',lanports:'',single:true,poe:true,mode:'station',hint:'1 порт ether1. wlan1=5GHz n. Station/AP. Бюджетний CPE.'},
    'sxtsg-5ac':{label:'SXTsq 5 ac (RBSXTsqG-5acD)',wifi:'legacy',wanif:'ether1',lanports:'',single:true,poe:true,mode:'station',hint:'Плоский корпус. 1 гігабіт ether1. wlan1=5GHz ac. Station/AP.'},
    'sxt-lte-kit':{label:'SXT LTE kit',wifi:'none',wanif:'lte1',wantype:'lte',lanports:'',single:true,poe:true,lte:true,hint:'LTE Cat4 (lte1). 1 ether=LAN. Без Wi-Fi.'},
    'sxt-lte6-kit':{label:'SXT LTE6 kit',wifi:'none',wanif:'lte1',wantype:'lte',lanports:'',single:true,poe:true,lte:true,hint:'LTE Cat6 (lte1). 1 гігабіт ether=LAN.'},
    'sxt-4g-kit':{label:'SXT 4G kit',wifi:'none',wanif:'lte1',wantype:'lte',lanports:'',single:true,poe:true,lte:true,hint:'4G/LTE (lte1). 1 ether=LAN.'},
    'sxtsg-lte4':{label:'SXTsq Embedded LTE4 Global',wifi:'none',wanif:'lte1',wantype:'lte',lanports:'',single:true,poe:true,lte:true,hint:'Вбудований LTE Cat4. Плоский корпус. 1 гігабіт ether=LAN.'},
    'lhg-5ac':{label:'LHG 5 ac (24.5 dBi)',wifi:'legacy',wanif:'ether1',lanports:'',single:true,poe:true,mode:'station',hint:'1 гігабіт ether1. wlan1=5GHz ac. Параболічна антена 24.5 dBi.'},
    'lhg-xl-5ac':{label:'LHG XL 5 ac (27 dBi)',wifi:'legacy',wanif:'ether1',lanports:'',single:true,poe:true,mode:'station',hint:'27 dBi відбивач. wlan1=5GHz ac. Для 30+ км ліній.'},
    'lhg-5ax':{label:'LHG 5 ax (Wi-Fi 6)',wifi:'wifi6',wanif:'ether1',lanports:'',single:true,poe:true,mode:'station',hint:'Wi-Fi 6 (wifi1=5GHz). 1 гігабіт ether1. RouterOS 7+.'},
    'lhg-xl-5ax':{label:'LHG XL 5 ax (27 dBi, Wi-Fi 6)',wifi:'wifi6',wanif:'ether1',lanports:'',single:true,poe:true,mode:'station',hint:'Wi-Fi 6 (wifi1) + 27 dBi. Флагман для дальніх ліній.'},
    'lhg-lte-kit':{label:'LHG LTE kit',wifi:'none',wanif:'lte1',wantype:'lte',lanports:'',single:true,poe:true,lte:true,hint:'LTE Cat4 + напрямлена антена. 1 ether=LAN.'},
    'lhgg-lte6-kit':{label:'LHGG LTE6 kit (гігабіт)',wifi:'none',wanif:'lte1',wantype:'lte',lanports:'',single:true,poe:true,lte:true,hint:'LTE Cat6 + гігабіт ether=LAN. Напрямлена антена.'},
    'lhgg-lte7-kit':{label:'LHGG LTE7 kit',wifi:'none',wanif:'lte1',wantype:'lte',lanports:'',single:true,poe:true,lte:true,hint:'LTE Cat7 + гігабіт ether=LAN.'}
  };

  var GROUPS={
    '── hAP lite / mini (Wi-Fi 4) ──':['hap-lite','hap-mini','hap'],
    '── hAP ac (Wi-Fi 5) ──':['hap-ac-lite','hap-ac2','hap-ac3'],
    '── hAP ax (Wi-Fi 6) ──':['hap-ax2','hap-ax3','hap-ax-s','hap-ax-lite','hap-ax-lite-lte6'],
    '── hAP be (Wi-Fi 7) ──':['hap-be3'],
    '── hEX (без Wi-Fi) ──':['hex','hex-s','hex-poe','hex-poe-lite'],
    '── L009 (наступники RB2011) ──':['l009-rm','l009-wifi6'],
    '── RB (професійні) ──':['rb3011','rb4011','rb4011-wifi','rb5009','rb5009-outdoor'],
    '── CCR (Cloud Core Router) ──':['ccr2004-sfp','ccr2004-16g','ccr2116','ccr2216'],
    '── Chateau (LTE / 5G) ──':['chateau-lte7','chateau-lte12','chateau-5g','chateau-pro-ax'],
    '── cAP (стельові точки) ──':['cap','cap-ac','cap-ax'],
    '── wAP (вуличні точки) ──':['wap','wap-ac','wap-ax','wap-lte'],
    '── Audience (Mesh) ──':['audience','audience-lte'],
    '── SXT / SXTsq (CPE та мости) ──':['sxt-5ac','sxt-lite5','sxtsg-5ac','sxt-lte-kit','sxt-lte6-kit','sxt-4g-kit','sxtsg-lte4'],
    '── LHG / LHGG (дальній зв\'язок) ──':['lhg-5ac','lhg-xl-5ac','lhg-5ax','lhg-xl-5ax','lhg-lte-kit','lhgg-lte6-kit','lhgg-lte7-kit']
  };

  function findModels(){
    if(window.MODELS && typeof window.MODELS==='object' && window.MODELS['hap-ac-lite']) return window.MODELS;
    var keys=Object.keys(window);
    for(var i=0;i<keys.length;i++){
      var v=window[keys[i]];
      if(v&&typeof v==='object'&&v['hap-ac-lite']&&v['hap-ac-lite'].label){window.MODELS=v;return v;}
    }
    return null;
  }

  function addModels(M){
    Object.keys(EXT).forEach(function(k){if(!M[k])M[k]=EXT[k];});
    console.log('[models-extended] моделей в базі:',Object.keys(M).length);
  }

  function buildSelect(M){
    var sel=document.getElementById('model');
    if(!sel)return;
    var cur=sel.value||'hap-ac-lite';
    sel.innerHTML='';
    Object.keys(GROUPS).forEach(function(g){
      var og=document.createElement('optgroup');
      og.label=g;
      var cnt=0;
      GROUPS[g].forEach(function(k){
        var m=M[k];if(!m)return;
        var o=document.createElement('option');
        o.value=k;o.textContent=m.label;
        og.appendChild(o);cnt++;
      });
      if(cnt>0)sel.appendChild(og);
    });
    var oth=document.createElement('option');
    oth.value='other';oth.textContent='Інша модель (вкажу вручну)';
    sel.appendChild(oth);
    if(sel.querySelector('option[value="'+cur+'"]'))sel.value=cur;
    else sel.value='hap-ac-lite';
    console.log('[models-extended] select:',sel.options.length,'опцій');
  }

  window.getModelWarnings=function(k){
    var M=findModels();var m=M&&M[k];if(!m)return[];
    var w=[];
    if(m.mode==='station')w.push('📡 CPE/міст — режим Station (клієнт до базової станції).');
    if(m.lte)w.push('📶 LTE: WAN=lte1. Перевір APN у оператора.');
    if(m.single)w.push('🔌 Один Ethernet порт! LAN тільки через Wi-Fi або зовнішній комутатор.');
    if(m.wifi==='wifi7')w.push('⚠️ Wi-Fi 7 — RouterOS 7.15+. /interface wifi.');
    if(m.wifi==='wifi6')w.push('ℹ️ Wi-Fi 6 — /interface wifi (не /interface wireless). RouterOS 7+.');
    return w;
  };

  function patchApplyModel(M){
    var orig=window.applyModel;
    window.applyModel=function(){
      var sel=document.getElementById('model');
      var k=sel?sel.value:null;
      var m=k&&M[k];
      if(m){
        var wanifEl=document.getElementById('wanif');
        var lanEl=document.getElementById('lanports');
        var wantypeEl=document.getElementById('wantype');
        var hintEl=document.getElementById('model-hint');
        var wifiBadge=document.getElementById('wifi-badge');
        var wifiChk=document.getElementById('wifienable');
        var wifiBlock=document.getElementById('wifi-block');
        var ws=document.getElementById('wan-static');
        var wp=document.getElementById('wan-pppoe');
        var wl=document.getElementById('wan-lte');
        var wl2=document.getElementById('wan-lte2');
        var custBlock=document.getElementById('custom-model-row')||document.getElementById('custommodel-block');
        if(wanifEl)wanifEl.value=m.wanif||'ether1';
        if(lanEl)lanEl.value=m.lanports||'';
        if(wantypeEl)wantypeEl.value=m.wantype||'dhcp';
        if(custBlock)custBlock.style.display='none';
        var wt=m.wantype||'dhcp';
        if(ws)ws.style.display=wt==='static'?'grid':'none';
        if(wp)wp.style.display=wt==='pppoe'?'grid':'none';
        if(wl)wl.style.display=wt==='lte'?'grid':'none';
        if(wl2)wl2.style.display=wt==='lte'?'grid':'none';
        if(wifiChk){
          if(m.wifi==='none'){
            wifiChk.checked=false;wifiChk.disabled=true;
            if(wifiBadge)wifiBadge.textContent='недоступно на цій моделі';
          }else{
            wifiChk.disabled=false;
            var badge=m.wifi==='wifi7'?'wifi1 5ГГц + wifi2 2.4ГГц (Wi-Fi 7)':
                      m.wifi==='wifi6'?'wifi1 5ГГц + wifi2 2.4ГГц (Wi-Fi 6)':
                      'wlan1 2.4ГГц + wlan2 5ГГц';
            if(wifiBadge)wifiBadge.textContent=badge;
          }
          if(wifiBlock)wifiBlock.classList.toggle('disabled',!wifiChk.checked||wifiChk.disabled);
        }
        var warns=window.getModelWarnings?window.getModelWarnings(k):[];
        if(hintEl){
          hintEl.innerHTML=(m.hint||'')+(warns.length?'<br><br>'+warns.map(function(x){
            return'<span style="color:#e6b35a">'+x+'</span>';
          }).join('<br>'):'');
        }
        if(window.render)window.render();
        return;
      }
      if(orig)orig();
    };
  }

  function tryInit(){
    var M=findModels();
    if(!M){setTimeout(tryInit,300);return;}
    addModels(M);
    buildSelect(M);
    patchApplyModel(M);
    var sel=document.getElementById('model');
    if(sel){
      sel.addEventListener('change',function(){if(window.applyModel)window.applyModel();});
      window.applyModel();
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(tryInit,800);});
  }else{
    setTimeout(tryInit,800);
  }

})();