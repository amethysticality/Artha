function checkAuth() {
    if (!localStorage.getItem('activeUser')) {
        window.location.href = "login.html"; 
    }
}
checkAuth();

function incrementViewCount(songId) {
    const username = localStorage.getItem('activeUser');
    
    // 1. Get the full user object
    let userData = JSON.parse(localStorage.getItem(username));

    // 2. Ensure the stats structure exists
    if (!userData.stats) {
        userData.stats = { totalViews: 0, songHistory: {} };
    }

    // 3. Update data
    userData.stats.totalViews += 1;
    
    // If they've seen this song before, add 1; otherwise, set to 1
    userData.stats.songHistory[songId] = (userData.stats.songHistory[songId] || 0) + 1;

    // 4. Save it back to the "database"
    localStorage.setItem(username, JSON.stringify(userData));
}

function logout() {
    // This only removes the "session" marker, not the user's account/stats
    localStorage.removeItem('activeUser');
    
    // Send them back to the start
    window.location.href = "index.html";
}

function loginUser(username, password) {
    const storedData = localStorage.getItem(username);
    if (storedData) {
        const user = JSON.parse(storedData);
        if (user.password === password) {
            // This stays until specifically removed
            localStorage.setItem('activeUser', username); 
            window.location.href = "dashboard.html";
        }
    }
}