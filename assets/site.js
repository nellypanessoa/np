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
