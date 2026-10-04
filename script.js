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

// Native airport suggestions — reliable on mobile and desktop.
const airports = Array.isArray(window.VALERA_AIRPORTS) ? window.VALERA_AIRPORTS : [];
const airportOptions = document.getElementById('airportOptions');

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

if (airportOptions) {
  const fragment = document.createDocumentFragment();

  airports.forEach(a => {
    const option = document.createElement('option');
    option.value = airportLabel(a);
    option.label = `${a.code} · ${a.city} · ${a.country}`;
    fragment.appendChild(option);
  });

  airportOptions.appendChild(fragment);
}

function resolveAirportInput(input) {
  if (!input) return;

  const raw = String(input.value || '').trim();
  if (!raw) {
    input.dataset.iata = '';
    return;
  }

  const q = normalizeSearch(raw);

  let match = airports.find(a =>
    normalizeSearch(a.code) === q ||
    normalizeSearch(airportLabel(a)) === q
  );

  // If the user typed a unique airport name, format it automatically.
  if (!match) {
    const matches = airports.filter(a =>
      normalizeSearch(a.name) === q ||
      normalizeSearch(`${a.city} ${a.name}`) === q
    );
    if (matches.length === 1) match = matches[0];
  }

  if (match) {
    input.value = airportLabel(match);
    input.dataset.iata = match.code;
  } else {
    input.dataset.iata = '';
  }
}

document.querySelectorAll('input[list="airportOptions"]').forEach(input => {
  input.addEventListener('change', () => resolveAirportInput(input));
  input.addEventListener('blur', () => resolveAirportInput(input));
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
