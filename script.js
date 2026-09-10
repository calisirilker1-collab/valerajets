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
let currentStep = 0;

function showStep(index){
  currentStep = index;
  steps.forEach((step,i)=>step.classList.toggle('active', i===index));
  progress.forEach((bar,i)=>bar.classList.toggle('active', i<=index));
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

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!validateStep(currentStep)) return;

  const data = Object.fromEntries(new FormData(form).entries());
  console.log('Valera Jets lead payload:', data);

  // PRODUCTION NOTE:
  // Replace this demo block with your real lead endpoint, CRM webhook,
  // serverless function, Formspree, HubSpot, Pipedrive, etc.
  steps.forEach(s => s.style.display = 'none');
  document.querySelector('.form-progress').style.display = 'none';
  document.querySelector('.form-success').hidden = false;
});

document.querySelector('.reset-form')?.addEventListener('click', () => {
  form.reset();
  document.querySelector('.form-success').hidden = true;
  document.querySelector('.form-progress').style.display = 'flex';
  steps.forEach(s => s.style.display = '');
  returnField.classList.add('hidden');
  showStep(0);
});
