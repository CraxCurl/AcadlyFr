import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
    ref,
    push,
    set,
    update,
    onValue,
    off,
    serverTimestamp,
    get,
    child,
    remove
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// DOM Elements
const teacherEmailEl = document.getElementById('teacher-email');
const logoutBtn = document.getElementById('logout-btn');
const startBtn = document.getElementById('start-btn');
const endBtn = document.getElementById('end-btn');
const qrcodeContainer = document.getElementById('qrcode');
const qrcodeWrapper = document.getElementById('qrcode-wrapper');
const timerDisplay = document.getElementById('timer-display');
const studentCountEl = document.getElementById('student-count');
const presentListEl = document.getElementById('present-list');
const addManualBtn = document.getElementById('add-manual-btn');
const manualEntryForm = document.getElementById('manual-entry-form');
const manualStudentIdInput = document.getElementById('manual-student-id');
const submitManualBtn = document.getElementById('submit-manual-btn');
const publishBtn = document.getElementById('publish-btn');
const sessionSlotInput = document.getElementById('session-slot');
const classListOptions = document.getElementById('class-list-options');
const themeToggle = document.getElementById('theme-toggle');
const themeStatusText = document.getElementById('theme-status-text');
const themeSubText = document.getElementById('theme-sub-text');

// Tab Navigation Elements
const navBtns = document.querySelectorAll('.nav-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Announcement Elements
const announcementSlotSelect = document.getElementById('announcement-slot-select');
const announcementTitle = document.getElementById('announcement-title');
const announcementBody = document.getElementById('announcement-body');
const announcementFile = document.getElementById('announcement-file');
const sendAnnouncementBtn = document.getElementById('send-announcement-btn');
const announcementsList = document.getElementById('announcements-list');

// History Elements
const historyListEl = document.getElementById('history-list');

// Student Registry Elements
const regSlotNameInput = document.getElementById('reg-slot-name');
const regStudentIdInput = document.getElementById('reg-student-id');
const regStudentNameInput = document.getElementById('reg-student-name');
const registerStudentBtn = document.getElementById('register-student-btn');
const registeredClassesContainer = document.getElementById('registered-classes-container');
const excelUploadInput = document.getElementById('excel-upload');

// Leaderboard Elements
const leaderboardCoursesGrid = document.getElementById('leaderboard-courses-grid');
const leaderboardMainView = document.getElementById('leaderboard-main-view');
const leaderboardRankingsView = document.getElementById('leaderboard-rankings-view');
const leaderboardListContainer = document.getElementById('leaderboard-list-container');
const selectedCourseTitle = document.getElementById('selected-course-title');
const backToCoursesBtn = document.getElementById('back-to-courses-btn');

// Settings Elements
const settingsEmail = document.getElementById('settings-email');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const updatePasswordBtn = document.getElementById('update-password-btn');
const settingsClassesList = document.getElementById('settings-classes-list');
const successPopup = document.getElementById('success-popup');

// Modal Elements
const studentModal = document.getElementById('student-modal');
const modalStudentName = document.getElementById('modal-student-name');
const modalStudentId = document.getElementById('modal-student-id');
const modalAttendanceList = document.getElementById('modal-attendance-list');
const closeModalBtn = document.getElementById('close-modal-btn');

// Doubts Modal Elements
const doubtsModal = document.getElementById('doubts-modal');
const doubtsList = document.getElementById('doubts-list');
const doubtCounterBtn = document.getElementById('doubt-counter-btn');
const doubtCountBadge = document.getElementById('doubt-count-badge');
const closeDoubtsModalBtn = document.getElementById('close-doubts-modal-btn');
const doubtsListView = document.getElementById('doubts-list-view');
const doubtDetailView = document.getElementById('doubt-detail-view');
const backToDoubtsListBtn = document.getElementById('back-to-doubts-list-btn');
const doubtStudentName = document.getElementById('doubt-student-name');
const doubtSlotName = document.getElementById('doubt-slot-name');
const doubtStudentId = document.getElementById('doubt-student-id');
const doubtText = document.getElementById('doubt-text');
const doubtTimestamp = document.getElementById('doubt-timestamp');
const doubtAttachmentContainer = document.getElementById('doubt-attachment-container');
const doubtAttachmentImg = document.getElementById('doubt-attachment-img');
const doubtSolutionInput = document.getElementById('doubt-solution-input');
const publishSolutionBtn = document.getElementById('publish-solution-btn');

// Lightbox Elements
const imageLightbox = document.getElementById('image-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeLightboxBtn = document.getElementById('close-lightbox-btn');

// About Modal Elements
const aboutBtn = document.getElementById('about-btn');
const aboutModal = document.getElementById('about-modal');
const closeAboutBtn = document.getElementById('close-about-btn');

let currentSessionId = null;
let sessionActive = false;
let qrInterval = null;
let timerInterval = null;
let qrcodeInstance = null;
let currentDoubtId = null;
let currentDoubtStudentId = null;

// --- THEME LOGIC ---
function updateThemeUI(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
        themeStatusText.textContent = 'Light Mode';
        themeSubText.textContent = 'Enable light mode for better visibility in bright environments.';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
        themeStatusText.textContent = 'Dark Mode';
        themeSubText.textContent = 'Enable dark mode for better eye comfort in dim environments.';
    }
}

const currentTheme = localStorage.getItem('theme') || 'light';
updateThemeUI(currentTheme);

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
});

// --- POPUP LOGIC ---
function showPopup(message) {
    successPopup.textContent = message;
    successPopup.style.display = 'block';
    setTimeout(() => {
        successPopup.style.display = 'none';
    }, 3000);
}

// Auth Protection
onAuthStateChanged(auth, (user) => {
    if (user) {
        teacherEmailEl.textContent = user.email;
        settingsEmail.value = user.email;
        loadAnnouncements();
        loadAttendanceHistory();
        loadRegisteredClasses();
        loadDoubts();
    } else {
        window.location.href = 'login.html';
    }
});

// Tab Navigation Logic
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        navBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');

        if (tabId === 'leaderboard-tab') {
            leaderboardMainView.style.display = 'block';
            leaderboardRankingsView.style.display = 'none';
        }
    });
});

// Utility: Convert File to Base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- LIGHTBOX LOGIC ---
function openLightbox(src) {
    lightboxImg.src = src;
    imageLightbox.classList.add('active');
}

function closeLightbox() {
    imageLightbox.classList.remove('active');
}

if (imageLightbox) {
    imageLightbox.onclick = (e) => {
        if (e.target !== lightboxImg) closeLightbox();
    };
}
if (closeLightboxBtn) closeLightboxBtn.onclick = closeLightbox;

// --- DOUBTS LOGIC ---

function loadDoubts() {
    const user = auth.currentUser;
    onValue(ref(db, 'doubts'), (snapshot) => {
        doubtsList.innerHTML = '';
        const data = snapshot.val();
        if (!data) {
            doubtCountBadge.style.display = 'none';
            doubtsList.innerHTML = '<li style="text-align: center; color: var(--text-body); padding: 20px;">No doubts reported yet.</li>';
            return;
        }

        const allDoubts = Object.entries(data)
            .filter(([_, d]) => d.teacherId === user.uid)
            .reverse();

        const unresolvedCount = allDoubts.filter(([_, d]) => !d.resolved).length;
        if (unresolvedCount > 0) {
            doubtCountBadge.textContent = unresolvedCount;
            doubtCountBadge.style.display = 'block';
        } else {
            doubtCountBadge.style.display = 'none';
        }

        if (allDoubts.length === 0) {
            doubtsList.innerHTML = '<li style="text-align: center; color: var(--text-body); padding: 20px;">No doubts found.</li>';
            return;
        }

        allDoubts.forEach(([id, doubt]) => {
            const li = document.createElement('li');
            li.className = 'flagged-item';
            li.style.cursor = 'pointer';

            const statusTag = doubt.resolved
                ? '<span class="status-tag present">Resolved</span>'
                : '<span class="status-tag manual">Unresolved</span>';

            li.innerHTML = `
                <div class="flagged-info">
                    <span class="flagged-id" style="color: var(--primary);">${doubt.studentName} (${doubt.slotName || 'No Slot'})</span>
                    <div class="flagged-time" style="color: var(--text-heading); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px;">
                        ${doubt.text}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${doubt.fileUrl ? '<span style="font-size: 1.2rem;">🖼️</span>' : ''}
                    ${statusTag}
                </div>
            `;
            li.onclick = () => showDoubtDetail(id, doubt);
            doubtsList.appendChild(li);
        });
    });
}

function showDoubtDetail(id, doubt) {
    currentDoubtId = id;
    currentDoubtStudentId = doubt.studentId;
    doubtsListView.style.display = 'none';
    doubtDetailView.style.display = 'block';

    doubtStudentName.textContent = doubt.studentName;
    doubtSlotName.textContent = doubt.slotName || 'General';
    doubtStudentId.textContent = `Reg: ${doubt.studentId}`;
    doubtText.textContent = doubt.text;
    doubtTimestamp.textContent = new Date(doubt.timestamp).toLocaleString();

    if (doubt.fileUrl) {
        doubtAttachmentImg.src = doubt.fileUrl;
        doubtAttachmentContainer.style.display = 'block';
        doubtAttachmentImg.onclick = () => openLightbox(doubt.fileUrl);
    } else {
        doubtAttachmentContainer.style.display = 'none';
    }

    if (doubt.resolved) {
        doubtSolutionInput.value = doubt.solution || '';
        doubtSolutionInput.disabled = true;
        publishSolutionBtn.style.display = 'none';
    } else {
        doubtSolutionInput.value = '';
        doubtSolutionInput.disabled = false;
        publishSolutionBtn.style.display = 'block';
    }
}

backToDoubtsListBtn.onclick = () => {
    doubtsListView.style.display = 'block';
    doubtDetailView.style.display = 'none';
};

publishSolutionBtn.onclick = async () => {
    const solution = doubtSolutionInput.value.trim();
    if (!solution) return alert("Please type a solution.");

    try {
        await update(ref(db, `doubts/${currentDoubtId}`), {
            solution: solution,
            resolved: true,
            resolvedAt: serverTimestamp()
        });

        await push(ref(db, 'announcements'), {
            slot: "Personal",
            title: "Doubt Resolved",
            body: `Solution to your query: "${doubtText.textContent.substring(0, 30)}..." \n\nResponse: ${solution}`,
            timestamp: serverTimestamp(),
            teacherEmail: auth.currentUser.email,
            teacherId: auth.currentUser.uid,
            allowedStudents: [currentDoubtStudentId],
            isPrivate: true,
            doubtResolution: true
        });

        showPopup("Query resolved and published privately!");
        doubtsListView.style.display = 'block';
        doubtDetailView.style.display = 'none';
    } catch (e) {
        console.error(e);
        alert("Error resolving doubt.");
    }
};

doubtCounterBtn.onclick = () => {
    doubtsModal.style.display = 'block';
    doubtsListView.style.display = 'block';
    doubtDetailView.style.display = 'none';
};

closeDoubtsModalBtn.onclick = () => {
    doubtsModal.style.display = 'none';
};

// --- ATTENDANCE LOGIC ---

startBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;
    const slotValue = sessionSlotInput.value.trim();
    if (!slotValue) {
        alert("Please select a class/slot before starting the session.");
        sessionSlotInput.focus();
        return;
    }

    try {
        const registryRef = ref(db, `teachers/${user.uid}/classes/${slotValue}/students`);
        const registrySnap = await get(registryRef);
        const allowedStudents = registrySnap.val() ? Object.keys(registrySnap.val()) : [];

        if (allowedStudents.length === 0) {
            if (!confirm("No students are registered for this slot. Anyone will be able to mark attendance. Continue?")) {
                return;
            }
        }

        const sessionsRef = ref(db, 'sessions');
        const newSessionRef = push(sessionsRef);
        currentSessionId = newSessionRef.key;

        await set(newSessionRef, {
            teacherId: user.uid,
            teacherEmail: user.email,
            slot: slotValue,
            startTime: Date.now(),
            isActive: true,
            published: false,
            allowedStudents: allowedStudents
        });

        sessionActive = true;
        startBtn.disabled = true;
        endBtn.disabled = false;
        sessionSlotInput.disabled = true;
        qrcodeWrapper.style.display = 'block';
        qrcodeContainer.innerHTML = '';
        presentListEl.innerHTML = '';
        studentCountEl.textContent = '0';
        qrcodeInstance = new QRCode(qrcodeContainer, {
            text: "Initializing...",
            width: 256,
            height: 256,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
        startTimer(300);
        startQRRotation();
        listenToAttendance();
    } catch (error) { console.error(error); }
});

endBtn.addEventListener('click', () => endSession());

async function endSession() {
    if (!currentSessionId) return;
    sessionActive = false;
    clearInterval(qrInterval);
    clearInterval(timerInterval);
    off(ref(db, `sessions/${currentSessionId}/attendance`));
    try {
        await update(ref(db, `sessions/${currentSessionId}`), { isActive: false });
        await update(ref(db, `attendanceTokens/${currentSessionId}`), { active: false });
        startBtn.disabled = false;
        endBtn.disabled = true;
        sessionSlotInput.disabled = false;
        sessionSlotInput.value = '';
        qrcodeWrapper.style.display = 'none';
        window.location.reload();
    } catch (error) { console.error(error); }
}

function startTimer(duration) {
    let timer = duration;
    timerInterval = setInterval(() => {
        const min = Math.floor(timer / 60);
        const sec = timer % 60;
        timerDisplay.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        if (--timer < 0) endSession();
    }, 1000);
}

function startQRRotation() {
    const gen = () => {
        if (!sessionActive || !qrcodeInstance) return;
        qrcodeInstance.makeCode(JSON.stringify({ s: currentSessionId, t: Date.now() }));
        update(ref(db, `attendanceTokens/${currentSessionId}`), { token: Date.now(), active: true });
    };
    gen();
    qrInterval = setInterval(gen, 5000);
}

function listenToAttendance() {
    onValue(ref(db, `sessions/${currentSessionId}/attendance`), (snapshot) => {
        const data = snapshot.val();
        presentListEl.innerHTML = '';
        if (!data) { studentCountEl.textContent = '0'; return; }
        const students = Object.entries(data);
        studentCountEl.textContent = students.length;
        students.forEach(([id, info]) => renderStudentItem(id, info));
    });
}

function renderStudentItem(id, info) {
    const li = document.createElement('li');
    li.className = 'flagged-item';
    const tag = info.manual ? '<span class="status-tag manual">Manual</span>' : '<span class="status-tag present">Present</span>';
    li.innerHTML = `
        <div class="flagged-info">
            <span class="flagged-id">${id}</span>
            <div class="flagged-time">${new Date(info.timestamp).toLocaleTimeString()}</div>
        </div>
        ${tag}
    `;
    presentListEl.appendChild(li);
}

publishBtn.addEventListener('click', async () => {
    if (!currentSessionId) return;
    try {
        await update(ref(db, `sessions/${currentSessionId}`), { published: true });
        showPopup("Attendance list has been published!");
    } catch (e) { alert("Error publishing list."); }
});

addManualBtn.addEventListener('click', () => {
    manualEntryForm.style.display = manualEntryForm.style.display === 'none' ? 'block' : 'none';
});

submitManualBtn.addEventListener('click', async () => {
    const id = manualStudentIdInput.value.trim();
    if (!id || !currentSessionId) return;
    await set(ref(db, `sessions/${currentSessionId}/attendance/${id}`), {
        timestamp: Date.now(),
        manual: true
    });
    manualStudentIdInput.value = '';
    manualEntryForm.style.display = 'none';
    showPopup(`Register Number ${id} added!`);
});

// --- STUDENT REGISTRY LOGIC ---

registerStudentBtn.addEventListener('click', async () => {
    const slotName = regSlotNameInput.value.trim();
    const studentId = regStudentIdInput.value.trim();
    const studentName = regStudentNameInput.value.trim();
    if (!slotName || !studentId || !studentName) return alert("Please fill Slot Name, Student ID, and Name");
    try {
        await set(ref(db, `teachers/${auth.currentUser.uid}/classes/${slotName}/students/${studentId}`), {
            name: studentName,
            addedAt: serverTimestamp()
        });
        regStudentIdInput.value = '';
        regStudentNameInput.value = '';
        showPopup(`Student added to ${slotName}`);
    } catch (e) { console.error(e); }
});

function loadRegisteredClasses() {
    const teacherId = auth.currentUser.uid;
    const classesRef = ref(db, `teachers/${teacherId}/classes`);
    const allSessionsRef = ref(db, 'sessions');

    onValue(classesRef, (classSnap) => {
        const classesData = classSnap.val() || {};

        get(allSessionsRef).then((sessionSnap) => {
            const sessionsData = sessionSnap.val() || {};
            const allSessions = Object.values(sessionsData).filter(s => s.teacherId === teacherId);

            registeredClassesContainer.innerHTML = '';
            classListOptions.innerHTML = '';
            settingsClassesList.innerHTML = '';
            leaderboardCoursesGrid.innerHTML = '';

            if (announcementSlotSelect) {
                announcementSlotSelect.innerHTML = '<option value="All Classes">Broadcast to All My Classes</option>';
            }

            Object.entries(classesData).forEach(([slotName, classInfo]) => {
                const option = document.createElement('option');
                option.value = slotName;
                classListOptions.appendChild(option);

                if (announcementSlotSelect) {
                    const annOption = document.createElement('option');
                    annOption.value = slotName;
                    annOption.textContent = slotName;
                    announcementSlotSelect.appendChild(annOption);
                }

                const courseCard = document.createElement('div');
                courseCard.className = 'history-card';
                courseCard.style.cursor = 'pointer';
                courseCard.innerHTML = `
                    <div class="flagged-info">
                        <span class="flagged-id" style="font-size: 1.2rem;">${slotName}</span>
                        <div class="flagged-time">${Object.keys(classInfo.students || {}).length} Registered Students</div>
                    </div>
                    <span class="status-tag present">View Rankings →</span>
                `;
                courseCard.onclick = () => showLeaderboardForCourse(slotName, classInfo.students || {}, allSessions);
                leaderboardCoursesGrid.appendChild(courseCard);

                const classTag = document.createElement('div');
                classTag.className = 'status-tag present';
                classTag.style.textAlign = 'center';
                classTag.style.padding = '12px';
                classTag.textContent = slotName;
                settingsClassesList.appendChild(classTag);

                const students = classInfo.students ? Object.entries(classInfo.students) : [];
                const classSessions = allSessions.filter(s => s.slot === slotName);
                const totalSessionsCount = classSessions.length;

                const classDiv = document.createElement('div');
                classDiv.className = 'panel';
                classDiv.style.marginBottom = '1.5rem';
                classDiv.style.padding = '1.5rem';

                classDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <h4 style="margin: 0; color: var(--primary);">${slotName}</h4>
                            <button class="btn btn-danger" style="width: auto; padding: 4px 10px; font-size: 0.7rem;" onclick="removeCourseFromRegistry('${slotName}')">Remove Course</button>
                        </div>
                        <span class="status-tag present">${students.length} Students</span>
                    </div>
                    <ul class="flagged-list" style="margin-top: 10px;">
                        ${students.map(([id, info]) => {
                            let presentIn = 0;
                            classSessions.forEach(sess => {
                                if (sess.attendance && sess.attendance[id]) presentIn++;
                            });

                            const percentage = totalSessionsCount > 0 ? Math.round((presentIn / totalSessionsCount) * 100) : 0;
                            let color = percentage < 75 ? "#F45252" : (percentage > 85 ? "#2ED480" : "#FF9F2D");

                            return `
                                <li class="flagged-item" style="padding: 10px 15px; cursor: pointer;" onclick="showStudentModal('${slotName}', '${id}', '${info.name}')">
                                    <div class="flagged-info">
                                        <span class="flagged-id" style="font-size: 0.9rem;">${id} - ${info.name}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 15px;">
                                        <strong style="color: ${color}; font-size: 0.9rem;">${percentage}%</strong>
                                        <button class="btn btn-danger" style="width: auto; padding: 4px 10px; font-size: 0.7rem;" onclick="event.stopPropagation(); removeStudentFromClass('${slotName}', '${id}')">Remove</button>
                                    </div>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                `;
                registeredClassesContainer.appendChild(classDiv);
            });
        });
    });
}

window.removeCourseFromRegistry = (slotName) => {
    if (confirm(`Are you sure you want to remove the entire course "${slotName}" and all its registered students? This will not delete attendance history.`)) {
        remove(ref(db, `teachers/${auth.currentUser.uid}/classes/${slotName}`));
        showPopup(`Course ${slotName} removed.`);
    }
};

// --- EXCEL UPLOAD LOGIC ---
if (excelUploadInput) {
    excelUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) return alert("Excel file is empty.");

                const teacherId = auth.currentUser.uid;
                let count = 0;

                for (const row of jsonData) {
                    const slotName = row["Class / Slot Name"] || row["Slot"] || row["Class"];
                    const studentId = String(row["Register Number"] || row["ID"] || row["RegNo"]);
                    const studentName = row["Full Name"] || row["Name"];

                    if (slotName && studentId && studentName) {
                        await set(ref(db, `teachers/${teacherId}/classes/${slotName}/students/${studentId}`), {
                            name: studentName,
                            addedAt: serverTimestamp()
                        });
                        count++;
                    }
                }

                showPopup(`Successfully uploaded ${count} students!`);
                excelUploadInput.value = '';
            } catch (error) {
                console.error("Excel Upload Error:", error);
                alert("Failed to process Excel file. Check format.");
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// --- LEADERBOARD LOGIC ---
function showLeaderboardForCourse(slotName, students, allSessions) {
    leaderboardMainView.style.display = 'none';
    leaderboardRankingsView.style.display = 'block';
    selectedCourseTitle.textContent = slotName;

    const classSessions = allSessions.filter(s => s.slot === slotName);
    const totalSessions = classSessions.length;

    const rankings = Object.entries(students).map(([id, info]) => {
        let presentIn = 0;
        classSessions.forEach(sess => {
            if (sess.attendance && sess.attendance[id]) presentIn++;
        });
        const percentage = totalSessions > 0 ? Math.round((presentIn / totalSessions) * 100) : 0;
        return { id, name: info.name, percentage };
    }).sort((a, b) => b.percentage - a.percentage);

    leaderboardListContainer.innerHTML = rankings.map((student, index) => {
        let color = student.percentage < 75 ? "#F45252" : (student.percentage > 85 ? "#2ED480" : "#FF9F2D");
        const medal = index === 0 ? "🥇" : (index === 1 ? "🥈" : (index === 2 ? "🥉" : `#${index + 1}`));

        return `
            <div class="flagged-item" style="margin-bottom: 10px; padding: 15px 25px;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <span style="font-weight: 800; font-size: 1.1rem; color: var(--primary); width: 30px;">${medal}</span>
                    <div class="flagged-info">
                        <span class="flagged-id">${student.name}</span>
                        <div class="flagged-time">Register No: ${student.id}</div>
                    </div>
                </div>
                <strong style="color: ${color}; font-size: 1.1rem;">${student.percentage}%</strong>
            </div>
        `;
    }).join('');
}

backToCoursesBtn.onclick = () => {
    leaderboardMainView.style.display = 'block';
    leaderboardRankingsView.style.display = 'none';
};

// --- MODAL LOGIC ---
window.showStudentModal = async (slotName, studentId, studentName) => {
    modalStudentName.textContent = studentName;
    modalStudentId.textContent = `Register No: ${studentId}`;
    modalAttendanceList.innerHTML = '<li style="text-align: center; color: var(--text-body);">Loading history...</li>';
    studentModal.style.display = 'block';

    const teacherId = auth.currentUser.uid;
    const sessionSnap = await get(ref(db, 'sessions'));
    const sessions = sessionSnap.val() || {};

    const classSessions = Object.values(sessions)
        .filter(s => s.teacherId === teacherId && s.slot === slotName)
        .sort((a, b) => b.startTime - a.startTime);

    modalAttendanceList.innerHTML = '';
    classSessions.forEach(sess => {
        const date = new Date(sess.startTime).toLocaleDateString();
        const isPresent = (sess.attendance && sess.attendance[studentId]);
        const li = document.createElement('li');
        li.className = 'flagged-item';
        li.innerHTML = `
            <div class="flagged-info"><span class="flagged-id">${date}</span></div>
            <span class="status-tag ${isPresent ? 'present' : 'flagged'}" style="background: ${isPresent ? '#E9FBF3' : '#FFF0F0'}; color: ${isPresent ? 'var(--success)' : 'var(--danger)'};">
                ${isPresent ? "PRESENT" : "ABSENT"}
            </span>
        `;
        modalAttendanceList.appendChild(li);
    });

    if (classSessions.length === 0) modalAttendanceList.innerHTML = '<li style="text-align: center;">No history.</li>';
};

closeModalBtn.addEventListener('click', () => studentModal.style.display = 'none');

// --- ANNOUNCEMENT LOGIC ---

sendAnnouncementBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert("Not logged in");

    const slot = announcementSlotSelect.value;
    const title = announcementTitle.value.trim();
    const body = announcementBody.value.trim();
    const file = announcementFile.files[0];

    if (!title || !body) return alert("Please fill Title and Message");

    sendAnnouncementBtn.disabled = true;
    sendAnnouncementBtn.textContent = "Publishing...";

    try {
        let fileUrl = null;
        let fileName = null;

        if (file) {
            if (file.size > 1024 * 1024) {
                alert("File too large. Please upload an image smaller than 1MB.");
                sendAnnouncementBtn.disabled = false;
                sendAnnouncementBtn.textContent = "Publish Announcement";
                return;
            }
            fileUrl = await fileToBase64(file);
            fileName = file.name;
        }

        let allowedStudents = [];
        if (slot !== "All Classes") {
            const registrySnap = await get(ref(db, `teachers/${user.uid}/classes/${slot}/students`));
            if (registrySnap.exists()) {
                allowedStudents = Object.keys(registrySnap.val());
            }
        }

        await push(ref(db, 'announcements'), {
            slot, title, body, fileUrl, fileName,
            allowedStudents,
            timestamp: serverTimestamp(),
            teacherEmail: user.email,
            teacherId: user.uid
        });

        announcementTitle.value = '';
        announcementBody.value = '';
        announcementFile.value = '';
        showPopup("Announcement published!");
    } catch (e) {
        console.error("Database Error:", e);
        alert("Error: " + e.message);
    } finally {
        sendAnnouncementBtn.disabled = false;
        sendAnnouncementBtn.textContent = "Publish Announcement";
    }
});

function loadAnnouncements() {
    onValue(ref(db, 'announcements'), (snapshot) => {
        announcementsList.innerHTML = '';
        const data = snapshot.val();
        if (!data) return;
        Object.entries(data).reverse().forEach(([id, ann]) => {
            if (ann.doubtResolution === true) return;

            const li = document.createElement('li');
            li.className = 'flagged-item';
            li.style.flexDirection = 'column';
            li.style.alignItems = 'flex-start';
            li.style.padding = '20px';

            const fileHtml = ann.fileUrl ? `
                <div style="margin-top: 10px; background: var(--bg-main); padding: 10px; border-radius: 8px; border: 1px solid var(--border-light); width: 100%;">
                    ${ann.fileUrl.startsWith('data:image')
                        ? `<img src="${ann.fileUrl}" style="max-width: 100%; border-radius: 4px; margin-bottom: 5px; cursor: pointer;" onclick="openLightbox('${ann.fileUrl}')">`
                        : `<a href="${ann.fileUrl}" target="_blank" style="text-decoration: none; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                            <span>📄</span><span style="font-size: 0.85rem; font-weight: 600;">${ann.fileName || 'View Attachment'}</span>
                           </a>`
                    }
                </div>` : '';

            li.innerHTML = `
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                        <span class="status-tag present" style="font-size: 0.7rem; margin-bottom: 5px; display: inline-block;">${ann.slot || 'All Classes'}</span>
                        <h4 style="color: var(--primary); margin: 0; font-size: 1.1rem;">${ann.title}</h4>
                    </div>
                    <button class="btn btn-danger delete-ann-btn" style="width: auto; padding: 6px 12px; font-size: 0.75rem;" data-id="${id}">Delete</button>
                </div>
                <p style="font-size: 0.95rem; margin: 10px 0; color: var(--text-heading); white-space: pre-wrap;">${ann.body}</p>
                ${fileHtml}
                <div style="margin-top: 15px; display: flex; justify-content: space-between; width: 100%;">
                    <small style="color: var(--text-muted); font-size: 0.8rem;">By ${ann.teacherEmail}</small>
                    <small style="color: var(--text-muted); font-size: 0.8rem;">${new Date(ann.timestamp).toLocaleString()}</small>
                </div>`;
            li.querySelector('.delete-ann-btn').addEventListener('click', () => deleteAnnouncement(id));
            announcementsList.appendChild(li);
        });
    });
}

async function deleteAnnouncement(id) {
    if (confirm("Delete this announcement?")) {
        try {
            await remove(ref(db, `announcements/${id}`));
            showPopup("Deleted.");
        } catch (e) { console.error(e); }
    }
}

// --- CLASS HISTORY LOGIC ---

function loadAttendanceHistory() {
    const sessionsRef = ref(db, 'sessions');
    onValue(sessionsRef, (snapshot) => {
        historyListEl.innerHTML = '';
        const data = snapshot.val();
        if (!data) return;
        const sessions = Object.entries(data)
            .filter(([_, session]) => session.teacherId === auth.currentUser.uid)
            .reverse();

        sessions.forEach(([id, session]) => {
            const dateStr = new Date(session.startTime).toLocaleDateString();
            const timeStr = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const count = session.attendance ? Object.keys(session.attendance).length : 0;

            const div = document.createElement('div');
            div.className = 'flagged-item history-card';
            div.innerHTML = `
                <div class="flagged-info" onclick="viewHistoryDetails('${id}', '${session.slot || ''}')" style="cursor: pointer; flex: 1;">
                    <span class="flagged-id" style="font-size: 1.1rem; display: block; margin-bottom: 4px;">${dateStr} (${session.slot || 'Regular'})</span>
                    <div class="flagged-time">Started at ${timeStr}</div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                    <button class="btn btn-danger delete-history-btn" style="width: auto; padding: 8px 18px; font-size: 0.75rem;" data-id="${id}">Delete</button>
                    <span class="status-tag present" onclick="viewHistoryDetails('${id}', '${session.slot || ''}')" style="cursor: pointer;">${count} Present</span>
                </div>`;
            div.querySelector('.delete-history-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteHistoryRecord(id); });
            historyListEl.appendChild(div);
        });
    });
}

window.viewHistoryDetails = (id, slot) => {
    localStorage.setItem('viewSessionId', id);
    localStorage.setItem('viewSlotName', slot);
    window.open('session-detail.html', '_blank');
};

async function deleteHistoryRecord(id) {
    if (confirm("Delete record?")) {
        try {
            await remove(ref(db, `sessions/${id}`));
            await remove(ref(db, `attendanceTokens/${id}`));
            showPopup("Deleted.");
        } catch (e) { console.error(e); }
    }
}

// --- SETTINGS LOGIC ---

if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        if (!currentPassword || !newPassword) return alert("Fill fields.");
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            currentPasswordInput.value = ''; newPasswordInput.value = '';
            showPopup("Password updated!");
        } catch (error) { alert("Failed: " + error.message); }
    });
}

logoutBtn.addEventListener('click', () => signOut(auth));
