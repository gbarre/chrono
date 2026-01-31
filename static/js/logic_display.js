const currentPath = window.location.pathname;
const socket = io({
    path: currentPath + "socket.io"
});
const bipSound = new Audio('static/sounds/bip.wav');
let config = { sequence: "AB", prep: 10, shoot: 120 };
let currentRow = 0, isRunning = false, currentGroup = 1;
let isPausedBetweenVagues = false, isVagueTransition = false, currentInterval = null;
let isSoundEnabled = true;

// --- UTILITAIRES ---

function playBip(count) {
    if (!isSoundEnabled) return;
    const fire = () => {
        const s = bipSound.cloneNode();
        s.play().catch(e => console.warn("Erreur son:", e));
    };
    fire();
    if (count > 1) {
        let i = 1;
        const interval = setInterval(() => {
            fire();
            if (++i >= count) clearInterval(interval);
        }, 1200); // Rythme de bip plus naturel
    }
}

function updateDisplay(time, color, phase) {
    const timerEl = document.getElementById('timer');
    timerEl.innerText = time;
    timerEl.style.color = color;

    // Nettoyage de la phase pour éviter les doublons de préfixes si on appelle updateDisplay manuellement
    let cleanPhase = phase.replace(/\[.*?\]\s*/, "");
    let groupPrefix = (config.sequence === "AB") ? "[AB] " : (currentGroup === 1 ? "[AB] " : "[CD] ");

    socket.emit('sync_timer', {
        time: time,
        color: color,
        phase: groupPrefix + cleanPhase
    });
}

function updateSequenceDisplay() {
    const labels = document.getElementById('group-labels');
    const container = document.getElementById('seq-display');
    if (config.sequence === "AB") {
        labels.innerHTML = '<span>A B</span>';
    } else {
        // Affiche AB et CD, met en évidence le groupe actif
        labels.innerHTML = currentGroup === 1 ?
            '<span>A B</span> <span class="inactive-text">C D</span>' :
            '<span class="inactive-text">A B</span> <span>C D</span>';
        container.style.flexDirection = currentGroup === 1 ? "row" : "row-reverse";
    }
}

// --- LOGIQUE DE CYCLE ---

function startCycle() {
    isRunning = true;
    document.getElementById('config-screen').style.display = 'none';
    document.getElementById('chrono-screen').style.display = 'flex';
    updateSequenceDisplay();
    playBip(2);
    runTimer();
}

function runTimer() {
    let p = config.prep;
    setLights(true, false, false);
    updateDisplay(p, "#ff0000", "PRÉPARATION");
    currentInterval = setInterval(() => {
        if (--p > 0) updateDisplay(p, "#ff0000", "PRÉPARATION");
        else { clearInterval(currentInterval); playBip(1); launchShootPhase(); }
    }, 1000);
}

function launchShootPhase() {
    let s = config.shoot;
    setLights(false, false, true);
    updateDisplay(s, "#00ff00", "TIR");

    currentInterval = setInterval(() => {
        if (--s > 0) {
            let c = (s <= 30) ? "#ffae00" : "#00ff00";
            if (s <= 30) setLights(false, true, false);
            updateDisplay(s, c, "TIR");
        } else {
            clearInterval(currentInterval);
            finishOrNext();
        }
    }, 1000);
}

function finishOrNext() {
    if (config.sequence === "AB/CD" && !isVagueTransition) {
        isVagueTransition = true;
        currentGroup = (currentGroup === 1) ? 2 : 1; // Bascule AB -> CD
        updateSequenceDisplay();
        playBip(2);
        runTimer();
    } else {
        finishVolley();
    }
}

function finishVolley() {
    updateDisplay(0, "#ff0000", "FIN VOLÉE");
    setLights(true, false, false);
    playBip(3);
    isPausedBetweenVagues = true;
    isVagueTransition = false;
    // ON NE CHANGE PAS currentGroup ici pour que le dernier groupe (CD) reste actif au prochain départ
    updateSequenceDisplay();
}

function forceNextStep() {
    if (currentInterval) clearInterval(currentInterval);
    if (isPausedBetweenVagues) {
        isPausedBetweenVagues = false;
        isVagueTransition = false;
        playBip(2);
        updateSequenceDisplay(); // Utilise le currentGroup conservé (CD)
        runTimer();
    } else {
        finishOrNext();
    }
}

// --- CONFIG ET SOCKETS ---

socket.on('ui_update', (data) => {
    if (isRunning) {
        // --- NOUVEAU : Correction manuelle du groupe pendant le tir ---
        if (data.key === 'ArrowUp' || data.key === 'ArrowDown') {
            if (config.sequence === "AB/CD") {
                currentGroup = (currentGroup === 1) ? 2 : 1;
                updateSequenceDisplay();
                // On rafraîchit aussi l'affichage sur la télécommande immédiatement
                const timerEl = document.getElementById('timer');
                updateDisplay(timerEl.innerText, timerEl.style.color, document.getElementById('remote-status').innerText.split(' ').pop());
            }
            return;
        }

        if (data.key === 'b') forceNextStep();
        else if (data.key === 'Escape') {
            socket.emit('sync_timer', { time: "--", color: "#aaa", phase: "STANDBY" });
            setTimeout(() => { location.reload(); }, 100);
        }
        return;
    }

    // Logique du menu (inchangée)
    if (data.key === 'ArrowUp') modifyValue(-1);
    else if (data.key === 'ArrowDown') modifyValue(1);
    else if (data.key === 'b') {
        if (currentRow === 3) startCycle(); else { currentRow++; updateUI(); }
    }
    updateUI();
});

function modifyValue(dir) {
    const step = dir * -1;
    if (currentRow === 0) config.sequence = (config.sequence === "AB") ? "AB/CD" : "AB";
    else if (currentRow === 1) config.prep = Math.min(30, Math.max(0, config.prep + (step * 10)));
    else if (currentRow === 2) config.shoot = Math.min(300, Math.max(40, config.shoot + (step * 10)));
}

function updateUI() {
    document.getElementById('val-sequence').innerText = config.sequence;
    document.getElementById('val-prep').innerText = config.prep + "s";
    document.getElementById('val-shoot').innerText = config.shoot + "s";
    for (let i = 0; i < 4; i++) document.getElementById(`row-${i}`).className = 'setting-row' + (i===currentRow?' active':'');
}

function setLights(r, o, g) {
    document.getElementById('light-red').classList.toggle('on', r);
    document.getElementById('light-orange').classList.toggle('on', o);
    document.getElementById('light-green').classList.toggle('on', g);
}

socket.on('audio_state_change', (data) => { isSoundEnabled = data.enabled; });

updateUI();
