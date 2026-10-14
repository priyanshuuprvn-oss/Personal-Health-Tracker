const page = document.body.dataset.page;
const nav = [['onboarding', 'Overview'], ['inference', 'Health Check-in'], ['analytics', 'Analytics'], ['records', 'Health History']];

function status(cls) {
  return `<span class="badge ${cls}">${cls === 'healthy' ? 'Healthy' : cls === 'moderate' ? 'Moderate Risk' : 'High Risk'}</span>`;
}

function tableRows(rows) {
  return rows.map(row => `<tr><td>${row.date}</td><td><strong>${row.hr}</strong> bpm</td><td>${Number(row.steps).toLocaleString()}</td><td>${row.sleep} h</td><td>${status(row.cls)}</td><td>${row.note}</td></tr>`).join('');
}

function userRecordKey(patient) {
  return (patient.patientEmail || patient.patientName || 'guest').trim().toLowerCase();
}

function getActivePatient() {
  const activeEmail = localStorage.getItem('smartHealthActiveUser');
  if (!activeEmail) return null;
  return getAllUsers()[activeEmail] || null;
}

function getAllUsers() {
  try { return JSON.parse(localStorage.getItem('smartHealthUsers') || '{}'); }
  catch { return {}; }
}

function getAllVitals() {
  try { return JSON.parse(localStorage.getItem('smartHealthVitalsByUser') || '{}'); }
  catch { return {}; }
}

function saveVitalsForUser(patient, vitals) {
  const allVitals = getAllVitals();
  allVitals[userRecordKey(patient)] = vitals;
  localStorage.setItem('smartHealthVitalsByUser', JSON.stringify(allVitals));
}

function applyTheme(theme) {
  const activeTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.dataset.theme = activeTheme;
  localStorage.setItem('smartHealthTheme', activeTheme);
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    toggle.textContent = `${nextTheme === 'dark' ? 'Dark' : 'Light'} mode`;
    toggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    toggle.setAttribute('aria-pressed', String(activeTheme === 'dark'));
  }
}

function wireThemeToggle() {
  applyTheme(localStorage.getItem('smartHealthTheme') || 'light');
  document.getElementById('themeToggle').onclick = () => {
    applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
  };
}

function openProfileCard() {
  const user = getActivePatient();
  if (!user) return;
  const firstName = (user.patientName || '').trim().split(/\s+/)[0] || 'there';
  document.getElementById('viewProfileFirstName').textContent = firstName;
  document.getElementById('viewProfileInitial').textContent = firstName.charAt(0).toUpperCase();
  document.getElementById('viewProfileEmail').textContent = user.patientEmail || '';
  document.getElementById('viewProfileAge').textContent = user.healthAge || user.patientAge || '\u2014';
  document.getElementById('viewProfileBloodGroup').textContent = user.bloodGroup || '\u2014';
  document.getElementById('viewProfileHeight').textContent = user.height ? `${user.height} cm` : '\u2014';
  document.getElementById('viewProfileWeight').textContent = user.weight ? `${user.weight} kg` : '\u2014';
  document.getElementById('viewProfileBmi').textContent = user.height && user.weight
    ? (Number(user.weight) / ((Number(user.height) / 100) ** 2)).toFixed(1)
    : '\u2014';
  document.getElementById('viewProfileDoctorReport').textContent = user.doctorReport || 'Not added yet';
  document.getElementById('viewProfileMedicines').textContent = user.medicines || 'Not added yet';
  document.getElementById('viewProfileConditions').textContent = user.conditions || 'Not added yet';
  document.getElementById('profileViewDialog').showModal();
}

function openHealthProfile() {
  const user = getActivePatient();
  if (!user) return;
  const fields = {
    profileAge: 'healthAge', profileBloodGroup: 'bloodGroup', profileHeight: 'height',
    profileWeight: 'weight', profileDoctorReport: 'doctorReport', profileMedicines: 'medicines',
    profileConditions: 'conditions'
  };
  Object.entries(fields).forEach(([id, property]) => {
    document.getElementById(id).value = user[property] || '';
  });
  document.getElementById('profileDialog').showModal();
}

function wireHealthProfile() {
  const dialog = document.getElementById('profileDialog');
  const viewDialog = document.getElementById('profileViewDialog');
  document.getElementById('profileAvatar').onclick = openProfileCard;
  document.getElementById('editProfileFromCard').onclick = openHealthProfile;
  document.getElementById('closeProfileView').onclick = () => viewDialog.close();
  document.getElementById('closeProfileViewDone').onclick = () => viewDialog.close();
  document.getElementById('editProfileFromView').onclick = () => {
    viewDialog.close();
    openHealthProfile();
  };
  document.getElementById('closeProfileDialog').onclick = () => dialog.close();
  document.getElementById('cancelProfile').onclick = () => dialog.close();
  document.getElementById('healthProfileForm').onsubmit = event => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const email = localStorage.getItem('smartHealthActiveUser');
    const users = getAllUsers();
    const user = users[email];
    if (!email || !user) return;
    const fields = {
      profileAge: 'healthAge', profileBloodGroup: 'bloodGroup', profileHeight: 'height',
      profileWeight: 'weight', profileDoctorReport: 'doctorReport', profileMedicines: 'medicines',
      profileConditions: 'conditions'
    };
    Object.entries(fields).forEach(([id, property]) => {
      user[property] = document.getElementById(id).value.trim();
    });
    users[email] = user;
    localStorage.setItem('smartHealthUsers', JSON.stringify(users));
    renderPatientProfile(user);
    dialog.close();
  };
}

function showLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  const app = document.getElementById('app');
  const users = getAllUsers();
  const activeEmail = localStorage.getItem('smartHealthActiveUser') || '';
  const activeUser = users[activeEmail] || {};
  loginScreen.hidden = false;
  app.hidden = true;
  loginScreen.innerHTML = `<main class="login-shell"><section class="login-card"><div class="login-brand"><span class="brand-mark">&#10010;</span><span>SmartHealth</span></div><div class="eyebrow">Your personal wellness space</div><h1>Welcome back</h1><p class="login-intro">Sign in to view your health check-ins and personal history.</p><form id="loginForm"><div class="field"><label for="loginName">First name</label><input id="loginName" type="text" autocomplete="given-name" placeholder="Your first name" required></div><div class="field"><label for="loginEmail">Email</label><input id="loginEmail" type="email" autocomplete="email" placeholder="you@example.com" required></div><button class="button login-submit" type="submit">Continue to SmartHealth <span aria-hidden="true">&#8594;</span></button></form><p class="login-note">This demo keeps profiles and records in this browser. It does not verify identity or use a password.</p></section><aside class="login-art"><img src="login-wellness.png" alt="A person checking a fitness watch during a calm morning wellness routine"><div><span class="eyebrow">Wellness, made personal</span><h2>Your health story, all in one place.</h2><p>Track daily signals and revisit your progress over time.</p></div></aside></main>`;
  document.getElementById('loginName').value = activeUser.patientName || '';
  document.getElementById('loginEmail').value = activeUser.patientEmail || activeEmail;
  document.getElementById('loginForm').onsubmit = event => {
    event.preventDefault();
    const name = document.getElementById('loginName').value.trim();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const users = getAllUsers();
    const legacy = JSON.parse(localStorage.getItem('smartHealthPatient') || 'null');
    const previous = users[email] || (legacy?.patientEmail?.trim().toLowerCase() === email ? legacy : {});
    const user = { ...previous, patientName: name, patientEmail: email };
    users[email] = user;
    localStorage.setItem('smartHealthUsers', JSON.stringify(users));
    localStorage.setItem('smartHealthActiveUser', email);
    if (!getAllVitals()[email] && legacy?.patientEmail?.trim().toLowerCase() === email) {
      const oldVitals = JSON.parse(localStorage.getItem('smartHealthVitals') || 'null');
      if (oldVitals) saveVitalsForUser(user, oldVitals);
    }
    loginScreen.hidden = true;
    app.hidden = false;
    renderPatientProfile(user);
    const savedVitals = getAllVitals()[email];
    if (savedVitals) {
      setVitals(savedVitals);
    } else {
      clearVitals();
    }
    clearVitalInputs();
    const avatar = document.getElementById('profileAvatar');
    avatar.textContent = name.charAt(0).toUpperCase();
    avatar.title = name;
    refreshRecords();
  };
}

function getAllUserRecords() {
  try { return JSON.parse(localStorage.getItem('smartHealthRecordsByUser') || '{}'); }
  catch { return {}; }
}

function saveHealthRecord(patient, record) {
  const allRecords = getAllUserRecords();
  const key = userRecordKey(patient);
  allRecords[key] = [record, ...(allRecords[key] || [])].sort((a, b) => b.timestamp - a.timestamp);
  localStorage.setItem('smartHealthRecordsByUser', JSON.stringify(allRecords));
  refreshRecords();
}

function refreshRecords() {
  renderWeeklyAverages();
  const body = document.getElementById('recordsBody');
  if (!body) return;
  const patient = getActivePatient();
  if (!patient) {
    body.innerHTML = '<tr><td colspan="6" class="empty">Sign in to view your health history.</td></tr>';
    return;
  }
  const records = getAllUserRecords()[userRecordKey(patient)] || [];
  const latestRecords = [...records].sort((a, b) => Number(b.timestamp) - Number(a.timestamp)).slice(0, 3);
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const selected = document.getElementById('riskFilter')?.value || 'all';
  const filtered = latestRecords.filter(row => (selected === 'all' || row.cls === selected) && `${row.date} ${row.hr} ${row.steps} ${row.note} ${row.risk}`.toLowerCase().includes(query));
  body.innerHTML = filtered.length
    ? tableRows(filtered)
    : `<tr><td colspan="6" class="empty">${records.length ? 'No records match your search.' : 'No check-ins yet. Run an assessment to start this user\'s history.'}</td></tr>`;
}

function renderWeeklyAverages() {
  const body = document.getElementById('weeklyAveragesBody');
  if (!body) return;
  const user = getActivePatient();
  if (!user) {
    body.innerHTML = '<tr><td colspan="5" class="empty">Sign in to see your weekly averages.</td></tr>';
    return;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const records = (getAllUserRecords()[userRecordKey(user)] || []).filter(record => {
    const date = new Date(record.timestamp);
    return Number.isFinite(date.getTime()) && date >= monthStart && date <= monthEnd;
  });
  const weekStart = new Date(monthStart);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const buckets = [];
  for (let start = new Date(weekStart); start <= now; start.setDate(start.getDate() + 7)) {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const visibleStart = start < monthStart ? monthStart : start;
    const visibleEnd = end > monthEnd ? monthEnd : end > todayEnd ? todayEnd : end;
    buckets.push({
      start: new Date(start),
      end: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999),
      label: `Week ${buckets.length + 1}`,
      range: `${visibleStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${visibleEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    });
  }

  const average = (items, key, digits = 1) => {
    const values = items.map(item => Number(item[key])).filter(Number.isFinite);
    if (!values.length) return '—';
    const result = values.reduce((sum, value) => sum + value, 0) / values.length;
    return digits === 0 ? Math.round(result).toLocaleString() : result.toFixed(digits);
  };
  const note = document.getElementById('weeklyAveragesNote');
  const sampleAverages = [
    { hr: 72, steps: 7450, sleep: 7.2, cal: 320 },
    { hr: 70, steps: 8120, sleep: 7.5, cal: 360 },
    { hr: 74, steps: 6800, sleep: 6.9, cal: 290 },
    { hr: 71, steps: 9050, sleep: 7.8, cal: 410 },
    { hr: 73, steps: 7600, sleep: 7.1, cal: 335 },
    { hr: 72, steps: 7900, sleep: 7.3, cal: 345 }
  ];
  if (note) {
    const hasEmptyWeek = buckets.some(bucket => !records.some(record => {
      const timestamp = Number(record.timestamp);
      return timestamp >= bucket.start.getTime() && timestamp <= bucket.end.getTime();
    }));
    note.textContent = hasEmptyWeek
      ? 'Weeks with saved check-ins show your averages. Weeks marked “example” use illustrative values, not saved readings.'
      : 'Averages are calculated from this month’s saved check-ins.';
  }
  body.innerHTML = buckets.map(bucket => {
    const items = records.filter(record => {
      const timestamp = Number(record.timestamp);
      return timestamp >= bucket.start.getTime() && timestamp <= bucket.end.getTime();
    });
    if (!items.length) {
      const sample = sampleAverages[buckets.indexOf(bucket) % sampleAverages.length];
      return `<tr class="sample-average-row"><td><strong>${bucket.label} · example</strong><br><span class="week-range">${bucket.range}</span></td><td>${sample.hr} bpm</td><td>${sample.steps.toLocaleString()}</td><td>${sample.sleep.toFixed(1)} h</td><td>${sample.cal} kcal</td></tr>`;
    }
    return `<tr><td><strong>${bucket.label}</strong><br><span class="week-range">${bucket.range}</span></td><td>${average(items, 'hr')} bpm</td><td>${average(items, 'steps', 0)}</td><td>${average(items, 'sleep')} h</td><td>${average(items, 'cal')} kcal</td></tr>`;
  }).join('');
}

function shell(content) {
  document.getElementById('app').innerHTML = `<header class="topbar"><div class="shell topinner"><a class="brand" href="#onboarding" style="text-decoration:none;color:inherit"><span class="brand-mark">&#10010;</span> SmartHealth</a><nav class="nav">${nav.map(([id, label]) => `<a href="#${id}">${label}</a>`).join('')}</nav><div class="topright"><button type="button" class="avatar" id="profileAvatar" title="Open health profile" aria-label="Open health profile">U</button><button type="button" class="button secondary theme-toggle" id="themeToggle" aria-label="Switch to dark mode" aria-pressed="false">Dark mode</button></div></div></header><main class="shell main">${content}</main>${healthProfileViewDialog()}${healthProfileDialog()}`;
}

function healthProfileViewDialog() {
  return `<dialog class="profile-dialog profile-view-dialog" id="profileViewDialog"><article class="user-profile-card"><header class="user-profile-header"><div class="person-avatar" id="viewProfileInitial">&#128100;</div><div class="user-profile-title"><div class="eyebrow">Your personal health profile</div><h3>Hi, <span id="viewProfileFirstName">there</span>!</h3><p id="viewProfileEmail"></p></div><button class="dialog-close" id="closeProfileView" type="button" aria-label="Close profile">&#215;</button></header><div class="user-profile-stats"><div class="user-profile-stat"><span>Age</span><strong id="viewProfileAge">&mdash;</strong></div><div class="user-profile-stat"><span>Blood group</span><strong id="viewProfileBloodGroup">&mdash;</strong></div><div class="user-profile-stat"><span>Height</span><strong id="viewProfileHeight">&mdash;</strong></div><div class="user-profile-stat"><span>Weight</span><strong id="viewProfileWeight">&mdash;</strong></div><div class="user-profile-stat"><span>BMI</span><strong id="viewProfileBmi">&mdash;</strong></div></div><div class="user-profile-notes"><section><h4>Previous doctor's report</h4><p id="viewProfileDoctorReport">Not added yet</p></section><section><h4>Medicines currently taking</h4><p id="viewProfileMedicines">Not added yet</p></section><section><h4>Health conditions, allergies &amp; other notes</h4><p id="viewProfileConditions">Not added yet</p></section></div><div class="profile-form-actions"><button class="button secondary" id="closeProfileViewDone" type="button">Close</button><button class="button" id="editProfileFromView" type="button">Edit profile</button></div></article></dialog>`;
}

function healthProfileDialog() {
  return `<dialog class="profile-dialog" id="profileDialog"><div class="profile-dialog-head"><div><div class="eyebrow">Personal health database</div><h2>Your health profile</h2></div><button class="dialog-close" id="closeProfileDialog" type="button" aria-label="Close profile">&#215;</button></div><p class="profile-dialog-note">Add your health details for this profile. They are saved in this browser.</p><form id="healthProfileForm"><div class="profile-form-grid"><div class="field"><label for="profileAge">Age</label><input id="profileAge" type="number" min="1" max="120" placeholder="Age in years"></div><div class="field"><label for="profileBloodGroup">Blood group</label><select id="profileBloodGroup" class="filter"><option value="">Select blood group</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></div><div class="field"><label for="profileHeight">Height (cm)</label><input id="profileHeight" type="number" min="50" max="250" placeholder="Height"></div><div class="field"><label for="profileWeight">Weight (kg) <span class="required-mark">*</span></label><input id="profileWeight" type="number" min="2" max="300" step="0.1" placeholder="Current weight" required></div><div class="field full-field"><label for="profileDoctorReport">Previous doctor's report <span class="required-mark">*</span></label><textarea id="profileDoctorReport" rows="3" placeholder="Add report date and summary, or enter None if you have no previous report." required></textarea></div><div class="field full-field"><label for="profileMedicines">Medicines currently taking <span class="required-mark">*</span></label><textarea id="profileMedicines" rows="3" placeholder="List medicine, dose, and frequency, or enter None." required></textarea></div><div class="field full-field"><label for="profileConditions">Health conditions</label><textarea id="profileConditions" rows="2" placeholder="List health conditions, allergies, or other relevant health details."></textarea></div></div><div class="profile-form-actions"><button class="button secondary" id="cancelProfile" type="button">Cancel</button><button class="button" type="submit">Save health profile</button></div></form></dialog>`;
}

function sectionHead(eyebrow, title, sub) {
  return `<div class="heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="sub">${sub}</p></div></div>`;
}

function singlePage() {
  shell(`
    <section id="onboarding"><div class="hero"><div class="hero-copy"><div class="eyebrow">A clearer view of your wellbeing</div><h1>Welcome, <span id="welcomeName">there</span>.</h1><p>Bring your daily health signals together, understand your progress, and make space for healthier habits.</p><a class="button hero-button" href="#inference">Start a check-in <span aria-hidden="true">&#8595;</span></a><div class="hero-note"><span class="hero-note-icon">&#10003;</span> Your health journey, thoughtfully tracked</div></div><img class="hero-image" src="hero-health.png" alt="A person reviewing wellness metrics on a tablet at home"></div>
    </section>
    <section id="inference" class="page-section"><div class="heading"><div><div class="eyebrow">Understand today's signals</div><h2>Check in with your body</h2><p class="sub">Update your latest readings and see how they fit together.</p></div></div>
      <div class="grid two-col"><article class="card"><div class="card-head"><div><h2>Physiological telemetry</h2><p>Enter values within the displayed biological bounds.</p></div></div>
        <form id="vitalsForm"><div class="formgrid"><div class="field"><label for="hr">Heart rate (BPM)</label><input id="hr" type="number" min="30" max="220" required></div><div class="field"><label for="steps">Daily steps</label><input id="steps" type="number" min="0" max="100000" required></div><div class="field"><label for="sleep">Sleep duration (hours)</label><input id="sleep" type="number" min="0" max="24" step="0.1" required></div><div class="field"><label for="calories">Calories burned (kcal)</label><input id="calories" type="number" min="0" max="10000" required></div></div><div class="form-actions"><button class="button" type="submit">Run Risk Inference</button><button class="button secondary" type="button" id="simulateBtn">Simulate telemetry</button></div></form>
      </article><article class="card"><div class="card-head"><div><h2>Inference output</h2><p>Rule-based prototype, not a medical diagnosis.</p></div></div><div class="output" id="output"><div class="risk-icon">&#10022;</div><h3>Ready for analysis</h3><p>Submit the form above to classify this check-in.</p></div></article></div>
    </section>
    <section id="analytics" class="page-section"><div class="heading"><div><div class="eyebrow">Patterns that support progress</div><h2>Your wellness at a glance</h2><p class="sub">See the trends behind your movement, rest, and heart rate.</p></div></div>
      <section class="grid metrics"><article class="card"><div class="metric-top">Resting heart rate</div><div class="metric-value" id="metricHr">&mdash; <span class="unit">BPM</span></div><div class="metric-foot">${status('healthy')} Current reading</div></article><article class="card"><div class="metric-top">Daily steps</div><div class="metric-value" id="metricSteps">&mdash; <span class="unit">steps</span></div><div class="progress"><i id="stepProgress" style="width:0%"></i></div><div class="metric-foot">Progress toward 10,000 steps</div></article><article class="card"><div class="metric-top">Sleep duration</div><div class="metric-value" id="metricSleep">&mdash; <span class="unit">hours</span></div><div class="metric-foot">Submitted sleep duration</div></article><article class="card"><div class="metric-top">Active calories</div><div class="metric-value" id="metricCalories">&mdash; <span class="unit">kcal</span></div><div class="metric-foot">Submitted active energy</div></article></section>
      <section class="grid analytics"><article class="card"><div class="card-head"><div><h2>Weekly health trajectory</h2><p>Heart rate and step activity</p></div></div><div class="chartbox"><canvas id="trendChart"></canvas></div></article><article class="card"><div class="card-head"><div><h2>Physiological balance</h2><p>Composite wellness index</p></div><span class="badge healthy">Demo index</span></div><div class="radarbox"><canvas id="radarChart"></canvas></div></article></section>
    </section>
    <section id="records" class="page-section"><div class="heading"><div><h2>Health history</h2><p class="sub">Explore your profile and revisit recent check-ins.</p></div></div>
      <article class="user-profile-card"><header class="user-profile-header"><div class="person-avatar" id="recordInitial">&#128100;</div><div class="user-profile-title"><div class="eyebrow">Personal health profile</div><h3 id="recordName">User</h3><p id="recordEmail"></p></div><button class="button secondary" id="editProfileFromCard" type="button">Edit profile</button></header><div class="user-profile-stats"><div class="user-profile-stat"><span>Age</span><strong id="recordAge">&mdash;</strong></div><div class="user-profile-stat"><span>Blood group</span><strong id="recordBloodGroup">&mdash;</strong></div><div class="user-profile-stat"><span>Height</span><strong id="recordHeight">&mdash;</strong></div><div class="user-profile-stat"><span>Weight</span><strong id="recordWeight">&mdash;</strong></div><div class="user-profile-stat"><span>BMI</span><strong id="recordBmi">&mdash;</strong></div></div><div class="user-profile-notes"><section><h4>Previous doctor's report</h4><p id="recordDoctorReport">Not added yet</p></section><section><h4>Medicines currently taking</h4><p id="recordMedicines">Not added yet</p></section><section><h4>Health conditions, allergies &amp; other notes</h4><p id="recordConditions">Not added yet</p></section></div></article>
      <section class="card table-card" style="margin-top:18px"><div class="table-head"><div><h2>Previous check-ins by date</h2><p class="sub">Showing the latest three saved check-ins.</p></div><div class="records-toolbar"><input class="search" id="searchInput" placeholder="Search latest check-ins"><select class="filter" id="riskFilter"><option value="all">All risk statuses</option><option value="healthy">Healthy</option><option value="moderate">Moderate Risk</option><option value="high">High Risk</option></select></div></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Heart rate</th><th>Steps</th><th>Sleep</th><th>Risk tier</th><th>Notes</th></tr></thead><tbody id="recordsBody"></tbody></table></div></section>
      <article class="card weekly-average-card"><div class="card-head"><div><h2>This month's weekly averages</h2><p id="weeklyAveragesNote">Average values from all your saved check-ins, grouped by calendar week.</p></div></div><div class="table-wrap"><table class="weekly-average-table"><thead><tr><th>Week</th><th>Heart rate</th><th>Steps</th><th>Sleep</th><th>Calories</th></tr></thead><tbody id="weeklyAveragesBody"></tbody></table></div></article>
    </section>`);
  wireVitals();
  wireRecords();
  drawCharts();
  wireThemeToggle();
  wireHealthProfile();
  showLoginScreen();
}

function setVitals(vitals) {
  ['hr', 'steps', 'sleep', 'calories'].forEach(id => { document.getElementById(id).value = id === 'calories' ? vitals.cal : vitals[id]; });
  document.getElementById('metricHr').innerHTML = `${vitals.hr} <span class="unit">BPM</span>`;
  document.getElementById('metricSteps').innerHTML = `${Number(vitals.steps).toLocaleString()} <span class="unit">steps</span>`;
  document.getElementById('metricSleep').innerHTML = `${vitals.sleep} <span class="unit">hours</span>`;
  document.getElementById('metricCalories').innerHTML = `${vitals.cal} <span class="unit">kcal</span>`;
  document.getElementById('stepProgress').style.width = `${Math.min(100, Number(vitals.steps) / 100)}%`;
}

function clearVitalInputs() {
  ['hr', 'steps', 'sleep', 'calories'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

function clearVitals() {
  ['hr', 'steps', 'sleep', 'calories'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('metricHr').innerHTML = `&mdash; <span class="unit">BPM</span>`;
  document.getElementById('metricSteps').innerHTML = `&mdash; <span class="unit">steps</span>`;
  document.getElementById('metricSleep').innerHTML = `&mdash; <span class="unit">hours</span>`;
  document.getElementById('metricCalories').innerHTML = `&mdash; <span class="unit">kcal</span>`;
  document.getElementById('stepProgress').style.width = '0%';
  const output = document.getElementById('output');
  output.className = 'output';
  output.innerHTML = '<div class="risk-icon">&#10022;</div><h3>Ready for analysis</h3><p>Submit the form above to classify this check-in.</p>';
}

function infer(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const x = { hr: Number(document.getElementById('hr').value), steps: Number(document.getElementById('steps').value), sleep: Number(document.getElementById('sleep').value), cal: Number(document.getElementById('calories').value) };
  let risk = 0;
  const causes = [];
  if (x.hr < 50 || x.hr > 100) { risk = 2; causes.push(`heart rate ${x.hr} BPM is outside the usual band`); } else if (x.hr > 90) { risk = 1; causes.push('heart rate is elevated'); }
  if (x.sleep < 5) { risk = 2; causes.push(`${x.sleep} hours of sleep is very low`); } else if (x.sleep < 6.5) { risk = Math.max(risk, 1); causes.push('sleep is below the 6.5-hour threshold'); }
  if (x.steps < 2000) { risk = Math.max(risk, 1); causes.push('step activity is low'); }
  if (x.cal > 0 && x.cal < 100) { risk = Math.max(risk, 1); causes.push('active calorie estimate is low'); }
  const names = ['Healthy', 'Moderate Risk', 'High Risk'];
  const classes = ['healthy', 'moderate', 'high'];
  const recommendations = risk === 0 ? ['Keep a steady activity routine and maintain hydration.', 'Continue tracking sleep and daily movement.'] : risk === 1 ? ['Hydrate and take a short recovery break.', 'Aim for a consistent sleep window tonight.'] : ['Pause strenuous activity and repeat the measurement after resting.', 'If symptoms persist, seek advice from a qualified clinician.'];
  document.getElementById('output').className = 'output ready';
  document.getElementById('output').innerHTML = `<div class="risk-icon ${classes[risk]}">${risk === 0 ? '&#10003;' : risk === 1 ? '!' : '&#9888;'}</div><span class="badge ${classes[risk]}" style="width:max-content">Class ${risk}</span><h3 style="margin-top:9px">${names[risk]}</h3><p>${causes.length ? `Triggered by: ${causes.join('; ')}.` : 'No configured threshold was crossed.'}</p><div class="reco"><strong>Suggested next steps</strong><ul>${recommendations.map(item => `<li>${item}</li>`).join('')}</ul></div>`;
  setVitals({ hr: x.hr, steps: x.steps, sleep: x.sleep, cal: x.cal });
  const patient = getActivePatient();
  if (patient) {
    const now = new Date();
    saveHealthRecord(patient, { timestamp: now.getTime(), date: now.toLocaleString(), hr: x.hr, steps: x.steps, sleep: x.sleep, cal: x.cal, risk: names[risk], cls: classes[risk], note: causes.length ? causes.join('; ') : 'No configured thresholds were crossed' });
    saveVitalsForUser(patient, { hr: x.hr, steps: x.steps, sleep: x.sleep, cal: x.cal });
  }
}

function wireVitals() {
  document.getElementById('vitalsForm').onsubmit = infer;
  document.getElementById('simulateBtn').onclick = () => {
    const values = { hr: Math.round(58 + Math.random() * 52), steps: Math.round(1800 + Math.random() * 10500), sleep: (4.5 + Math.random() * 4.5).toFixed(1), cal: Math.round(120 + Math.random() * 480) };
    setVitals(values);
    infer({ preventDefault() {}, currentTarget: document.getElementById('vitalsForm') });
  };
}

function renderPatientProfile(patient) {
  const firstName = (patient.patientName || '').trim().split(/\s+/)[0] || 'there';
  document.getElementById('welcomeName').textContent = firstName;
  document.getElementById('recordInitial').textContent = firstName.charAt(0).toUpperCase();
  document.getElementById('recordName').textContent = patient.patientName || 'User';
  document.getElementById('recordEmail').textContent = patient.patientEmail || '';
  document.getElementById('recordAge').textContent = patient.healthAge || patient.patientAge || '\u2014';
  document.getElementById('recordBloodGroup').textContent = patient.bloodGroup || '\u2014';
  document.getElementById('recordHeight').textContent = patient.height ? `${patient.height} cm` : '\u2014';
  document.getElementById('recordWeight').textContent = patient.weight ? `${patient.weight} kg` : '\u2014';
  document.getElementById('recordBmi').textContent = patient.height && patient.weight
    ? (Number(patient.weight) / ((Number(patient.height) / 100) ** 2)).toFixed(1)
    : '\u2014';
  document.getElementById('recordDoctorReport').textContent = patient.doctorReport || 'Not added yet';
  document.getElementById('recordMedicines').textContent = patient.medicines || 'Not added yet';
  document.getElementById('recordConditions').textContent = patient.conditions || 'Not added yet';
}

function wireRecords() {
  refreshRecords();
  document.getElementById('searchInput').oninput = refreshRecords;
  document.getElementById('riskFilter').onchange = refreshRecords;
}

function drawCharts() {
  if (!window.Chart) return;
  new Chart(document.getElementById('trendChart'), { type: 'line', data: { labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'], datasets: [{ label: 'Heart rate', data: [72, 69, 76, 108, 72, 91, 68], borderColor: '#2563eb', tension: .38, yAxisID: 'y' }, { label: 'Steps', data: [7800, 9200, 6800, 3210, 9032, 10350, 8246], borderColor: '#10b981', tension: .38, yAxisID: 'y1' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 40, max: 120 }, y1: { position: 'right', min: 0, max: 12000, grid: { display: false } } } } });
  new Chart(document.getElementById('radarChart'), { type: 'radar', data: { labels: ['Cardio', 'Mobility', 'Sleep', 'Nutrition', 'Consistency'], datasets: [{ data: [78, 83, 74, 68, 79], backgroundColor: '#3b82f626', borderColor: '#2563eb', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 100, ticks: { display: false } } } } });
}

if (page === 'dashboard') singlePage();



