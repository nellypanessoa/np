const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('open', !open);
});
nav?.addEventListener('click', event => {
  if (event.target.matches('a')) {
    nav.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
  }
});
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const serviceSelect = document.querySelector('#contact-service');
const subjectInput = document.querySelector('#contact-subject');
const messageInput = document.querySelector('#contact-message');
function updateContactForm() {
  const type = serviceSelect?.value || '';
  if (subjectInput) subjectInput.value = type ? 'Nueva solicitud web: ' + type : 'Nueva solicitud desde Nelly Panesso';
  if (messageInput) messageInput.placeholder = type === 'Material académico para Contenido Archivístico'
    ? 'Indica el título, autores, temática y enlace de consulta del material ya elaborado. Su publicación requiere revisión editorial.'
    : 'Explica tus necesidades, objetivos y el alcance aproximado de tu solicitud.';
}
serviceSelect?.addEventListener('change', updateContactForm);
document.querySelectorAll('.request-service').forEach(link => {
  link.addEventListener('click', () => {
    const interest = link.dataset.interest;
    if (serviceSelect && [...serviceSelect.options].some(option => option.value === interest)) {
      serviceSelect.value = interest;
      updateContactForm();
    }
  });
});
updateContactForm();

/* Formsubmit backup: use a local mail draft instead of the failing external endpoint. */
const contactForm = document.querySelector('#contact-form');
const contactReady = document.querySelector('#contact-ready');
const contactEmailLink = document.querySelector('#contact-email-link');
const contactCopy = document.querySelector('#contact-copy');
const contactCopyStatus = document.querySelector('#contact-copy-status');
let preparedContactText = '';
contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const values = new FormData(contactForm);
  const type = String(values.get('Servicio solicitado') || 'Consulta profesional');
  const order = ['Nombre', 'email', 'Teléfono o WhatsApp', 'Organización', 'Servicio solicitado', 'Ciudad y país', 'Plazo', 'Descripción de la solicitud'];
  const labels = {'email':'Correo electrónico'};
  const entries = order.map(key => {
    const value = String(values.get(key) || '').trim();
    return value ? (labels[key] || key) + ': ' + value : null;
  }).filter(Boolean);
  preparedContactText = 'Solicitud desde nellypanessoa.github.io/np/' + '\n\n' + entries.join('\n\n') +
    '\n\nAutorización para responder a esta solicitud: Sí';
  const subject = 'Solicitud web - ' + type;
  const mailto = 'mailto:nellypanessoa@gmail.com?subject=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(preparedContactText);
  if(contactEmailLink) contactEmailLink.href = mailto;
  if(contactCopyStatus) contactCopyStatus.textContent = '';
  if(contactReady) {
    contactReady.hidden = false;
    contactReady.scrollIntoView({behavior:'smooth',block:'center'});
  }
});
contactCopy?.addEventListener('click', async () => {
  if (!preparedContactText) return;
  try {
    await navigator.clipboard.writeText(preparedContactText);
    if(contactCopyStatus) contactCopyStatus.textContent = 'Texto copiado. Pégalo en un correo nuevo a nellypanessoa@gmail.com.';
  } catch {
    if(contactCopyStatus) contactCopyStatus.textContent = 'No fue posible copiarlo automáticamente. Abre tu aplicación de correo con el botón anterior.';
  }
});
