// Initialize Lucide icons
lucide.createIcons();

// DOM Elements
const userIdDisplay = document.getElementById('userIdDisplay');
const addEntryBtn = document.getElementById('addEntryBtn');
const resetAllBtn = document.getElementById('resetAllBtn');
const subjectCardsContainer = document.getElementById('subjectCardsContainer');
const subjectModal = document.getElementById('subjectModal');
const overviewModal = document.getElementById('overviewModal');
const modalTitle = document.getElementById('modalTitle');
const subjectForm = document.getElementById('subjectForm');
const entryTypeSelect = document.getElementById('entryType');
const subjectNameInput = document.getElementById('subjectName');
const theoryInputsDiv = document.getElementById('theoryInputs');
const attendedClassesInput = document.getElementById('attendedClasses');
const totalClassesInput = document.getElementById('totalClasses');
const labInputsDiv = document.getElementById('labInputs');
const attendedLabsInput = document.getElementById('attendedLabs');
const totalLabsInput = document.getElementById('totalLabs');
const saveSubjectBtn = document.getElementById('saveSubjectBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const closeOverviewModalBtn = document.getElementById('closeOverviewModalBtn');
const totalAttendancePercentageDisplay = document.getElementById('totalAttendancePercentage');
const totalAttendedDisplay = document.getElementById('totalAttended');
const totalTotalDisplay = document.getElementById('totalTotal');
const totalLabAttendancePercentageDisplay = document.getElementById('totalLabAttendancePercentage');
const totalLabsAttendedDisplay = document.getElementById('totalLabsAttended');
const totalLabsTotalDisplay = document.getElementById('totalLabsTotal');

const overviewTypeLabel = document.getElementById('overviewTypeLabel');
const overviewMissableRow = document.getElementById('overviewMissableRow');
const overviewLeavesAvailableRow = document.getElementById('overviewLeavesAvailableRow');

const themeToggleBtn = document.getElementById('themeToggleBtn');

// State Variables
let subjects = [];
let editingSubjectId = null;

// Constants
const MIN_ELIGIBILITY_PERCENTAGE = 75;
const STORAGE_KEY = 'aalsiEngineerAttendanceData';
const THEME_STORAGE_KEY = 'aalsiEngineerTheme';

/**
 * Generates a unique ID for subjects.
 * @returns {string} A unique ID.
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Renders all subject cards to the DOM.
 */
function renderSubjects() {
    subjectCardsContainer.innerHTML = '';
    let totalAttendedTheory = 0;
    let totalTotalTheory = 0;
    let totalAttendedLabs = 0;
    let totalTotalLabs = 0;

    if (subjects.length === 0) {
        subjectCardsContainer.innerHTML = '<p class="text-center text-gray-400 mt-10">No entries yet. Time to get that bread, or just chill? 🤷‍♀️</p>';
    }

    subjects.forEach(subject => {
        let percentage, isEligible, classesCount, statusText, emoji;

        if (subject.type === 'theory') {
            percentage = subject.totalClasses > 0 ? ((subject.attendedClasses / subject.totalClasses) * 100).toFixed(2) : 0;
            isEligible = percentage >= MIN_ELIGIBILITY_PERCENTAGE;
            classesCount = `${subject.attendedClasses} / ${subject.totalClasses}`;
            // Calculate missable/needed classes for theory
            const theoryClassesMissable = Math.max(0, Math.floor(subject.attendedClasses / (MIN_ELIGIBILITY_PERCENTAGE / 100)) - subject.totalClasses);
            const theoryClassesNeeded = Math.max(0, Math.ceil(subject.totalClasses * MIN_ELIGIBILITY_PERCENTAGE / 100) - subject.attendedClasses);
            statusText = isEligible ? `Eligible! You're vibin'. Can still skip ${theoryClassesMissable} classes (low-key).` : `Bruh, not eligible. You need to pull up to ${theoryClassesNeeded} more classes. No cap!`;
            emoji = isEligible ? '😎' : '😭'; // Safe or Crying

            totalAttendedTheory += subject.attendedClasses;
            totalTotalTheory += subject.totalClasses;

        } else if (subject.type === 'lab') {
            percentage = subject.totalLabs > 0 ? ((subject.attendedLabs / subject.totalLabs) * 100).toFixed(2) : 0;
            isEligible = percentage >= MIN_ELIGIBILITY_PERCENTAGE;
            classesCount = `${subject.attendedLabs} / ${subject.totalLabs}`;
            // Calculate leaves available/needed for labs
            const labLeavesAvailable = Math.max(0, Math.floor(subject.attendedLabs / (MIN_ELIGIBILITY_PERCENTAGE / 100)) - subject.totalLabs);
            const labClassesNeeded = Math.max(0, Math.ceil(subject.totalLabs * MIN_ELIGIBILITY_PERCENTAGE / 100) - subject.attendedLabs);
            statusText = isEligible ? `Eligible! You got ${labLeavesAvailable} leaves. Go off, king/queen! 👑` : `Big yikes! Not eligible. You need to show up to ${labClassesNeeded} more labs. It's not a drill!`;
            emoji = isEligible ? '🕺' : '💀'; // Dancing or Skull

            totalAttendedLabs += subject.attendedLabs;
            totalTotalLabs += subject.totalLabs;
        }

        const cardHtml = `
            <div class="subject-card" data-id="${subject.id}" data-type="${subject.type}">
                <h3>${subject.name} (${subject.type === 'theory' ? 'Theory' : 'Lab'})</h3>
                <p class="attendance-info">${subject.type === 'theory' ? 'Theory Classes' : 'Labs'}: ${classesCount}</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%;"></div>
                </div>
                <div class="percentage-display ${!isEligible ? 'red' : ''}">
                    ${percentage}% ${emoji}
                </div>
                <p class="eligibility-status">
                    ${statusText}
                </p>
                <div class="card-buttons">
                    <button class="edit-btn" data-id="${subject.id}">
                        <span class="lucide lucide-edit"></span> Edit
                    </button>
                    <button class="delete-btn" data-id="${subject.id}">
                        <span class="lucide lucide-trash"></span> Delete
                    </button>
                    <button class="overview-btn" data-id="${subject.id}">
                        <span class="lucide lucide-eye"></span> Overview
                    </button>
                </div>
            </div>
        `;
        subjectCardsContainer.insertAdjacentHTML('beforeend', cardHtml);
    });

    updateTotalAttendanceSummary(totalAttendedTheory, totalTotalTheory, totalAttendedLabs, totalTotalLabs);
    addCardEventListeners();
}

/**
 * Updates the overall attendance summary.
 * @param {number} totalAttendedTheory - Sum of attended theory classes.
 * @param {number} totalTotalTheory - Sum of total theory classes.
 * @param {number} totalAttendedLabs - Sum of attended labs.
 * @param {number} totalTotalLabs - Sum of total labs.
 */
function updateTotalAttendanceSummary(totalAttendedTheory, totalTotalTheory, totalAttendedLabs, totalTotalLabs) {
    const overallTheoryPercentage = totalTotalTheory > 0 ? ((totalAttendedTheory / totalTotalTheory) * 100).toFixed(2) : 0;
    totalAttendancePercentageDisplay.textContent = `${overallTheoryPercentage}%`;
    totalAttendedDisplay.textContent = totalAttendedTheory;
    totalTotalDisplay.textContent = totalTotalTheory;

    if (overallTheoryPercentage < MIN_ELIGIBILITY_PERCENTAGE) {
        totalAttendancePercentageDisplay.classList.add('red');
    } else {
        totalAttendancePercentageDisplay.classList.remove('red');
    }

    const overallLabPercentage = totalTotalLabs > 0 ? ((totalAttendedLabs / totalTotalLabs) * 100).toFixed(2) : 0;
    totalLabAttendancePercentageDisplay.textContent = `${overallLabPercentage}%`;
    totalLabsAttendedDisplay.textContent = totalAttendedLabs;
    totalLabsTotalDisplay.textContent = totalTotalLabs;

    if (overallLabPercentage < MIN_ELIGIBILITY_PERCENTAGE) {
        totalLabAttendancePercentageDisplay.classList.add('red');
    } else {
        totalLabAttendancePercentageDisplay.classList.remove('red');
    }
}

/**
 * Saves the current subjects array to local storage.
 */
function saveSubjects() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

/**
 * Loads subjects from local storage.
 */
function loadSubjects() {
    const storedSubjects = localStorage.getItem(STORAGE_KEY);
    if (storedSubjects) {
        subjects = JSON.parse(storedSubjects);
        // Ensure backward compatibility for older data without 'type' or lab details
        subjects.forEach(subject => {
            if (typeof subject.type === 'undefined') {
                subject.type = 'theory'; // Default to theory for old entries
            }
            if (typeof subject.attendedLabs === 'undefined') subject.attendedLabs = 0;
            if (typeof subject.totalLabs === 'undefined') subject.totalLabs = 0;
            if (typeof subject.attendedClasses === 'undefined') subject.attendedClasses = 0;
            if (typeof subject.totalClasses === 'undefined') subject.totalClasses = 0;
        });
    }
}

/**
 * Toggles visibility of theory/lab input fields based on selected entry type.
 */
function toggleEntryInputs() {
    if (entryTypeSelect.value === 'theory') {
        theoryInputsDiv.style.display = 'block';
        labInputsDiv.style.display = 'none';
        // Remove 'required' attribute for hidden inputs to allow form submission
        attendedLabsInput.removeAttribute('required');
        totalLabsInput.removeAttribute('required');
        // Add 'required' attribute for visible inputs
        attendedClassesInput.setAttribute('required', 'required');
        totalClassesInput.setAttribute('required', 'required');
    } else {
        theoryInputsDiv.style.display = 'none';
        labInputsDiv.style.display = 'block';
        // Remove 'required' attribute for hidden inputs
        attendedClassesInput.removeAttribute('required');
        totalClassesInput.removeAttribute('required');
        // Add 'required' attribute for visible inputs
        attendedLabsInput.setAttribute('required', 'required');
        totalLabsInput.setAttribute('required', 'required');
    }
}

/**
 * Opens the subject modal for adding or editing.
 * @param {object|null} subjectData - Data of the subject to edit, or null for new entry.
 */
function openSubjectModal(subjectData = null) {
    subjectModal.style.display = 'flex';
    if (subjectData) {
        modalTitle.textContent = 'Edit Entry';
        entryTypeSelect.value = subjectData.type || 'theory'; // Ensure type is set for old entries
        subjectNameInput.value = subjectData.name;
        attendedClassesInput.value = subjectData.attendedClasses;
        totalClassesInput.value = subjectData.totalClasses;
        attendedLabsInput.value = subjectData.attendedLabs;
        totalLabsInput.value = subjectData.totalLabs;
        editingSubjectId = subjectData.id;
    } else {
        modalTitle.textContent = 'Add New Entry';
        subjectForm.reset(); // Clear form for new entry
        entryTypeSelect.value = 'theory'; // Default to theory for new entry
        editingSubjectId = null;
    }
    toggleEntryInputs(); // Adjust visibility based on selected type
}

/**
 * Closes the subject modal.
 */
function closeSubjectModal() {
    subjectModal.style.display = 'none';
    subjectForm.reset(); // Reset form fields
    editingSubjectId = null; // Clear editing ID
}

/**
 * Displays the overview modal for a specific subject.
 * @param {string} subjectId - The ID of the subject to display.
 */
function showOverviewModal(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return; // Should not happen if data is consistent

    document.getElementById('overviewSubjectName').textContent = subject.name;

    let percentage, isEligible, attended, total, statusText, missableValue;

    if (subject.type === 'theory') {
        overviewTypeLabel.textContent = 'Theory Attendance';
        attended = subject.attendedClasses;
        total = subject.totalClasses;
        percentage = total > 0 ? ((attended / total) * 100).toFixed(2) : 0;
        isEligible = percentage >= MIN_ELIGIBILITY_PERCENTAGE;
        const theoryClassesMissable = Math.max(0, Math.floor(attended / (MIN_ELIGIBILITY_PERCENTAGE / 100)) - total);
        const theoryClassesNeeded = Math.max(0, Math.ceil(total * MIN_ELIGIBILITY_PERCENTAGE / 100) - attended);
        statusText = isEligible ? 'Eligible' : 'Not Eligible';
        missableValue = isEligible ? `${theoryClassesMissable} classes` : `${theoryClassesNeeded > 0 ? theoryClassesNeeded : 0} more classes needed to be eligible`;

        overviewMissableRow.style.display = 'block';
        overviewLeavesAvailableRow.style.display = 'none'; // Hide for theory

    } else if (subject.type === 'lab') {
        overviewTypeLabel.textContent = 'Lab Attendance';
        attended = subject.attendedLabs;
        total = subject.totalLabs;
        percentage = total > 0 ? ((attended / total) * 100).toFixed(2) : 0;
        isEligible = percentage >= MIN_ELIGIBILITY_PERCENTAGE;
        const labLeavesAvailable = Math.max(0, Math.floor(attended / (MIN_ELIGIBILITY_PERCENTAGE / 100)) - total);
        const labClassesNeeded = Math.max(0, Math.ceil(total * MIN_ELIGIBILITY_PERCENTAGE / 100) - attended);
        statusText = isEligible ? 'Eligible' : 'Not Eligible';
        missableValue = isEligible ? `${labLeavesAvailable} leaves` : `${labClassesNeeded > 0 ? labClassesNeeded : 0} more labs needed to be eligible`;

        overviewMissableRow.style.display = 'none'; // Hide for labs
        overviewLeavesAvailableRow.style.display = 'block';
        document.getElementById('overviewLeavesAvailable').textContent = missableValue;
    }

    document.getElementById('overviewAttended').textContent = attended;
    document.getElementById('overviewTotal').textContent = total;
    document.getElementById('overviewPercentage').textContent = `${percentage}%`;
    document.getElementById('overviewStatus').textContent = statusText;
    document.getElementById('overviewMissable').textContent = missableValue;


    overviewModal.style.display = 'flex';
}

/**
 * Closes the overview modal.
 */
function closeOverviewModal() {
    overviewModal.style.display = 'none';
}

/**
 * Handles form submission for adding/editing a subject.
 * @param {Event} event - The form submission event.
 */
function handleSubjectFormSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    const type = entryTypeSelect.value;
    const name = subjectNameInput.value.trim();
    let attended, total, attendedLabs, totalLabs;

    if (type === 'theory') {
        attended = parseInt(attendedClassesInput.value);
        total = parseInt(totalClassesInput.value);
        attendedLabs = 0; // Ensure labs are 0 for theory type
        totalLabs = 0;
    } else { // type === 'lab'
        attended = 0; // Ensure theory are 0 for lab type
        total = 0;
        attendedLabs = parseInt(attendedLabsInput.value);
        totalLabs = parseInt(totalLabsInput.value);
    }

    if (!name) {
        showMessageBox('Subject ka naam toh likh de, bhai! Kya exam mein "random subject" likhega?', 'error');
        return;
    }

    if (type === 'theory' && (isNaN(attended) || isNaN(total) || attended < 0 || total < 0 || attended > total)) {
        showMessageBox('Bhai, sahi numbers daal! Kya tu attendance mein bhi scam kar raha hai?', 'error');
        return;
    }

    if (type === 'lab' && (isNaN(attendedLabs) || isNaN(totalLabs) || attendedLabs < 0 || totalLabs < 0 || attendedLabs > totalLabs)) {
        showMessageBox('Lab mein bhi cheating? Sahi data daal, warna professor gussa ho jayega!', 'error');
        return;
    }

    // Logic for adding or editing a subject
    if (editingSubjectId) {
        const index = subjects.findIndex(s => s.id === editingSubjectId);
        if (index !== -1) {
            subjects[index] = {
                ...subjects[index], // Keep existing properties if any
                type,
                name,
                attendedClasses: attended,
                totalClasses: total,
                attendedLabs: attendedLabs,
                totalLabs: totalLabs
            };
        }
    } else {
        subjects.push({
            id: generateUniqueId(),
            type,
            name,
            attendedClasses: attended,
            totalClasses: total,
            attendedLabs: attendedLabs,
            totalLabs: totalLabs
        });
    }

    saveSubjects();    // Save updated subjects to local storage
    renderSubjects();  // Re-render the subject cards
    closeSubjectModal(); // Close the modal
}

/**
 * Handles the delete action for a subject.
 * @param {string} subjectId - The ID of the subject to delete.
 */
function handleDeleteSubject(subjectId) {
    showMessageBox('Pakka delete karna hai? Yeh toh tere future se bhi zyada jaldi gayab ho jayega!', 'confirm', () => {
        subjects = subjects.filter(s => s.id !== subjectId); // Filter out the deleted subject
        saveSubjects();
        renderSubjects();
        showMessageBox('Entry gayab! Jaise tere doubts exam ke baad!', 'success');
    });
}

/**
 * Attaches event listeners to dynamically created subject cards.
 */
function addCardEventListeners() {
    // Attach listeners for Edit buttons
    document.querySelectorAll('.subject-card .edit-btn').forEach(button => {
        button.onclick = (e) => {
            const id = e.currentTarget.dataset.id;
            const subjectToEdit = subjects.find(s => s.id === id);
            if (subjectToEdit) {
                openSubjectModal(subjectToEdit);
            }
        };
    });

    // Attach listeners for Delete buttons
    document.querySelectorAll('.subject-card .delete-btn').forEach(button => {
        button.onclick = (e) => {
            const id = e.currentTarget.dataset.id;
            handleDeleteSubject(id);
        };
    });

    // Attach listeners for Overview buttons
    document.querySelectorAll('.subject-card .overview-btn').forEach(button => {
        button.onclick = (e) => {
            const id = e.currentTarget.dataset.id;
            showOverviewModal(id);
        };
    });
}

/**
 * Displays a custom message box instead of alert/confirm.
 * @param {string} message - The message to display.
 * @param {'info'|'confirm'|'success'|'error'} type - Type of message box.
 * @param {function} [onConfirm] - Callback for confirm type.
 */
function showMessageBox(message, type, onConfirm = null) {
    let msgBox = document.getElementById('messageBox');
    if (!msgBox) {
        msgBox = document.createElement('div');
        msgBox.id = 'messageBox';
        msgBox.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.7); backdrop-filter: blur(3px);
            display: flex; justify-content: center; align-items: center; z-index: 2000;
        `;
        document.body.appendChild(msgBox);
    }

    let contentHtml = `
        <div style="background-color: var(--modal-bg); padding: 25px; border-radius: 12px; max-width: 400px; text-align: center; box-shadow: 0 5px 20px var(--shadow-heavy);">
            <p style="font-size: 1.1rem; margin-bottom: 20px; color: var(--text-primary);">${message}</p>
            <div style="display: flex; justify-content: center; gap: 10px;">
                <button id="msgBoxOkBtn" style="padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s ease; border: none; background: linear-gradient(45deg, #6a0dad, #a020f0); color: white;">OK</button>
                ${type === 'confirm' ? '<button id="msgBoxCancelBtn" style="padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s ease; border: none; background-color: var(--progress-bg); color: var(--text-primary);">Cancel</button>' : ''}
            </div>
        </div>
    `;
    msgBox.innerHTML = contentHtml;
    msgBox.style.display = 'flex'; // Show the message box

    document.getElementById('msgBoxOkBtn').onclick = () => {
        msgBox.style.display = 'none'; // Hide on OK click
        if (type === 'confirm' && onConfirm) {
            onConfirm(); // Execute callback for confirm type
        }
    };

    if (type === 'confirm') {
        document.getElementById('msgBoxCancelBtn').onclick = () => {
            msgBox.style.display = 'none'; // Hide on Cancel click
        };
    }
}

/**
 * Toggles between dark and bright mode.
 */
function toggleTheme() {
    document.body.classList.toggle('bright-mode');
    const isBrightMode = document.body.classList.contains('bright-mode');
    localStorage.setItem(THEME_STORAGE_KEY, isBrightMode ? 'bright' : 'dark');
    updateThemeToggleButton(isBrightMode);
}

/**
 * Updates the theme toggle button icon.
 * @param {boolean} isBrightMode - True if bright mode is active, false otherwise.
 */
function updateThemeToggleButton(isBrightMode) {
    const iconSpan = themeToggleBtn.querySelector('.lucide');
    if (isBrightMode) {
        iconSpan.classList.remove('lucide-sun');
        iconSpan.classList.add('lucide-moon');
    } else {
        iconSpan.classList.remove('lucide-moon');
        iconSpan.classList.add('lucide-sun');
    }
    // Re-create lucide icons to ensure correct rendering after class change
    lucide.createIcons();
}


// --- Event Listeners ---
addEntryBtn.addEventListener('click', () => openSubjectModal());
resetAllBtn.addEventListener('click', () => {
    showMessageBox('Saara data udaana hai? Soch le, yeh "kal se padhunga" wali feeling jaisi hai, waapis nahi aayegi!', 'confirm', () => {
        subjects = []; // Clear all subjects
        saveSubjects();
        renderSubjects();
        showMessageBox('Sab reset! Nayi shuruat, naye bahane!', 'success');
    });
});

// Modal close buttons
subjectModal.querySelector('.close-button').addEventListener('click', closeSubjectModal);
cancelModalBtn.addEventListener('click', closeSubjectModal);
overviewModal.querySelector('.close-button').addEventListener('click', closeOverviewModal);
closeOverviewModalBtn.addEventListener('click', closeOverviewModal);

// Form submission
subjectForm.addEventListener('submit', handleSubjectFormSubmit);

// Toggle theory/lab inputs based on selection
entryTypeSelect.addEventListener('change', toggleEntryInputs);

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === subjectModal) {
        closeSubjectModal();
    }
    if (event.target === overviewModal) {
        closeOverviewModal();
    }
});

// Theme toggle button
themeToggleBtn.addEventListener('click', toggleTheme);

// --- Initial Load ---
window.onload = function() {
    // Set a dummy user ID
    userIdDisplay.textContent = '16090792577082014388';

    // Apply saved theme
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'bright') {
        document.body.classList.add('bright-mode');
        updateThemeToggleButton(true);
    } else {
        document.body.classList.remove('bright-mode');
        updateThemeToggleButton(false);
    }

    // Load and render subjects on page load
    loadSubjects();
    renderSubjects();
};