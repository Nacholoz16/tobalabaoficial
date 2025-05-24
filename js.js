
const header = document.getElementById('site-header');
const cinta = document.getElementById('cinta');
const cinta2 = document.getElementById('cinta2');

window.addEventListener('scroll', () => {
  const cintaTop = cinta.getBoundingClientRect().top;
  const cinta2Top = cinta2.getBoundingClientRect().top;

  if (cinta2Top <= 60) {
    // Segunda cinta activa
    header.classList.add('bg-[#2f58a0]', 'text-white');
    header.classList.remove('bg-[#1e3060]', 'bg-[#0f0f0f]', 'text-gray-100');
  } else if (cintaTop <= 60) {
    // Primera cinta activa
    header.classList.add('bg-[#1e3060]', 'text-white');
    header.classList.remove('bg-[#2f58a0]', 'bg-[#0f0f0f]', 'text-gray-100');
  } else {
    // Ninguna cinta visible, volver al estado base
    header.classList.add('bg-[#0f0f0f]', 'text-gray-100');
    header.classList.remove('bg-[#1e3060]', 'bg-[#2f58a0]', 'text-white');
  }
});


    const btn = document.getElementById('menu-btn');
    const menu = document.getElementById('mobile-menu');

    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });