// --- AUTHENTICATION & NAVIGATION ---
function checkAuth() {
    const user = localStorage.getItem('activeUser');
    if (!user) {
        window.location.href = "login.html"; 
    }
}

function logout() {
    localStorage.removeItem('activeUser');
    window.location.href = "login.html";
}

// --- LOGIN & REGISTRATION ---
function handleLogin() {
    const userVal = document.getElementById('username').value.trim();
    const passVal = document.getElementById('password').value.trim();

    if (!userVal || !passVal) {
        alert("Please fill in both fields.");
        return;
    }

    const storedData = localStorage.getItem(userVal);
    if (storedData) {
        const user = JSON.parse(storedData);
        if (user.password === passVal) {
            localStorage.setItem('activeUser', userVal);
            window.location.href = "dashboard.html"; 
        } else {
            alert("Incorrect password.");
        }
    } else {
        alert("User not found.");
    }
}

function handleRegister() {
    const userVal = document.getElementById('regUsername').value.trim();
    const passVal = document.getElementById('regPassword').value.trim();

    if (!userVal || !passVal) {
        alert("Please enter both a username and password.");
        return;
    }

    if (localStorage.getItem(userVal)) {
        alert("Username taken.");
        return;
    }

    const newUser = {
        username: userVal,
        password: passVal,
        stats: {
            totalViews: 0,
            songHistory: {},
            recentSongs: [],
            timeStats: {}
        },
        tutoringSessions: []
    };

    localStorage.setItem(userVal, JSON.stringify(newUser));
    alert("Account created!");
    window.location.href = "login.html";
}

// --- TRACKING LOGIC ---
function incrementViewCount(songId, category) {
    const username = localStorage.getItem('activeUser');
    if (!username) return;

    let userData = JSON.parse(localStorage.getItem(username));
    if (!userData.stats) userData.stats = { totalViews: 0, songHistory: {}, recentSongs: [] };

    userData.stats.totalViews += 1;
    userData.stats.songHistory[songId] = (userData.stats.songHistory[songId] || 0) + 1;

    const entry = { id: songId, cat: category };
    userData.stats.recentSongs = userData.stats.recentSongs.filter(item => item.id !== songId);
    userData.stats.recentSongs.unshift(entry);
    if (userData.stats.recentSongs.length > 3) userData.stats.recentSongs.pop();

    localStorage.setItem(username, JSON.stringify(userData));
}

function addTimeSpent(category, seconds) {
    const username = localStorage.getItem('activeUser');
    if (!username) return;

    let userData = JSON.parse(localStorage.getItem(username));
    if (!userData.stats.timeStats) userData.stats.timeStats = {};

    userData.stats.timeStats[category] = (userData.stats.timeStats[category] || 0) + seconds;
    localStorage.setItem(username, JSON.stringify(userData));
}

function startTimeTracking(category) {
    setInterval(() => { addTimeSpent(category, 5); }, 5000);
}

// --- DASHBOARD & PAGE LOAD LOGIC ---
window.addEventListener('DOMContentLoaded', () => {
    const activeUser = localStorage.getItem('activeUser');
    
    // Always try to display global tutoring sessions if the table exists
    displayAvailableSessions();

    // If no user is logged in, stop here
    if (!activeUser) return;

    const userData = JSON.parse(localStorage.getItem(activeUser));

    // 1. Welcome Message
    const welcomeHeading = document.getElementById('welcome-message');
    if (welcomeHeading) {
        welcomeHeading.textContent = `Welcome, ${activeUser}!`;
    }

    // 2. Account Tab Info
    const userDisplay = document.getElementById('display-username');
    const passDisplay = document.getElementById('display-password');
    if (userDisplay && passDisplay) {
        userDisplay.textContent = userData.username;
        passDisplay.textContent = userData.password;
    }

    // 3. Booked Tutoring Sessions
    const sessionList = document.getElementById('booked-sessions-list');
    if (sessionList && userData.tutoringSessions) {
        sessionList.innerHTML = ""; 
        userData.tutoringSessions.forEach(s => {
            const li = document.createElement('li');
            li.textContent = `${s.language} with ${s.tutor} (Joined: ${s.dateSignedUp})`;
            sessionList.appendChild(li);
        });
    }

    // 4. Total Views
    const viewDisplay = document.getElementById('total-views-display');
    if (viewDisplay) viewDisplay.textContent = userData.stats?.totalViews || 0;

    // 5. Recent Activity List
    const listElement = document.getElementById('recent-list');
    if (listElement && userData.stats?.recentSongs) {
        listElement.innerHTML = "";
        userData.stats.recentSongs.forEach(song => {
            const li = document.createElement('li');
            const cleanName = song.id.replace(/_/g, ' ').toUpperCase();
            li.innerHTML = `<strong>${cleanName}</strong> — <small>${song.cat}</small>`;
            listElement.appendChild(li);
        });
    }

    // 6. Pie Chart
    const chartCanvas = document.getElementById('myPieChart');
    if (chartCanvas && userData.stats?.timeStats && typeof Chart !== 'undefined') {
        const ctx = chartCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(userData.stats.timeStats),
                datasets: [{
                    data: Object.values(userData.stats.timeStats).map(s => (s/60).toFixed(2)),
                    backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0']
                }]
            }
        });
    }
});

// --- TUTORING LOGIC ---
function signUpForSession(tutorName, language) {
    const username = localStorage.getItem('activeUser');
    if (!username) {
        alert("Please log in to sign up for sessions!");
        return;
    }

    let userData = JSON.parse(localStorage.getItem(username));
    if (!userData.tutoringSessions) userData.tutoringSessions = [];

    const alreadySignedUp = userData.tutoringSessions.some(s => s.tutor === tutorName);
    if (alreadySignedUp) {
        alert("You are already signed up with " + tutorName);
        return;
    }

    userData.tutoringSessions.push({
        tutor: tutorName,
        language: language,
        dateSignedUp: new Date().toLocaleDateString()
    });

    localStorage.setItem(username, JSON.stringify(userData));
    alert(`Signed up for ${language} with ${tutorName}!`);
    location.reload(); // Refresh to show the new session in the list
}

function addNewSession() {
    const name = document.getElementById('tutorName').value;
    const lang = document.getElementById('tutorLang').value;
    const desc = document.getElementById('tutorDesc').value;
    const cost = document.getElementById('tutorCost').value;

    if (!name || !lang || !desc || !cost) {
        alert("Fill in all fields");
        return;
    }

    let allSessions = JSON.parse(localStorage.getItem('globalSessions')) || [];
    allSessions.push({ name, lang, desc, cost, id: Date.now() });
    localStorage.setItem('globalSessions', JSON.stringify(allSessions));
    
    displayAvailableSessions();
}

function displayAvailableSessions() {
    const tableBody = document.getElementById('session-table-body');
    if (!tableBody) return;

    // 1. Define your default session
    const defaultSession = {
        name: "Jean Dupont",
        lang: "French",
        desc: "Conversational French for beginners.",
        cost: "$25/hr",
        id: "default-1"
    };

    // 2. Get existing sessions or start with the default one
    let allSessions = JSON.parse(localStorage.getItem('globalSessions'));

    // If localStorage is totally empty, save the default session as the starting point
    if (!allSessions || allSessions.length === 0) {
        allSessions = [defaultSession];
        localStorage.setItem('globalSessions', JSON.stringify(allSessions));
    }

    tableBody.innerHTML = ""; // Clear current table

    // 3. Render all sessions (Default + anything you added via the form)
    allSessions.forEach(session => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${session.name}</td>
            <td>${session.lang}</td>
            <td>${session.desc}</td>
            <td>${session.cost}</td>
            <td><button class="signup-btn" onclick="signUpForSession('${session.name}', '${session.lang}')">Sign Up</button></td>
        `;
        tableBody.appendChild(row);
    });
}