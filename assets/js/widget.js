/* BakeSmart.ua, ЛР №11: інтерактивний віджет «Калькулятор пропорцій та форм»
   (Vanilla JS, захисне програмування, обробка Edge Cases). Рахує всі інгредієнти обраного рецепта */
(function () {
  'use strict';   // увесь код в IIFE: віджет не створює глобальних змінних і функцій

  /* ---------- 1. Конфігурація (дублює min/max з HTML, рівень 2 захисту) ---------- */
  var LIMITS = {
    dim:  { min: 5, max: 80 },     // розмір форми, см
    serv: { min: 1, max: 100 }     // кількість порцій
  };
  var SHAPES = ['round', 'square', 'rect'];
  /* Дані калькулятора: інгредієнти для базових порцій у рецепті.
     u: г, мл, шт., ст. л.; fixed: не масштабується; egg: яйце (для підказки про частини яйця).
     form: форма з рецепта; mine: стартова «Ваша форма»; serv: скільки порцій дає рецепт; allergens: для примітки */
  var CALC={
    sharlotka:{form:{type:'round',d:24},mine:{type:'round',d:20},serv:8,note:'У рецепті: форма Ø 24 см.',
      allergens:'глютен (борошно), яйця.',
      ing:[{n:'Яйця',q:3,u:'шт.',egg:true},{n:'Цукор',q:150,u:'г'},{n:'Борошно',q:150,u:'г'},{n:'Яблука',q:4,u:'шт.'}]},
    brauni:{form:{type:'square',s:20},mine:{type:'square',s:24},serv:9,note:'У рецепті: форма 20 × 20 см.',
      allergens:'глютен (борошно), яйця, молоко (масло, шоколад).',
      ing:[{n:'Шоколад',q:150,u:'г'},{n:'Масло',q:120,u:'г'},{n:'Яйця',q:3,u:'шт.',egg:true},{n:'Цукор',q:150,u:'г'},{n:'Борошно',q:80,u:'г'},{n:'Сіль',u:'щіпка',fixed:true}]},
    bulochky:{form:null,serv:9,note:'У рецепті немає конкретної форми, тому калькулятор рахує за порціями (рецепт дає 8–10 булочок).',
      allergens:'глютен (борошно), яйця, молоко (молоко, масло).',
      ing:[{n:'Борошно',q:400,u:'г'},{n:'Молоко',q:250,u:'мл'},{n:'Сухі дріжджі',q:7,u:'г'},{n:'Цукор у тісті',q:50,u:'г'},{n:'Яйце',q:1,u:'шт.',egg:true},{n:'Масло у тісті',q:60,u:'г'},{n:'Масло для начинки',q:60,u:'г'},{n:'Цукор для начинки',q:80,u:'г'},{n:'Кориця',q:2,u:'ст. л.'}]},
    pechyvo:{form:null,serv:16,note:'У рецепті немає конкретної форми, тому калькулятор рахує за порціями (рецепт дає близько 16 печив по 25 г).',
      allergens:'глютен (борошно), яйця, молоко (масло), горіхи (мигдаль).',
      ing:[{n:'Борошно',q:150,u:'г'},{n:'Масло',q:100,u:'г'},{n:'Цукор',q:60,u:'г'},{n:'Мигдаль',q:80,u:'г'},{n:'Жовток',q:1,u:'шт.',egg:true}]},
    focaccia:{form:null,serv:8,note:'У рецепті немає конкретної форми, тому калькулятор рахує за порціями (рецепт дає близько 8 шматків).',
      allergens:'глютен (борошно).',
      ing:[{n:'Борошно',q:500,u:'г'},{n:'Вода',q:400,u:'мл'},{n:'Сухі дріжджі',q:7,u:'г'},{n:'Сіль',q:10,u:'г'},{n:'Олія',q:2,u:'ст. л.'}]},
    cheesecake:{form:{type:'round',d:20},mine:{type:'round',d:24},serv:10,note:'У рецепті: форма Ø 20 см.',
      allergens:'глютен (печиво), яйця, молоко (сир, масло).',
      ing:[{n:'Печиво',q:200,u:'г'},{n:'Масло',q:80,u:'г'},{n:'Сир',q:600,u:'г'},{n:'Цукор',q:150,u:'г'},{n:'Яйця',q:3,u:'шт.',egg:true},{n:'Ваніль',u:'за смаком',fixed:true}]}
  };
  var NAMES = {'sharlotka': 'Яблучна шарлотка', 'brauni': 'Шоколадне брауні', 'bulochky': 'Булочки з корицею', 'pechyvo': 'Мигдалеве печиво', 'focaccia': 'Фокача з розмарином', 'cheesecake': 'Сирний чізкейк'};
  var RECIPES = {};
  Object.keys(NAMES).forEach(function (id) { RECIPES[id] = { name: NAMES[id], c: CALC[id] }; });
  var DEFAULT_RECIPE = 'sharlotka';
  var MSG = {
    dim:     'Введіть розмір від 5 до 80 см.',
    serv:    'Введіть кількість порцій від 1 до 100.',
    summary: 'Виправте виділені поля, щоб побачити результат.',
    fatal:   'Не вдалося виконати розрахунок. Оновіть сторінку та спробуйте ще раз.'
  };

  /* ---------- 2. Безпечний доступ до DOM: немає елемента, немає падіння ---------- */
  function byId(id) { return document.getElementById(id); }

  var REQUIRED = ['calculator', 'recipe', 'err', 'err-t', 'res-title', 'ratio', 'tbody', 'notes',
    'mode-shape', 'mode-serv', 'fs-a', 'fs-b', 'a-type', 'b-type',
    'a-d', 'a-s', 'a-l', 'a-w', 'b-d', 'b-s', 'b-l', 'b-w', 's-a', 's-b'];
  var missing = REQUIRED.filter(function (id) { return !byId(id); });
  if (missing.length) {
    // Fail-safe: розробнику попередження в консоль, користувачу нічого не ламається
    if (window.console) console.warn('[BakeSmart widget] Немає елементів: ' + missing.join(', ') + '. Віджет вимкнено.');
    return;
  }
  if (!RECIPES[DEFAULT_RECIPE]) {
    if (window.console) console.warn('[BakeSmart widget] Немає даних рецептів. Віджет вимкнено.');
    return;
  }
  var root = byId('calculator');
  var mode = 'shape';
  var recipeId = DEFAULT_RECIPE;

  /* ---------- 3. Допоміжні функції ---------- */
  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function fmtR(r) { return (Math.round(r * 100) / 100).toString().replace('.', ','); }
  /* кількість з одиницею: г/мл округлюємо, штуки й ложки до реалістичної кратності */
  function fmtAmount(it, k) {
    if (it.fixed) return it.u;
    var v = it.q * k, r, pre = '';
    if (it.u === 'шт.') {
      if (v < 0.25) return '< ½ шт.';
      if (v < 0.75) return '≈ ½ шт.';                      // менше цілої штуки: показуємо половину
      r = Math.round(v);
      if (Math.abs(v - r) > 0.001) pre = '≈ ';
      return pre + fmtN(r) + ' шт.';
    }
    if (it.u === 'ст. л.') {
      r = Math.max(0.5, Math.round(v * 2) / 2);
      if (Math.abs(v - r) > 0.001) pre = '≈ ';
      return pre + String(r).replace('.', ',') + ' ст. л.';
    }
    r = Math.round(v);
    return r < 1 ? '< 1 ' + it.u : fmtN(r) + ' ' + it.u;
  }
  function portionWord(n) { return (n % 10 === 1 && n % 100 !== 11) ? 'порції' : 'порцій'; }

  /* Правило №1: вхідним даним не довіряємо. Повертає число або NaN (порожньо, «-», текст, Infinity) */
  function readNumber(el) {
    if (!el) return NaN;
    if (el.validity && el.validity.badInput) return NaN;
    var s = String(el.value == null ? '' : el.value).trim().replace(',', '.');
    if (s === '') return NaN;
    var n = Number(s);
    return isFinite(n) ? n : NaN;
  }
  function inRange(n, lim) { return typeof n === 'number' && isFinite(n) && n >= lim.min && n <= lim.max; }

  /* ---------- 4. UI-стани: червона рамка (Tailwind) + текст помилки під полем ---------- */
  function setFieldError(id, msg) {
    var el = byId(id), err = byId(id + '-err');
    if (!el) return;
    if (msg) {
      el.setAttribute('aria-invalid', 'true');
      el.classList.add('!border-red-500');
      if (err) { err.textContent = msg; err.classList.remove('hidden'); }
    } else {
      el.removeAttribute('aria-invalid');
      el.classList.remove('!border-red-500');
      if (err) { err.textContent = ''; err.classList.add('hidden'); }
    }
  }

  /* ---------- 5. Безпечне формування розмітки (без innerHTML) ---------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function icon(name) {
    var s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('class', 'ico');
    s.setAttribute('aria-hidden', 'true');
    var u = document.createElementNS(SVG_NS, 'use');
    u.setAttribute('href', '#i-' + name);
    s.appendChild(u);
    return s;
  }
  function clearNode(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function cell(tag, text, cls) {
    var c = document.createElement(tag);
    c.textContent = text;
    if (cls) c.className = cls;
    return c;
  }
  function note(iconName, text) {
    var p = document.createElement('p');
    p.className = 'note';
    p.appendChild(icon(iconName));
    p.appendChild(cell('span', text));
    return p;
  }

  /* ---------- 6. Читання та перевірка форми ---------- */
  function toggleDims(p) {
    var t = byId(p + '-type').value;
    Array.prototype.forEach.call(byId('fs-' + p).querySelectorAll('[data-for]'), function (l) {
      l.hidden = l.getAttribute('data-for') !== t;
    });
  }
  function readShape(p) {
    var sel = byId(p + '-type'), t = sel.value;
    if (SHAPES.indexOf(t) < 0) { t = 'round'; sel.value = 'round'; toggleDims(p); }   // неправильне значення select
    var ids = t === 'round' ? [p + '-d'] : t === 'square' ? [p + '-s'] : [p + '-l', p + '-w'];
    var vals = ids.map(function (id) { return readNumber(byId(id)); });
    var okAll = true;
    ids.forEach(function (id, i) {
      var good = inRange(vals[i], LIMITS.dim);
      setFieldError(id, good ? '' : MSG.dim);
      if (!good) okAll = false;
    });
    ['d', 's', 'l', 'w'].forEach(function (k) {           // приховані поля не мають показувати помилок
      var id = p + '-' + k;
      if (ids.indexOf(id) < 0) setFieldError(id, '');
    });
    if (!okAll) return null;
    if (t === 'round') return { area: Math.PI * Math.pow(vals[0] / 2, 2), label: 'круглої форми Ø ' + fmtR(vals[0]) + ' см' };
    if (t === 'square') return { area: vals[0] * vals[0], label: 'квадратної форми ' + fmtR(vals[0]) + ' × ' + fmtR(vals[0]) + ' см' };
    return { area: vals[0] * vals[1], label: 'прямокутної форми ' + fmtR(vals[0]) + ' × ' + fmtR(vals[1]) + ' см' };
  }

  /* ---------- 7. Розрахунок і виведення ---------- */
  function showError(text) {
    byId('err').hidden = false;
    byId('err-t').textContent = text;
    byId('res-title').textContent = 'Перевірте дані';
    byId('ratio').textContent = 'Коефіцієнт перерахунку: –';
    var tb = byId('tbody'); clearNode(tb);
    var tr = document.createElement('tr'), td = cell('td', 'Поки що немає чого рахувати.');
    td.colSpan = 3; td.style.textAlign = 'left'; td.style.color = 'var(--ink-2)';
    tr.appendChild(td); tb.appendChild(tr);
    clearNode(byId('notes'));
  }
  function calc() {
    var ratio, title;
    if (mode === 'shape') {
      var A = readShape('a'), B = readShape('b');
      if (!A || !B) { showError(MSG.summary); return; }
      ratio = B.area / A.area; title = RECIPES[recipeId].name + ': для ' + B.label;
    } else {
      var a = readNumber(byId('s-a')), b = readNumber(byId('s-b'));
      var ga = inRange(a, LIMITS.serv), gb = inRange(b, LIMITS.serv);
      setFieldError('s-a', ga ? '' : MSG.serv);
      setFieldError('s-b', gb ? '' : MSG.serv);
      if (!ga || !gb) { showError(MSG.summary); return; }
      a = Math.round(a); b = Math.round(b);               // дробові порції нормалізуємо до цілих
      ratio = b / a; title = RECIPES[recipeId].name + ': для ' + b + ' ' + portionWord(b);
    }
    if (!isFinite(ratio) || ratio <= 0) { showError(MSG.summary); return; }   // остання лінія захисту від NaN/Infinity

    byId('err').hidden = true;
    byId('res-title').textContent = title;
    byId('ratio').textContent = 'Коефіцієнт перерахунку: × ' + fmtR(ratio);

    var tb = byId('tbody'); clearNode(tb);
    RECIPES[recipeId].c.ing.forEach(function (it) {
      var tr = document.createElement('tr'), th = cell('th', it.n);
      th.scope = 'row';
      tr.appendChild(th);
      tr.appendChild(cell('td', fmtAmount(it, 1)));
      tr.appendChild(cell('td', fmtAmount(it, ratio), 'new'));
      tb.appendChild(tr);
    });

    var nt = byId('notes'); clearNode(nt);
    if (ratio > 2.5 || ratio < 0.4) nt.appendChild(note('alert', 'Форми дуже різні за розміром (× ' + fmtR(ratio) + '). Тісто може вийти надто тонким або надто товстим, тож подумайте про іншу форму.'));
    var eggFrac = RECIPES[recipeId].c.ing.some(function (it) {
      if (!it.egg) return false;
      var v = it.q * ratio;
      return Math.abs(v - Math.round(v)) > 0.001 || v < 1;
    });
    if (eggFrac) nt.appendChild(note('bulb', 'Якщо виходить частина яйця, збийте яйце виделкою й відміряйте потрібну частину (одне яйце ≈ 50 г).'));
    nt.appendChild(note('clock', 'Висота тіста змінюється разом із формою, тому час випікання перевіряйте окремо. Зазвичай у ширшій формі тісто тонше й пропікається швидше.'));
    nt.appendChild(note('alert', 'Алергени: ' + RECIPES[recipeId].c.allergens + ' Склад готових продуктів перевіряйте на упаковці.'));
  }

  /* Обгортка: будь-яка непередбачена помилка не ламає сторінку і не показує користувачу технічний текст */
  function safeCalc() {
    try { calc(); }
    catch (e) {
      if (window.console) console.error('[BakeSmart widget]', e);
      try { showError(MSG.fatal); } catch (e2) { /* нічого більше зробити не можна */ }
    }
  }

  /* ---------- 8. Події: input / change / click ---------- */
  function setMode(m) {
    mode = m === 'serv' ? 'serv' : 'shape';
    Array.prototype.forEach.call(root.querySelectorAll('.modes button'), function (x) {
      x.setAttribute('aria-pressed', String(x.getAttribute('data-mode') === mode));
    });
    byId('mode-shape').hidden = mode !== 'shape';
    byId('mode-serv').hidden = mode !== 'serv';
  }
  function setShape(p, f) {                                // підставляє тип форми й розмір у блок a або b
    byId(p + '-type').value = f.type;
    var key = { round: 'd', square: 's' }[f.type];
    if (key) byId(p + '-' + key).value = f[key];
    toggleDims(p);
  }
  function setRecipe(id, initial) {
    recipeId = RECIPES[id] ? id : DEFAULT_RECIPE;          // невідомий рецепт → за замовчуванням
    var c = RECIPES[recipeId].c, note = byId('recipe-note');
    if (byId('recipe').value !== recipeId) byId('recipe').value = recipeId;
    if (note) note.textContent = c.note;
    byId('s-a').value = String(c.serv);                    // скільки порцій дає рецепт
    if (c.form) { setShape('a', c.form); if (initial && c.mine) setShape('b', c.mine); }
    setMode(c.form ? 'shape' : 'serv');                    // немає форми в рецепті → рахуємо за порціями
  }
  // Заповнюємо список рецептів із спільних даних
  var sel = byId('recipe');
  clearNode(sel);
  Object.keys(RECIPES).forEach(function (k) {
    var o = document.createElement('option');
    o.value = k; o.textContent = RECIPES[k].name;
    sel.appendChild(o);
  });
  sel.addEventListener('change', function () { setRecipe(sel.value); safeCalc(); });
  // Рецепт, обраний у каталозі або покроковому режимі (подія з index.html)
  document.addEventListener('bake:recipe', function (e) {
    var id = e && e.detail && e.detail.id;
    if (id && RECIPES[id]) { setRecipe(id); safeCalc(); }
  });
  sel.value = DEFAULT_RECIPE;
  setRecipe(DEFAULT_RECIPE, true);

  ['a', 'b'].forEach(function (p) {
    byId(p + '-type').addEventListener('change', function () { toggleDims(p); safeCalc(); });
    toggleDims(p);
  });
  Array.prototype.forEach.call(root.querySelectorAll('input.field'), function (i) {
    i.addEventListener('input', safeCalc);                 // миттєвий перерахунок, кнопка не потрібна
  });
  ['s-a', 's-b'].forEach(function (id) {                   // нормалізація дробових порцій після завершення введення
    var el = byId(id);
    el.addEventListener('change', function () {
      var n = readNumber(el);
      if (inRange(n, LIMITS.serv) && n !== Math.round(n)) { el.value = String(Math.round(n)); safeCalc(); }
    });
  });
  Array.prototype.forEach.call(root.querySelectorAll('.modes button'), function (b) {
    b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); safeCalc(); });
  });

  safeCalc();
})();