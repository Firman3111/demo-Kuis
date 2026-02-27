// 1. Inisialisasi Firebase
const firebaseConfig = {
  databaseURL: "https://fir-kuis-23368-default-rtdb.asia-southeast1.firebasedatabase.app"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 2. Data Soal (Kategori)
const quizData = {
    sejarah: [
        { q: "Siapa Presiden pertama Indonesia?", options: ["Hatta", "Soekarno", "Soeharto", "Habibie"], correct: 1 },
        { q: "Tahun berapa Indonesia merdeka?", options: ["1945", "1944", "1946", "1947"], correct: 0 },
        { q: "Sumpah Pemuda terjadi pada tahun...", options: ["1908", "1928", "1945", "1998"], correct: 1 },
        { q: "Candi tertua di Jawa Tengah adalah...", options: ["Prambanan", "Borobudur", "Kalasan", "Mendut"], correct: 2 },
        { q: "Pahlawan dari Aceh yang melawan Belanda adalah...", options: ["Pattimura", "Diponegoro", "Cut Nyak Dien", "Kartini"], correct: 2 },
        { q: "Ibu kota RI pernah pindah ke...", options: ["Bandung", "Surabaya", "Yogyakarta", "Medan"], correct: 2 },
        { q: "BPUPKI dibentuk oleh...", options: ["Belanda", "Jepang", "Inggris", "Portugal"], correct: 1 },
        { q: "Lambang Negara Indonesia adalah...", options: ["Harimau", "Garuda", "Banteng", "Padi Kapas"], correct: 1 },
        { q: "Lagu Indonesia Raya diciptakan oleh...", options: ["Ibu Sud", "C. Simanjuntak", "WR Supratman", "Kusbini"], correct: 2 },
        { q: "Teks Proklamasi diketik oleh...", options: ["Sayuti Melik", "Sukarni", "Wikana", "Latif"], correct: 0 }
    ],
    sains: [
        { q: "Planet terdekat dari Matahari adalah...", options: ["Mars", "Venus", "Merkurius", "Jupiter"], correct: 2 },
        { q: "Zat hijau daun disebut juga...", options: ["Klorofil", "Stomata", "Fotosintesis", "Kambium"], correct: 0 },
        { q: "H2O adalah rumus kimia untuk...", options: ["Udara", "Asam", "Garam", "Air"], correct: 3 },
        { q: "Penyusun terkecil makhluk hidup adalah...", options: ["Organ", "Jaringan", "Sel", "Sistem"], correct: 2 },
        { q: "Planet Merah adalah julukan untuk...", options: ["Venus", "Mars", "Saturnus", "Uranus"], correct: 1 },
        { q: "Manusia bernapas menghirup...", options: ["Nitrogen", "Karbon Dioksida", "Oksigen", "Hidrogen"], correct: 2 },
        { q: "Alat pengukur gempa disebut...", options: ["Termometer", "Barometer", "Seismograf", "Anemometer"], correct: 2 },
        { q: "Pusat tata surya kita adalah...", options: ["Bumi", "Bulan", "Matahari", "Jupiter"], correct: 2 },
        { q: "Mamalia yang bisa terbang adalah...", options: ["Ayam", "Kelelawar", "Burung Unta", "Penguin"], correct: 1 },
        { q: "Gaya yang menarik benda ke bawah adalah...", options: ["Magnet", "Gesek", "Pegas", "Gravitasi"], correct: 3 }
    ]
};

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
        loadChallengeLeaderboard(); // Ambil data dulu
        showPage('page-challenge'); // Pindah ke halaman tantangan
    }
}

function loadChallengeLeaderboard() {
    const tbody = document.getElementById('challenge-leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="3">Memuat juara...</td></tr>';

    // Mengambil 10 besar skor tertinggi secara global
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
    startTime = Date.now();
    
    const dataKategori = quizData[currentCategory] || quizData.sejarah;
    selectedQuestions = [...dataKategori].sort(() => 0.5 - Math.random()).slice(0, 10);
    
    showPage('page-quiz');
    loadQuestion();
}

function loadQuestion() {
    if (currentIdx < selectedQuestions.length) {
        const q = selectedQuestions[currentIdx];
        document.getElementById('progress').innerText = `Pertanyaan ${currentIdx + 1} dari 10`;
        document.getElementById('question-box').innerText = `${currentIdx + 1}. ${q.q}`;
        
        // Sembunyikan tombol lanjutkan sampai user menjawab
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
    
    // SISTEM LEVEL (Waktu Dinamis)
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
            nextQuestion(); 
        }
    }, 1000);
}

function selectOption(idx) {
    clearInterval(timerInterval);
    const q = selectedQuestions[currentIdx];
    const options = document.querySelectorAll('.option');
    
    options.forEach(opt => opt.classList.add('disabled'));

    // ANALISIS JAWABAN (Visual Feedback)
    if (idx === q.correct) {
        options[idx].classList.add('correct-flash'); 
        score += 10;
    } else {
        options[idx].classList.add('wrong-flash');   
        options[q.correct].classList.add('correct-flash'); 
    }
    
    const btn = document.getElementById('next-btn');
    btn.classList.remove('hidden');
    
    // Set teks dan aksi tombol secara eksplisit
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

// 6. Akhir Kuis & Database
function finishQuiz() {
    if (isFinished) return; 
    isFinished = true;

    clearInterval(timerInterval);
    const totalTimeUsed = Math.floor((Date.now() - startTime) / 1000);
    
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

    showPage('page-result');
    document.getElementById('result-greeting').innerText = `Selamat ${username}!`;
    document.getElementById('final-score').innerText = score;
    
    saveToLeaderboard(totalTimeUsed);
}

function saveToLeaderboard(totalTime) {
    const newEntry = { 
        name: username, 
        group: groupName, 
        score: score, 
        time: totalTime,
        category: currentCategory, // Mencatat apakah Sejarah atau Sains
        timestamp: Date.now() 
    };

    database.ref('leaderboard').push(newEntry);
}

function showLeaderboard() {
    showPage('page-leaderboard');
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="5">Memuat peringkat...</td></tr>';

    database.ref('leaderboard').orderByChild('score').limitToLast(100).once('value', (snapshot) => {
        let data = [];
        snapshot.forEach((child) => {
            const val = child.val();
            // Filter agar hanya menampilkan kategori yang baru saja dimainkan
            if (val.category === currentCategory) {
                data.push(val);
            }
        });

        data.sort((a, b) => b.score - a.score || a.time - b.time);

        tbody.innerHTML = data.map((item, index) => {
            let rankClass = index < 3 ? `rank-${index + 1}` : "rank-other";
            let medal = index === 0 ? "🥇 " : index === 1 ? "🥈 " : index === 2 ? "🥉 " : "";
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