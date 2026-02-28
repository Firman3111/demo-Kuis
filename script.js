// 1. Inisialisasi Firebase
const firebaseConfig = {
  databaseURL: "https://fir-kuis-23368-default-rtdb.asia-southeast1.firebasedatabase.app"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 3. Variabel Global
let currentCategory = ''; 
let isFinished = false; 
let username = "";
let groupName = "";
let selectedQuestions = [];
let currentIdx = 0;
let score = 0;
let timeLeft = 30;
let timerInterval;
let startTime;
let lives = 5; 

// 4. Navigasi Halaman
function showPage(pageId) {
    document.querySelectorAll('.container').forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}

function checkUsername() {
    username = document.getElementById('username-input').value.trim();
    groupName = document.getElementById('group-input').value.trim();
    
    if (username === "" || groupName === "") {
        document.getElementById('warning-modal').classList.remove('hidden');
    } else {
        loadChallengeLeaderboard();
        showPage('page-challenge');
    }
}

function loadChallengeLeaderboard() {
    const tbody = document.getElementById('challenge-leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="3">Memuat juara...</td></tr>';

    database.ref('leaderboard').orderByChild('score').limitToLast(10).once('value', (snapshot) => {
        let data = [];
        snapshot.forEach((child) => { data.push(child.val()); });
        data.sort((a, b) => b.score - a.score || a.time - b.time);

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">Belum ada penantang. Jadilah yang pertama!</td></tr>';
            return;
        }

        tbody.innerHTML = data.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.score}</td>
            </tr>
        `).join('');
    });
}

function selectCategory(category) {
    currentCategory = category;
    showPage('page-rules');
}

function closeModal() {
    document.getElementById('warning-modal').classList.add('hidden');
}

// 5. Logika Inti Kuis
function startQuiz() {
    isFinished = false; 
    score = 0;
    currentIdx = 0;
    lives = 5; // Reset menjadi 5 nyawa
    updateLivesDisplay(); 
    startTime = Date.now();
    
    const dataKategori = quizData[currentCategory] || quizData.sejarah;
    selectedQuestions = [...dataKategori].sort(() => 0.5 - Math.random()).slice(0, 10);
    
    showPage('page-quiz');
    loadQuestion();
}

// 3. Pastikan fungsi update display tetap menggunakan icon Font Awesome
function updateLivesDisplay() {
    const heartHTML = '<i class="fas fa-heart"></i>'.repeat(lives);
    document.getElementById('lives-display').innerHTML = heartHTML;
}

function loadQuestion() {
    if (currentIdx < selectedQuestions.length) {
        const q = selectedQuestions[currentIdx];
        document.getElementById('progress').innerText = `Pertanyaan ${currentIdx + 1} dari 10`;
        document.getElementById('question-box').innerText = `${currentIdx + 1}. ${q.q}`;
        
        const nextBtn = document.getElementById('next-btn');
        nextBtn.classList.add('hidden');
        
        const optionsBox = document.getElementById('options-box');
        optionsBox.innerHTML = '';
        
        const labels = ['A', 'B', 'C', 'D'];
        q.options.forEach((opt, index) => {
            const div = document.createElement('div');
            div.className = 'option';
            div.innerText = `${labels[index]}. ${opt}`;
            div.onclick = () => selectOption(index);
            optionsBox.appendChild(div);
        });

        startTimerLogic(); 
    }
}

function startTimerLogic() {
    clearInterval(timerInterval);
    
    if (currentIdx < 3) timeLeft = 30;      
    else if (currentIdx < 7) timeLeft = 20; 
    else timeLeft = 10;                     

    const timerDisplay = document.getElementById('time-left');
    const progressBar = document.getElementById('progress-bar');
    const initialTime = timeLeft; 
    
    timerDisplay.classList.remove('low-time');
    progressBar.style.backgroundColor = "var(--primary)";

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        
        let widthPercentage = (timeLeft / initialTime) * 100;
        progressBar.style.width = widthPercentage + "%";

        if (timeLeft <= 5) {
            timerDisplay.classList.add('low-time');
            progressBar.style.backgroundColor = "var(--danger)";
        }

       if (timeLeft <= 0) {
            clearInterval(timerInterval);
            lives--;
            updateLivesDisplay();
            playSound('audio-wrong');

            if (lives <= 0) {
                document.getElementById('last-score').innerText = score;
                document.getElementById('game-over-modal').classList.remove('hidden');
            } else {
                nextQuestion();
            }
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            lives--;
            updateLivesDisplay();
            
            if (lives <= 0) {
                playSound('audio-gameover'); // Tambahkan ini
                document.getElementById('last-score').innerText = score;
                document.getElementById('game-over-modal').classList.remove('hidden');
            } else {
                playSound('audio-wrong');
                nextQuestion();
            }
        }
    }, 1000);
}

function selectOption(idx) {
    clearInterval(timerInterval);
    const q = selectedQuestions[currentIdx];
    const options = document.querySelectorAll('.option');
    
    // Matikan semua pilihan agar tidak bisa diklik lagi
    options.forEach(opt => opt.classList.add('disabled'));

    if (idx === q.correct) {
        options[idx].classList.add('correct-flash'); 
        score += 10;
        playSound('audio-correct');
   } else {
    options[idx].classList.add('wrong-flash');   
    options[q.correct].classList.add('correct-flash'); 
    
    lives--; 
    updateLivesDisplay();
    
    if (lives <= 0) {
        playSound('audio-gameover'); // Tambahkan ini
        setTimeout(() => {
            document.getElementById('last-score').innerText = score;
            document.getElementById('game-over-modal').classList.remove('hidden');
        }, 800);
        return; 
    } else {
        playSound('audio-wrong');
    }
}
    
    // Munculkan tombol lanjutkan hanya jika nyawa masih ada
    const btn = document.getElementById('next-btn');
    btn.classList.remove('hidden');
    
    if (currentIdx === 9) {
        btn.innerText = "Lihat Hasil";
        btn.onclick = finishQuiz;
    } else {
        btn.innerText = "Lanjutkan";
        btn.onclick = nextQuestion;
    }
}

function nextQuestion() {
    currentIdx++;
    if (currentIdx < 10) {
        loadQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    if (isFinished) return; 
    isFinished = true;
    clearInterval(timerInterval); //
    
    // 1. Putar suara segera setelah kuis selesai
    playSound('audio-finish'); //
    
    // 2. Berikan sedikit delay 100ms sebelum pindah halaman agar audio terpicu
    setTimeout(() => {
        const totalTimeUsed = Math.floor((Date.now() - startTime) / 1000); //
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); //
        showPage('page-result'); //
        document.getElementById('result-greeting').innerText = `Selamat ${username}!`; //
        document.getElementById('final-score').innerText = score; //
        saveToLeaderboard(totalTimeUsed); //
    }, 100);
}

function saveToLeaderboard(totalTime) {
    const newEntry = { 
        name: username, 
        group: groupName, 
        score: score, 
        time: totalTime,
        category: currentCategory,
        timestamp: Date.now() 
    };
    database.ref('leaderboard').push(newEntry);
}

function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.pause(); // Hentikan suara yang sedang berjalan (jika ada)
        sound.currentTime = 0; // Kembalikan ke detik ke-0
        
        // Gunakan Promise untuk memastikan suara benar-benar bisa diputar
        const playPromise = sound.play();
        
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Suara berhasil diputar
            }).catch(error => {
                console.log("Pemutaran suara dicegah oleh browser. User harus berinteraksi dulu.");
            });
        }
    }
}

function showLeaderboard() {
    showPage('page-leaderboard');
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="5">Memuat peringkat...</td></tr>';

    database.ref('leaderboard').orderByChild('score').limitToLast(100).once('value', (snapshot) => {
        let data = [];
        snapshot.forEach((child) => {
            const val = child.val();
            if (val.category === currentCategory) {
                data.push(val);
            }
        });

        data.sort((a, b) => b.score - a.score || a.time - b.time);

        tbody.innerHTML = data.map((item, index) => {
            let rankClass = index < 10 ? `rank-${index + 1}` : "rank-other";
            
            // GANTI EMOJI DENGAN ICON FONT AWESOME
            let medal = "";
            if (index === 0) medal = '<i class="fas fa-medal" style="color: #fceb8c;"></i> '; // Gold
            else if (index === 1) medal = '<i class="fas fa-medal" style="color: #706f6f;"></i> '; // Silver
            else if (index === 2) medal = '<i class="fas fa-medal" style="color: #8b4600;"></i> '; // Bronze
            
            return `
                <tr class="${rankClass}">
                    <td>${medal}${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.group}</td> 
                    <td>${item.score}</td>
                    <td>${item.time}s</td>
                </tr>
            `;
        }).join('');
    });
}

function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.pause();
        sound.currentTime = 0;
        
        // Memaksa pemutaran suara
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Browser memblokir audio: " + error);
            });
        }
    }
}