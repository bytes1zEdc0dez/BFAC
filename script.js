const START_HOUR = 8;
const END_HOUR = 22;
const ROW_HEIGHT = 40;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ROLE_COLORS = {
  "Staff": '#2C89FA', //Blue
  "Intern": '#E47FAE', //Pink
  "Front-Desk Volunteer": '#EEC877', //Yellow
  "Work-Exchange Volunteer": '#6FCA90', //Green
  "Host": '#2D2D8D', //Cobalt
};

const API_URL = 'https://api.npoint.io/aec1bf60d4c4599b0737';
let shifts = [];

function setupForm() {
    const daySelect = document.getElementById('shiftDay');
    DAYS.forEach((day, index) => {
        daySelect.options[daySelect.options.length] = new Option(day, index);
    });

    const startSelect = document.getElementById('startTime');
    const endSelect = document.getElementById('endTime');
    const timeTrack = document.getElementById('timeTrack');

    for (let h = START_HOUR; h <= END_HOUR; h++) {
        let displayTime = h > 12 ? `${h-12}:00 PM` : h === 12 ? '12:00 PM' : `${h}:00 AM`;
        
        if(h < END_HOUR) startSelect.options[startSelect.options.length] = new Option(displayTime, h);
        if(h > START_HOUR) endSelect.options[endSelect.options.length] = new Option(displayTime, h);

        let label = document.createElement('div');
        label.className = 'time-label';
        label.innerText = displayTime;
        timeTrack.appendChild(label);
    }
}

async function loadShiftsFromCloud() {
  try {
    const response = await fetch(API_URL); 
    if (!response.ok) throw new Error('Failed to fetch schedule');
    const data = await response.json();

    shifts = data.shifts || [];
    renderSchedule();
  } catch (error) {
    console.error('Error loading schedule from cloud:', error);
  }
}

function addShift() {
    const name = document.getElementById('empName').value.trim();
    const role = document.getElementById('shiftRole').value;
    const day = parseInt(document.getElementById('shiftDay').value);
    const start = parseInt(document.getElementById('startTime').value);
    const end = parseInt(document.getElementById('endTime').value);

    if (!name) return alert('Please enter an employee name.');
    if (start >= end) return alert('End time must be after start time.');

    const color = ROLE_COLORS[role] || '#787774';

    shifts.push({ id: Date.now(), name, role, day, start, end, color });

    renderSchedule();
    document.getElementById('empName').value = '';
}

function deleteShift(id) {
    shifts = shifts.filter(s => s.id !== id);
    renderSchedule();
}

function renderSchedule() {
    for (let i = 0; i < 7; i++) {
        document.getElementById(`day-${i}`).innerHTML = '';
    }

    DAYS.forEach((_, dayIndex) => {
        const dayShifts = shifts.filter(s => s.day === dayIndex)
                                .sort((a, b) => a.start - b.start);
        
        dayShifts.forEach((shift) => {
            const columnCanvas = document.getElementById(`day-${shift.day}`);
            
            const topPos = (shift.start - START_HOUR) * ROW_HEIGHT;
            const duration = shift.end - shift.start;
            const heightSize = duration * ROW_HEIGHT;

            const overlaps = dayShifts.filter(s => s.id !== shift.id && (shift.start < s.end && shift.end > s.start));
            
            let width = 96;
            let left = 2;

            if (overlaps.length > 0) {
                const currentOverlapGroup = dayShifts.filter(s => (shift.start <s.end && shift.end > s.start));
                width = 96 / currentOverlapGroup.length;
                let laneIndex = currentOverlapGroup.indexOf(shift);

                left = 2 + (laneIndex * width);
            }

            const block = document.createElement('div');
            block.className = 'shift-block';
            block.style.top = `${topPos}px`;
            block.style.height = `${heightSize}px`;
            block.style.backgroundColor = shift.color;
            block.style.width = `${width}%`;
            block.style.left = `${left}%`;

            block.innerHTML = `
                <div><strong>${shift.name}</strong> (${shift.role})<br>${formatHour(shift.start)} - ${formatHour(shift.end)}</div>
                <button class="delete-btn" onclick="deleteShift(${shift.id})">×</button>
            `;
            columnCanvas.appendChild(block);
        });
    });
}

function formatHour(h) {
    return h > 12 ? `${h-12} PM` : h === 12 ? '12 PM' : `${h} AM`;
}

window.onload = async () => {
    setupForm();
    await loadShiftsFromCloud();
};
