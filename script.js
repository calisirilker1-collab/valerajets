const menuBtn = document.querySelector('.menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

menuBtn?.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.mobile-menu a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.13 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const form = document.getElementById('quoteForm');
const successBox = document.querySelector('.form-success');
const formContent = document.querySelector('.single-form-content');
const formError = document.querySelector('.form-error');

const tripRadios = document.querySelectorAll('input[name="tripType"]');
const returnField = document.querySelector('.return-field');
const returnInput = document.querySelector('input[name="returnDate"]');
const dep = document.querySelector('input[name="departure"]');
const ret = document.querySelector('input[name="returnDate"]');

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const minDate = `${yyyy}-${mm}-${dd}`;

if (dep) dep.min = minDate;
if (ret) ret.min = minDate;

dep?.addEventListener('change', () => {
  if (ret) ret.min = dep.value || minDate;
});

tripRadios.forEach(r => r.addEventListener('change', () => {
  const checked = document.querySelector('input[name="tripType"]:checked');
  const round = checked?.value === 'Gidiş Dönüş';

  returnField?.classList.toggle('hidden', !round);

  if (returnInput) {
    returnInput.required = round;
    if (!round) returnInput.value = '';
  }
}));

// Airport autocomplete — custom UI for desktop and mobile.
const airports = Array.isArray(window.VALERA_AIRPORTS) ? window.VALERA_AIRPORTS : [];
const popularAirportCodes = ['IST','SAW','BJV','DLM','AYT','ADB','ESB','LTN','FAB','LBG','NCE','GVA','LIN','JMK','DXB','DWC'];

function normalizeSearch(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .trim();
}

function airportLabel(a) {
  return `${a.city} — ${a.name} (${a.code})`;
}

function searchAirports(query) {
  const q = normalizeSearch(query);

  if (!q) {
    return popularAirportCodes
      .map(code => airports.find(a => a.code === code))
      .filter(Boolean)
      .slice(0, 8);
  }

  if (q.length < 2) return [];

  return airports
    .map(a => {
      const code = normalizeSearch(a.code);
      const city = normalizeSearch(a.city);
      const name = normalizeSearch(a.name);
      const country = normalizeSearch(a.country);

      let score = 0;

      if (code === q) score += 120;
      else if (code.startsWith(q)) score += 95;

      if (city === q) score += 85;
      else if (city.startsWith(q)) score += 65;
      else if (city.includes(q)) score += 40;

      if (name.startsWith(q)) score += 35;
      else if (name.includes(q)) score += 20;

      if (country.includes(q)) score += 5;

      return { airport: a, score };
    })
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score || a.airport.city.localeCompare(b.airport.city, 'tr'))
    .slice(0, 8)
    .map(x => x.airport);
}

function resolveAirportInput(input) {
  if (!input) return null;

  const raw = String(input.value || '').trim();
  if (!raw) {
    input.dataset.iata = '';
    return null;
  }

  const q = normalizeSearch(raw);

  const exact = airports.find(a =>
    normalizeSearch(a.code) === q ||
    normalizeSearch(airportLabel(a)) === q
  );

  if (exact) {
    input.value = airportLabel(exact);
    input.dataset.iata = exact.code;
    return exact;
  }

  const unique = airports.filter(a =>
    normalizeSearch(a.name) === q ||
    normalizeSearch(`${a.city} ${a.name}`) === q
  );

  if (unique.length === 1) {
    input.value = airportLabel(unique[0]);
    input.dataset.iata = unique[0].code;
    return unique[0];
  }

  input.dataset.iata = '';
  return null;
}

function setupAirportAutocomplete(input, list) {
  if (!input || !list) return;

  let currentItems = [];
  let activeIndex = -1;
  let isSelecting = false;

  const isMobile = () =>
    window.matchMedia('(max-width: 700px), (pointer: coarse)').matches;

  const close = () => {
    list.classList.remove('open');
    input.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
  };

  const choose = airport => {
    if (!airport) return;

    isSelecting = true;
    input.value = airportLabel(airport);
    input.dataset.iata = airport.code;
    input.setAttribute('aria-expanded', 'false');
    list.classList.remove('open');

    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Keep keyboard behavior natural on mobile after selection.
    if (isMobile()) input.blur();

    window.setTimeout(() => {
      isSelecting = false;
    }, 60);
  };

  const render = () => {
    currentItems = searchAirports(input.value);
    activeIndex = -1;
    list.innerHTML = '';

    const hint = document.createElement('div');
    hint.className = 'airport-hint';
    hint.textContent = input.value.trim()
      ? 'Havalimanı seçenekleri'
      : 'Popüler özel jet havalimanları';
    list.appendChild(hint);

    if (!currentItems.length) {
      const empty = document.createElement('div');
      empty.className = 'airport-empty';
      empty.textContent = 'Eşleşme bulunamadı. Şehir, havalimanı adı veya IATA kodu yazın.';
      list.appendChild(empty);
    } else {
      currentItems.forEach((airport, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'airport-suggestion';
        button.setAttribute('role', 'option');
        button.setAttribute('aria-label', `${airport.city}, ${airport.name}, ${airport.code}`);
        button.dataset.index = String(index);

        button.innerHTML = `
          <span class="airport-code">${airport.code}</span>
          <span class="airport-main">
            <strong>${airport.city}</strong>
            <small>${airport.name}</small>
          </span>
          <span class="airport-country">${airport.country}</span>
        `;

        const selectNow = e => {
          e.preventDefault();
          e.stopPropagation();
          choose(airport);
        };

        // pointerdown works for mouse, touch and pen before input blur fires.
        button.addEventListener('pointerdown', selectNow);
        button.addEventListener('touchstart', selectNow, { passive: false });
        button.addEventListener('click', selectNow);

        list.appendChild(button);
      });
    }

    list.classList.add('open');
    input.setAttribute('aria-expanded', 'true');

    if (isMobile()) {
      document.body.classList.add('airport-picker-open');
    }
  };

  const reallyClose = () => {
    close();
    document.body.classList.remove('airport-picker-open');
  };

  input.addEventListener('focus', render);

  input.addEventListener('input', () => {
    if (isSelecting) return;
    input.dataset.iata = '';
    render();
  });

  input.addEventListener('blur', () => {
    window.setTimeout(() => {
      if (isSelecting) return;
      resolveAirportInput(input);
      reallyClose();
    }, isMobile() ? 320 : 160);
  });

  input.addEventListener('keydown', e => {
    const buttons = [...list.querySelectorAll('.airport-suggestion')];

    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !list.classList.contains('open')) {
      render();
    }

    if (e.key === 'Escape') {
      reallyClose();
      return;
    }

    if (e.key === 'Enter') {
      const chosen =
        activeIndex >= 0
          ? currentItems[activeIndex]
          : currentItems.length === 1
            ? currentItems[0]
            : resolveAirportInput(input);

      if (chosen) {
        e.preventDefault();
        choose(chosen);
      }
      return;
    }

    if (!buttons.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % buttons.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + buttons.length) % buttons.length;
    } else {
      return;
    }

    buttons.forEach((button, index) => {
      button.classList.toggle('active', index === activeIndex);
    });

    buttons[activeIndex]?.scrollIntoView({ block: 'nearest' });
  });
}

setupAirportAutocomplete(
  document.querySelector('input[name="from"]'),
  document.getElementById('originSuggestions')
);

setupAirportAutocomplete(
  document.querySelector('input[name="to"]'),
  document.getElementById('destinationSuggestions')
);

// Conversational request helper — fills only fields we can identify confidently.
const smartRequestText = document.getElementById('smartRequestText');
const smartFillButton = document.getElementById('smartFillButton');
const smartRequestStatus = document.getElementById('smartRequestStatus');
const smartExample = document.getElementById('smartExample');

const TR_MONTHS = {
  ocak:0, subat:1, şubat:1, mart:2, nisan:3, mayis:4, mayıs:4, haziran:5,
  temmuz:6, agustos:7, ağustos:7, eylul:8, eylül:8, ekim:9, kasim:10, kasım:10, aralik:11, aralık:11
};

function toISODate(date){
  if(!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,'0');
  const d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function parseNaturalDate(text){
  const raw=String(text||'');
  const n=normalizeSearch(raw);
  const now=new Date();

  if(/\byarin\b/.test(n)){
    const d=new Date(now); d.setDate(d.getDate()+1); return toISODate(d);
  }
  if(/\bbugun\b/.test(n)) return toISODate(now);

  const numeric=raw.match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/);
  if(numeric){
    let day=Number(numeric[1]), month=Number(numeric[2])-1;
    let year=numeric[3]?Number(numeric[3]):now.getFullYear();
    if(year<100) year+=2000;
    const d=new Date(year,month,day);
    if(d.getFullYear()===year && d.getMonth()===month && d.getDate()===day) return toISODate(d);
  }

  const monthPattern='ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik';
  const named=raw.toLocaleLowerCase('tr-TR').match(new RegExp('\\b(\\d{1,2})\\s+('+monthPattern+')(?:\\s+(\\d{4}))?\\b','i'));
  if(named){
    const day=Number(named[1]);
    const month=TR_MONTHS[normalizeSearch(named[2])];
    let year=named[3]?Number(named[3]):now.getFullYear();
    let d=new Date(year,month,day);
    if(!named[3] && d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      d=new Date(year+1,month,day);
    }
    return toISODate(d);
  }

  return '';
}

function parseNaturalTime(text){
  const raw=String(text||'').toLocaleLowerCase('tr-TR');

  const explicit=raw.match(/(?:saat\s*)?(\d{1,2})[:.](\d{2})\b/);
  if(explicit){
    let h=Number(explicit[1]), m=Number(explicit[2]);
    if(h>=0 && h<=23 && (m===0 || m===30)){
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }
    // Round only to supported half-hour values.
    if(h>=0 && h<=23 && m>=0 && m<=59){
      if(m<15) m=0;
      else if(m<45) m=30;
      else { m=0; h=(h+1)%24; }
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }
  }

  const hourOnly=raw.match(/(?:saat\s+)(\d{1,2})\b/);
  if(hourOnly){
    const h=Number(hourOnly[1]);
    if(h>=0 && h<=23) return `${String(h).padStart(2,'0')}:00`;
  }

  return '';
}

function findAirportMention(fragment){
  const q=normalizeSearch(fragment);
  if(!q) return null;

  const direct=airports.find(a => normalizeSearch(a.code)===q);
  if(direct) return direct;

  const scored=airports.map(a=>{
    const city=normalizeSearch(a.city);
    const name=normalizeSearch(a.name);
    const code=normalizeSearch(a.code);
    let score=0;
    if(q.includes(code)) score+=100;
    if(q.includes(city)) score+=70;
    if(q.includes(name)) score+=80;
    if(city.includes(q) || q.includes(city)) score+=30;
    if(name.includes(q) || q.includes(name)) score+=25;
    return {a,score};
  }).filter(x=>x.score>0).sort((x,y)=>y.score-x.score);

  return scored[0]?.a || null;
}

function parseRoute(text){
  const raw=String(text||'').trim();

  // Turkish: "Miami'den Dubai'ye", "İstanbuldan Londraya"
  const turkish=raw.match(/(.+?)(?:'?(?:dan|den|tan|ten))\s+(.+?)(?:'?(?:ya|ye|a|e))(?=\s|,|\.|$)/i);
  if(turkish){
    const from=findAirportMention(turkish[1]);
    const to=findAirportMention(turkish[2]);
    if(from || to) return {from,to};
  }

  // Arrow / "to": "MIA -> DXB", "Miami to Dubai"
  const arrow=raw.match(/(.+?)\s*(?:→|->|\bto\b)\s*(.+?)(?=,|\.|$)/i);
  if(arrow){
    return {from:findAirportMention(arrow[1]),to:findAirportMention(arrow[2])};
  }

  // Fallback: first two distinct airport/city mentions in text.
  const normalized=normalizeSearch(raw);
  const found=[];
  airports.forEach(a=>{
    const city=normalizeSearch(a.city);
    const code=normalizeSearch(a.code);
    const name=normalizeSearch(a.name);
    let pos=-1;
    for(const key of [code,city,name]){
      const i=normalized.indexOf(key);
      if(i>=0 && (pos<0 || i<pos)) pos=i;
    }
    if(pos>=0) found.push({a,pos});
  });
  found.sort((x,y)=>x.pos-y.pos);
  const unique=[];
  for(const x of found){
    if(!unique.some(u=>u.a.code===x.a.code)) unique.push(x);
  }
  return {from:unique[0]?.a||null,to:unique[1]?.a||null};
}

function parseSmartRequest(text){
  const normalized=normalizeSearch(text);
  const route=parseRoute(text);

  let passengers=null;
  const paxMatch=normalized.match(/\b(\d{1,2})\s*(?:kisi|kisilik|pax|yolcu)\b/);
  if(paxMatch){
    const n=Number(paxMatch[1]);
    if(n>=1 && n<=30) passengers=n;
  }

  let tripType='';
  if(/gidiş\s*dönüş|gidis\s*donus|round\s*trip/.test(normalized)) tripType='Gidiş Dönüş';
  else if(/tek\s*yön|tek\s*yon|one\s*way/.test(normalized)) tripType='Tek Yön';

  let jetType='';
  if(/heavy\s*jet|agir\s*jet|ağır\s*jet/.test(normalized)) jetType='Heavy Jet';
  else if(/midsize\s*jet|orta\s*boy/.test(normalized)) jetType='Midsize Jet';
  else if(/light\s*jet|hafif\s*jet/.test(normalized)) jetType='Light Jet';

  return {
    from: route.from,
    to: route.to,
    passengers,
    tripType,
    departureDate: parseNaturalDate(text),
    departureTime: parseNaturalTime(text),
    jetType
  };
}

function setSelectValue(select,value){
  if(!select || !value) return false;
  const option=[...select.options].find(o=>o.value===value);
  if(!option) return false;
  select.value=value;
  return true;
}

function fillFormFromSmartRequest(){
  const text=String(smartRequestText?.value||'').trim();

  if(!text){
    if(smartRequestStatus) smartRequestStatus.textContent='Önce uçuş talebinizi birkaç cümleyle yazın.';
    smartRequestText?.focus();
    return;
  }

  const parsed=parseSmartRequest(text);
  let filled=0;
  const missing=[];

  const fromInput=form?.querySelector('input[name="from"]');
  const toInput=form?.querySelector('input[name="to"]');
  const departureInput=form?.querySelector('input[name="departure"]');
  const passengersInput=form?.querySelector('input[name="passengers"]');
  const timeSelect=form?.querySelector('select[name="departureTime"]');
  const jetSelect=form?.querySelector('select[name="jetType"]');

  if(parsed.from && fromInput){
    fromInput.value=airportLabel(parsed.from);
    fromInput.dataset.iata=parsed.from.code;
    filled++;
  } else missing.push('kalkış');

  if(parsed.to && toInput){
    toInput.value=airportLabel(parsed.to);
    toInput.dataset.iata=parsed.to.code;
    filled++;
  } else missing.push('varış');

  if(parsed.departureDate && departureInput){
    departureInput.value=parsed.departureDate;
    departureInput.dispatchEvent(new Event('change',{bubbles:true}));
    filled++;
  } else missing.push('tarih');

  if(parsed.departureTime && timeSelect && setSelectValue(timeSelect,parsed.departureTime)){
    filled++;
  }

  if(parsed.passengers && passengersInput){
    passengersInput.value=String(parsed.passengers);
    filled++;
  } else missing.push('yolcu');

  if(parsed.tripType){
    const radio=[...tripRadios].find(r=>r.value===parsed.tripType);
    if(radio){
      radio.checked=true;
      radio.dispatchEvent(new Event('change',{bubbles:true}));
      filled++;
    }
  }

  if(parsed.jetType && jetSelect && setSelectValue(jetSelect,parsed.jetType)){
    filled++;
  }

  if(smartRequestStatus){
    smartRequestStatus.textContent = missing.length
      ? `${filled} alan dolduruldu. ${missing.join(', ')} bilgisini aşağıdan tamamlayabilirsiniz.`
      : `${filled} alan dolduruldu. Bilgileri kontrol edip talebi gönderebilirsiniz.`;
  }

  document.querySelector('.single-form-section')?.scrollIntoView({behavior:'smooth',block:'start'});
}

smartFillButton?.addEventListener('click',fillFormFromSmartRequest);

smartRequestText?.addEventListener('keydown',e=>{
  if((e.ctrlKey || e.metaKey) && e.key==='Enter'){
    e.preventDefault();
    fillFormFromSmartRequest();
  }
});

smartExample?.addEventListener('click',()=>{
  if(!smartRequestText) return;
  smartRequestText.value="Miami'den Dubai'ye 5 kişi, 18 Ekim saat 14:30, tek yön. Heavy Jet tercih ederim.";
  smartRequestText.focus();
});

function getSupabaseConfig() {
  const config = window.VALERA_SUPABASE || {};

  const configured =
    typeof config.url === 'string' &&
    config.url.startsWith('https://') &&
    !config.url.includes('YOUR_PROJECT_REF') &&
    typeof config.publishableKey === 'string' &&
    config.publishableKey.startsWith('sb_publishable_') &&
    !config.publishableKey.includes('YOUR_KEY');

  return configured ? config : null;
}

function showError(message) {
  if (!formError) return;

  formError.textContent = message;
  formError.hidden = false;
  formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showSuccess() {
  if (formError) formError.hidden = true;
  if (formContent) formContent.hidden = true;
  if (successBox) successBox.hidden = false;
}

form?.addEventListener('submit', async e => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  resolveAirportInput(form.querySelector('input[name="from"]'));
  resolveAirportInput(form.querySelector('input[name="to"]'));

  const config = getSupabaseConfig();

  if (!config) {
    showError('Form bağlantısı henüz yapılandırılmadı. Lütfen daha sonra tekrar deneyin.');
    console.error('Supabase configuration is missing. Check supabase-config.js.');
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonHtml = submitButton.innerHTML;

  submitButton.disabled = true;
  submitButton.textContent = 'Gönderiliyor...';

  if (formError) formError.hidden = true;

  const fd = new FormData(form);

  // Honeypot: bots may fill this hidden field.
  if ((fd.get('website') || '').trim()) {
    showSuccess();
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonHtml;
    return;
  }

  const payload = {
    trip_type: fd.get('tripType'),
    origin: String(fd.get('from') || '').trim(),
    destination: String(fd.get('to') || '').trim(),
    departure_date: fd.get('departure'),
    return_date: fd.get('returnDate') || null,
    preferred_departure_time: fd.get('departureTime') || null,
    passengers: Number(fd.get('passengers')),
    jet_type: String(fd.get('jetType') || 'Farketmez / En uygun seçenek').trim(),
    notes: String(fd.get('notes') || '').trim() || null,
    full_name: String(fd.get('name') || '').trim(),
    phone: String(fd.get('phone') || '').trim(),
    email: String(fd.get('email') || '').trim().toLowerCase(),
    consent: fd.get('kvkk') === 'on',
    source: 'valerajets.com',
    status: 'new'
  };

  try {
    const response = await fetch(`${config.url}/rest/v1/flight_requests`, {
      method: 'POST',
      headers: {
        apikey: config.publishableKey,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let detail = '';
      try {
        detail = JSON.stringify(await response.json());
      } catch (_) {}

      throw new Error(`Supabase ${response.status}: ${detail}`);
    }

    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', {
        lead_type: 'private_jet_request'
      });
    }

    showSuccess();
  } catch (error) {
    console.error('Valera Jets lead submit failed:', error);
    showError('Talebiniz şu anda gönderilemedi. Lütfen birkaç dakika sonra tekrar deneyin.');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonHtml;
  }
});

document.querySelector('.reset-form')?.addEventListener('click', () => {
  form.reset();

  if (successBox) successBox.hidden = true;
  if (formContent) formContent.hidden = false;
  if (formError) formError.hidden = true;

  returnField?.classList.add('hidden');

  if (returnInput) {
    returnInput.required = false;
    returnInput.value = '';
  }

  if (dep) dep.min = minDate;
  if (ret) ret.min = minDate;

  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
