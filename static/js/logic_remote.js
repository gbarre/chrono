const currentPath = window.location.pathname;
const socket = io({
    path: currentPath + "socket.io"
});
let soundOn = true;

function send(key) { socket.emit('command', { key: key }); }

function toggleAudio() {
    soundOn = !soundOn;
    document.getElementById('mute-btn').innerText = soundOn ? "SON : ACTIVÉ 🔊" : "SON : COUPÉ 🔇";
    document.getElementById('mute-btn').style.background = soundOn ? "#444" : "#800";
    socket.emit('toggle_audio', { enabled: soundOn });
}

socket.on('timer_update', (data) => {
    const timerEl = document.getElementById('remote-timer');
    const statusEl = document.getElementById('remote-status');
    timerEl.innerText = data.time;
    timerEl.style.color = data.color;
    statusEl.innerText = data.phase;
});

window.onload = () => {
    document.getElementById('remote-timer').innerText = "--";
    document.getElementById('remote-status').innerText = "STANDBY";
};
