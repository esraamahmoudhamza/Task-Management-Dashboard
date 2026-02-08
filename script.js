// ==========================
// Global variables
// ==========================
let tasks = JSON.parse(localStorage.getItem('tasks')) || {};
let currentDate = new Date();
let selectedDate = null;
let editingTaskId = null;
let categories = ['Work', 'Personal', 'Health', 'Education'];
let categoryColors = {
    'Work': '#4a90e2',
    'Personal': '#e74c3c',
    'Health': '#2ecc71',
    'Education': '#f39c12'
};

// ==========================
// DOM Elements
// ==========================
const calendarEl = document.getElementById('calendar');
const taskPanel = document.getElementById('task-panel');
const selectedDateEl = document.getElementById('selected-date');
const taskDetails = document.getElementById('task-details');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');
const filterCategory = document.getElementById('filter-category');
const filterPriority = document.getElementById('filter-priority');
const themeToggle = document.getElementById('theme-toggle');
const categoryColorsEl = document.getElementById('category-colors');
const categoriesDatalist = document.getElementById('categories');
const monthYearEl = document.getElementById('month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

// ==========================
// Initialization
// ==========================
init();

function init() {
    renderCalendar();
    updateCategories();
    setupEventListeners();
    applyTheme();
}

// ==========================
// Event Listeners
// ==========================
function setupEventListeners() {
    addTaskBtn.addEventListener('click', () => openModal());
    taskForm.addEventListener('submit', saveTask);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    filterCategory.addEventListener('change', () => renderTasks(selectedDate));
    filterPriority.addEventListener('change', () => renderTasks(selectedDate));
    themeToggle.addEventListener('click', toggleTheme);
    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));

    // Category color selection
    categoryColorsEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-color')) {
            document.querySelectorAll('.category-color').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');
            document.getElementById('task-category').value = e.target.dataset.category;
        }
    });

    // Priority selection
    document.querySelectorAll('.priority-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.priority-option').forEach(el => el.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
}

// ==========================
// Calendar Functions
// ==========================
function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    calendarEl.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    monthYearEl.textContent = `${monthNames[month]} ${year}`;

    // Day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day';
        header.innerHTML = `<div class="day-number">${day}</div>`;
        calendarEl.appendChild(header);
    });

    // Empty cells for first day
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'day';
        calendarEl.appendChild(empty);
    }

    // Days
    for (let day = 1; day <= lastDay; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'day';
        const dateKey = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        dayEl.innerHTML = `<div class="day-number">${day}</div>`;

        if (tasks[dateKey] && tasks[dateKey].length>0) {
            dayEl.classList.add('has-tasks');
            const taskList = document.createElement('ul');
            taskList.className = 'task-list';
            tasks[dateKey].forEach(task => {
                const taskItem = document.createElement('li');
                taskItem.className = 'task-item';
                taskItem.draggable = true;
                taskItem.dataset.taskId = task.id;
                taskItem.innerHTML = `<i class="fas fa-${getIcon(task.category)}"></i> ${task.title}`;
                taskItem.addEventListener('dragstart', handleDragStart);
                taskList.appendChild(taskItem);
            });
            dayEl.appendChild(taskList);
        }

        dayEl.addEventListener('click', () => selectDay(dateKey));
        dayEl.addEventListener('dragover', handleDragOver);
        dayEl.addEventListener('drop', (e) => handleDrop(e, dateKey));
        calendarEl.appendChild(dayEl);
    }
}

// ==========================
// Task Functions
// ==========================
function selectDay(dateKey) {
    selectedDate = dateKey;
    const [year, month, day] = dateKey.split('-');
    selectedDateEl.textContent = new Date(year, month - 1, day).toDateString();
    taskPanel.style.display = 'block';
    renderTasks(dateKey);
}

function renderTasks(dateKey) {
    taskDetails.innerHTML = '';
    if (!tasks[dateKey]) return;

    const categoryFilterValue = filterCategory ? filterCategory.value : '';
    const priorityFilterValue = filterPriority ? filterPriority.value : '';

    tasks[dateKey].forEach(task => {
        if ((categoryFilterValue === '' || task.category === categoryFilterValue) &&
            (priorityFilterValue === '' || task.priority === priorityFilterValue)) {

            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.style.borderLeft = `5px solid ${categoryColors[task.category] || '#ccc'}`;
            taskCard.innerHTML = `
                <div class="task-info">
                    <div class="task-title"><i class="fas fa-${getIcon(task.category)}"></i> ${task.title}</div>
                    <div class="task-desc">${task.description || ''}</div>
                    <div class="task-meta">Priority: ${task.priority} ${task.time ? '| Time: ' + task.time : ''}</div>
                </div>
                <div class="task-actions">
                    <button class="btn" onclick="editTask('${task.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteTask('${task.id}')">Delete</button>
                </div>
            `;
            taskDetails.appendChild(taskCard);
        }
    });
}

// ==========================
// Modal & Task CRUD
// ==========================
function openModal(task = null) {
    taskModal.classList.add('show');
    if (task) {
        editingTaskId = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description;
        document.getElementById('task-category').value = task.category;
        document.querySelectorAll('.priority-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector(`.priority-option[data-priority="${task.priority}"]`)?.classList.add('selected');
        document.getElementById('task-time').value = task.time || '';
        modalTitle.textContent = "Edit Task";
    } else {
        taskForm.reset();
        modalTitle.textContent = "Add Task";
        editingTaskId = null;
    }
}

function closeModal() {
    taskModal.classList.remove('show');
}

function saveTask(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const category = document.getElementById('task-category').value || 'General';
    const priority = document.querySelector('.priority-option.selected')?.dataset.priority || 'low';
    const time = document.getElementById('task-time').value;

    if (!tasks[selectedDate]) tasks[selectedDate] = [];

    if (editingTaskId) {
        const idx = tasks[selectedDate].findIndex(t => t.id === editingTaskId);
        tasks[selectedDate][idx] = {id: editingTaskId, title, description, category, priority, time};
    } else {
        const id = Date.now().toString();
        tasks[selectedDate].push({id, title, description, category, priority, time});
    }

    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderCalendar();
    renderTasks(selectedDate);
    closeModal();
}

function editTask(id) {
    const task = tasks[selectedDate].find(t => t.id === id);
    openModal(task);
}

function deleteTask(id) {
    tasks[selectedDate] = tasks[selectedDate].filter(t => t.id !== id);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderCalendar();
    renderTasks(selectedDate);
}

// ==========================
// Drag & Drop
// ==========================
let draggedTaskId = null;
function handleDragStart(e) {
    draggedTaskId = e.target.dataset.taskId;
}
function handleDragOver(e) {
    e.preventDefault();
}
function handleDrop(e, dateKey) {
    if (!draggedTaskId) return;
    const taskIndex = tasks[selectedDate].findIndex(t => t.id === draggedTaskId);
    const [movedTask] = tasks[selectedDate].splice(taskIndex, 1);
    if (!tasks[dateKey]) tasks[dateKey] = [];
    tasks[dateKey].push(movedTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderCalendar();
    if (selectedDate === dateKey) renderTasks(selectedDate);
    draggedTaskId = null;
}

// ==========================
// Utilities
// ==========================
function getIcon(category) {
    switch(category.toLowerCase()) {
        case 'work': return 'briefcase';
        case 'personal': return 'user';
        case 'health': return 'heart';
        case 'education': return 'book';
        default: return 'sticky-note';
    }
}

function updateCategories() {
    filterCategory.innerHTML = `<option value="">All Categories</option>`;
    categories.forEach(cat => filterCategory.innerHTML += `<option value="${cat}">${cat}</option>`);
    categoriesDatalist.innerHTML = '';
    categories.forEach(cat => categoriesDatalist.innerHTML += `<option value="${cat}">`);
    categoryColorsEl.innerHTML = '';
    categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-color';
        div.style.backgroundColor = categoryColors[cat];
        div.dataset.category = cat;
        categoryColorsEl.appendChild(div);
    });
}

// ==========================
// Dark Mode
// ==========================
function applyTheme() {
    if(localStorage.getItem('theme') === 'dark') document.body.setAttribute('data-theme','dark');
}
function toggleTheme() {
    if(document.body.getAttribute('data-theme') === 'dark') {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme','light');
    } else {
        document.body.setAttribute('data-theme','dark');
        localStorage.setItem('theme','dark');
    }
}
