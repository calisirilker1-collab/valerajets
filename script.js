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
