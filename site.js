/* ═══════════════════════════════════════════════════════════════════════════
   A.POINT ADVISORY — le script du site
   ═══════════════════════════════════════════════════════════════════════════

   REFAIT LE 13/09/2026 avec la direction B. Trois choses :

   1. le menu du téléphone ;
   2. la démonstration : la section épinglée, les diapositives qui avancent une
      à une, le téléphone qui allume l'écran de l'étape ;
   3. l'ouverture du titre, et le défilement lissé sur ordinateur.

   Trois règles, tenues d'un bout à l'autre :

   · **Aucun appel réseau.** GSAP, ScrollTrigger, SplitText et Lenis sont des
     fichiers COPIÉS à côté des pages par `construire.py` (versions figées dans
     package.json). « no third-party trackers » reste vrai, et un test le lit.

   · **La page est juste SANS ce fichier, et sans les bibliothèques.** Le menu
     est un `hidden` et tous ses liens sont dans le pied. La démonstration est
     une liste de cinq étapes lisibles. Les grands chiffres et la douleur
     s'animent en CSS natif, pas ici. Si GSAP manque (réseau coupé, navigateur
     ancien, jsdom dans les tests), ce script ne fait que le menu.

   · **Il ne calcule aucun prix, et n'écrit aucun texte.** Tout est dans le
     HTML, écrit par le générateur. Il choisit seulement quel écran est allumé.

   Sur téléphone, pas de défilement lissé : le défilement tactile natif est
   meilleur que tout lissage, et Lenis ne lisse pas le tactile de toute façon.
   Tranché par Samer le 13/09/2026 : « si pour téléphone faut pas faire quelque
   chose alors on le fait que pour ordinateur ».
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── 1. Le menu du téléphone ──────────────────────────────────────────── */
  var burger = $('#burger'), menu = $('#menu-mobile');
  function basculerMenu(ouvrir) {
    if (!burger || !menu) return;
    var ouvert = typeof ouvrir === 'boolean' ? ouvrir : menu.hidden;
    menu.hidden = !ouvert;
    burger.setAttribute('aria-expanded', String(ouvert));
    document.documentElement.style.overflow = ouvert ? 'hidden' : '';
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { basculerMenu(); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { basculerMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') basculerMenu(false); });
  }

  /* ── 2. Le mouvement — seulement si les bibliothèques sont là ─────────── */
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  if (calme || !gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var ordinateur = window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches;

  if (ordinateur && window.Lenis) {
    var lenis = new window.Lenis({ lerp: 0.085 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* La démonstration. `html.anime` fait passer la section de la liste à la
     scène épinglée : posée ICI, jamais dans le HTML, pour que sans script la
     page reste une liste lisible. */
  var projection = $('.projection');
  if (projection) {
    document.documentElement.classList.add('anime');
    var piste = $('.piste', projection), diapos = $$('.diapo', projection);
    var ecrans = $$('.ecran', projection), avance = $('.avance i', projection);
    var courante = -1;
    var passerA = function (n) {
      if (n === courante) return;
      courante = n;
      diapos.forEach(function (d, i) { d.classList.toggle('actif', i === n); });
      ecrans.forEach(function (e) { e.classList.toggle('actif', +e.getAttribute('data-e') === n); });
      gsap.to(piste, { x: -diapos[n].offsetLeft, duration: 0.9, ease: 'expo.out', overwrite: true });
    };
    passerA(0);
    ScrollTrigger.create({
      trigger: projection, start: 'top top', end: function () { return '+=' + window.innerHeight * 4; },
      pin: true, scrub: true, invalidateOnRefresh: true,
      onUpdate: function (s) {
        passerA(Math.min(diapos.length - 1, Math.floor(s.progress * diapos.length)));
        if (avance) gsap.set(avance, { scaleX: s.progress });
      },
      onRefresh: function () { if (courante >= 0) gsap.set(piste, { x: -diapos[courante].offsetLeft }); }
    });
  }

  /* L'ouverture : les lignes du titre se resserrent en entrant — le seul
     moment orchestré au chargement. Une fois les polices prêtes, sinon les
     lignes seraient coupées dans la police de secours. */
  var titre = $('.hero-titre');
  if (titre && window.SplitText && document.fonts) {
    document.fonts.ready.then(function () {
      var coupe = new window.SplitText(titre, { type: 'lines', linesClass: 'ligne-titre' });
      gsap.from(coupe.lines, {
        // Étiré au départ sur ordinateur seulement : à 320 px, un mot étiré sort de l'écran.
        fontVariationSettings: ordinateur ? "'wdth' 150, 'wght' 300" : "'wdth' 90, 'wght' 400",
        opacity: 0, x: ordinateur ? -24 : 0,
        duration: 1.5, ease: 'expo.out', stagger: 0.09,
        onComplete: function () { coupe.revert(); }
      });
      gsap.from('.hero-produit, .hero-bas', { opacity: 0, y: 12, duration: 1, ease: 'expo.out', stagger: 0.1, delay: 0.4 });
    });
  }
})();
