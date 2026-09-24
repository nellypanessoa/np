const whatsappNumber = '18572011220';
const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');

menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('open', !open);
});

nav?.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    nav.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
  }
});

const valuesFor = (form, name) => [...form.querySelectorAll(`[name="${name}"]:checked`)].map((input) => input.value);
const valueFor = (form, name) => form.elements[name]?.value.trim() || '';
const openWhatsApp = (message) => window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');

document.querySelector('#spanish-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const days = valuesFor(form, 'days');
  if (!days.length) {
    window.alert('Please select at least one available day.');
    form.querySelector('[name="days"]')?.focus();
    return;
  }
  const message = [
    'SPANISH CLASSES — NEW REQUEST',
    '',
    `Name: ${valueFor(form, 'name')}`,
    `Email: ${valueFor(form, 'email')}`,
    `Phone / WhatsApp: ${valueFor(form, 'phone')}`,
    `Available days: ${days.join(', ')}`,
    `Preferred times: ${valueFor(form, 'times')}`,
    `Time zone: ${valueFor(form, 'timezone')}`,
    `Hours per week: ${valueFor(form, 'weekly_hours')}`
  ].join('\n');
  openWhatsApp(message);
});

document.querySelector('#notary-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const services = valuesFor(form, 'services');
  if (!services.length) {
    window.alert('Selecciona al menos un servicio requerido.');
    form.querySelector('[name="services"]')?.focus();
    return;
  }
  const message = [
    'NOTARÍA PÚBLICA MA — NUEVA SOLICITUD',
    '',
    `Nombre: ${valueFor(form, 'name')}`,
    `Correo: ${valueFor(form, 'email')}`,
    `Teléfono / WhatsApp: ${valueFor(form, 'phone')}`,
    `Servicios: ${services.join(', ')}`,
    `Páginas para traducir: ${valueFor(form, 'translation_pages')}`,
    `Autenticaciones requeridas: ${valueFor(form, 'notarizations')}`,
    `Descripción: ${valueFor(form, 'details')}`
  ].join('\n');
  openWhatsApp(message);
});

document.querySelectorAll('.whatsapp-interest').forEach((link) => {
  const interest = link.dataset.interest;
  link.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola Nelly, me interesa recibir información sobre: ${interest}.`)}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
});

document.querySelector('#year').textContent = new Date().getFullYear();
