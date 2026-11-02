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
document.querySelectorAll('.request-service').forEach(link => {
  const subject = 'Consulta de servicios: ' + (link.dataset.interest || 'Gestión documental');
  link.href = 'mailto:nellypanessoa@gmail.com?subject=' + encodeURIComponent(subject);
});