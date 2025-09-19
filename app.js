// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const fabToggle = document.getElementById('fab-toggle');
const fabMenu = document.querySelector('.fab-menu');
const fabItems = document.querySelectorAll('.fab-item');
const themeSelector = document.getElementById('theme-selector');
const darkModeToggle = document.getElementById('dark-mode');
const saveSettingsBtn = document.getElementById('save-settings');
const toastContainer = document.getElementById('toast-container');
const modalContainer = document.getElementById('modal-container');
const kpiValues = document.querySelectorAll('.kpi-value');
const notificationToggle = document.getElementById('notification-toggle');
const notificationDropdown = document.querySelector('.notification-dropdown');
const markReadBtn = document.querySelector('.mark-read');
const notificationItems = document.querySelectorAll('.notification-item');
const addStudentBtn = document.getElementById('add-student-btn');
const exportStudentsBtn = document.getElementById('export-students-btn');
const studentsTbody = document.getElementById('students-tbody');
const studentSearch = document.getElementById('student-search');
const classFilterStudents = document.getElementById('class-filter-students');
const classFilter = document.getElementById('class-filter');
const dateFilter = document.getElementById('date-filter');
const defaultChartType = document.getElementById('default-chart-type');
const animationDuration = document.getElementById('animation-duration');
const logoutBtn = document.getElementById('logout-btn');

// Chart type toggle buttons
const chartTypeButtons = document.querySelectorAll('.chart-action-btn[data-chart]');

// Teacher profile elements
const userNameElement = document.querySelector('.user-name');
const userRoleElement = document.querySelector('.user-role');
const userAvatarElement = document.querySelector('.user-avatar img');

// Teacher profile section elements
const teacherNameElement = document.getElementById('teacher-name');
const teacherInstitutionElement = document.getElementById('teacher-institution');
const teacherEmailElement = document.getElementById('teacher-email');
const teacherStudentsCountElement = document.getElementById('teacher-students-count');
const teacherClassesCountElement = document.getElementById('teacher-classes-count');
const teacherAssignmentsCountElement = document.getElementById('teacher-assignments-count');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check if teacher is logged in
    checkTeacherAuth();
    
    // Load saved theme and settings
    loadTheme();
    loadSettings();
    
    // Load teacher profile
    loadTeacherProfile();
    
    // Initialize sidebar toggle
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // Initialize navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => switchSection(item.dataset.section));
    });
    
    // Initialize FAB
    fabToggle.addEventListener('click', toggleFabMenu);
    fabItems.forEach(item => {
        item.addEventListener('click', handleFabAction);
    });
    
    // Initialize theme selector
    themeSelector.addEventListener('change', changeTheme);
    
    // Initialize dark mode toggle
    darkModeToggle.addEventListener('change', toggleDarkMode);
    
    // Initialize settings save
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Initialize animated counters
    animateCounters();
    
    // Initialize charts
    initializeCharts();
    
    // Initialize notifications
    notificationToggle.addEventListener('click', toggleNotifications);
    markReadBtn.addEventListener('click', markAllAsRead);
    
    // Initialize student management
    addStudentBtn.addEventListener('click', () => showStudentModal());
    exportStudentsBtn.addEventListener('click', exportStudents);
    
    // Initialize search and filters
    studentSearch.addEventListener('input', filterStudents);
    classFilterStudents.addEventListener('change', filterStudents);
    classFilter.addEventListener('change', updateCharts);
    dateFilter.addEventListener('change', updateCharts);
    
    // Initialize chart type toggles
    chartTypeButtons.forEach(button => {
        button.addEventListener('click', toggleChartType);
    });
    
    // Initialize table sorting
    initializeTableSorting();
    
    // Initialize pagination
    initializePagination();
    
    // Initialize draggable cards
    initializeDraggableCards();
    
    // Initialize account settings buttons
    const settingItems = document.querySelectorAll('.setting-item');
    
    settingItems.forEach(item => {
        const label = item.querySelector('.setting-label');
        const button = item.querySelector('.btn-outline');
        
        if (label && button) {
            if (label.textContent.includes('Profile Information')) {
                button.addEventListener('click', showProfileModal);
            } else if (label.textContent.includes('Change Password')) {
                button.addEventListener('click', showPasswordModal);
            } else if (label.textContent.includes('Connected Accounts')) {
                button.addEventListener('click', showConnectedAccountsModal);
            }
        }
    });
    
    // Initialize logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', showLogoutModal);
    }
    
    // Check if mobile and adjust sidebar
    checkMobileView();
    
    // Add click outside to close FAB menu
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.fab-container') && fabMenu.classList.contains('active')) {
            toggleFabMenu();
        }
    });
    
    // Add click outside to close expanded sidebar on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('expanded') && 
            !e.target.closest('.sidebar') && 
            !e.target.closest('.sidebar-toggle')) {
            sidebar.classList.remove('expanded');
        }
    });
    
    // Add click outside to close notification dropdown
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.notification-bell') && notificationDropdown.classList.contains('active')) {
            notificationDropdown.classList.remove('active');
        }
    });
    
    // Initialize with empty data
    initializeEmptyDashboard();
});

// Initialize empty dashboard
function initializeEmptyDashboard() {
    // Clear any existing data
    localStorage.removeItem('students');
    localStorage.removeItem('dashboardData');
    localStorage.removeItem('analyticsData');
    
    // Update dashboard with empty data
    const emptyDashboardData = {
        totalStudents: 0,
        activeAssignments: 0,
        averageScore: 0,
        attendance: 0,
        recentActivity: [],
        assignmentProgress: []
    };
    
    // Save empty data
    localStorage.setItem('dashboardData', JSON.stringify(emptyDashboardData));
    
    // Update UI
    updateDashboardUI(emptyDashboardData);
    
    // Update teacher profile section
    const teacherProfile = getTeacherProfile();
    if (teacherProfile) {
        updateTeacherProfileSection(teacherProfile, []);
    }
    
    // Render empty students table
    renderStudentsTable();
}

// Check if teacher is authenticated
function checkTeacherAuth() {
    const teacherProfile = getTeacherProfile();
    
    if (!teacherProfile) {
        // Redirect to login page if not authenticated
        window.location.href = 'teacher-login.html';
        return;
    }
    
    // Update UI with teacher data
    updateTeacherUI(teacherProfile);
}

// Get teacher profile from localStorage
function getTeacherProfile() {
    try {
        const raw = localStorage.getItem('teacherProfile');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error('Error getting teacher profile:', e);
        return null;
    }
}

// Save teacher profile to localStorage
function saveTeacherProfile(profile) {
    try {
        localStorage.setItem('teacherProfile', JSON.stringify(profile));
        return true;
    } catch (e) {
        console.error('Error saving teacher profile:', e);
        return false;
    }
}

// Update UI with teacher data
function updateTeacherUI(teacherProfile) {
    // Update sidebar profile
    if (userNameElement) userNameElement.textContent = teacherProfile.name || 'Teacher';
    if (userRoleElement) userRoleElement.textContent = teacherProfile.role || 'Teacher';
    if (userAvatarElement) {
        // Use a placeholder avatar based on teacher's name
        const seed = teacherProfile.name ? teacherProfile.name.replace(/\s+/g, '').toLowerCase() : 'teacher';
        userAvatarElement.src = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=4e73df,7e57c2,1cc88a,36b9cc,f6c23e,e74a3b`;
    }
    
    // Update teacher profile section
    if (teacherNameElement) teacherNameElement.textContent = teacherProfile.name || 'Teacher';
    if (teacherInstitutionElement) {
        const institutionBadge = teacherInstitutionElement.querySelector('.institution-badge');
        if (institutionBadge) institutionBadge.textContent = teacherProfile.institution || 'Institution';
    }
    if (teacherEmailElement) teacherEmailElement.textContent = teacherProfile.email || '';
}

// Load teacher profile
function loadTeacherProfile() {
    const teacherProfile = getTeacherProfile();
    
    if (teacherProfile) {
        // Update profile in settings
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            document.getElementById('profile-name').value = teacherProfile.name || '';
            document.getElementById('profile-role').value = teacherProfile.role || 'Teacher';
            document.getElementById('profile-email').value = teacherProfile.email || '';
            document.getElementById('profile-phone').value = teacherProfile.phone || '';
            document.getElementById('profile-avatar').value = teacherProfile.avatar || '';
            
            const avatarPreview = document.getElementById('avatar-preview-img');
            if (avatarPreview) {
                const seed = teacherProfile.name ? teacherProfile.name.replace(/\s+/g, '').toLowerCase() : 'teacher';
                avatarPreview.src = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=4e73df,7e57c2,1cc88a,36b9cc,f6c23e,e74a3b`;
            }
        }
    }
}

// Update teacher profile section
function updateTeacherProfileSection(teacherProfile, students) {
    // Update teacher name
    const teacherName = document.getElementById('teacher-name');
    if (teacherName) teacherName.textContent = teacherProfile.name || 'Teacher';
    
    // Update institution
    const teacherInstitution = document.getElementById('teacher-institution');
    if (teacherInstitution) {
        const institutionBadge = teacherInstitution.querySelector('.institution-badge');
        if (institutionBadge) institutionBadge.textContent = teacherProfile.institution || 'Institution';
    }
    
    // Update email
    const teacherEmail = document.getElementById('teacher-email');
    if (teacherEmail) teacherEmail.textContent = teacherProfile.email || '';
    
    // Update stats
    const studentsCount = document.getElementById('teacher-students-count');
    if (studentsCount) studentsCount.textContent = students.length;
    
    // Get unique classes
    const uniqueClasses = students.length > 0 ? [...new Set(students.map(student => student.class))] : [];
    const classesCount = document.getElementById('teacher-classes-count');
    if (classesCount) classesCount.textContent = uniqueClasses.length;
    
    const assignmentsCount = document.getElementById('teacher-assignments-count');
    if (assignmentsCount) assignmentsCount.textContent = '0';
}

// Update dashboard UI with data
function updateDashboardUI(dashboardData) {
    // Update KPI values
    if (kpiValues.length >= 4) {
        kpiValues[0].setAttribute('data-target', dashboardData.totalStudents);
        kpiValues[1].setAttribute('data-target', dashboardData.activeAssignments);
        kpiValues[2].setAttribute('data-target', dashboardData.averageScore);
        kpiValues[3].setAttribute('data-target', dashboardData.attendance);
    }
    
    // Update recent activity
    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        activityList.innerHTML = '';
        
        if (dashboardData.recentActivity.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No recent activity</p>
                </div>
            `;
        } else {
            dashboardData.recentActivity.forEach(activity => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                
                let icon = '';
                switch (activity.type) {
                    case 'student':
                        icon = 'fas fa-user-plus';
                        break;
                    case 'grade':
                        icon = 'fas fa-chart-bar';
                        break;
                    case 'announcement':
                        icon = 'fas fa-bullhorn';
                        break;
                }
                
                activityItem.innerHTML = `
                    <div class="activity-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="activity-details">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                `;
                
                activityList.appendChild(activityItem);
            });
        }
    }
}

// Sidebar Functions
function toggleSidebar() {
    if (window.innerWidth > 768) {
        // Desktop behavior - toggle between expanded and collapsed
        sidebar.classList.toggle('collapsed');
        
        // Save the collapsed state to localStorage
        localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
    } else {
        // Mobile behavior - toggle expanded state
        sidebar.classList.toggle('expanded');
    }
}

function checkMobileView() {
    if (window.innerWidth <= 768) {
        // On mobile, sidebar should be collapsed by default
        sidebar.classList.add('collapsed');
        sidebar.classList.remove('expanded');
    } else {
        // On desktop, check if we should restore the collapsed state
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
        sidebar.classList.remove('expanded');
    }
}

window.addEventListener('resize', () => {
    const wasExpanded = sidebar.classList.contains('expanded');
    
    checkMobileView();
    
    // If we were in expanded state on mobile and resize to desktop, maintain the expanded state
    if (window.innerWidth > 768 && wasExpanded) {
        sidebar.classList.remove('collapsed');
    }
});

// Navigation Functions
function switchSection(sectionId) {
    // Update active nav item
    navItems.forEach(item => {
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update active content section
    contentSections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('expanded');
    }
    
    // Initialize charts when analytics section is opened
    if (sectionId === 'analytics') {
        initializeCharts();
    }
}

// FAB Functions
function toggleFabMenu() {
    fabToggle.classList.toggle('active');
    fabMenu.classList.toggle('active');
}

function handleFabAction(e) {
    const action = e.currentTarget.dataset.action;
    
    switch (action) {
        case 'add-student':
            showStudentModal();
            break;
        case 'switch-theme':
            cycleTheme();
            break;
        case 'logout':
            showLogoutModal();
            break;
    }
    
    // Close FAB menu after action
    toggleFabMenu();
}

// Theme Functions
function loadTheme() {
    const savedTheme = localStorage.getItem('dashboard-theme') || 'pink-purple';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeSelector.value = savedTheme;
}

function changeTheme() {
    const selectedTheme = themeSelector.value;
    document.documentElement.setAttribute('data-theme', selectedTheme);
    localStorage.setItem('dashboard-theme', selectedTheme);
    showToast('info', 'Theme Changed', `Theme has been changed to ${selectedTheme.replace('-', '/')}.`);
    
    // Update charts with new theme colors
    updateChartsTheme();
}

function cycleTheme() {
    const themes = ['pink-purple', 'blue-cyan', 'green-lime', 'orange-yellow'];
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('dashboard-theme', nextTheme);
    themeSelector.value = nextTheme;
    showToast('info', 'Theme Changed', `Theme has been changed to ${nextTheme.replace('-', '/')}.`);
    
    // Update charts with new theme colors
    updateChartsTheme();
}

function toggleDarkMode() {
    const isDarkMode = darkModeToggle.checked;
    document.documentElement.setAttribute('data-dark-mode', isDarkMode);
    localStorage.setItem('dark-mode', isDarkMode);
    showToast('info', 'Dark Mode', `Dark mode has been ${isDarkMode ? 'enabled' : 'disabled'}.`);
}

// Settings Functions
function loadSettings() {
    const savedSettings = localStorage.getItem('dashboard-settings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Apply settings
        if (settings.darkMode !== undefined) {
            darkModeToggle.checked = settings.darkMode;
            document.documentElement.setAttribute('data-dark-mode', settings.darkMode);
        }
        
        if (settings.compactMode !== undefined) {
            document.getElementById('compact-mode').checked = settings.compactMode;
        }
        
        if (settings.emailNotifications !== undefined) {
            document.getElementById('email-notifications').checked = settings.emailNotifications;
        }
        
        if (settings.pushNotifications !== undefined) {
            document.getElementById('push-notifications').checked = settings.pushNotifications;
        }
        
        if (settings.assignmentReminders !== undefined) {
            document.getElementById('assignment-reminders').checked = settings.assignmentReminders;
        }
        
        if (settings.defaultChartType !== undefined) {
            defaultChartType.value = settings.defaultChartType;
        }
        
        if (settings.animationDuration !== undefined) {
            animationDuration.value = settings.animationDuration;
        }
    }
}

function saveSettings() {
    // Get all settings values
    const settings = {
        theme: themeSelector.value,
        darkMode: darkModeToggle.checked,
        compactMode: document.getElementById('compact-mode').checked,
        emailNotifications: document.getElementById('email-notifications').checked,
        pushNotifications: document.getElementById('push-notifications').checked,
        assignmentReminders: document.getElementById('assignment-reminders').checked,
        defaultChartType: defaultChartType.value,
        animationDuration: animationDuration.value
    };
    
    // Save to localStorage (in a real app, this would be saved to a database)
    localStorage.setItem('dashboard-settings', JSON.stringify(settings));
    
    // Show success toast
    showToast('success', 'Settings Saved', 'Your settings have been successfully saved.');
}

// Counter Animation Functions
function animateCounters() {
    kpiValues.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target'));
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.ceil(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target % 1 === 0 ? target : target.toFixed(1);
            }
        };
        
        // Start animation when element is in viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(counter);
    });
}

// Chart Functions
let charts = {};

function initializeCharts() {
    // Check if we have analytics data
    const analyticsData = getAnalyticsData();
    
    if (!analyticsData || Object.keys(analyticsData).length === 0) {
        // Show no data message
        const noDataMessage = document.getElementById('no-data-message');
        if (noDataMessage) {
            noDataMessage.style.display = 'flex';
        }
        return;
    }
    
    // Hide no data message
    const noDataMessage = document.getElementById('no-data-message');
    if (noDataMessage) {
        noDataMessage.style.display = 'none';
    }
    
    // Create charts container if it doesn't exist
    const analyticsGrid = document.getElementById('analytics-grid');
    if (analyticsGrid && !analyticsGrid.querySelector('.chart-container')) {
        analyticsGrid.innerHTML = `
            <div class="chart-container">
                <div class="chart-header">
                    <h2 class="chart-title">Student Performance</h2>
                    <div class="chart-actions">
                        <button class="chart-action-btn" data-chart="line" data-target="lineChart">
                            <i class="fas fa-chart-line"></i>
                        </button>
                        <button class="chart-action-btn" data-chart="bar" data-target="lineChart">
                            <i class="fas fa-chart-bar"></i>
                        </button>
                        <button class="chart-action-btn">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
                <div class="chart-content">
                    <canvas id="lineChart"></canvas>
                </div>
            </div>
            
            <div class="chart-container">
                <div class="chart-header">
                    <h2 class="chart-title">Grade Distribution</h2>
                    <div class="chart-actions">
                        <button class="chart-action-btn">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
                <div class="chart-content">
                    <canvas id="pieChart"></canvas>
                </div>
            </div>
            
            <div class="chart-container">
                <div class="chart-header">
                    <h2 class="chart-title">Skills Assessment</h2>
                    <div class="chart-actions">
                        <button class="chart-action-btn">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
                <div class="chart-content">
                    <canvas id="radarChart"></canvas>
                </div>
            </div>
        `;
        
        // Re-initialize chart type buttons
        const chartTypeButtons = document.querySelectorAll('.chart-action-btn[data-chart]');
        chartTypeButtons.forEach(button => {
            button.addEventListener('click', toggleChartType);
        });
    }
    
    // Line Chart
    const lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
        charts.line = new Chart(lineCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: analyticsData.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Average Score',
                    data: analyticsData.performance || [75, 78, 80, 82, 85, 87],
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-light'),
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 70,
                        max: 100
                    }
                }
            }
        });
    }
    
    // Pie Chart
    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        charts.pie = new Chart(pieCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['A (90-100)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (0-59)'],
                datasets: [{
                    data: analyticsData.gradeDistribution || [25, 35, 20, 15, 5],
                    backgroundColor: [
                        getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                        getComputedStyle(document.documentElement).getPropertyValue('--secondary-color'),
                        getComputedStyle(document.documentElement).getPropertyValue('--primary-light'),
                        getComputedStyle(document.documentElement).getPropertyValue('--secondary-light'),
                        '#e0e0e0'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Radar Chart
    const radarCtx = document.getElementById('radarChart');
    if (radarCtx) {
        charts.radar = new Chart(radarCtx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['Problem Solving', 'Critical Thinking', 'Communication', 'Collaboration', 'Creativity', 'Research'],
                datasets: [{
                    label: 'Class Average',
                    data: analyticsData.skills || [85, 78, 92, 88, 76, 82],
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-light'),
                    pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}

// Add function to get analytics data
function getAnalyticsData() {
    // In a real application, this would fetch data from a server
    // For now, we'll check localStorage or return null
    const analyticsData = localStorage.getItem('analyticsData');
    return analyticsData ? JSON.parse(analyticsData) : null;
}

function updateChartsTheme() {
    // Get current theme colors
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
    const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color');
    const primaryLight = getComputedStyle(document.documentElement).getPropertyValue('--primary-light');
    const secondaryLight = getComputedStyle(document.documentElement).getPropertyValue('--secondary-light');
    
    // Update line chart
    if (charts.line) {
        charts.line.data.datasets[0].borderColor = primaryColor;
        charts.line.data.datasets[0].backgroundColor = primaryLight;
        charts.line.update();
    }
    
    // Update pie chart
    if (charts.pie) {
        charts.pie.data.datasets[0].backgroundColor = [
            primaryColor,
            secondaryColor,
            primaryLight,
            secondaryLight,
            '#e0e0e0'
        ];
        charts.pie.update();
    }
    
    // Update radar chart
    if (charts.radar) {
        charts.radar.data.datasets[0].borderColor = primaryColor;
        charts.radar.data.datasets[0].backgroundColor = primaryLight;
        charts.radar.data.datasets[0].pointBackgroundColor = primaryColor;
        charts.radar.update();
    }
}

function updateCharts() {
    // In a real app, this would fetch new data based on filters
    // For now, we'll just update with random data to simulate the effect
    
    // Get analytics data
    const analyticsData = getAnalyticsData();
    
    if (!analyticsData) {
        // If no data, show no data message
        const noDataMessage = document.getElementById('no-data-message');
        if (noDataMessage) {
            noDataMessage.style.display = 'flex';
        }
        
        // Remove existing charts
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        charts = {};
        
        // Remove chart containers
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => container.remove());
        
        return;
    }
    
    // Update line chart
    if (charts.line) {
        const newData = Array.from({length: 6}, () => Math.floor(Math.random() * 20) + 75);
        charts.line.data.datasets[0].data = newData;
        charts.line.update();
    }
    
    // Update pie chart
    if (charts.pie) {
        const total = 100;
        const data = [
            Math.floor(Math.random() * 30) + 10,
            Math.floor(Math.random() * 30) + 10,
            Math.floor(Math.random() * 20) + 10,
            Math.floor(Math.random() * 15) + 5,
            Math.floor(Math.random() * 10) + 1
        ];
        
        // Normalize to ensure total is 100
        const sum = data.reduce((a, b) => a + b, 0);
        const normalizedData = data.map(value => Math.round(value / sum * total));
        
        charts.pie.data.datasets[0].data = normalizedData;
        charts.pie.update();
    }
    
    // Update radar chart
    if (charts.radar) {
        const newData = Array.from({length: 6}, () => Math.floor(Math.random() * 30) + 70);
        charts.radar.data.datasets[0].data = newData;
        charts.radar.update();
    }
}

function toggleChartType(e) {
    const button = e.currentTarget;
    const chartType = button.dataset.chart;
    const targetChart = button.dataset.target;
    
    if (charts[targetChart]) {
        charts[targetChart].config.type = chartType;
        charts[targetChart].update();
    }
}

// Notification Functions
function toggleNotifications() {
    notificationDropdown.classList.toggle('active');
}

function markAllAsRead() {
    notificationItems.forEach(item => {
        item.classList.remove('unread');
    });
    
    // Update notification badge
    const badge = document.querySelector('.notification-badge');
    badge.textContent = '0';
    badge.style.display = 'none';
    
    showToast('success', 'Notifications', 'All notifications marked as read.');
}

// Student Management Functions
function renderStudentsTable() {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const searchTerm = studentSearch.value.toLowerCase();
    const classFilter = classFilterStudents.value;
    
    // Filter students
    let filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm) || 
                              student.id.toLowerCase().includes(searchTerm);
        const matchesClass = classFilter === 'all' || student.class === classFilter;
        return matchesSearch && matchesClass;
    });
    
    // Clear table
    studentsTbody.innerHTML = '';
    
    // Show empty state if no students
    if (filteredStudents.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 2rem;">
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No students found</p>
                </div>
            </td>
        `;
        studentsTbody.appendChild(emptyRow);
        return;
    }
    
    // Render rows
    filteredStudents.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="student-name">
                    <img src="https://randomuser.me/api/portraits/${student.id.endsWith('1') || student.id.endsWith('3') ? 'women' : 'men'}/${parseInt(student.id.substring(1)) % 70 + 1}.jpg" alt="${student.name}" class="student-avatar">
                    ${student.name}
                </div>
            </td>
            <td>${student.id}</td>
            <td>${student.class}</td>
            <td>${student.grade}</td>
            <td>${student.attendance}</td>
            <td>
                <button class="action-btn" onclick="editStudent('${student.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="deleteStudent('${student.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        studentsTbody.appendChild(row);
    });
    
    // Update pagination
    updatePagination('students', filteredStudents.length);
}

function filterStudents() {
    renderStudentsTable();
}

function showStudentModal(studentId = null) {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const student = studentId ? students.find(s => s.id === studentId) : null;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">${studentId ? 'Edit Student' : 'Add Student'}</h2>
            <button class="modal-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="student-form">
                <div class="form-group">
                    <label class="form-label" for="student-name">Name</label>
                    <input type="text" id="student-name" class="form-input" value="${student ? student.name : ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="student-id">ID</label>
                    <input type="text" id="student-id" class="form-input" value="${student ? student.id : ''}" ${student ? 'readonly' : ''} required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="student-class">Class</label>
                    <select id="student-class" class="form-select" required>
                        <option value="Math 101" ${student && student.class === 'Math 101' ? 'selected' : ''}>Math 101</option>
                        <option value="Math 201" ${student && student.class === 'Math 201' ? 'selected' : ''}>Math 201</option>
                        <option value="Math 301" ${student && student.class === 'Math 301' ? 'selected' : ''}>Math 301</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="student-grade">Grade</label>
                    <select id="student-grade" class="form-select" required>
                        <option value="A" ${student && student.grade === 'A' ? 'selected' : ''}>A</option>
                        <option value="B" ${student && student.grade === 'B' ? 'selected' : ''}>B</option>
                        <option value="C" ${student && student.grade === 'C' ? 'selected' : ''}>C</option>
                        <option value="D" ${student && student.grade === 'D' ? 'selected' : ''}>D</option>
                        <option value="F" ${student && student.grade === 'F' ? 'selected' : ''}>F</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="student-attendance">Attendance (%)</label>
                    <input type="text" id="student-attendance" class="form-input" value="${student ? student.attendance : ''}" required>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline modal-cancel">Cancel</button>
            <button class="btn btn-primary modal-save">${studentId ? 'Update' : 'Add'} Student</button>
        </div>
    `;
    
    // Add modal to container
    modalContainer.innerHTML = '';
    modalContainer.appendChild(modal);
    
    // Show modal
    modalContainer.classList.add('active');
    
    // Add close button functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', closeModal);
    
    // Add cancel button functionality
    const cancelBtn = modal.querySelector('.modal-cancel');
    cancelBtn.addEventListener('click', closeModal);
    
    // Add save button functionality
    const saveBtn = modal.querySelector('.modal-save');
    saveBtn.addEventListener('click', () => {
        const form = document.getElementById('student-form');
        if (form.checkValidity()) {
            saveStudent(studentId);
            closeModal();
        } else {
            form.reportValidity();
        }
    });
    
    // Close modal when clicking outside
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });
}

function saveStudent(studentId) {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    
    const studentData = {
        id: document.getElementById('student-id').value,
        name: document.getElementById('student-name').value,
        class: document.getElementById('student-class').value,
        grade: document.getElementById('student-grade').value,
        attendance: document.getElementById('student-attendance').value
    };
    
    if (studentId) {
        // Update existing student
        const index = students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            students[index] = studentData;
            showToast('success', 'Student Updated', `${studentData.name} has been updated successfully.`);
        }
    } else {
        // Add new student
        students.push(studentData);
        showToast('success', 'Student Added', `${studentData.name} has been added successfully.`);
    }
    
    // Save to localStorage
    localStorage.setItem('students', JSON.stringify(students));
    
    // Re-render table
    renderStudentsTable();
    
    // Update dashboard data
    const teacherProfile = getTeacherProfile();
    const dashboardData = {
        totalStudents: students.length,
        activeAssignments: 0,
        averageScore: students.length > 0 ? Math.floor(Math.random() * 20) + 80 : 0,
        attendance: students.length > 0 ? Math.floor(Math.random() * 15) + 85 : 0,
        recentActivity: students.length > 0 ? [
            { type: 'student', title: 'New student enrolled', time: 'Just now' }
        ] : [],
        assignmentProgress: []
    };
    
    localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
    updateDashboardUI(dashboardData);
    updateTeacherProfileSection(teacherProfile, students);
}

function editStudent(studentId) {
    showStudentModal(studentId);
}

function deleteStudent(studentId) {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const student = students.find(s => s.id === studentId);
    
    if (student) {
        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Set modal content
        modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">Confirm Delete</h2>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete ${student.name}? This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-confirm">Delete</button>
            </div>
        `;
        
        // Add modal to container
        modalContainer.innerHTML = '';
        modalContainer.appendChild(modal);
        
        // Show modal
        modalContainer.classList.add('active');
        
        // Add close button functionality
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', closeModal);
        
        // Add cancel button functionality
        const cancelBtn = modal.querySelector('.modal-cancel');
        cancelBtn.addEventListener('click', closeModal);
        
        // Add confirm button functionality
        const confirmBtn = modal.querySelector('.modal-confirm');
        confirmBtn.addEventListener('click', () => {
            // Remove student
            const updatedStudents = students.filter(s => s.id !== studentId);
            localStorage.setItem('students', JSON.stringify(updatedStudents));
            
            // Re-render table
            renderStudentsTable();
            
            // Update dashboard data
            const teacherProfile = getTeacherProfile();
            const dashboardData = {
                totalStudents: updatedStudents.length,
                activeAssignments: 0,
                averageScore: updatedStudents.length > 0 ? Math.floor(Math.random() * 20) + 80 : 0,
                attendance: updatedStudents.length > 0 ? Math.floor(Math.random() * 15) + 85 : 0,
                recentActivity: updatedStudents.length > 0 ? [
                    { type: 'student', title: 'Student removed', time: 'Just now' }
                ] : [],
                assignmentProgress: []
            };
            
            localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
            updateDashboardUI(dashboardData);
            updateTeacherProfileSection(teacherProfile, updatedStudents);
            
            // Show success message
            showToast('success', 'Student Deleted', `${student.name} has been deleted successfully.`);
            
            closeModal();
        });
        
        // Close modal when clicking outside
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                closeModal();
            }
        });
    }
}

function exportStudents() {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    
    if (students.length === 0) {
        showToast('warning', 'No Data', 'There are no students to export.');
        return;
    }
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,ID,Class,Grade,Attendance\n";
    
    students.forEach(student => {
        csvContent += `${student.name},${student.id},${student.class},${student.grade},${student.attendance}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students.csv");
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    
    showToast('success', 'Export Successful', 'Student data has been exported as CSV.');
}

// Table Sorting Functions
function initializeTableSorting() {
    const sortableHeaders = document.querySelectorAll('th[data-sort]');
    
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sortBy = header.dataset.sort;
            const table = header.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            // Determine sort direction
            const currentDirection = header.dataset.direction || 'asc';
            const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
            header.dataset.direction = newDirection;
            
            // Sort rows
            rows.sort((a, b) => {
                const aValue = a.querySelector(`td:nth-child(${getColumnIndex(header)})`).textContent.trim();
                const bValue = b.querySelector(`td:nth-child(${getColumnIndex(header)})`).textContent.trim();
                
                // Handle numeric values
                if (!isNaN(aValue) && !isNaN(bValue)) {
                    return newDirection === 'asc' ? aValue - bValue : bValue - aValue;
                }
                
                // Handle string values
                return newDirection === 'asc' 
                    ? aValue.localeCompare(bValue) 
                    : bValue.localeCompare(aValue);
            });
            
            // Re-append sorted rows
            rows.forEach(row => tbody.appendChild(row));
            
            // Update sort icons
            sortableHeaders.forEach(h => {
                const icon = h.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-sort';
                }
            });
            
            const icon = header.querySelector('i');
            if (icon) {
                icon.className = newDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            }
        });
    });
}

function getColumnIndex(header) {
    const headers = Array.from(header.closest('thead').querySelectorAll('th'));
    return headers.indexOf(header) + 1;
}

// Pagination Functions
function initializePagination() {
    // Students pagination
    const studentsTableContainer = document.querySelector('.students-table-container');
    if (studentsTableContainer) {
        const prevPageBtn = studentsTableContainer.querySelector('#prev-page');
        const nextPageBtn = studentsTableContainer.querySelector('#next-page');
        const pageNumbers = studentsTableContainer.querySelectorAll('.pagination-number');
        
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => changePage('students', -1));
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => changePage('students', 1));
        }
        
        pageNumbers.forEach((pageBtn, index) => {
            pageBtn.addEventListener('click', () => goToPage('students', index + 1));
        });
    }
}

function updatePagination(tableType, totalItems) {
    const container = tableType === 'students' 
        ? document.querySelector('.students-table-container')
        : null;
    
    if (!container) return;
    
    const pagination = container.querySelector('.pagination');
    const pageNumbers = pagination.querySelector('.pagination-numbers');
    const prevBtn = pagination.querySelector('.pagination-btn:first-child');
    const nextBtn = pagination.querySelector('.pagination-btn:last-child');
    
    // For demo purposes, we'll show 5 items per page
    const itemsPerPage = 5;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Update page numbers
    pageNumbers.innerHTML = '';
    for (let i = 1; i <= Math.min(totalPages, 3); i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-number';
        if (i === 1) pageBtn.classList.add('active');
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => goToPage(tableType, i));
        pageNumbers.appendChild(pageBtn);
    }
    
    // Add ellipsis if there are more pages
    if (totalPages > 3) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        pageNumbers.appendChild(ellipsis);
        
        const lastPageBtn = document.createElement('button');
        lastPageBtn.className = 'pagination-number';
        lastPageBtn.textContent = totalPages;
        lastPageBtn.addEventListener('click', () => goToPage(tableType, totalPages));
        pageNumbers.appendChild(lastPageBtn);
    }
    
    // Update prev/next buttons
    prevBtn.disabled = true; // Always start on page 1
    nextBtn.disabled = totalPages <= 1;
}

function changePage(tableType, direction) {
    const container = tableType === 'students' 
        ? document.querySelector('.students-table-container')
        : null;
    
    if (!container) return;
    
    const pagination = container.querySelector('.pagination');
    const activePage = pagination.querySelector('.pagination-number.active');
    const currentPage = parseInt(activePage.textContent);
    const newPage = currentPage + direction;
    
    goToPage(tableType, newPage);
}

function goToPage(tableType, pageNumber) {
    const container = tableType === 'students' 
        ? document.querySelector('.students-table-container')
        : null;
    
    if (!container) return;
    
    const pagination = container.querySelector('.pagination');
    const pageNumbers = pagination.querySelectorAll('.pagination-number');
    const prevBtn = pagination.querySelector('.pagination-btn:first-child');
    const nextBtn = pagination.querySelector('.pagination-btn:last-child');
    
    // Update active page
    pageNumbers.forEach(pageBtn => {
        pageBtn.classList.remove('active');
        if (parseInt(pageBtn.textContent) === pageNumber) {
            pageBtn.classList.add('active');
        }
    });
    
    // Update prev/next buttons
    prevBtn.disabled = pageNumber === 1;
    nextBtn.disabled = pageNumber === parseInt(pageNumbers[pageNumbers.length - 1].textContent);
    
    // In a real app, this would fetch and display the appropriate page of data
    // For now, we'll just show a toast notification
    showToast('info', 'Page Changed', `Now showing page ${pageNumber}.`);
}

// Draggable Cards Functions
function initializeDraggableCards() {
    const dashboardCards = document.querySelectorAll('.dashboard-card, .chart-container');
    
    dashboardCards.forEach(card => {
        card.classList.add('draggable');
        card.draggable = true;
        
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', card.innerHTML);
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
        
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        card.addEventListener('dragenter', () => {
            if (card !== document.querySelector('.dragging')) {
                card.classList.add('drag-over');
            }
        });
        
        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });
        
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            
            const draggingCard = document.querySelector('.dragging');
            if (draggingCard !== card) {
                // Swap positions
                const allCards = Array.from(draggingCard.parentNode.children);
                const draggingIndex = allCards.indexOf(draggingCard);
                const targetIndex = allCards.indexOf(card);
                
                if (draggingIndex < targetIndex) {
                    card.parentNode.insertBefore(draggingCard, card.nextSibling);
                } else {
                    card.parentNode.insertBefore(draggingCard, card);
                }
                
                showToast('success', 'Layout Updated', 'Dashboard layout has been updated.');
            }
        });
    });
}

// Profile Management Functions
function showProfileModal() {
    // Get current user data from localStorage or use default
    const userData = JSON.parse(localStorage.getItem('user-profile')) || {
        name: 'Sarah Johnson',
        role: 'Math Teacher',
        email: 'sarah.johnson@school.edu',
        phone: '+1 (555) 123-4567',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    };
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">Edit Profile</h2>
            <button class="modal-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="profile-form">
                <div class="form-group">
                    <label class="form-label" for="profile-name">Full Name</label>
                    <input type="text" id="profile-name" class="form-input" value="${userData.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="profile-role">Role</label>
                    <input type="text" id="profile-role" class="form-input" value="${userData.role}" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="profile-email">Email</label>
                    <input type="email" id="profile-email" class="form-input" value="${userData.email}" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="profile-phone">Phone</label>
                    <input type="tel" id="profile-phone" class="form-input" value="${userData.phone}" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="profile-avatar">Avatar URL</label>
                    <input type="url" id="profile-avatar" class="form-input" value="${userData.avatar}" required>
                </div>
                <div class="avatar-preview">
                    <img id="avatar-preview-img" src="${userData.avatar}" alt="Avatar Preview">
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline modal-cancel">Cancel</button>
            <button class="btn btn-primary modal-save">Save Changes</button>
        </div>
    `;
    
    // Add modal to container
    modalContainer.innerHTML = '';
    modalContainer.appendChild(modal);
    
    // Show modal
    modalContainer.classList.add('active');
    
    // Add close button functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', closeModal);
    
    // Add cancel button functionality
    const cancelBtn = modal.querySelector('.modal-cancel');
    cancelBtn.addEventListener('click', closeModal);
    
    // Add save button functionality
    const saveBtn = modal.querySelector('.modal-save');
    saveBtn.addEventListener('click', () => {
        const form = document.getElementById('profile-form');
        if (form.checkValidity()) {
            saveProfile();
            closeModal();
        } else {
            form.reportValidity();
        }
    });
    
    // Add avatar preview functionality
    const avatarInput = document.getElementById('profile-avatar');
    const avatarPreview = document.getElementById('avatar-preview-img');
    
    avatarInput.addEventListener('input', () => {
        avatarPreview.src = avatarInput.value;
        avatarPreview.onerror = () => {
            // Fallback to a default avatar if URL is invalid
            avatarPreview.src = 'https://randomuser.me/api/portraits/women/44.jpg';
        };
    });
    
    // Close modal when clicking outside
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });
}

function saveProfile() {
    const userData = {
        name: document.getElementById('profile-name').value,
        role: document.getElementById('profile-role').value,
        email: document.getElementById('profile-email').value,
        phone: document.getElementById('profile-phone').value,
        avatar: document.getElementById('profile-avatar').value
    };
    
    // Save to localStorage
    localStorage.setItem('user-profile', JSON.stringify(userData));
    
    // Update sidebar profile
    updateSidebarProfile(userData);
    
    // Update teacher profile section
    const teacherProfile = getTeacherProfile();
    if (teacherProfile) {
        teacherProfile.name = userData.name;
        teacherProfile.email = userData.email;
        teacherProfile.avatar = userData.avatar;
        saveTeacherProfile(teacherProfile);
        updateTeacherUI(teacherProfile);
    }
    
    // Show success toast
    showToast('success', 'Profile Updated', 'Your profile has been updated successfully.');
}

function updateSidebarProfile(userData) {
    const userAvatar = document.querySelector('.user-avatar img');
    const userName = document.querySelector('.user-name');
    const userRole = document.querySelector('.user-role');
    
    if (userAvatar) userAvatar.src = userData.avatar;
    if (userName) userName.textContent = userData.name;
    if (userRole) userRole.textContent = userData.role;
}

// Password Change Functions
function showPasswordModal() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">Change Password</h2>
            <button class="modal-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="password-form">
                <div class="form-group">
                    <label class="form-label" for="current-password">Current Password</label>
                    <input type="password" id="current-password" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="new-password">New Password</label>
                    <input type="password" id="new-password" class="form-input" required>
                    <div class="password-strength">
                        <div class="strength-bar">
                            <div class="strength-indicator"></div>
                        </div>
                        <div class="strength-text">Password strength</div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="confirm-password">Confirm New Password</label>
                    <input type="password" id="confirm-password" class="form-input" required>
                </div>
                <div class="password-requirements">
                    <p>Password must:</p>
                    <ul>
                        <li>Be at least 8 characters long</li>
                        <li>Contain at least one uppercase letter</li>
                        <li>Contain at least one number</li>
                        <li>Contain at least one special character</li>
                    </ul>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline modal-cancel">Cancel</button>
            <button class="btn btn-primary modal-save">Change Password</button>
        </div>
    `;
    
    // Add modal to container
    modalContainer.innerHTML = '';
    modalContainer.appendChild(modal);
    
    // Show modal
    modalContainer.classList.add('active');
    
    // Add close button functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', closeModal);
    
    // Add cancel button functionality
    const cancelBtn = modal.querySelector('.modal-cancel');
    cancelBtn.addEventListener('click', closeModal);
    
    // Add save button functionality
    const saveBtn = modal.querySelector('.modal-save');
    saveBtn.addEventListener('click', () => {
        const form = document.getElementById('password-form');
        if (form.checkValidity()) {
            changePassword();
        } else {
            form.reportValidity();
        }
    });
    
    // Add password strength checker
    const newPasswordInput = document.getElementById('new-password');
    const strengthIndicator = document.querySelector('.strength-indicator');
    const strengthText = document.querySelector('.strength-text');
    
    newPasswordInput.addEventListener('input', () => {
        const password = newPasswordInput.value;
        const strength = checkPasswordStrength(password);
        
        // Update strength indicator
        strengthIndicator.style.width = strength.percentage + '%';
        strengthIndicator.style.backgroundColor = strength.color;
        
        // Update strength text
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
    });
    
    // Close modal when clicking outside
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });
}

function checkPasswordStrength(password) {
    // Check password strength
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Uppercase check
    if (/[A-Z]/.test(password)) strength += 25;
    
    // Number check
    if (/[0-9]/.test(password)) strength += 25;
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    
    // Return strength object
    if (strength === 0) {
        return { percentage: 0, color: '#f44336', text: 'Very Weak' };
    } else if (strength <= 25) {
        return { percentage: 25, color: '#ff9800', text: 'Weak' };
    } else if (strength <= 50) {
        return { percentage: 50, color: '#ffeb3b', text: 'Fair' };
    } else if (strength <= 75) {
        return { percentage: 75, color: '#8bc34a', text: 'Good' };
    } else {
        return { percentage: 100, color: '#4caf50', text: 'Strong' };
    }
}

function changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // In a real app, you would verify the current password with the backend
    // For demo purposes, we'll just check if new passwords match
    if (newPassword !== confirmPassword) {
        showToast('error', 'Password Mismatch', 'New passwords do not match.');
        return;
    }
    
    // Check password strength
    const strength = checkPasswordStrength(newPassword);
    if (strength.percentage < 50) {
        showToast('error', 'Weak Password', 'Please choose a stronger password.');
        return;
    }
    
    // Simulate password change (in a real app, this would be an API call)
    setTimeout(() => {
        showToast('success', 'Password Changed', 'Your password has been changed successfully.');
        closeModal();
    }, 1000);
}

// Connected Accounts Functions
function showConnectedAccountsModal() {
    // Get connected accounts from localStorage or use default
    const connectedAccounts = JSON.parse(localStorage.getItem('connected-accounts')) || [
        { provider: 'Google', connected: true, email: 'sarah.johnson@gmail.com' },
        { provider: 'Microsoft', connected: false, email: '' },
        { provider: 'Apple', connected: false, email: '' }
    ];
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">Connected Accounts</h2>
            <button class="modal-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="connected-accounts-list">
                ${connectedAccounts.map(account => `
                    <div class="connected-account-item">
                        <div class="account-info">
                            <div class="account-icon">
                                <i class="fab fa-${account.provider.toLowerCase()}"></i>
                            </div>
                            <div class="account-details">
                                <div class="account-provider">${account.provider}</div>
                                ${account.connected ? `<div class="account-email">${account.email}</div>` : '<div class="account-status">Not connected</div>'}
                            </div>
                        </div>
                        <div class="account-actions">
                            ${account.connected 
                                ? `<button class="btn btn-outline disconnect-account" data-provider="${account.provider}">Disconnect</button>`
                                : `<button class="btn btn-primary connect-account" data-provider="${account.provider}">Connect</button>`
                            }
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline modal-cancel">Close</button>
        </div>
    `;
    
    // Add modal to container
    modalContainer.innerHTML = '';
    modalContainer.appendChild(modal);
    
    // Show modal
    modalContainer.classList.add('active');
    
    // Add close button functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', closeModal);
    
    // Add cancel button functionality
    const cancelBtn = modal.querySelector('.modal-cancel');
    cancelBtn.addEventListener('click', closeModal);
    
    // Add connect/disconnect functionality
    const connectButtons = modal.querySelectorAll('.connect-account');
    const disconnectButtons = modal.querySelectorAll('.disconnect-account');
    
    connectButtons.forEach(button => {
        button.addEventListener('click', () => {
            const provider = button.dataset.provider;
            connectAccount(provider);
        });
    });
    
    disconnectButtons.forEach(button => {
        button.addEventListener('click', () => {
            const provider = button.dataset.provider;
            disconnectAccount(provider);
        });
    });
    
    // Close modal when clicking outside
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });
}

function connectAccount(provider) {
    // In a real app, this would initiate OAuth flow
    // For demo purposes, we'll simulate the connection
    
    // Get user email (in a real app, this would come from the OAuth provider)
    const email = prompt(`Enter your ${provider} email:`);
    
    if (email) {
        // Get connected accounts from localStorage
        const connectedAccounts = JSON.parse(localStorage.getItem('connected-accounts')) || [
            { provider: 'Google', connected: false, email: '' },
            { provider: 'Microsoft', connected: false, email: '' },
            { provider: 'Apple', connected: false, email: '' }
        ];
        
        // Update the connected account
        const accountIndex = connectedAccounts.findIndex(account => account.provider === provider);
        if (accountIndex !== -1) {
            connectedAccounts[accountIndex] = {
                provider: provider,
                connected: true,
                email: email
            };
            
            // Save to localStorage
            localStorage.setItem('connected-accounts', JSON.stringify(connectedAccounts));
            
            // Show success toast
            showToast('success', 'Account Connected', `Your ${provider} account has been connected successfully.`);
            
            // Refresh the modal
            closeModal();
            showConnectedAccountsModal();
        }
    }
}

function disconnectAccount(provider) {
    // Get connected accounts from localStorage
    const connectedAccounts = JSON.parse(localStorage.getItem('connected-accounts')) || [];
    
    // Update the connected account
    const accountIndex = connectedAccounts.findIndex(account => account.provider === provider);
    if (accountIndex !== -1) {
        connectedAccounts[accountIndex] = {
            provider: provider,
            connected: false,
            email: ''
        };
        
        // Save to localStorage
        localStorage.setItem('connected-accounts', JSON.stringify(connectedAccounts));
        
        // Show success toast
        showToast('success', 'Account Disconnected', `Your ${provider} account has been disconnected.`);
        
        // Refresh the modal
        closeModal();
        showConnectedAccountsModal();
    }
}

// Toast Notification Functions
function showToast(type, title, message, duration = 5000) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle toast-icon"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle toast-icon"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle toast-icon"></i>';
            break;
        case 'info':
            icon = '<i class="fas fa-info-circle toast-icon"></i>';
            break;
    }
    
    // Set toast content
    toast.innerHTML = `
        ${icon}
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Add close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto remove after duration
    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

function removeToast(toast) {
    toast.style.animation = 'slideOut 0.3s forwards';
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// Modal Functions
function closeModal() {
    modalContainer.classList.remove('active');
}

function showLogoutModal() {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">Confirm Logout</h2>
            <button class="modal-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <p>Are you sure you want to logout?</p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline modal-cancel">Cancel</button>
            <button class="btn btn-primary modal-confirm">Logout</button>
        </div>
    `;
    
    // Add modal to container
    modalContainer.innerHTML = '';
    modalContainer.appendChild(modal);
    
    // Show modal
    modalContainer.classList.add('active');
    
    // Add close button functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', closeModal);
    
    // Add cancel button functionality
    const cancelBtn = modal.querySelector('.modal-cancel');
    cancelBtn.addEventListener('click', closeModal);
    
    // Add confirm button functionality
    const confirmBtn = modal.querySelector('.modal-confirm');
    confirmBtn.addEventListener('click', () => {
        closeModal();
        
        // Clear teacher profile from localStorage
        localStorage.removeItem('teacherProfile');
        
        // Show success toast
        showToast('info', 'Logged Out', 'You have been successfully logged out.');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'teacher-login.html';
        }, 1500);
    });
    
    // Close modal when clicking outside
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });
}

// Firebase Simulation
// In a real implementation, this would connect to Firebase Firestore
const firebaseSimulation = {
    // Simulate fetching user data
    getUserData: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    name: 'Sarah Johnson',
                    role: 'Math Teacher',
                    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
                });
            }, 500);
        });
    },
    
    // Simulate fetching dashboard data
    getDashboardData: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    students: 0,
                    assignments: 0,
                    averageScore: 0,
                    attendance: 0,
                    recentActivity: []
                });
            }, 800);
        });
    },
    
    // Simulate fetching analytics data
    getAnalyticsData: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(null);
            }, 1000);
        });
    },
    
    // Simulate saving settings
    saveSettings: (settings) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 600);
        });
    }
};

// Example of using the Firebase simulation
// This would be replaced with actual Firebase integration in a real app
async function loadDashboardData() {
    try {
        const userData = await firebaseSimulation.getUserData();
        const dashboardData = await firebaseSimulation.getDashboardData();
        const analyticsData = await firebaseSimulation.getAnalyticsData();
        
        // Update UI with fetched data
        // This is just a simulation, in a real app you would update the DOM with the fetched data
        console.log('User Data:', userData);
        console.log('Dashboard Data:', dashboardData);
        console.log('Analytics Data:', analyticsData);
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('error', 'Error', 'Failed to load dashboard data. Please try again.');
    }
}

// Uncomment to test the Firebase simulation
// loadDashboardData();