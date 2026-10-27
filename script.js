import posthog from 'posthog-js';

const posthogToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim();
const posthogHost = import.meta.env.VITE_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com';
const isLocalDevelopmentHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
let posthogEnabled = false;

if (posthogToken && !isLocalDevelopmentHost) {
  posthog.init(posthogToken, {
    api_host: posthogHost,
    defaults: '2026-08-30',
    capture_pageview: true,
    autocapture: true,
    disable_session_recording: true
  });
  posthogEnabled = true;
}

function captureAnalyticsEvent(eventName) {
  if (posthogEnabled) posthog.capture(eventName);
}

document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
  link.addEventListener('click', () => captureAnalyticsEvent('email_click'));
});

document.querySelectorAll('a[href*="linkedin.com/in/stephaniedurugbor"]').forEach((link) => {
  link.addEventListener('click', () => captureAnalyticsEvent('linkedin_click'));
});

document.querySelector('[data-sort-action="tidy"]')?.addEventListener('click', () => {
  captureAnalyticsEvent('tidy_up_click');
});

const rmsRecording = document.querySelector('.rms-recording');
if (rmsRecording) {
  const reducedMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const playbackToggle = document.querySelector('.rms-playback-toggle');
  const progressRing = document.querySelector('.rms-playback-progress-value');
  const screenFrame = rmsRecording.closest('.rms-screen-frame');
  let rmsRecordingInView = false;
  let userPausedRecording = false;
  let userRequestedPlayback = false;
  const syncRmsZoom = () => {
    const isSearching = !reducedMotionPreference.matches
      && rmsRecording.currentTime >= 1.3
      && rmsRecording.currentTime < 7.45;
    screenFrame?.classList.toggle('is-search-zoomed', isSearching);
  };
  const syncRmsControls = () => {
    const isPlaying = !rmsRecording.paused && !rmsRecording.ended;
    playbackToggle?.classList.toggle('is-playing', isPlaying);
    playbackToggle?.setAttribute('aria-label', `${isPlaying ? 'Pause' : 'Play'} RMS screen recording`);
    playbackToggle?.setAttribute('aria-pressed', String(isPlaying));

    const progress = Number.isFinite(rmsRecording.duration) && rmsRecording.duration > 0
      ? rmsRecording.currentTime / rmsRecording.duration
      : 0;
    const circumference = 2 * Math.PI * 21;
    if (progressRing) progressRing.style.strokeDashoffset = String(circumference * (1 - progress));
  };
  const updateRmsPlayback = () => {
    const motionAllowed = !reducedMotionPreference.matches || userRequestedPlayback;
    if (!motionAllowed || !rmsRecordingInView || userPausedRecording) {
      rmsRecording.pause();
      return;
    }
    rmsRecording.play().catch(() => {});
  };

  playbackToggle?.addEventListener('click', () => {
    if (rmsRecording.paused || rmsRecording.ended) {
      userPausedRecording = false;
      userRequestedPlayback = true;
      updateRmsPlayback();
    } else {
      userPausedRecording = true;
      userRequestedPlayback = false;
      rmsRecording.pause();
    }
  });
  ['timeupdate', 'loadedmetadata', 'durationchange', 'seeked', 'seeking', 'play', 'pause', 'ended'].forEach((eventName) => {
    rmsRecording.addEventListener(eventName, syncRmsControls);
  });
  ['timeupdate', 'loadedmetadata', 'seeking', 'seeked', 'play', 'ended'].forEach((eventName) => {
    rmsRecording.addEventListener(eventName, syncRmsZoom);
  });

  if ('IntersectionObserver' in window) {
    const rmsRecordingObserver = new IntersectionObserver(([entry]) => {
      rmsRecordingInView = entry.isIntersecting;
      updateRmsPlayback();
    }, { rootMargin: '120px 0px' });
    rmsRecordingObserver.observe(rmsRecording);
  } else {
    rmsRecordingInView = true;
    updateRmsPlayback();
  }

  reducedMotionPreference.addEventListener('change', () => {
    if (reducedMotionPreference.matches) userRequestedPlayback = false;
    updateRmsPlayback();
    syncRmsZoom();
  });
  syncRmsControls();
  syncRmsZoom();
}

const root = document.documentElement;
const themeOptions = Array.from(document.querySelectorAll('.theme-option'));

function setTheme(theme, save = true) {
  root.dataset.theme = theme;
  themeOptions.forEach((option) => {
    const isActive = option.dataset.themeChoice === theme;
    option.setAttribute('aria-pressed', String(isActive));
    option.classList.toggle('is-active', isActive);
  });
  document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#f3f0e8' : '#111110';
  if (save) {
    try { localStorage.setItem('stephanie-theme', theme); } catch { /* Storage can be unavailable in private contexts. */ }
  }
}

try {
  const saved = localStorage.getItem('stephanie-theme');
  if (saved === 'light' || saved === 'dark') setTheme(saved, false);
} catch { /* Keep the default dark theme when storage is unavailable. */ }

themeOptions.forEach((option) => {
  option.addEventListener('click', () => setTheme(option.dataset.themeChoice));
});

const lagosTime = document.querySelector('#lagos-time');
if (lagosTime) {
  const updateLagosTime = () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).formatToParts(now);
    const part = (type) => parts.find((item) => item.type === type)?.value ?? '';
    lagosTime.textContent = `${part('hour')}:${part('minute')}${part('dayPeriod')}`;
    lagosTime.dateTime = now.toISOString();
  };
  updateLagosTime();
  window.setInterval(updateLagosTime, 30_000);
}

const underlinedEmphasis = Array.from(document.querySelectorAll('.role-emphasis, .build-emphasis, .marked'));
if (underlinedEmphasis.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  root.classList.add('underline-motion-ready');
  if ('IntersectionObserver' in window) {
    const underlineObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-underline-revealed');
          underlineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0 });
    underlinedEmphasis.forEach((item) => underlineObserver.observe(item));
  } else {
    underlinedEmphasis.forEach((item) => item.classList.add('is-underline-revealed'));
  }
}

const descriptiveCopy = Array.from(document.querySelectorAll('main p:not(.eyebrow)'));
if (descriptiveCopy.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  root.classList.add('copy-reveal-ready');
  if ('IntersectionObserver' in window) {
    const copyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-copy-revealed');
          copyObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    descriptiveCopy.forEach((paragraph) => copyObserver.observe(paragraph));
  } else {
    descriptiveCopy.forEach((paragraph) => paragraph.classList.add('is-copy-revealed'));
  }
}

const headingsToReveal = Array.from(document.querySelectorAll('[data-heading-reveal]'));
const heroHeading = document.querySelector('#name');

if (headingsToReveal.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('heading-reveal-ready');

  if (heroHeading) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => heroHeading.classList.add('is-revealed'));
    });
  }

  const scrollHeadings = headingsToReveal.filter((heading) => heading !== heroHeading);
  if ('IntersectionObserver' in window) {
    const headingObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          headingObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    scrollHeadings.forEach((heading) => headingObserver.observe(heading));
  } else {
    scrollHeadings.forEach((heading) => heading.classList.add('is-revealed'));
  }
}

const sortingGame = document.querySelector('.sort-game');
if (sortingGame) {
  const canvas = sortingGame.querySelector('.sort-game__physics');
  const ctx = canvas?.getContext('2d');
  const status = sortingGame.querySelector('.sort-game__status');
  const tidyButton = sortingGame.querySelector('[data-sort-action="tidy"]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Ten of each colour (20 total), split evenly between the buckets at start.
  const ballsPerBucket = 10;
  const ballsPerColor = ballsPerBucket;
  const definitions = Array.from({ length: ballsPerBucket * 2 }, (_, index) => ({
    id: index,
    color: index < ballsPerColor ? 'pink' : 'black',
    bucket: index % ballsPerColor < ballsPerBucket / 2
      ? (index < ballsPerColor ? 'pink' : 'black')
      : (index < ballsPerColor ? 'black' : 'pink')
  }));
  const balls = definitions.map(({ id, color, bucket }) => ({
    id, color, bucket, x: 0, y: 0, vx: 0, vy: 0, r: 26, asleep: false, rest: 0, flight: '',
    selected: false, dragged: false, idleTimer: 1 + Math.random() * 2.4, idleBouncing: false
  }));
  let width = 0, height = 0, dpr = 1, geometry = {}, selected = null, selectionTimeout = 0;
  let pointer = null, frame = 0, previousTime = 0, tidying = false, gameVisible = !('IntersectionObserver' in window);
  let seed = Math.floor(Math.random() * 2147483646) + 1;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const themeColor = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

  function makeGeometry() {
    const small = width < 520;
    // Keep a deliberate, even gap between the bucket silhouettes on narrow screens.
    const bucketWidth = Math.min(width * .42, small ? 165 : 240);
    const centerOffset = bucketWidth * .49 + 8;
    const top = Math.max(110, height * .20);
    const bottom = height - (small ? 20 : 22);
    return {
      pink: { id: 'pink', cx: width / 2 - centerOffset, top, bottom, bw: bucketWidth, topHalf: bucketWidth * .49, bottomHalf: bucketWidth * .37 },
      black: { id: 'black', cx: width / 2 + centerOffset, top, bottom, bw: bucketWidth, topHalf: bucketWidth * .49, bottomHalf: bucketWidth * .37 }
    };
  }
  const sideHalf = (bucket, y) => {
    const t = clamp((y - bucket.top) / (bucket.bottom - bucket.top), 0, 1);
    return bucket.topHalf + (bucket.bottomHalf - bucket.topHalf) * t;
  };
  function resize() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const oldWidth = width, oldHeight = height, oldGeometry = geometry;
    width = rect.width; height = rect.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    geometry = makeGeometry();
    const small = width < 520;
    balls.forEach((ball) => {
      const old = oldGeometry[ball.bucket];
      const next = geometry[ball.bucket];
      if (old && next && oldWidth && oldHeight && !ball.flight) {
        const oldHalf = sideHalf(old, ball.y);
        const fraction = oldHalf ? (ball.x - old.cx) / oldHalf : 0;
        const yFraction = clamp((ball.y - old.top) / (old.bottom - old.top), 0, 1);
        ball.x = next.cx + fraction * sideHalf(next, next.top + yFraction * (next.bottom - next.top));
        ball.y = next.top + yFraction * (next.bottom - next.top);
      } else if (oldWidth && oldHeight) {
        ball.x *= width / oldWidth; ball.y *= height / oldHeight;
      }
      ball.r = small ? 25 : clamp(width * .045, 34, 42);
      if (!ball.flight && next) {
        ball.x = clamp(ball.x, next.cx - sideHalf(next, ball.y) + ball.r, next.cx + sideHalf(next, ball.y) - ball.r);
        ball.y = clamp(ball.y, next.top + ball.r, next.bottom - ball.r);
      }
    });
    draw();
  }

  function bucketFill(bucket) {
    const pink = bucket.id === 'pink';
    const gradient = ctx.createLinearGradient(bucket.cx, bucket.top, bucket.cx, bucket.bottom);
    if (pink) {
      gradient.addColorStop(0, 'rgba(255, 0, 144, .18)');
      gradient.addColorStop(.55, 'rgba(255, 0, 144, .11)');
      gradient.addColorStop(1, 'rgba(255, 0, 144, .055)');
    } else {
      gradient.addColorStop(0, 'rgba(155, 155, 155, .20)');
      gradient.addColorStop(.55, 'rgba(110, 110, 110, .14)');
      gradient.addColorStop(1, 'rgba(70, 70, 70, .09)');
    }
    return gradient;
  }
  function drawBucket(bucket) {
    const pink = bucket.id === 'pink';
    const leftTop = bucket.cx - bucket.topHalf, rightTop = bucket.cx + bucket.topHalf;
    const leftBottom = bucket.cx - bucket.bottomHalf, rightBottom = bucket.cx + bucket.bottomHalf;
    const line = themeColor('--line', 'rgba(240,238,232,.25)');
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(leftTop, bucket.top + 2);
    ctx.lineTo(rightTop, bucket.top + 2);
    ctx.lineTo(rightBottom, bucket.bottom - 3);
    ctx.quadraticCurveTo(bucket.cx, bucket.bottom + 6, leftBottom, bucket.bottom - 3);
    ctx.closePath();
    ctx.fillStyle = bucketFill(bucket); ctx.fill();
    ctx.strokeStyle = pink ? 'rgba(255,0,144,.55)' : line;
    ctx.lineWidth = 1.2; ctx.stroke();
    ctx.save(); ctx.clip();
    const shine = ctx.createLinearGradient(leftTop, 0, leftTop + bucket.bw * .23, 0);
    shine.addColorStop(0, 'rgba(255,255,255,.01)');
    shine.addColorStop(.45, pink ? 'rgba(255,255,255,.23)' : 'rgba(255,255,255,.16)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.beginPath(); ctx.moveTo(leftTop + 9, bucket.top + 5); ctx.lineTo(leftTop + bucket.bw * .22, bucket.top + 5);
    ctx.lineTo(leftBottom + bucket.bw * .19, bucket.bottom - 7); ctx.lineTo(leftBottom + 5, bucket.bottom - 7); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(rightTop - 12, bucket.top + 9); ctx.lineTo(rightBottom - 8, bucket.bottom - 11);
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    const rim = pink ? '#FF0090' : '#272624';
    const rimHeight = Math.max(4, bucket.bw * .018);
    ctx.beginPath(); ctx.ellipse(bucket.cx, bucket.top, bucket.topHalf, rimHeight, 0, 0, Math.PI * 2);
    ctx.strokeStyle = rim; ctx.lineWidth = 2.25; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(bucket.cx, bucket.top + 1, bucket.topHalf * .94, rimHeight * .5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = pink ? 'rgba(255,132,201,.72)' : 'rgba(255,255,255,.18)'; ctx.lineWidth = .8; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(bucket.cx, bucket.bottom - 3, bucket.bottomHalf, Math.max(5, rimHeight * .7), 0, 0, Math.PI);
    ctx.strokeStyle = pink ? 'rgba(255,0,144,.38)' : line; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  function drawBall(ball) {
    ctx.save();
    const gradient = ctx.createRadialGradient(ball.x - ball.r * .34, ball.y - ball.r * .42, ball.r * .05, ball.x, ball.y, ball.r * 1.15);
    gradient.addColorStop(0, ball.color === 'pink' ? '#ff8aca' : '#74736f');
    gradient.addColorStop(.34, ball.color === 'pink' ? '#ff0090' : '#252523');
    gradient.addColorStop(1, ball.color === 'pink' ? '#a90060' : '#070707');
    ctx.beginPath(); ctx.arc(ball.x, ball.y + 2, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fill();
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = gradient; ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 7; ctx.shadowOffsetY = 3; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.beginPath(); ctx.arc(ball.x - ball.r * .28, ball.y - ball.r * .33, ball.r * .18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.32)'; ctx.fill();
    if (ball.selected) {
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = ball.color === 'pink' ? '#FF0090' : '#8c8982'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }
  function draw() {
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    drawBucket(geometry.pink); drawBucket(geometry.black);
    balls.filter((ball) => ball.bucket === 'pink').forEach(drawBall);
    balls.filter((ball) => ball.bucket === 'black').forEach(drawBall);
    // Draw the front lip over the lowest balls to make the open bucket read as a container.
    ['pink', 'black'].forEach((id) => {
      const b = geometry[id];
      ctx.beginPath(); ctx.ellipse(b.cx, b.top, b.topHalf, Math.max(8, b.bw * .055), 0, 0, Math.PI);
      ctx.strokeStyle = id === 'pink' ? '#FF0090' : '#272624';
      ctx.lineWidth = 2; ctx.stroke();
    });
  }
  function contains(bucket, ball, x, y) {
    return x >= bucket.cx - bucket.topHalf && x <= bucket.cx + bucket.topHalf && y >= bucket.top && y <= bucket.bottom;
  }
  function correctBucketFor(ball) { return ball.color; }
  function isComplete() { return balls.every((ball) => ball.bucket === correctBucketFor(ball)); }
  function updateCompletion() {
    const complete = isComplete();
    status.classList.toggle('is-complete', complete);
    if (complete) status.textContent = 'All sorted. Nice and tidy.';
    return complete;
  }
  function resetBallsIntoBuckets(bucketForBall, message) {
    clearSelection(); pointer = null; tidying = true;
    status.classList.remove('is-complete'); status.textContent = message;
    balls.forEach((ball) => {
      const bucket = geometry[bucketForBall(ball)];
      ball.bucket = bucket.id; ball.target = bucket.id; ball.flight = 'drop';
      ball.dragged = false; ball.asleep = false; ball.idleBouncing = false; ball.rest = 0;
      const opening = Math.max(0, bucket.topHalf - ball.r * .58);
      ball.x = bucket.cx + (random() - .5) * opening * 1.75;
      ball.y = bucket.top - ball.r - (4 + random() * 12);
      ball.vx = (random() - .5) * 28; ball.vy = 0;
    });
    draw(); startLoop();
  }
  let lastShuffleSignature = '';
  function shuffleBucketAssignments() {
    let shuffled = [];
    let signature = '';
    let pinkCount = 0;
    let attempts = 0;
    do {
      shuffled = balls.slice();
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      pinkCount = shuffled.slice(0, balls.length / 2).filter((ball) => ball.color === 'pink').length;
      signature = shuffled.slice(0, balls.length / 2).map((ball) => ball.id).sort((a, b) => a - b).join(',');
      attempts += 1;
    } while ((pinkCount < 2 || pinkCount > balls.length / 2 - 2 || signature === lastShuffleSignature) && attempts < 20);
    lastShuffleSignature = signature;
    const assignments = new Map();
    shuffled.forEach((ball, index) => assignments.set(ball.id, index < balls.length / 2 ? 'pink' : 'black'));
    return assignments;
  }
  function clearSelectionTimeout() {
    if (selectionTimeout) window.clearTimeout(selectionTimeout);
    selectionTimeout = 0;
  }
  function armSelectionTimeout() {
    clearSelectionTimeout();
    if (!selected) return;
    selectionTimeout = window.setTimeout(() => {
      selectionTimeout = 0;
      clearSelection();
    }, 10_000);
  }
  function clearSelection() {
    clearSelectionTimeout();
    if (selected) selected.selected = false;
    selected = null;
    draw();
  }
  function selectBall(ball) {
    if (selected) selected.selected = false;
    selected = ball; if (ball) ball.selected = true;
    armSelectionTimeout();
    status.textContent = ball ? `Ball ${ball.id + 1} (${ball.color}) selected. Drag toward a bucket, or choose one.` : 'Select a ball to move it.';
    draw();
  }
  function startLoop() { if (!frame && gameVisible) { previousTime = 0; frame = requestAnimationFrame(tick); } }
  function launch(ball, destination) {
    if (!ball || !destination || ball.flight || ball.dragged) return;
    clearSelection();
    if (ball.bucket === destination) { status.textContent = `Ball ${ball.id + 1} is already in that bucket.`; return; }
    ball.asleep = false; ball.rest = 0; ball.flight = 'lift'; ball.target = destination;
    ball.vx = (random() - .5) * 28;
    ball.vy = -Math.sqrt(2 * 1550 * Math.max(30, ball.y - (geometry[ball.bucket].top - ball.r - 10)));
    status.textContent = `Ball ${ball.id + 1} lifting out of the ${ball.bucket} bucket.`;
    startLoop();
  }
  function beginArc(ball) {
    const source = geometry[ball.bucket];
    const destination = geometry[ball.target];
    ball.y = Math.min(ball.y, source.top - ball.r - 3);
    ball.flight = 'arc';
    const targetX = destination.cx + (random() - .5) * destination.topHalf * .16;
    const targetY = destination.top - ball.r - 5;
    const gravity = 1050;
    const arcClearance = reducedMotion ? 28 : Math.max(46, width * .055);
    const apex = Math.min(source.top, destination.top) - ball.r - arcClearance;
    const vy = -Math.sqrt(2 * gravity * Math.max(25, ball.y - apex));
    const discriminant = vy * vy + 2 * gravity * (targetY - ball.y);
    const duration = Math.max(.25, (-vy + Math.sqrt(Math.max(1, discriminant))) / gravity);
    ball.vy = vy; ball.vx = (targetX - ball.x) / duration;
    ball.arcTargetX = targetX; ball.arcTargetY = targetY;
  }
  function resolveWalls(ball, bucket, dt) {
    const topClear = bucket.top - ball.r - 2;
    if (ball.flight === 'lift' && ball.y <= topClear) {
      ball.y = topClear;
      beginArc(ball);
    }
    if (ball.flight === 'arc') {
      if ((ball.vx >= 0 && ball.x >= ball.arcTargetX) || (ball.vx < 0 && ball.x <= ball.arcTargetX)) {
        ball.x = ball.arcTargetX; ball.vx = 0;
      }
      const reachedX = Math.abs(ball.x - ball.arcTargetX) < ball.r * .7;
      if (reachedX && ball.y >= ball.arcTargetY) {
        ball.x = ball.arcTargetX; ball.y = ball.arcTargetY; ball.flight = 'drop'; ball.bucket = ball.target; ball.vx *= .25;
      }
      return;
    }
    if (ball.flight === 'drop') bucket = geometry[ball.bucket];
    const inBucket = ball.bucket === bucket.id;
    if (!inBucket) return;
    if (ball.y + ball.r < bucket.top) return;
    const half = sideHalf(bucket, clamp(ball.y, bucket.top, bucket.bottom));
    const limit = half - ball.r;
    const dx = ball.x - bucket.cx;
    if (ball.y - ball.r < bucket.top && Math.abs(dx) > bucket.topHalf - ball.r * .55) {
      ball.x = bucket.cx + Math.sign(dx) * (bucket.topHalf - ball.r * .55);
      if (ball.vy > 0) ball.vy = -Math.abs(ball.vy) * .36;
      ball.vx = -Math.sign(dx) * Math.abs(ball.vx) * .35;
    }
    if (Math.abs(dx) > limit) {
      ball.x = bucket.cx + Math.sign(dx) * Math.max(0, limit);
      if (ball.vx * Math.sign(dx) > 0) ball.vx = -ball.vx * .32;
      ball.vy *= .97;
    }
    if (ball.y + ball.r >= bucket.bottom) {
      ball.y = bucket.bottom - ball.r; if (ball.vy > 0) ball.vy = -ball.vy * .34; ball.vx *= .82;
    }
  }
  function step(dt) {
    const gravity = 1050;
    const motionBusy = Boolean(pointer || tidying || balls.some((ball) => ball.flight));
    balls.forEach((ball) => {
      if (ball.dragged) return;
      if (ball.asleep) {
        const restingBucket = geometry[ball.bucket];
        const stillSupported = ball.y + ball.r >= restingBucket.bottom - .5 || balls.some((other) => (
          other !== ball && other.bucket === ball.bucket && other.y > ball.y &&
          Math.hypot(other.x - ball.x, other.y - ball.y) <= ball.r + other.r + 2
        ));
        if (!stillSupported) { ball.asleep = false; ball.rest = 0; }
      }
      if (ball.asleep) {
        if (reducedMotion || motionBusy) return;
        ball.idleTimer -= dt;
        if (ball.idleTimer > 0) return;
        const restingBucket = geometry[ball.bucket];
        const liftRoom = ball.y - (restingBucket.top + ball.r + 4);
        const impulse = Math.min(104, Math.sqrt(Math.max(0, 2 * gravity * liftRoom)));
        if (impulse < 30) { ball.idleTimer = 1.1 + Math.random() * 2.5; return; }
        ball.asleep = false; ball.idleBouncing = true; ball.rest = 0;
        ball.vy = -impulse; ball.vx = (Math.random() - .5) * 16;
      }
      const bucket = geometry[ball.bucket];
      ball.vy += gravity * dt; ball.y += ball.vy * dt; ball.x += ball.vx * dt;
      resolveWalls(ball, bucket, dt);
    });
    for (let i = 0; i < balls.length; i += 1) for (let j = i + 1; j < balls.length; j += 1) {
      const a = balls[i], b = balls[j];
      if (a.bucket !== b.bucket || (a.asleep && b.asleep) || a.flight === 'arc' || b.flight === 'arc') continue;
      const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy) || .001, minimum = a.r + b.r;
      if (distance >= minimum) continue;
      const nx = dx / distance, ny = dy / distance, overlap = minimum - distance;
      const movableA = a.asleep ? 0 : 1, movableB = b.asleep ? 0 : 1, total = movableA + movableB || 1;
      a.x -= nx * overlap * movableA / total; a.y -= ny * overlap * movableA / total;
      b.x += nx * overlap * movableB / total; b.y += ny * overlap * movableB / total;
      const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (relative < 0) {
        const impulse = -(1 + .34) * relative / total;
        if (!a.asleep) { a.vx -= impulse * nx; a.vy -= impulse * ny; }
        if (!b.asleep) { b.vx += impulse * nx; b.vy += impulse * ny; }
      }
      if (a.asleep) { b.asleep = false; b.rest = 0; }
      if (b.asleep) { a.asleep = false; a.rest = 0; }
    }
    balls.forEach((ball) => {
      if (ball.asleep || ball.dragged || ball.flight === 'arc' || ball.flight === 'lift') return;
      const bucket = geometry[ball.bucket];
      resolveWalls(ball, bucket, dt);
      ball.vx *= ball.idleBouncing ? .94 : .997; ball.vy *= .999;
      if (Math.abs(ball.vx) < 8) ball.vx = 0;
      if (Math.abs(ball.vy) < 8) ball.vy = 0;
      const touchingFloor = ball.y + ball.r >= bucket.bottom - .5;
      const touchingBall = balls.some((other) => other !== ball && other.bucket === ball.bucket && other.y > ball.y && Math.hypot(other.x - ball.x, other.y - ball.y) <= ball.r + other.r + 1.5);
      const supported = touchingFloor || touchingBall;
      if (touchingFloor && ball.vy > 0) { ball.y = bucket.bottom - ball.r; ball.vy *= ball.idleBouncing ? -.14 : -.34; }
      if (supported && Math.abs(ball.vy) < 25 && Math.abs(ball.vx) < 24) {
        ball.vx *= .72; ball.vy = 0; ball.rest += dt;
        if (ball.rest > (tidying ? .12 : .3)) {
          ball.asleep = true; ball.flight = ''; ball.vx = 0; ball.vy = 0;
          if (ball.idleBouncing) { ball.idleBouncing = false; ball.idleTimer = 1.1 + Math.random() * 2.5; }
        }
      } else ball.rest = 0;
    });
    if (tidying && balls.every((ball) => ball.asleep)) {
      tidying = false;
      updateCompletion();
    }
  }
  function tick(now) {
    if (!previousTime) previousTime = now;
    let delta = Math.min((now - previousTime) / 1000, .04); previousTime = now;
    while (delta > 0) { const stepSize = Math.min(delta, 1 / 120); step(stepSize); delta -= stepSize; }
    draw();
    if (gameVisible && (!reducedMotion || balls.some((ball) => !ball.asleep || ball.dragged) || tidying)) frame = requestAnimationFrame(tick);
    else { frame = 0; updateCompletion(); }
  }
  function hitTest(x, y) {
    return balls.slice().reverse().find((ball) => Math.hypot(x - ball.x, y - ball.y) <= ball.r + 4) || null;
  }
  function localPoint(event) {
    const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  canvas?.addEventListener('pointerdown', (event) => {
    const point = localPoint(event), ball = hitTest(point.x, point.y);
    if (ball) {
      pointer = { id: event.pointerId, ball, source: ball.bucket, startX: point.x, startY: point.y, lastX: point.x, lastY: point.y, offsetX: ball.x - point.x, offsetY: ball.y - point.y, time: performance.now(), moved: false };
      canvas.setPointerCapture(event.pointerId); selectBall(ball); clearSelectionTimeout(); ball.dragged = true;
    } else if (selected) {
      const destination = point.x < width / 2 ? 'pink' : 'black'; launch(selected, destination);
    }
    event.preventDefault();
  });
  canvas?.addEventListener('pointermove', (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const point = localPoint(event), ball = pointer.ball;
    if (Math.hypot(point.x - pointer.startX, point.y - pointer.startY) > 5) pointer.moved = true;
    if (pointer.moved) {
      pointer.lastX = point.x; pointer.lastY = point.y;
      const source = geometry[pointer.source];
      // The ball follows the pointer immediately. Keep it in the source opening
      // until it has been lifted above the rim, then let it travel freely.
      // Pointer capture lets the ball keep following the drag even after it
      // passes the canvas edge, where the canvas naturally clips it from view.
      ball.y = clamp(point.y + pointer.offsetY, -ball.r * 1.5, height + ball.r);
      if (ball.y + ball.r > source.top) {
        const openingHalf = source.topHalf - ball.r * .55;
        ball.x = clamp(point.x + pointer.offsetX, source.cx - openingHalf, source.cx + openingHalf);
        ball.y = Math.max(ball.y, source.top + ball.r * .2);
      } else {
        ball.x = clamp(point.x + pointer.offsetX, ball.r, width - ball.r);
      }
      draw();
    }
  });
  function releasePointer(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const point = localPoint(event), ball = pointer.ball, source = geometry[pointer.source]; ball.dragged = false;
    if (pointer.moved) {
      const destination = point.x < width / 2 ? 'pink' : 'black';
      if (destination !== pointer.source) {
        ball.target = destination;
        if (ball.y <= source.top - ball.r - 2) {
          ball.flight = 'arc'; ball.asleep = false; ball.rest = 0;
          clearSelection(); beginArc(ball); startLoop();
        } else launch(ball, destination);
      }
      else {
        ball.asleep = false; ball.flight = ''; ball.vx = 0; ball.vy = 0; ball.rest = 0;
        status.textContent = 'Drag toward the other bucket to toss the ball.'; armSelectionTimeout(); startLoop();
      }
    } else {
      ball.asleep = true; selectBall(ball);
    }
    pointer = null; draw();
  }
  canvas?.addEventListener('pointerup', releasePointer);
  canvas?.addEventListener('pointercancel', releasePointer);
  let keyboardBucket = 'pink';
  canvas?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const index = selected ? balls.indexOf(selected) : -1;
      selectBall(balls[(index + (event.key === 'ArrowDown' ? 1 : balls.length - 1)) % balls.length]);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); keyboardBucket = event.key === 'ArrowLeft' ? 'pink' : 'black';
      if (selected) {
        status.textContent = `Ball ${selected.id + 1} selected. Press Enter to move it to the ${keyboardBucket} bucket.`;
        armSelectionTimeout();
      }
    } else if ((event.key === 'Enter' || event.key === ' ') && selected) {
      event.preventDefault(); launch(selected, keyboardBucket);
    } else if (event.key === 'Escape') clearSelection();
  });
  tidyButton?.addEventListener('click', () => {
    resetBallsIntoBuckets(correctBucketFor, 'Tidying up…');
    updateCompletion();
  });
  sortingGame.querySelector('[data-sort-action="reshuffle"]')?.addEventListener('click', () => {
    const assignments = shuffleBucketAssignments();
    resetBallsIntoBuckets((ball) => assignments.get(ball.id), 'Mixed up. Your move.');
    status.classList.remove('is-complete');
  });

  resize();
  // Start with a loose, mixed pile; let gravity and ball collisions find every resting position.
  balls.forEach((ball) => {
    const bucket = geometry[ball.bucket];
    ball.x = bucket.cx + (random() - .5) * bucket.topHalf * 1.05;
    ball.y = bucket.top + ball.r + random() * Math.min(150, height * .31);
    ball.asleep = false; ball.vx = (random() - .5) * 30; ball.vy = (random() - .5) * 12;
  });
  // Settle the initial arrangement before first paint without placing balls into rows.
  for (let i = 0; i < 900; i += 1) step(1 / 120);
  draw();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  window.addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      const entry = entries[0];
      gameVisible = entry.isIntersecting;
      if (gameVisible) startLoop();
      else if (frame) { cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
    }, { rootMargin: '120px 0px' }).observe(canvas);
  } else startLoop();
}
