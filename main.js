// The Now Playing demo behaves like the firmware's cover: swiping 60px or more
// changes the song, a tap pauses or closes the lyrics, a long press opens them.
(function () {
  var SWIPE_PX = 60, HOLD_MS = 500;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var el = function (id) { return document.getElementById(id); };
  var cover = el('cover'), art = el('art'), lyrics = el('lyrics'), paused = el('paused');
  var song = el('song'), count = el('count'), elapsed = el('elapsed'), bar = el('progress'), result = el('result');
  var names = ['one', 'two', 'three', 'four'];
  [1, 2, 3].forEach(function (n) { new Image().src = 'assets/cover-' + n + '.png'; });
  var track = 0, playing = true, seconds = 83, total = 225;

  function setProgress() {
    bar.style.transform = 'scaleX(' + (seconds / total) + ')';
    elapsed.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }
  function say(text, action) {
    result.textContent = text;
    document.querySelectorAll('.controls button').forEach(function (b) {
      b.classList.toggle('lit', b.dataset.do === action);
    });
  }
  function change(dir) {
    track = (track + dir + 4) % 4;
    art.classList.add(dir > 0 ? 'out-l' : 'out-r');
    setTimeout(function () {
      art.src = 'assets/cover-' + track + '.png';
      art.className = 'np-art';
      song.textContent = 'Placeholder song ' + names[track];
      count.textContent = (track + 1) + '/4';
      seconds = 0;
      setProgress();
    }, reduce ? 0 : 220);
    lyrics.hidden = true;
    playing = true;
    paused.hidden = true;
    say(dir > 0 ? 'Next song' : 'Previous song', dir > 0 ? 'next' : 'prev');
  }
  function toggle() {
    if (!lyrics.hidden) { lyrics.hidden = true; say('Back to the cover', 'lyrics'); return; }
    playing = !playing;
    paused.hidden = playing;
    say(playing ? 'Playing again' : 'Paused', 'toggle');
  }
  function showLyrics() {
    lyrics.hidden = false;
    say('Lyrics are showing. Tap to go back.', 'lyrics');
  }

  document.querySelectorAll('.controls button').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = b.dataset.do;
      if (d === 'next') change(1);
      else if (d === 'prev') change(-1);
      else if (d === 'toggle') toggle();
      else if (lyrics.hidden) showLyrics();
      else toggle();
    });
  });

  var down = null, timer = 0, held = false;
  cover.addEventListener('pointerdown', function (e) {
    down = { x: e.clientX, y: e.clientY };
    held = false;
    clearTimeout(timer);
    timer = setTimeout(function () {
      held = true;
      if (lyrics.hidden) showLyrics();
    }, HOLD_MS);
  });
  cover.addEventListener('pointermove', function (e) {
    if (down && (Math.abs(e.clientX - down.x) > 10 || Math.abs(e.clientY - down.y) > 10)) clearTimeout(timer);
  });
  cover.addEventListener('pointerup', function (e) {
    clearTimeout(timer);
    if (!down) return;
    var dx = e.clientX - down.x, dy = e.clientY - down.y;
    down = null;
    if (held) return;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy)) change(dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) toggle();
  });
  cover.addEventListener('pointercancel', function () { clearTimeout(timer); down = null; });
  cover.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  setInterval(function () {
    if (!playing) return;
    seconds = (seconds + 1) % total;
    setProgress();
  }, 1000);
  setProgress();

  // Section parts arrive once, a little after one another.
  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    reveals.forEach(function (r) { r.classList.add('in'); });
    return;
  }
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      seen.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  reveals.forEach(function (r) {
    var i = Array.prototype.indexOf.call(r.parentNode.children, r);
    r.style.setProperty('--d', Math.min(i, 5) * 70 + 'ms');
    seen.observe(r);
  });
})();
