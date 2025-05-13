// DOM Elements
const authModal = document.getElementById('authModal');
const closeModal = document.getElementById('closeModal');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const getStartedBtn = document.getElementById('getStartedBtn');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginContent = document.getElementById('loginContent');
const signupContent = document.getElementById('signupContent');
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');
const loginSubmit = document.getElementById('loginSubmit');
const signupSubmit = document.getElementById('signupSubmit');
const userProfile = document.getElementById('userProfile');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const authSection = document.getElementById('authSection');
const welcomeScreen = document.getElementById('welcomeScreen');
const predictionScreen = document.getElementById('predictionScreen');
const predictBtn = document.getElementById('predictBtn');
const resultsSection = document.getElementById('resultsSection');

// Store JWT token
let jwtToken = null;

// Auth Modal Functions
function openModal(tab = 'login') {
    authModal.classList.add('active');
    if (tab === 'login') {
        activateTab(loginTab, loginContent);
    } else {
        activateTab(signupTab, signupContent);
    }
}

function closeModalFn() {
    authModal.classList.remove('active');
}

function activateTab(tabElement, contentElement) {
    // Deactivate all tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activate the clicked tab
    tabElement.classList.add('active');
    contentElement.classList.add('active');
}

// Event Listeners
loginBtn.addEventListener('click', () => openModal('login'));
signupBtn.addEventListener('click', () => openModal('signup'));
getStartedBtn.addEventListener('click', () => openModal('signup'));
closeModal.addEventListener('click', closeModalFn);
loginTab.addEventListener('click', () => activateTab(loginTab, loginContent));
signupTab.addEventListener('click', () => activateTab(signupTab, signupContent));
switchToSignup.addEventListener('click', () => activateTab(signupTab, signupContent));
switchToLogin.addEventListener('click', () => activateTab(loginTab, loginContent));

// Outside click to close modal
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        closeModalFn();
    }
});

// Auth submissions
loginSubmit.addEventListener('click', handleLogin);
signupSubmit.addEventListener('click', handleSignup);

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Please fill all fields');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
        }
        const data = await response.json();
        jwtToken = data.access_token;
        userProfile.style.display = 'flex';
        authSection.style.display = 'none';
        userName.textContent = data.name;
        userAvatar.textContent = data.name.charAt(0);
        welcomeScreen.classList.remove('active');
        predictionScreen.classList.add('active');
        closeModalFn();
    } catch (error) {
        alert('Login error: ' + error.message);
    }
}

async function handleSignup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
        alert('Please fill all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Registration failed');
        }
        alert('Registration successful! Please log in.');
        activateTab(loginTab, loginContent);
    } catch (error) {
        alert('Registration error: ' + error.message);
    }
}

// Slider elements
const academicLevel = document.getElementById('academicLevel');
const academicLevelValue = document.getElementById('academicLevelValue');
const aiUsageTime = document.getElementById('aiUsageTime');
const aiUsageTimeValue = document.getElementById('aiUsageTimeValue');
const aiHomeworkPercent = document.getElementById('aiHomeworkPercent');
const aiHomeworkPercentValue = document.getElementById('aiHomeworkPercentValue');
const aiDependencyLevel = document.getElementById('aiDependencyLevel');
const aiDependencyLevelValue = document.getElementById('aiDependencyLevelValue');
const courseDifficulty = document.getElementById('courseDifficulty');
const courseDifficultyValue = document.getElementById('courseDifficultyValue');
const studyHoursNoAI = document.getElementById('studyHoursNoAI');
const studyHoursNoAIValue = document.getElementById('studyHoursNoAIValue');
const aiUnderstanding = document.getElementById('aiUnderstanding');
const aiUnderstandingValue = document.getElementById('aiUnderstandingValue');

// Update slider values
academicLevel.addEventListener('input', () => academicLevelValue.textContent = academicLevel.value);
aiUsageTime.addEventListener('input', () => aiUsageTimeValue.textContent = aiUsageTime.value);
aiHomeworkPercent.addEventListener('input', () => aiHomeworkPercentValue.textContent = aiHomeworkPercent.value + '%');
aiDependencyLevel.addEventListener('input', () => aiDependencyLevelValue.textContent = aiDependencyLevel.value);
courseDifficulty.addEventListener('input', () => courseDifficultyValue.textContent = courseDifficulty.value);
studyHoursNoAI.addEventListener('input', () => studyHoursNoAIValue.textContent = studyHoursNoAI.value);
aiUnderstanding.addEventListener('input', () => aiUnderstandingValue.textContent = aiUnderstanding.value);

// Prediction handler using backend API with validation and loading state
predictBtn.addEventListener('click', async () => {
    if (!jwtToken) {
        alert('Please log in to generate a prediction.');
        return;
    }

    // Basic input validation
    if (
        !academicLevel.value || isNaN(academicLevel.value) ||
        !aiUsageTime.value || isNaN(aiUsageTime.value) ||
        !aiDependencyLevel.value || isNaN(aiDependencyLevel.value) ||
        !courseDifficulty.value || isNaN(courseDifficulty.value) ||
        !studyHoursNoAI.value || isNaN(studyHoursNoAI.value) ||
        !aiUnderstanding.value || isNaN(aiUnderstanding.value)
    ) {
        alert('Please fill in all fields with valid numbers.');
        return;
    }

    const inputData = {
        academicLevel: parseFloat(academicLevel.value),
        aiUsageTime: parseFloat(aiUsageTime.value),
        aiDependencyLevel: parseFloat(aiDependencyLevel.value),
        courseDifficulty: parseFloat(courseDifficulty.value),
        studyHoursNoAI: parseFloat(studyHoursNoAI.value),
        aiUnderstanding: parseFloat(aiUnderstanding.value)
    };

    // Disable button and show loading spinner
    predictBtn.disabled = true;
    loadingSpinner.style.display = 'block';

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify(inputData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Prediction request failed');
        }

        const result = await response.json();
        const predictedGPA = result.predictedGPA.toFixed(1);

        // Update UI
        document.getElementById('predictedGPA').textContent = predictedGPA;
        document.getElementById('dependencyProgress').style.width = 
            `${Math.min(100, (aiDependencyLevel.value / 10) * 100)}%`;
        resultsSection.style.display = 'block';

        // Update Impact Factors
        const featureImportance = result.featureImportance || {};
        const featureImportanceContainer = document.getElementById('featureImportance');
        featureImportanceContainer.innerHTML = '';
        for (const [feature, importance] of Object.entries(featureImportance)) {
            const item = document.createElement('div');
            item.className = 'feature-item';
            item.textContent = `${feature}: ${(importance * 100).toFixed(1)}%`;
            featureImportanceContainer.appendChild(item);
        }

        // Update Recommendations (dummy example)
        const recommendationsContainer = document.getElementById('recommendationsContainer');
        recommendationsContainer.innerHTML = '';
        if (result.predictedGPA < 3.0) {
            recommendationsContainer.innerHTML = '<p>Consider reducing AI dependency and increasing study hours.</p>';
        } else {
            recommendationsContainer.innerHTML = '<p>Your AI usage and study habits are balanced.</p>';
        }

        // Update Charts (dummy example)
        // Assuming Chart.js is loaded and canvas elements exist
        const gpaProjectionCtx = document.getElementById('gpaProjectionChart').getContext('2d');
        const factorAnalysisCtx = document.getElementById('factorAnalysisChart').getContext('2d');

        // Destroy existing charts if any
        if (window.gpaProjectionChart && typeof window.gpaProjectionChart.destroy === 'function') window.gpaProjectionChart.destroy();
        if (window.factorAnalysisChart && typeof window.factorAnalysisChart.destroy === 'function') window.factorAnalysisChart.destroy();

        window.gpaProjectionChart = new Chart(gpaProjectionCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'GPA Projection',
                    data: [3.0, 3.1, 3.2, parseFloat(predictedGPA)],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { min: 1, max: 5 }
                }
            }
        });

        window.factorAnalysisChart = new Chart(factorAnalysisCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(featureImportance),
                datasets: [{
                    label: 'Feature Importance',
                    data: Object.values(featureImportance).map(v => v * 100),
                    backgroundColor: 'rgba(153, 102, 255, 0.6)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { min: 0, max: 100 }
                }
            }
        });

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        alert('Error during prediction: ' + error.message);
    } finally {
        // Re-enable button and hide loading spinner
        predictBtn.disabled = false;
        loadingSpinner.style.display = 'none';
    }
});

// Initialize application
document.querySelectorAll('input[type="range"]').forEach(input => {
    input.dispatchEvent(new Event('input'));
});
