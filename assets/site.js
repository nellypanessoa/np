const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('open', !open);
});
nav?.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('a')) {
    nav.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
  }
});
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const topic = document.querySelector('#contact-service');
const name = document.querySelector('#contact-name');
const message = document.querySelector('#contact-message');
const whatsapp = document.querySelector('#contact-whatsapp');
const email = document.querySelector('#contact-email');
const topicNote = document.querySelector('#contact-topic-note');
const whatsappNumber = '573017171462';
const emailAddress = 'nellypanessoa@gmail.com';

function contactDraft() {
  const interest = topic?.value?.trim() || '';
  const person = name?.value?.trim() || '';
  const details = message?.value?.trim() || '';
  const lines = [
    'Hola, Nelly.',
    '',
    'Me comunico desde tu página web.',
    'Tema de interés: ' + interest,
  ];
  if (person) lines.push('Nombre: ' + person);
  if (details) lines.push('', 'Mi consulta:', details);
  lines.push('', 'Quedo pendiente de tu respuesta. Muchas gracias.');
  return lines.join('\n');
}
function updateContactLinks() {
  const interest = topic?.value?.trim() || '';
  const draft = contactDraft();
  if (whatsapp) whatsapp.href = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(draft);
  if (email) email.href = 'mailto:' + emailAddress + '?subject=' +
    encodeURIComponent('Consulta desde la web: ' + (interest || 'Tema por seleccionar')) +
    '&body=' + encodeURIComponent(draft);
  if (topicNote) topicNote.textContent = '';
}
function requireTopic(event) {
  if (topic?.value) return;
  event.preventDefault();
  if (topicNote) topicNote.textContent = 'Selecciona un tema para continuar por WhatsApp o correo.';
  topic?.focus();
}
[topic, name, message].forEach(field => {
  field?.addEventListener('input', updateContactLinks);
  field?.addEventListener('change', updateContactLinks);
});
whatsapp?.addEventListener('click', requireTopic);
email?.addEventListener('click', requireTopic);

document.querySelectorAll('.request-service').forEach(link => {
  link.addEventListener('click', () => {
    const interest = link.dataset.interest || '';
    if (topic && Array.from(topic.options).some(option => option.value === interest)) {
      topic.value = interest;
      updateContactLinks();
    }
  });
});
updateContactLinks();
