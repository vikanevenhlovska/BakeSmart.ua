/* BakeSmart.ua, ЛР №10: ініціалізація JS-плагінів (Swiper, Fancybox, Typed.js) */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Swiper.js: слайдер відгуків ---------- */
  if (typeof Swiper !== 'undefined' && document.querySelector('.reviews-swiper')) {
    // Конструктор приймає селектор та об'єкт конфігурації
    new Swiper('.reviews-swiper', {
      loop: true,
      spaceBetween: 24,
      speed: 600,                                   // тривалість анімації переходу, мс
      autoplay: reduceMotion ? false : {
        delay: 3500,                                // пауза між слайдами, мс
        disableOnInteraction: false,
        // пауза при наведенні лише там, де є справжній курсор; на тачскріні
        // "наведення" після дотику залишало автопрокрутку зупиненою
        pauseOnMouseEnter: window.matchMedia('(hover: hover)').matches
      },
      pagination: { el: '.reviews-swiper .swiper-pagination', clickable: true },
      navigation: {
        nextEl: '.reviews-swiper .swiper-button-next',
        prevEl: '.reviews-swiper .swiper-button-prev'
      },
      a11y: {
        prevSlideMessage: 'Попередній відгук',
        nextSlideMessage: 'Наступний відгук',
        paginationBulletMessage: 'Перейти до відгуку {{index}}'
      },
      breakpoints: {                                // адаптивність
        320:  { slidesPerView: 1 },                 // мобільні
        768:  { slidesPerView: 2 },                 // планшети
        1024: { slidesPerView: 3 }                  // десктопи
      }
    });
  }

  /* ---------- 2. Fancybox v5: галерея (один альбом data-fancybox="bakery-gallery") ---------- */
  if (typeof Fancybox !== 'undefined') {
    Fancybox.bind('[data-fancybox="bakery-gallery"]', {
      Carousel: { transition: 'fade' },             // ефект переходу (fade)
      Images: { Panzoom: { maxScale: 3 } }          // зум до 3x
    });
  }

  /* ---------- 3. Typed.js: ефект друку в Hero ---------- */
  if (typeof Typed !== 'undefined' && document.getElementById('typed-text') && !reduceMotion) {
    // Typed.js, якщо в елементі вже є текст, спершу СТИРАЄ його, а вже потім друкує.
    // Тому запасний текст для no-JS прибираємо перед запуском.
    document.getElementById('typed-text').textContent = '';
    new Typed('#typed-text', {
      strings: [
        'Точні пропорції для будь-якої форми.',
        'Рецепти з продуктів, що є вдома.',
        'Human-tested: перевірено на справжній кухні.'
      ],
      typeSpeed: 50,                                // швидкість друку, мс
      backSpeed: 30,                                // швидкість стирання, мс
      backDelay: 1800,                              // пауза перед стиранням, мс
      loop: true
    });
  }
});