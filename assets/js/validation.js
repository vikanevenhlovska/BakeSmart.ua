/* BakeSmart.ua: клієнтська валідація форми зворотного зв'язку (Vanilla JS) */
(function () {
  'use strict';

  /* ---------- 1. Регулярні вирази та правила ---------- */
  var REGEX_NAME  = /^(?=(?:[^\p{L}]*\p{L}){2})[\p{L}][\p{L}\s'’-]{1,49}$/u;   // ≥2 літери (lookahead), без цифр і HTML
  var REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;  // user@domain.tld
  var REGEX_PHONE = /^\+380\d{9}$/;                   // +380 і рівно 9 цифр

  /* ---------- 2. Функції перевірки: повертають текст помилки або '' ---------- */
  function validateName(v) {
    v = v.trim();
    if (!v) return 'Введіть ім’я.';
    if (!REGEX_NAME.test(v)) return 'Ім’я: від 2 літер, без цифр і спецсимволів.';
    return '';
  }
  function validateEmail(v) {
    v = v.trim();
    if (!v) return 'Введіть електронну адресу.';
    if (!REGEX_EMAIL.test(v)) return 'Введіть коректну електронну адресу, наприклад user@gmail.com.';
    return '';
  }
  function validatePhone(v) {
    if (!v) return 'Введіть номер телефону.';
    if (!REGEX_PHONE.test(v)) return 'Формат номера: +380XXXXXXXXX (без пробілів і дужок).';
    return '';
  }
  function validateMessage(v) {
    var len = v.trim().length;
    if (!len) return 'Напишіть повідомлення.';
    if (len < 10) return 'Повідомлення має містити щонайменше 10 символів (зараз ' + len + ').';
    return '';
  }
  function validateAgreement(checked) {
    return checked ? '' : 'Потрібна згода з політикою конфіденційності.';
  }

  /* Окрема UX-функція (не RegEx-правило): 0501234567 -> +380501234567 */
  function normalizePhone(v) {
    var s = v.replace(/[\s()-]/g, '');
    if (/^0\d{9}$/.test(s)) return '+38' + s;
    if (/^380\d{9}$/.test(s)) return '+' + s;
    if (REGEX_PHONE.test(s)) return s;   // прибрано пробіли, дужки, дефіси
    return v;                              // решту не чіпаємо: покажемо помилку
  }

  window.FormRules = { validateName: validateName, validateEmail: validateEmail,
    validatePhone: validatePhone, validateMessage: validateMessage,
    validateAgreement: validateAgreement, normalizePhone: normalizePhone };

  var form = document.getElementById('feedbackForm');
  if (!form) return;

  /* ---------- 3. Керування станами UI ---------- */
  var FIELDS = [
    { id: 'username',  check: validateName },
    { id: 'email',     check: validateEmail },
    { id: 'phone',     check: validatePhone },
    { id: 'message',   check: validateMessage },
    { id: 'agreement', check: validateAgreement, box: true }
  ];
  FIELDS.forEach(function (f) {
    f.el = document.getElementById(f.id);
    f.err = document.getElementById(f.id + 'Error');
    f.touched = false;
  });

  function showError(f, msg) {
    f.err.textContent = msg;
    f.err.classList.remove('hidden');
    f.el.setAttribute('aria-invalid', 'true');
    f.el.classList.remove('!border-green-500', 'is-ok');
    if (!f.box) f.el.classList.add('!border-red-500');
  }
  function showSuccess(f) {
    clearError(f);
    f.el.setAttribute('aria-invalid', 'false');
    if (!f.box) f.el.classList.add('!border-green-500', 'is-ok');
  }
  function clearError(f) {
    f.err.textContent = '';
    f.err.classList.add('hidden');
    f.el.removeAttribute('aria-invalid');
    f.el.classList.remove('!border-red-500', '!border-green-500', 'is-ok');
  }
  function run(f) {                       // перевіряє поле й оновлює його стан
    var msg = f.check(f.box ? f.el.checked : f.el.value);
    if (msg) showError(f, msg); else showSuccess(f);
    return !msg;
  }

  /* ---------- 4. Динамічна валідація: input, blur, change ---------- */
  var phoneHint = document.getElementById('phoneHint');
  FIELDS.forEach(function (f) {
    if (f.box) {
      f.el.addEventListener('change', function () { f.touched = true; run(f); });
      return;
    }
    f.el.addEventListener('input', function () { if (f.touched) run(f); });
    f.el.addEventListener('blur', function () {
      if (f.id === 'phone' && f.el.value) {
        var n = normalizePhone(f.el.value);
        if (n !== f.el.value) {
          f.el.value = n;
          phoneHint.textContent = 'Номер приведено до формату +380XXXXXXXXX.';
        }
      }
      f.touched = true; run(f);          // blur = фінальна перевірка поля (в т.ч. порожнього)
    });
  });
  document.getElementById('phone').addEventListener('input', function () { phoneHint.textContent = ''; });

  /* ---------- 5. Submit і модальне вікно ---------- */
  var modal = document.getElementById('successModal');
  var closeBtn = document.getElementById('modalClose');
  var submitBtn = form.querySelector('[type="submit"]');
  var opener = null;

  function openModal() {
    opener = document.activeElement;
    modal.classList.remove('hidden'); modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    closeBtn.focus();
  }
  function closeModal() {
    modal.classList.add('hidden'); modal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
    submitBtn.disabled = false;
    if (opener) opener.focus();
  }
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }   // фокус не виходить з вікна
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitBtn.disabled) return;       // захист від повторних натискань
    var firstBad = null;
    FIELDS.forEach(function (f) { f.touched = true; if (!run(f) && !firstBad) firstBad = f; });
    if (firstBad) { firstBad.el.focus(); return; }
    // Тут мав би бути запит на сервер. Його немає: це імітація успішного надсилання.
    submitBtn.disabled = true;
    form.reset();
    FIELDS.forEach(function (f) { f.touched = false; clearError(f); });
    phoneHint.textContent = '';
    openModal();
  });
})();
