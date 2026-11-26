/* BakeSmart.ua, ЛР №10 + ЛР №12: ініціалізація JS-плагінів (Swiper, Fancybox, Typed.js).
   Для швидкості (LCP, TBT) бібліотеки з CDN не вантажаться разом зі сторінкою:
   Swiper і Fancybox підтягуються, коли їхня секція наближається до екрана, Typed.js після завантаження сторінки. */
(function () {
  'use strict';

  var CDN = 'https://cdn.jsdelivr.net/npm/';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Допоміжні функції ---------- */
  function loadCss(href) {
    return new Promise(function (resolve) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href;
      l.onload = l.onerror = resolve;                 // без стилів плагін усе одно працює
      document.head.appendChild(l);
    });
  }
  function loadJs(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('CDN недоступний: ' + src)); };
      document.head.appendChild(s);
    });
  }
  function whenNear(el, cb) {                         // викликає cb, коли елемент ближче ніж 400 px до екрана
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); cb(); }
    }, { rootMargin: '400px 0px' });
    io.observe(el);
  }
  function afterLoad(cb) {                            // після події load, коли головний потік вільний
    function run() { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(cb); }
    if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
  }

  /* ---------- 1. Swiper.js: слайдер відгуків ---------- */
  whenNear(document.querySelector('.reviews-swiper'), function () {
    Promise.all([loadCss(CDN + 'swiper@11/swiper-bundle.min.css'), loadJs(CDN + 'swiper@11/swiper-bundle.min.js')]).then(function () {
      if (typeof Swiper === 'undefined') return;
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
        pagination: { el: '.rev-nav .swiper-pagination', clickable: true },
        navigation: {
          nextEl: '.rev-nav .swiper-button-next',
          prevEl: '.rev-nav .swiper-button-prev'
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
    }).catch(function () { /* без CDN відгуки лишаються статичним списком */ });
  });

  /* ---------- 2. Fancybox v5: галерея (один альбом data-fancybox="bakery-gallery") ---------- */
  var fancyReady = null;
  function loadFancybox() {                           // завантажується один раз, повторні виклики отримують той самий Promise
    if (!fancyReady) {
      fancyReady = Promise.all([loadCss(CDN + '@fancyapps/ui@5.0/dist/fancybox/fancybox.css'), loadJs(CDN + '@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js')]).then(function () {
        if (typeof Fancybox === 'undefined') throw new Error('Fancybox не завантажено');
        Fancybox.bind('[data-fancybox="bakery-gallery"]', {
          Carousel: { transition: 'fade' },           // ефект переходу (fade)
          Images: { Panzoom: { maxScale: 3 } }        // зум до 3x
        });
      });
    }
    return fancyReady;
  }
  whenNear(document.getElementById('gallery'), function () { loadFancybox().catch(function () { /* без CDN фото відкриваються як звичайні посилання */ }); });
  // Якщо користувач натиснув на фото раніше, ніж підвантажився Fancybox: чекаємо бібліотеку й повторюємо клік,
  // щоб відкрилась галерея з перемиканням, а не окрема сторінка із зображенням
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-fancybox="bakery-gallery"]') : null;
    if (!a || typeof Fancybox !== 'undefined' || a.dataset.retry) return;
    e.preventDefault();
    loadFancybox().then(function () { a.dataset.retry = '1'; a.click(); delete a.dataset.retry; })
      .catch(function () { window.location.href = a.href; });
  });

  /* ---------- 3. Typed.js: ефект друку в Hero ---------- */
  if (!reduceMotion && document.getElementById('typed-text')) {
    afterLoad(function () {
      loadJs(CDN + 'typed.js@2.0.12').then(function () {
        if (typeof Typed === 'undefined') return;
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
      }).catch(function () { /* залишається статичний текст */ });
    });
  }
})();