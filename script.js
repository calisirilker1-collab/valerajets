const menuBtn = document.querySelector('.menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');
menuBtn?.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.mobile-menu a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.13 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const form = document.getElementById('quoteForm');
const steps = [...document.querySelectorAll('.form-step')];
const progress = [...document.querySelectorAll('.form-progress span')];
const successBox = document.querySelector('.form-success');
const formError = document.querySelector('.form-error');
let currentStep = 0;

function showStep(index){
  currentStep = index;
  steps.forEach((step,i)=>step.classList.toggle('active', i===index));
  progress.forEach((bar,i)=>bar.classList.toggle('active', i<=index));
  if (formError) formError.hidden = true;
}

function validateStep(index){
  const required = [...steps[index].querySelectorAll('[required]')];
  let ok = true;
  required.forEach(el => {
    if (!el.checkValidity()) { el.reportValidity(); ok = false; }
  });
  return ok;
}

document.querySelectorAll('.form-next').forEach(btn => btn.addEventListener('click', () => {
  if(validateStep(currentStep)) showStep(Math.min(currentStep + 1, steps.length - 1));
}));
document.querySelectorAll('.form-back').forEach(btn => btn.addEventListener('click', () => showStep(Math.max(currentStep - 1, 0))));

const tripRadios = document.querySelectorAll('input[name="tripType"]');
const returnField = document.querySelector('.return-field');
const returnInput = document.querySelector('input[name="returnDate"]');
tripRadios.forEach(r => r.addEventListener('change', () => {
  const round = document.querySelector('input[name="tripType"]:checked').value === 'Gidiş Dönüş';
  returnField.classList.toggle('hidden', !round);
  returnInput.required = round;
  if (!round) returnInput.value = '';
}));

const dep = document.querySelector('input[name="departure"]');
const ret = document.querySelector('input[name="returnDate"]');
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth()+1).padStart(2,'0');
const dd = String(today.getDate()).padStart(2,'0');
const minDate = `${yyyy}-${mm}-${dd}`;
dep.min = minDate; ret.min = minDate;
dep.addEventListener('change', ()=> { ret.min = dep.value || minDate; });


// Airport autocomplete — local data, no third-party API/key required.
const airports = Array.isArray(window.VALERA_AIRPORTS) ? window.VALERA_AIRPORTS : [];
const popularAirportCodes = ['IST','SAW','BJV','LTN','FAB','LBG','NCE','GVA','LIN','JMK','DXB','DWC'];

function normalizeSearch(value){
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
}

function airportLabel(a){ return `${a.city} — ${a.name} (${a.code})`; }

function searchAirports(query){
  const q = normalizeSearch(query).trim();
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
      if (code === q) score += 100;
      else if (code.startsWith(q)) score += 80;
      if (city === q) score += 70;
      else if (city.startsWith(q)) score += 55;
      else if (city.includes(q)) score += 35;
      if (name.startsWith(q)) score += 30;
      else if (name.includes(q)) score += 18;
      if (country.includes(q)) score += 5;
      return { a, score };
    })
    .filter(x => x.score > 0)
    .sort((x,y) => y.score - x.score || x.a.city.localeCompare(y.a.city, 'tr'))
    .slice(0, 8)
    .map(x => x.a);
}

function setupAirportAutocomplete(input, list){
  if (!input || !list) return;
  let items = [];
  let activeIndex = -1;

  const close = () => {
    list.classList.remove('open');
    input.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
  };

  const select = airport => {
    input.value = airportLabel(airport);
    input.dataset.iata = airport.code;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    close();
  };

  const render = () => {
    items = searchAirports(input.value);
    activeIndex = -1;
    list.innerHTML = '';

    const hint = document.createElement('div');
    hint.className = 'airport-hint';
    hint.textContent = input.value.trim() ? 'Havalimanı seçenekleri' : 'Popüler özel jet rotaları';
    list.appendChild(hint);

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'airport-empty';
      empty.textContent = 'Eşleşme bulunamadı. Şehir veya havalimanı adını serbestçe yazabilirsiniz.';
      list.appendChild(empty);
    } else {
      items.forEach((airport, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'airport-suggestion';
        button.setAttribute('role', 'option');
        button.innerHTML = `<span class="airport-code">${airport.code}</span><span class="airport-main"><strong>${airport.city}</strong><small>${airport.name}</small></span><span class="airport-country">${airport.country}</span>`;
        button.addEventListener('mousedown', e => e.preventDefault());
        button.addEventListener('click', () => select(airport));
        list.appendChild(button);
      });
    }

    list.classList.add('open');
    input.setAttribute('aria-expanded', 'true');
  };

  input.addEventListener('focus', render);
  input.addEventListener('input', () => {
    input.dataset.iata = '';
    render();
  });
  input.addEventListener('blur', () => setTimeout(close, 120));
  input.addEventListener('keydown', e => {
    const buttons = [...list.querySelectorAll('.airport-suggestion')];
    if (!list.classList.contains('open') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) render();
    if (!buttons.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % buttons.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + buttons.length) % buttons.length;
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(items[activeIndex]);
      return;
    } else if (e.key === 'Escape') {
      close();
      return;
    } else return;

    buttons.forEach((b,i) => b.classList.toggle('active', i === activeIndex));
    buttons[activeIndex]?.scrollIntoView({ block: 'nearest' });
  });
}

setupAirportAutocomplete(document.querySelector('input[name="from"]'), document.getElementById('originSuggestions'));
setupAirportAutocomplete(document.querySelector('input[name="to"]'), document.getElementById('destinationSuggestions'));
setupAirportAutocomplete(document.getElementById('quickFrom'), document.getElementById('quickOriginSuggestions'));
setupAirportAutocomplete(document.getElementById('quickTo'), document.getElementById('quickDestinationSuggestions'));

// Hero "Hızlı Talep" alanı: seçimleri ana teklif formuna aktarır.
const quickFrom = document.getElementById('quickFrom');
const quickTo = document.getElementById('quickTo');
const quickTripType = document.getElementById('quickTripType');
const quickPassengers = document.getElementById('quickPassengers');
const quickDeparture = document.getElementById('quickDeparture');
const quickQuoteBtn = document.getElementById('quickQuoteBtn');
const quickFormError = document.getElementById('quickFormError');

if (quickDeparture) quickDeparture.min = minDate;

quickQuoteBtn?.addEventListener('click', () => {
  const fromValue = String(quickFrom?.value || '').trim();
  const toValue = String(quickTo?.value || '').trim();
  const departureValue = String(quickDeparture?.value || '').trim();

  if (!fromValue || !toValue || !departureValue) {
    if (quickFormError) quickFormError.hidden = false;
    return;
  }

  if (quickFormError) quickFormError.hidden = true;

  const mainFrom = document.querySelector('input[name="from"]');
  const mainTo = document.querySelector('input[name="to"]');
  const mainPassengers = document.querySelector('input[name="passengers"]');
  const mainDeparture = document.querySelector('input[name="departure"]');

  if (mainFrom) {
    mainFrom.value = fromValue;
    mainFrom.dataset.iata = quickFrom?.dataset.iata || '';
  }
  if (mainTo) {
    mainTo.value = toValue;
    mainTo.dataset.iata = quickTo?.dataset.iata || '';
  }
  if (mainPassengers) mainPassengers.value = quickPassengers?.value || '4';
  if (mainDeparture) {
    mainDeparture.value = departureValue;
    mainDeparture.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const selectedTrip = quickTripType?.value || 'Tek Yön';
  const matchingTripRadio = [...tripRadios].find(r => r.value === selectedTrip);
  if (matchingTripRadio) {
    matchingTripRadio.checked = true;
    matchingTripRadio.dispatchEvent(new Event('change', { bubbles: true }));
  }

  showStep(0);
  document.getElementById('teklif')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  setTimeout(() => {
    document.querySelector('input[name="departureTime"]')?.focus({ preventScroll: true });
  }, 650);
});

function getSupabaseConfig(){
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

function showError(message){
  if (!formError) return;
  formError.textContent = message;
  formError.hidden = false;
  formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showSuccess(){
  steps.forEach(s => s.style.display = 'none');
  document.querySelector('.form-progress').style.display = 'none';
  if (formError) formError.hidden = true;
  successBox.hidden = false;
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!validateStep(currentStep)) return;

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

  // Basit bot tuzağı. Normal kullanıcı bu alanı görmez/doldurmaz.
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
        'apikey': config.publishableKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let detail = '';
      try { detail = JSON.stringify(await response.json()); } catch (_) {}
      throw new Error(`Supabase ${response.status}: ${detail}`);
    }

    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', { lead_type: 'private_jet_request' });
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
  successBox.hidden = true;
  document.querySelector('.form-progress').style.display = 'flex';
  steps.forEach(s => s.style.display = '');
  returnField.classList.add('hidden');
  showStep(0);
});
