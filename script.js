// Global variables for view state
let currentView = 'all';
let selectedBatch = null;
let selectedFaculty = null;

// Calculate total students based on batches and students per batch
function updateTotalStudents() {
    const numBatches = parseInt(document.getElementById('num-batches').value) || 0;
    const studentsPerBatch = parseInt(document.getElementById('students-per-batch').value) || 0;
    
    document.getElementById('total-students').value = numBatches * studentsPerBatch;
}

// Initialize theme based on saved preference
function initTheme() {
    const savedTheme = localStorage.getItem('planova-theme') || 'light';
    applyTheme(savedTheme);
    
    // Setup theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Update total students when batch inputs change
    document.getElementById('num-batches').addEventListener('input', updateTotalStudents);
    document.getElementById('students-per-batch').addEventListener('input', updateTotalStudents);
}

// Toggle between light and dark themes
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    applyTheme(newTheme);
    localStorage.setItem('planova-theme', newTheme);
}

// Apply the selected theme to the document
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (theme === 'dark') {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Add a new subject input group
function addSubject() {
    const subjectsDiv = document.getElementById('subjects');
    const newSubject = document.createElement('div');
    newSubject.className = 'input-group';
    newSubject.innerHTML = `
        <div class="input-field">
            <label>Name:</label>
            <input type="text" class="subject-name" required placeholder="Enter subject name">
        </div>
        <div class="input-field">
            <label>Hours per week:</label>
            <input type="number" class="subject-hours" required min="1" max="15" placeholder="Hours required">
        </div>
        <div class="input-field">
            <label>Students:</label>
            <input type="number" class="subject-students" required min="1" placeholder="Number of students">
        </div>
        <div class="input-field">
            <label>Faculty:</label>
            <input type="text" class="subject-faculty" required placeholder="Comma-separated names">
        </div>
        <button class="remove-btn" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i> Remove
        </button>
    `;
    subjectsDiv.appendChild(newSubject);
}

// Add a new room input group
function addRoom() {
    const roomsDiv = document.getElementById('rooms');
    const newRoom = document.createElement('div');
    newRoom.className = 'input-group';
    newRoom.innerHTML = `
        <div class="input-field">
            <label>Name:</label>
            <input type="text" class="room-name" required placeholder="Enter room name">
        </div>
        <div class="input-field">
            <label>Capacity:</label>
            <input type="number" class="room-capacity" required min="1" placeholder="Room capacity">
        </div>
        <div class="input-field">
            <label>Type:</label>
            <select class="room-type" required>
                <option value="classroom">Classroom</option>
                <option value="lab">Laboratory</option>
            </select>
        </div>
        <button class="remove-btn" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i> Remove
        </button>
    `;
    roomsDiv.appendChild(newRoom);
}

// Add a new lab input group
function addLab() {
    const labsDiv = document.getElementById('labs');
    const newLab = document.createElement('div');
    newLab.className = 'input-group';
    newLab.innerHTML = `
        <div class="input-field">
            <label>Name:</label>
            <input type="text" class="lab-name" required placeholder="Enter lab name">
        </div>
        <div class="input-field">
            <label>Hours per week:</label>
            <input type="number" class="lab-hours" required min="2" max="12" step="2" placeholder="Hours required">
        </div>
        <div class="input-field">
            <label>Room:</label>
            <input type="text" class="lab-room" required placeholder="Enter lab room">
        </div>
        <div class="input-field">
            <label>Faculty:</label>
            <input type="text" class="lab-faculty" required placeholder="Comma-separated names">
        </div>
        <button class="remove-btn" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i> Remove
        </button>
    `;
    labsDiv.appendChild(newLab);
}

// Collect form data for submission
function collectFormData() {
    // Batch data
    const numBatches = parseInt(document.getElementById('num-batches').value) || 1;
    const studentsPerBatch = parseInt(document.getElementById('students-per-batch').value) || 0;
    
    // Subject data
    const subjectGroups = document.querySelectorAll('#subjects .input-group');
    const subjects = [];
    const faculties = new Set();
    
    subjectGroups.forEach(group => {
        const name = group.querySelector('.subject-name').value;
        const hours = parseInt(group.querySelector('.subject-hours').value) || 0;
        const students = parseInt(group.querySelector('.subject-students').value) || 0;
        const facultyInput = group.querySelector('.subject-faculty').value;
        const faculty = facultyInput.split(',').map(f => f.trim()).filter(f => f !== '');
        
        if (name && hours > 0 && students > 0 && faculty.length > 0) {
            subjects.push({ name, hours, students, faculty });
            faculty.forEach(f => faculties.add(f));
        }
    });
    
    // Room data
    const roomGroups = document.querySelectorAll('#rooms .input-group');
    const rooms = [];
    
    roomGroups.forEach(group => {
        const name = group.querySelector('.room-name').value;
        const capacity = parseInt(group.querySelector('.room-capacity').value) || 0;
        const type = group.querySelector('.room-type').value;
        
        if (name && capacity > 0) {
            rooms.push({ name, capacity, type });
        }
    });
    
    // Lab data
    const labGroups = document.querySelectorAll('#labs .input-group');
    const labs = [];
    
    labGroups.forEach(group => {
        const name = group.querySelector('.lab-name').value;
        const hours = parseInt(group.querySelector('.lab-hours').value) || 0;
        const room = group.querySelector('.lab-room').value;
        const facultyInput = group.querySelector('.lab-faculty').value;
        const faculty = facultyInput.split(',').map(f => f.trim()).filter(f => f !== '');
        
        if (name && hours > 0 && room && faculty.length > 0) {
            labs.push({ name, hours, room, faculty });
            faculty.forEach(f => faculties.add(f));
        }
    });
    
    return {
        subjects,
        rooms,
        labs,
        faculties: Array.from(faculties),
        num_batches: numBatches,
        students_per_batch: studentsPerBatch
    };
}

function generateTimetable() {
    const loading = document.querySelector('.loading');
    loading.classList.add('active');
    
    const data = collectFormData();
    console.log('Sending data to server:', data);
    
    // Validate data before sending
    if (data.subjects.length === 0) {
        alert('Please add at least one subject');
        loading.classList.remove('active');
        return;
    }
    
    if (data.rooms.length === 0) {
        alert('Please add at least one room');
        loading.classList.remove('active');
        return;
    }
    
    if (data.num_batches < 1) {
        alert('Number of batches must be at least 1');
        loading.classList.remove('active');
        return;
    }
    
    if (data.students_per_batch < 1) {
        alert('Students per batch must be at least 1');
        loading.classList.remove('active');
        return;
    }
    
    fetch('/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.error || 'Server error');
            }).catch(() => {
                // If JSON parsing fails
                throw new Error(`Server error: ${response.status}`);
            });
        }
        return response.json().catch(err => {
            console.error('JSON parsing error:', err);
            throw new Error('Failed to parse server response');
        });
    })
    .then(response => {
        console.log('Received response:', response);
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        const timetable = response.timetable;
        const analysis = response.analysis;
        
        // Validate the timetable data structure
        if (!timetable || typeof timetable !== 'object' || Object.keys(timetable).length === 0) {
            throw new Error('Empty or invalid timetable received');
        }
        
        // Verify that we have the expected days
        const requiredDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        for (const day of requiredDays) {
            if (!timetable[day] || !Array.isArray(timetable[day])) {
                console.warn(`Missing or invalid data for ${day}`);
            }
        }
        
        try {
            renderTimetable(timetable, data.num_batches);
            
            // Display timetable analysis if available
            if (analysis) {
                renderAnalysis(analysis);
            }
            
            document.getElementById('save-btn').disabled = false;
        } catch (renderError) {
            console.error('Error rendering timetable:', renderError);
            throw new Error('Failed to render timetable: ' + renderError.message);
        } finally {
            loading.classList.remove('active');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error: ' + error.message);
        loading.classList.remove('active');
    });
}

function renderTimetable(timetable, numBatches) {
    const timetableDiv = document.getElementById('timetable');
    timetableDiv.innerHTML = '';
    
    const timeSlots = ['9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-1:00', '1:00-2:00', '2:00-3:00', '3:00-4:00', '4:00-5:00'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Create the timetable HTML
    const table = document.createElement('table');
    
    // Create the header row
    const headerRow = document.createElement('tr');
    const cornerCell = document.createElement('th');
    cornerCell.textContent = 'Day / Time';
    headerRow.appendChild(cornerCell);
    
    // Add time slots to header
    timeSlots.forEach(slot => {
        const th = document.createElement('th');
        th.textContent = slot;
        headerRow.appendChild(th);
    });
    
    table.appendChild(headerRow);
    
    // Add data rows for each day
    for (const day of days) {
        try {
            if (!timetable[day] || !Array.isArray(timetable[day])) {
                console.warn(`No data for ${day}, creating empty row`);
                const emptyRow = document.createElement('tr');
                const dayCell = document.createElement('th');
                dayCell.textContent = day;
                emptyRow.appendChild(dayCell);
                
                for (let i = 0; i < timeSlots.length; i++) {
                    const cell = document.createElement('td');
                    cell.textContent = 'No Data';
                    emptyRow.appendChild(cell);
                }
                
                table.appendChild(emptyRow);
                continue;
            }

            const dayRow = document.createElement('tr');
            const dayCell = document.createElement('th');
            dayCell.textContent = day;
            dayRow.appendChild(dayCell);
            
            // Process each time slot
            for (let slot = 0; slot < timeSlots.length; slot++) {
                if (slot >= timetable[day].length) {
                    console.warn(`Missing data for ${day} at slot ${slot}, adding empty cell`);
                    const cell = document.createElement('td');
                    cell.textContent = 'No Data';
                    dayRow.appendChild(cell);
                    continue;
                }
                
                const slotData = timetable[day][slot];
                const cell = document.createElement('td');
                
                // Determine cell content based on slot data
                if (slotData.whole_class && slotData.whole_class.type === 'break') {
                    cell.className = 'break';
                    cell.innerHTML = '<strong>Lunch Break</strong>';
                }
                else if (slotData.whole_class && slotData.whole_class.type === 'theory') {
                    cell.className = 'theory';
                    const subject = slotData.whole_class.subject || 'Unknown';
                    const faculty = slotData.whole_class.faculty || 'Unassigned';
                    const room = slotData.whole_class.room || 'Unassigned';
                    
                    cell.innerHTML = `
                        <strong>${subject}</strong><br>
                        Faculty: ${faculty}<br>
                        Room: ${room}
                    `;
                    
                    // Add data attributes for filtering
                    if (faculty && faculty !== 'Unassigned') {
                        cell.dataset.faculty = faculty;
                    }
                }
                else if (slotData.whole_class && slotData.whole_class.type === 'lab_session') {
                    cell.className = 'lab';
                    cell.innerHTML = '<strong>Lab Sessions</strong><br>';
                    
                    // For each batch, show their lab
                    for (let b = 1; b <= numBatches; b++) {
                        const batchName = `batch_${b}`;
                        if (slotData[batchName] && slotData[batchName].type === 'lab') {
                            const batchContainer = document.createElement('div');
                            batchContainer.className = 'batch-container';
                            batchContainer.dataset.batch = b;
                            
                            const subject = slotData[batchName].subject || 'Unknown Lab';
                            const faculty = slotData[batchName].faculty || 'Unassigned';
                            const room = slotData[batchName].room || 'Unassigned';
                            
                            // Only set faculty data attribute if faculty exists
                            if (faculty && faculty !== 'Unassigned') {
                                batchContainer.dataset.faculty = faculty;
                            }
                            
                            batchContainer.innerHTML = `
                                <span class="batch-label">Batch ${b}</span>
                                <strong>${subject}</strong><br>
                                Faculty: ${faculty}<br>
                                Room: ${room}
                            `;
                            
                            cell.appendChild(batchContainer);
                        }
                    }
                }
                else {
                    cell.innerHTML = 'Free';
                }
                
                dayRow.appendChild(cell);
            }
            
            table.appendChild(dayRow);
            
        } catch (error) {
            console.error(`Error rendering day ${day}:`, error);
            // Add error cells if something fails
            const errorRow = document.createElement('tr');
            const dayCell = document.createElement('th');
            dayCell.textContent = day;
            errorRow.appendChild(dayCell);
            
            for (let i = 0; i < timeSlots.length; i++) {
                const cell = document.createElement('td');
                cell.innerHTML = 'Error';
                errorRow.appendChild(cell);
            }
            
            table.appendChild(errorRow);
        }
    }
    
    // Add the table to the container
    timetableDiv.appendChild(table);
    
    // Create view filters
    createViewFilters(numBatches, timetable);
    
    // Reset view state
    currentView = 'all';
    selectedBatch = null;
    selectedFaculty = null;
    
    // Apply initial filter
    filterView('all');
    
    // Show the view options
    document.getElementById('view-options').style.display = 'flex';
}

function createViewFilters(numBatches, timetable) {
    // Create view options container
    const viewOptionsContainer = document.getElementById('view-options');
    viewOptionsContainer.innerHTML = '';
    
    // Add the "All Classes" button
    const allButton = document.createElement('button');
    allButton.className = 'view-btn active';
    allButton.textContent = 'All Classes';
    allButton.dataset.view = 'all';
    
    allButton.addEventListener('click', function() {
        filterView('all');
    });
    
    viewOptionsContainer.appendChild(allButton);
    
    // Create batch buttons container
    const batchButtonsContainer = document.createElement('div');
    batchButtonsContainer.id = 'batch-view-buttons';
    
    // Add batch filter buttons
    for (let b = 1; b <= numBatches; b++) {
        const button = document.createElement('button');
        button.className = 'view-btn';
        button.textContent = `Batch ${b}`;
        button.dataset.view = 'batch';
        button.dataset.batch = b;
        
        button.addEventListener('click', function() {
            filterView('batch', b);
        });
        
        batchButtonsContainer.appendChild(button);
    }
    
    viewOptionsContainer.appendChild(batchButtonsContainer);
    
    // Create faculty buttons container
    const facultyButtonsContainer = document.createElement('div');
    facultyButtonsContainer.id = 'faculty-view-buttons';
    
    // Add faculty filter buttons
    const faculties = collectAllFaculties(timetable);
    faculties.forEach(faculty => {
        const button = document.createElement('button');
        button.className = 'view-btn';
        button.textContent = faculty;
        button.dataset.view = 'faculty';
        button.dataset.faculty = faculty;
        
        button.addEventListener('click', function() {
            filterView('faculty', faculty);
        });
        
        facultyButtonsContainer.appendChild(button);
    });
    
    viewOptionsContainer.appendChild(facultyButtonsContainer);
}

function collectAllFaculties(timetable) {
    const faculties = new Set();
    
    // Extract all faculty names from the timetable
    for (const day in timetable) {
        for (const slot of timetable[day]) {
            // Check whole class
            if (slot.whole_class && slot.whole_class.faculty) {
                faculties.add(slot.whole_class.faculty);
            }
            
            // Check each batch
            for (const key in slot) {
                if (key !== 'whole_class' && slot[key] && slot[key].faculty) {
                    faculties.add(slot[key].faculty);
                }
            }
        }
    }
    
    return Array.from(faculties);
}

function renderAnalysis(analysis) {
    const analysisDiv = document.getElementById('timetable-analysis');
    if (!analysisDiv) return;
    
    // Clear previous analysis
    analysisDiv.innerHTML = '';
    
    // Create main analysis container
    const container = document.createElement('div');
    container.className = 'analysis-container';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'analysis-header';
    header.innerHTML = '<h3>Timetable Analysis</h3>';
    container.appendChild(header);
    
    // Add suggestions section
    if (analysis.suggestions && analysis.suggestions.length > 0) {
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'suggestions-container';
        
        const suggestionsTitle = document.createElement('h4');
        suggestionsTitle.textContent = 'Suggestions:';
        suggestionsContainer.appendChild(suggestionsTitle);
        
        const suggestionsList = document.createElement('ul');
        analysis.suggestions.forEach(suggestion => {
            const item = document.createElement('li');
            item.textContent = suggestion;
            suggestionsList.appendChild(item);
        });
        
        suggestionsContainer.appendChild(suggestionsList);
        container.appendChild(suggestionsContainer);
    }
    
    // Add faculty workload section if available
    if (analysis.faculty_workload && Object.keys(analysis.faculty_workload).length > 0) {
        const workloadContainer = document.createElement('div');
        workloadContainer.className = 'workload-container';
        
        const workloadTitle = document.createElement('h4');
        workloadTitle.textContent = 'Faculty Workload:';
        workloadContainer.appendChild(workloadTitle);
        
        // Basic stats
        const statsDiv = document.createElement('div');
        statsDiv.className = 'workload-stats';
        statsDiv.innerHTML = `
            <p><strong>Average: </strong>${analysis.faculty_workload.average} classes per faculty</p>
            <p><strong>Range: </strong>${analysis.faculty_workload.min} to ${analysis.faculty_workload.max} classes</p>
        `;
        workloadContainer.appendChild(statsDiv);
        
        // Add loadable faculty detail section (expandable)
        if (analysis.faculty_workload.by_faculty) {
            const detailsToggle = document.createElement('button');
            detailsToggle.className = 'details-toggle';
            detailsToggle.textContent = 'Show Faculty Details';
            workloadContainer.appendChild(detailsToggle);
            
            const detailsContent = document.createElement('div');
            detailsContent.className = 'faculty-details';
            detailsContent.style.display = 'none';
            
            // Create a table for faculty workloads
            const table = document.createElement('table');
            table.className = 'faculty-workload-table';
            
            // Add header row
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = '<th>Faculty</th><th>Total Classes</th>';
            table.appendChild(headerRow);
            
            // Add rows for each faculty
            Object.entries(analysis.faculty_workload.by_faculty).forEach(([faculty, load]) => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${faculty}</td><td>${load}</td>`;
                table.appendChild(row);
            });
            
            detailsContent.appendChild(table);
            workloadContainer.appendChild(detailsContent);
            
            // Toggle details visibility
            detailsToggle.addEventListener('click', () => {
                if (detailsContent.style.display === 'none') {
                    detailsContent.style.display = 'block';
                    detailsToggle.textContent = 'Hide Faculty Details';
                } else {
                    detailsContent.style.display = 'none';
                    detailsToggle.textContent = 'Show Faculty Details';
                }
            });
        }
        
        container.appendChild(workloadContainer);
    }
    
    // Add gap analysis section if available
    if (analysis.gap_analysis && analysis.gap_analysis.total_gaps > 0) {
        const gapContainer = document.createElement('div');
        gapContainer.className = 'gap-container';
        
        const gapTitle = document.createElement('h4');
        gapTitle.textContent = 'Scheduling Gaps:';
        gapContainer.appendChild(gapTitle);
        
        const gapInfo = document.createElement('p');
        gapInfo.textContent = `Total gaps detected: ${analysis.gap_analysis.total_gaps}`;
        gapContainer.appendChild(gapInfo);
        
        container.appendChild(gapContainer);
    }
    
    // Append the analysis container to the analysis div
    analysisDiv.appendChild(container);
    
    // Make analysis section visible
    analysisDiv.style.display = 'block';
}

function filterView(viewType, value = null) {
    // Update global state
    currentView = viewType;
    if (viewType === 'batch') {
        selectedBatch = value;
        selectedFaculty = null;
    } else if (viewType === 'faculty') {
        selectedFaculty = value;
        selectedBatch = null;
    } else {
        selectedBatch = null;
        selectedFaculty = null;
    }
    
    // Update button states
    const buttons = document.querySelectorAll('.view-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        
        if (viewType === 'all' && btn.dataset.view === 'all') {
            btn.classList.add('active');
        }
        else if (viewType === 'batch' && btn.dataset.view === 'batch' && btn.dataset.batch == value) {
            btn.classList.add('active');
        }
        else if (viewType === 'faculty' && btn.dataset.view === 'faculty' && btn.dataset.faculty === value) {
            btn.classList.add('active');
        }
    });
    
    // Apply filters to timetable cells
    const allCells = document.querySelectorAll('td');
    
    allCells.forEach(cell => {
        // Reset visibility first
        cell.style.opacity = '1';
        
        // Get all batch containers within this cell
        const batchContainers = cell.querySelectorAll('.batch-container');
        
        if (viewType === 'batch' && batchContainers.length > 0) {
            // For batch view, hide batches not matching the selected batch
            let hasBatch = false;
            
            batchContainers.forEach(container => {
                if (container.dataset.batch == value) {
                    container.style.display = 'block';
                    hasBatch = true;
                } else {
                    container.style.display = 'none';
                }
            });
            
            // If no containers match, dim the entire cell
            if (!hasBatch) {
                cell.style.opacity = '0.3';
            }
        } 
        else if (viewType === 'faculty') {
            // For faculty view, check if cell or any batch container has the faculty
            let hasMatchingFaculty = false;
            
            if (cell.dataset.faculty === value) {
                hasMatchingFaculty = true;
            }
            
            batchContainers.forEach(container => {
                if (container.dataset.faculty === value) {
                    container.style.display = 'block';
                    hasMatchingFaculty = true;
                } else {
                    container.style.display = 'none';
                }
            });
            
            if (!hasMatchingFaculty) {
                cell.style.opacity = '0.3';
            }
        }
        else {
            // For all view, show everything
            batchContainers.forEach(container => {
                container.style.display = 'block';
            });
        }
    });
}

function saveTimetableAsImage() {
    const timetableDiv = document.getElementById('timetable');
    
    // First, get the original backgrounds to reset later
    const originalCellBackgrounds = {};
    const cells = timetableDiv.querySelectorAll('td');
    cells.forEach((cell, index) => {
        originalCellBackgrounds[index] = {
            element: cell,
            background: window.getComputedStyle(cell).backgroundColor
        };
    });
    
    // Set solid backgrounds for better capture
    timetableDiv.querySelectorAll('.theory').forEach(cell => {
        cell.style.backgroundColor = '#ebf8ff';
    });
    
    timetableDiv.querySelectorAll('.lab').forEach(cell => {
        cell.style.backgroundColor = '#fff5f5';
    });
    
    timetableDiv.querySelectorAll('.break').forEach(cell => {
        cell.style.backgroundColor = '#f0fff4';
    });
    
    // Capture the table
    html2canvas(timetableDiv, {
        backgroundColor: '#ffffff',
        scale: 2
    }).then(canvas => {
        // Reset backgrounds
        Object.values(originalCellBackgrounds).forEach(item => {
            item.element.style.backgroundColor = item.background;
        });
        
        // Convert to image and trigger download
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'Timetable.png';
        link.click();
    });
}

function clearForm() {
    // Reset batch inputs
    document.getElementById('num-batches').value = '1';
    document.getElementById('students-per-batch').value = '';
    document.getElementById('total-students').value = '';
    
    // Clear and reset subject inputs
    const subjectsDiv = document.getElementById('subjects');
    subjectsDiv.innerHTML = '';
    addSubject();
    
    // Clear and reset room inputs
    const roomsDiv = document.getElementById('rooms');
    roomsDiv.innerHTML = '';
    addRoom();
    
    // Clear and reset lab inputs
    const labsDiv = document.getElementById('labs');
    labsDiv.innerHTML = '';
    addLab();
    
    // Clear timetable and analysis
    document.getElementById('timetable').innerHTML = '';
    document.getElementById('timetable-analysis').innerHTML = '';
    document.getElementById('timetable-analysis').style.display = 'none';
    document.getElementById('save-btn').disabled = true;
    
    // Hide view options
    document.getElementById('view-options').style.display = 'none';
    
    // Reset global view state
    currentView = 'all';
    selectedBatch = null;
    selectedFaculty = null;
}

// Initialize the form with one of each input group
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelectorAll('#subjects .input-group').length === 0) {
        addSubject();
    }
    
    if (document.querySelectorAll('#rooms .input-group').length === 0) {
        addRoom();
    }
    
    if (document.querySelectorAll('#labs .input-group').length === 0) {
        addLab();
    }
    
    // Initialize theme
    initTheme();
});