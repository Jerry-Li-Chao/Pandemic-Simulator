const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridWidth = 50;
const gridHeight = 40;
// const cellSize = 20;

// Get the computed style of the canvas
const computedStyle = getComputedStyle(canvas);

// Calculate the cellSize based on the computed width of the canvas and the desired gridWidth
const cellSize = parseFloat(computedStyle.width) / gridWidth;

canvas.width = gridWidth * cellSize;
canvas.height = gridHeight * cellSize;

const transmissibilityMin = document.getElementById('transmissibilityMin');
const transmissibilityMax = document.getElementById('transmissibilityMax');
const transmissibilityRange = document.getElementById('transmissibilityRange');

let isRunning = false;
let infectionRate = getTransmissibility();
let initialSickPercentage = 0.05; // 5%
let healedReInfectionChance_ReductionMultipler = 0.25; // Default healed infection chance

let incubationInfectionRateMultiplier = 1.5;
let incubationReducedSeverityMultiplier = 0.1;

// Default healing infection chance reduction multipler
let healingInfectionChance_ReductionMultipler = 0.8; 

document.getElementById('healedReInfectionChance_ReductionMultipler').addEventListener('input', (event) => {
    healedReInfectionChance_ReductionMultipler = event.target.value / 100;
});

function updateTransmissibilityRange() {
    if (parseFloat(transmissibilityMin.value) > parseFloat(transmissibilityMax.value)) {
        transmissibilityMin.value = transmissibilityMax.value;
    }

    transmissibilityRange.textContent = `${transmissibilityMin.value}% - ${transmissibilityMax.value}% (Normal Distribution)`;
}

transmissibilityMin.addEventListener('input', updateTransmissibilityRange);
transmissibilityMax.addEventListener('input', updateTransmissibilityRange);

updateTransmissibilityRange(); // Initial call to set the text

const incubationPhaseDurationMin = document.getElementById('incubationPhaseDurationMin');
const incubationPhaseDurationMax = document.getElementById('incubationPhaseDurationMax');
const incubationPhaseDurationRange = document.getElementById('incubationPhaseDurationRange');

function updateIncubationPhaseDurationRange() {
    if (parseInt(incubationPhaseDurationMin.value) > parseInt(incubationPhaseDurationMax.value)) {
        incubationPhaseDurationMin.value = incubationPhaseDurationMax.value;
    }

    incubationPhaseDurationRange.textContent = 
    `${incubationPhaseDurationMin.value} - ${incubationPhaseDurationMax.value} Days (Normal Distribution)`;
}

incubationPhaseDurationMin.addEventListener('input', updateIncubationPhaseDurationRange);
incubationPhaseDurationMax.addEventListener('input', updateIncubationPhaseDurationRange);

updateIncubationPhaseDurationRange(); // Initial call to set the text


const healSpeedMin = document.getElementById('healSpeedMin');
const healSpeedMax = document.getElementById('healSpeedMax');
const healSpeedRange = document.getElementById('healSpeedRange');

function updateHealSpeedRange() {
    if (parseInt(healSpeedMin.value) > parseInt(healSpeedMax.value)) {
        healSpeedMin.value = healSpeedMax.value;
    }

    healSpeedRange.textContent = `⬆️ ${healSpeedMin.value} - ${healSpeedMax.value}🩸/Day (Normal Distribution)`;
}

healSpeedMin.addEventListener('input', updateHealSpeedRange);
healSpeedMax.addEventListener('input', updateHealSpeedRange);

updateHealSpeedRange(); // Initial call to set the text


const severityLevelMin = document.getElementById('severityLevelMin');
const severityLevelMax = document.getElementById('severityLevelMax');
const severityLevelRange = document.getElementById('severityLevelRange');

const skewnessSlider = document.getElementById('skewnessSlider');
const skewnessValue = document.getElementById('skewnessValue');

function updateSeverityLevelRange() {
    if (parseInt(severityLevelMin.value) > parseInt(severityLevelMax.value)) {
        severityLevelMin.value = severityLevelMax.value;
    }

    severityLevelRange.textContent = `⬇️ ${severityLevelMin.value} - ${severityLevelMax.value}🩸/Day`;
}

function updateSkewnessValue() {
    skewnessValue.textContent = `${skewnessSlider.value}`;
}

severityLevelMin.addEventListener('input', updateSeverityLevelRange);
severityLevelMax.addEventListener('input', updateSeverityLevelRange);
skewnessSlider.addEventListener('input', updateSkewnessValue);

updateSeverityLevelRange();
updateSkewnessValue();

const healChanceMin = document.getElementById('healChanceMin');
const healChanceMax = document.getElementById('healChanceMax');
const healChanceRange = document.getElementById('healChanceRange');

const healChanceSkewness = document.getElementById('healChanceSkewness');
const healChanceSkewnessValue = document.getElementById('healChanceSkewnessValue');

function updateHealChanceRange() {
    if (parseInt(healChanceMin.value) > parseInt(healChanceMax.value)) {
        healChanceMin.value = healChanceMax.value;
    }

    healChanceRange.textContent = `${healChanceMin.value}% - ${healChanceMax.value}%`;
}

function updateHealChanceSkewnessValue() {
    healChanceSkewnessValue.textContent = healChanceSkewness.value;
}

healChanceMin.addEventListener('input', updateHealChanceRange);
healChanceMax.addEventListener('input', updateHealChanceRange);
healChanceSkewness.addEventListener('input', updateHealChanceSkewnessValue);

updateHealChanceRange();
updateHealChanceSkewnessValue();

const travelPercentage = document.getElementById('travelPercentage');
const travelPercentageValue = document.getElementById('travelPercentageValue');

function updateTravelPercentage() {
    travelPercentageValue.textContent = `${travelPercentage.value}%`;
}

travelPercentage.addEventListener('input', updateTravelPercentage);
updateTravelPercentage(); // Initial call to set the text


function applyTravelRestriction() {
    const isTravelRestricted = document.getElementById('travelRestriction').checked;
    const travelPercent = parseFloat(travelPercentage.value) / 100;

    if (!isTravelRestricted) {
        // Logic to replace a percentage of the population
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                if (Math.random() < travelPercent) {
                    if (isValidForTravelReplacement(grid[y][x])) {
                        grid[y][x] = getNewCellState(); // Implement this function
                    }
                }
            }
        }
    }
}

function isValidForTravelReplacement(cell) {
    state = cell.state;
    health = cell.health;
    let flag = (cell.stayed >= cell.stayingFor);
    return (state === STATES.HEALTHY || 
           state === STATES.HEALED || 
           state === STATES.INCUBATING || 
           (state === STATES.SYMPTOMATIC && health >= 50))
           && flag;
}

function getNewCellState() {
    let newState;
    const randomState = Math.random();
    if (randomState < 0.75) {
        newState = STATES.HEALTHY;
    } else if (randomState < 0.95) {
        newState = STATES.INCUBATING;
    } else {
        newState = STATES.SYMPTOMATIC; // Ensured health is >= 50
    }

    let duration = getIncubationDuration()
    // newState is SYMPTOMATIC, sickDays should be duration
    // newState is INCUBATING, sickDays should a random of range of 0 to duration
    let sd = 0;
    if(newState === STATES.SYMPTOMATIC){
        sd = duration;
    }
    else if (newState === STATES.INCUBATING){
        sd = Math.floor(Math.random() * duration);
    }

    return {
        state: newState,
        health: (newState === STATES.SYMPTOMATIC) ? 50 + Math.random() * 35 : 100,
        sickDays: sd,
        incubationPhaseDuration: duration,
        healSpeed: getHealSpeed(),
        stayingFor: getStayDuration(),
        stayed: 0
    };
}

// Function that generate a value for stayingFor
function getStayDuration() {
    let travelingPopulationPercentage = parseFloat(travelPercentage.value)
    if (Math.random() < travelingPopulationPercentage) {
        return getSkewedRandomValue(2, 14, 1);
    }
    return getSkewedRandomValue(120, 180, 1);
}


function generateNormallyDistributedValue(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num * stdDev + mean; // Adjust for mean and standard deviation
    return num;
}

// When skewness is 1, the distribution is not skewed (uniform distribution).
// When skewness is greater than 1, the distribution is skewed towards the lower end (more values near min).
// When skewness is less than 1 but greater than 0, the distribution is skewed towards the higher end (more values near max).
function getSkewedRandomValue(min, max, skewness) {
    let u = Math.random();
    // Apply a power transformation to skew the distribution
    let skewedU = Math.pow(u, skewness);
    return min + (skewedU * (max - min));
}

function getNormalRandomPercentage(min, max) {
    const mean = (min + max) / 2;
    const stdDev = (max - min) / 6; // Approx. 99.7% values will be within [min, max]

    let percentage;
    do {
        percentage = generateNormallyDistributedValue(mean, stdDev);
    } while (percentage < min || percentage > max); // Ensure value is within range

    return percentage;
}

function getTransmissibility() {
    const minTransmissibility = parseFloat(transmissibilityMin.value);
    const maxTransmissibility = parseFloat(transmissibilityMax.value);
    return getNormalRandomPercentage(minTransmissibility, maxTransmissibility) / 100;
}

function getIncubationDuration() {
    const minDuration = parseInt(incubationPhaseDurationMin.value);
    const maxDuration = parseInt(incubationPhaseDurationMax.value);
    return getNormalRandomPercentage(minDuration, maxDuration);
}

function getHealSpeed() {
    const minHealSpeed = parseInt(healSpeedMin.value);
    const maxHealSpeed = parseInt(healSpeedMax.value);
    return getNormalRandomPercentage(minHealSpeed, maxHealSpeed);
}

// getSeverityLevel use skewness to skew the distribution
function getSeverityLevel() {
    const minSeverityLevel = parseInt(severityLevelMin.value);
    const maxSeverityLevel = parseInt(severityLevelMax.value);
    const skewness = parseFloat(skewnessSlider.value);
    return getSkewedRandomValue(minSeverityLevel, maxSeverityLevel, skewness);
}

// getHealChance use skewness to skew the distribution
function getHealChance() {
    const minHealChance = parseInt(healChanceMin.value);
    const maxHealChance = parseInt(healChanceMax.value);
    const skewness = parseFloat(healChanceSkewness.value);
    return getSkewedRandomValue(minHealChance, maxHealChance, skewness) / 100;
}


let mouseIsDown = false;
let keyIsPressed = false;

// Event listener for key down
document.addEventListener('keydown', function(event) {
    if (event.key === 'Shift') { // Choose the key to use (e.g., Shift)
        keyIsPressed = true;
    }
});

// Event listener for key up
document.addEventListener('keyup', function(event) {
    if (event.key === 'Shift') { // Same key as above
        keyIsPressed = false;
    }
});

// Event listener for mouse down on the canvas
canvas.addEventListener('mousedown', function(event) {
    mouseIsDown = true;
    infectCell(event);
});

// Event listener for mouse move on the canvas
canvas.addEventListener('mousemove', function(event) {
    if (mouseIsDown && keyIsPressed) {
        infectCell(event);
    }
});

// Event listener for mouse up on the canvas
canvas.addEventListener('mouseup', function(event) {
    mouseIsDown = false;
});

document.getElementById('makeAllHealthyButton').addEventListener('click', function() {
    if (!isRunning) {
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                grid[y][x].state = STATES.HEALTHY;
                grid[y][x].health = 100;
            }
        }
        drawGrid();
    }
});

// chartResetButton
document.getElementById('chartResetButton').addEventListener('click', function() {
    if (!isRunning) {
        // Resetting the population chart
        populationChart.data.labels = []; // Clear the labels
        populationChart.data.datasets.forEach((dataset) => {
            dataset.data = []; // Clear each dataset
        });
        populationChart.update(); // Update the chart to reflect the changes
    }
});


function infectCell(event) {
    if (!isRunning) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / cellSize);
        const y = Math.floor((event.clientY - rect.top) / cellSize);

        if (grid[y] && grid[y][x] && (grid[y][x].state === STATES.HEALTHY || grid[y][x].state === STATES.HEALED)) {
            grid[y][x].state = STATES.INCUBATING;
            grid[y][x].health = 100 - getSeverityLevel() * incubationReducedSeverityMultiplier; // Set health based on severity level
            drawGrid();
        }
    }
}


const STATES = {
    HEALTHY: 'healthy',
    INCUBATING: 'incubating', // New state for incubation phase
    SYMPTOMATIC: 'symptomatic', // New state for symptomatic phase
    DEAD: 'dead', 
    HEALING: 'healing',
    HEALED: 'healed'
};


let grid = createGrid(gridWidth, gridHeight);

function createGrid(width, height) {
    let arr = [];
    for (let y = 0; y < height; y++) {
        let row = [];
        for (let x = 0; x < width; x++) {
            const isSick = Math.random() < initialSickPercentage;
            row.push({
                state: isSick ? STATES.INCUBATING : STATES.HEALTHY,
                health: isSick ? 100 - getSeverityLevel() * incubationReducedSeverityMultiplier : 100,
                sickDays: 0,
                incubationPhaseDuration: 0,
                healSpeed: 0,
                stayingFor: getSkewedRandomValue(120, 180, 1),
                stayed: 0
            });
        }
        arr.push(row);
    }
    return arr;
}


let brightness = 0.7; // Default brightness
function getHealthColor(health) {
    const red = Math.floor((100 - health) * 2.55) * brightness;
    const green = Math.floor(health * 2.55) * brightness;
    const blue = Math.floor(health * 0.85) * brightness;
    return `rgb(${red},${green},${blue})`;
}

let chartCtx = document.getElementById('populationChart').getContext('2d');
let populationChart = new Chart(chartCtx, {
    type: 'line',
    data: {
        labels: [], // Time steps labels
        datasets: [{
            label: 'Healthy',
            backgroundColor: 'green',
            borderColor: 'green',
            data: [],
            fill: false,
            pointRadius: 2,
        }, {
            label: 'Sick',
            backgroundColor: 'red',
            borderColor: 'red',
            data: [],
            fill: false,
            pointRadius: 2,
        }, {
            label: 'Healed',
            backgroundColor: '#F0F055', // Light yellow
            borderColor: '#F0F055',
            data: [],
            fill: false,
            pointRadius: 2,
        }, {
            label: 'Dead',
            backgroundColor: 'black',
            borderColor: 'black',
            data: [],
            fill: false,
            pointRadius: 2,
        }, {
            label: 'Average Health',
            backgroundColor: 'blue',
            borderColor: 'blue',
            data: [],
            fill: false,
            yAxisID: 'y-axis-health',
            pointRadius: 2, // Decrease the point radius to make it smaller
        }]
    },
    options: {
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Population Count', // Name for the primary y-axis
                    color: '#666',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
                // ... other y-axis options ...
            },
            'y-axis-health': {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false
                },
                title: {
                    display: true,
                    text: 'Average Health (%)', // Name for the secondary y-axis
                    color: '#666',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
                // ... other y-axis-health options ...
            },
            x: {
                title: {
                    display: true,
                    text: 'Days', // Name for the x-axis
                    color: '#666',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
                // ... other x-axis options ...
            }

        }
        // ... other chart options ...
    }
});


let previousCounts = { healthy: 0, sick: 0, healed: 0, dead: 0 };
let unchangedIterations = 0;

function showToast(textInput) {
    Toastify({
        text: textInput,
        duration: 3000,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: 'right', // `left`, `center` or `right`
        style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)"
        },
        stopOnFocus: true, // Prevents dismissing of toast on hover
    }).showToast();
}

function updateChart() {
    let healthyCount = 0, sickCount = 0, healedCount = 0, deadCount = 0;
    let totalHealth = 0, totalCells = gridWidth * gridHeight;

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            switch (grid[y][x].state) {
                case STATES.HEALTHY:
                    healthyCount++;
                    break;
                case STATES.INCUBATING:
                    sickCount++;
                    break;
                case STATES.SYMPTOMATIC:
                    sickCount++;
                    break;
                case STATES.HEALED:
                    healedCount++;
                    break;
                case STATES.DEAD:
                    deadCount++;
                    break;
            }
            totalHealth += grid[y][x].health;
        }
    }

    // Calculate the average health
    let averageHealth = totalHealth / totalCells;

     // Check if counts have changed
     if (healthyCount === previousCounts.healthy && 
        sickCount === previousCounts.sick && 
        healedCount === previousCounts.healed && 
        deadCount === previousCounts.dead) {
        unchangedIterations++;
        if (unchangedIterations >= 20) {
            isRunning = false; // Stop the simulation
            const toggleButton = document.getElementById('toggleButton');
            toggleButton.classList.remove('stop');
            toggleButton.classList.add('start');
            toggleButton.textContent = 'Start';
            unchangedIterations = 0
            if(averageHealth > 90){
                showToast("Pandemic Ended! We are still Healthy! 😊");
            }
            else if(averageHealth > 80){
                showToast("Pandemic Ended! Stay Strong, Guys! 💪");
            }
            else if(averageHealth > 60){
                showToast("Pandemic Ended! We will recover! 😷");
            }
            else{
                showToast("Pandemic Ended! What a Deadly Pandemic! 😢");
            }
            
        }
    } else {
        unchangedIterations = 0; // Reset the counter if counts have changed
    }

    // Update previous counts
    previousCounts = { healthy: healthyCount, sick: sickCount, healed: healedCount, dead: deadCount };

    let currentTimeStep = populationChart.data.labels.length + 1;
    populationChart.data.labels.push(currentTimeStep);
    populationChart.data.datasets[0].data.push(healthyCount);
    populationChart.data.datasets[1].data.push(sickCount);
    populationChart.data.datasets[2].data.push(healedCount);
    populationChart.data.datasets[3].data.push(deadCount);
    populationChart.data.datasets[4].data.push(averageHealth);

    populationChart.update();
}


function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            ctx.beginPath();
            ctx.rect(x * cellSize, y * cellSize, cellSize, cellSize);
            switch (grid[y][x].state) {
                case STATES.HEALTHY:
                    // bluish-green
                    ctx.fillStyle = `rgb(0, 255, 85)`;
                    break;
                case STATES.INCUBATING:
                    // ctx.fillStyle = `rgb(255, 173, 219)`; // pink
                    ctx.fillStyle = getHealthColor(grid[y][x].health);
                    break;
                case STATES.SYMPTOMATIC:
                    ctx.fillStyle = getHealthColor(grid[y][x].health);
                    break;
                case STATES.HEALING:
                    ctx.fillStyle = getHealthColor(grid[y][x].health);
                    break;
                case STATES.HEALED:
                    // yellow
                    ctx.fillStyle = `rgb(240, 240, 85)`;
                    break;
                case STATES.DEAD:
                    ctx.fillStyle = 'black';
                    break;
            }
            ctx.fill();
            ctx.stroke();

        }
    }
}

let healthyCount = 0, sickCount = 0, healedCount = 0, deadCount = 0;
function updateGrid() {
    let nextGrid = createGrid(gridWidth, gridHeight);

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            nextGrid[y][x] = {...grid[y][x]}; // Copy current state
            nextGrid[y][x].stayed++;

            // If the cell is healthy, healing or healed, it can get infected
            if(nextGrid[y][x].state === STATES.HEALTHY 
                || nextGrid[y][x].state === STATES.HEALING 
                || nextGrid[y][x].state === STATES.HEALED){
                if(Math.random() < calculateInfectionChance(x, y)){
                    nextGrid[y][x].state = STATES.INCUBATING;
                    nextGrid[y][x].sickDays = 0;
                    nextGrid[y][x].incubationPhaseDuration = getIncubationDuration();
                }
            }
            
            if (grid[y][x].state === STATES.INCUBATING) {
                nextGrid[y][x].sickDays++;
                if (nextGrid[y][x].sickDays >= nextGrid[y][x].incubationPhaseDuration) {
                    nextGrid[y][x].state = STATES.SYMPTOMATIC;
                } else {
                    nextGrid[y][x].health -= getSeverityLevel() * incubationReducedSeverityMultiplier;
                }
            } else if (grid[y][x].state === STATES.SYMPTOMATIC) {
                nextGrid[y][x].health -= getSeverityLevel();
                if (nextGrid[y][x].health <= 0) {
                    nextGrid[y][x].state = STATES.DEAD;
                    nextGrid[y][x].health = 0;
                }
                // chance to starting healing
                else if(Math.random() < getHealChance()){
                    nextGrid[y][x].state = STATES.HEALING;
                }
            } else if (grid[y][x].state === STATES.HEALING) {
                nextGrid[y][x].healSpeed = getHealSpeed();
                nextGrid[y][x].health += nextGrid[y][x].healSpeed;
                if (nextGrid[y][x].health >= 100) {
                    nextGrid[y][x].state = STATES.HEALED;
                    nextGrid[y][x].health = 100;
                }
            }
        }
    }

    grid = nextGrid;
}

function calculateInfectionChance(x, y) {
    let notInfectedChance = 1;

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            let nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                if (grid[ny][nx].state === STATES.INCUBATING || grid[ny][nx].state === STATES.SYMPTOMATIC) {
                    let individualInfectionRate = getTransmissibility();
                    if (grid[ny][nx].state === STATES.INCUBATING) {
                        individualInfectionRate *= incubationInfectionRateMultiplier;
                    }
                    notInfectedChance *= (1 - individualInfectionRate);
                }
            }
        }
    }

    // The overall infection chance is 1 minus the chance of not getting infected by any neighbor
    let infectionChance = 1 - notInfectedChance;
    if(grid[y][x].state === STATES.HEALING) infectionChance *= healingInfectionChance_ReductionMultipler;
    if(grid[y][x].state === STATES.HEALED) infectionChance *= healedReInfectionChance_ReductionMultipler;

    return infectionChance;
}


let simulationSpeed = 20; // Default speed
let lastRenderTime = 0;

document.getElementById('simulationSpeed').addEventListener('input', function() {
    simulationSpeed = parseInt(this.value);
});

function gameLoop(currentTime) {
    if (isRunning) {
        requestAnimationFrame(gameLoop);
        const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
        if (secondsSinceLastRender < 1 / simulationSpeed) return;

        lastRenderTime = currentTime;
        applyTravelRestriction();
        updateGrid();
        drawGrid();
        updateChart();
    }
}

document.getElementById('toggleButton').addEventListener('click', () => {
    isRunning = !isRunning;

    const toggleButton = document.getElementById('toggleButton');
    if (isRunning) {
        toggleButton.classList.remove('start');
        toggleButton.classList.add('stop');
        toggleButton.textContent = 'Stop';
        gameLoop();
    } else {
        toggleButton.classList.remove('stop');
        toggleButton.classList.add('start');
        toggleButton.textContent = 'Start';
    }
});

document.getElementById('randomizeButton').addEventListener('click', () => {
    grid = createGrid(gridWidth, gridHeight);
    drawGrid();
});

document.getElementById('initialSick').addEventListener('input', (event) => {
    initialSickPercentage = event.target.value / 100;
});



// healingInfectionChance_ReductionMultipler
document.getElementById('healingInfectionChance_ReductionMultipler').addEventListener('input', (event) => {
    healingInfectionChance_ReductionMultipler = event.target.value / 100;
});

document.getElementById('simulationSpeed').addEventListener('input', function() {
    document.getElementById('simulationSpeedValue').textContent = `${this.value} Day(s)/second`;
});

document.getElementById('incubationInfectionRateMultiplier').addEventListener('input', function() {
        document.getElementById('incubationInfectionRateMultiplierValue').textContent = this.value;    
});

document.getElementById('incubationReducedSeverityMultiplier').addEventListener('input', function() {
    document.getElementById('incubationReducedSeverityMultiplierValue').textContent = this.value;    
});

document.getElementById('incubationInfectionRateMultiplier').addEventListener('input', function() {
    incubationInfectionRateMultiplier = parseFloat(this.value);
});

document.getElementById('incubationReducedSeverityMultiplier').addEventListener('input', function() {
    incubationReducedSeverityMultiplier = parseFloat(this.value);
});

// I want to modify the setPresetValues() to pass in the values, instead of hard code the values
document.getElementById('covid19').addEventListener('click', function() {
    setPresetValues({
        initialSick: 1,
        transmissibilityMin: 2,
        transmissibilityMax: 5,
        simulationSpeed: 20,
        severityLevelMin: 2,
        severityLevelMax: 5,
        skewnessSlider: 3,
        healSpeedMin: 2,
        healSpeedMax: 7,
        healingInfectionChance_ReductionMultipler: 0.15,
        healedReInfectionChance_ReductionMultipler: 0.3,
        healChanceMin: 10,
        healChanceMax: 20,
        healChanceSkewness: 0.7,
        incubationInfectionRateMultiplier: 1.5,
        incubationReducedSeverityMultiplier: 0.5,
        incubationPhaseDurationMin: 2,
        incubationPhaseDurationMax: 14
    });
    // click on randomizeButton to randomize the grid
    document.getElementById('randomizeButton').click();
});

function setValueAndDispatchEvent(elementId, value) {
    const element = document.getElementById(elementId);
    element.value = value;
    element.dispatchEvent(new Event('input'));
}

function setPresetValues(values) {
    setValueAndDispatchEvent('initialSick', values.initialSick);
    setValueAndDispatchEvent('transmissibilityMin', values.transmissibilityMin);
    setValueAndDispatchEvent('transmissibilityMax', values.transmissibilityMax);
    setValueAndDispatchEvent('simulationSpeed', values.simulationSpeed);
    setValueAndDispatchEvent('severityLevelMin', values.severityLevelMin);
    setValueAndDispatchEvent('severityLevelMax', values.severityLevelMax);
    setValueAndDispatchEvent('skewnessSlider', values.skewnessSlider);
    setValueAndDispatchEvent('healSpeedMin', values.healSpeedMin);
    setValueAndDispatchEvent('healSpeedMax', values.healSpeedMax);
    setValueAndDispatchEvent('healingInfectionChance_ReductionMultipler', values.healingInfectionChance_ReductionMultipler);
    setValueAndDispatchEvent('healedReInfectionChance_ReductionMultipler', values.healedReInfectionChance_ReductionMultipler);
    setValueAndDispatchEvent('healChanceMin', values.healChanceMin);
    setValueAndDispatchEvent('healChanceMax', values.healChanceMax);
    setValueAndDispatchEvent('healChanceSkewness', values.healChanceSkewness);
    setValueAndDispatchEvent('incubationInfectionRateMultiplier', values.incubationInfectionRateMultiplier);
    setValueAndDispatchEvent('incubationReducedSeverityMultiplier', values.incubationReducedSeverityMultiplier);
    setValueAndDispatchEvent('incubationPhaseDurationMin', values.incubationPhaseDurationMin);
    setValueAndDispatchEvent('incubationPhaseDurationMax', values.incubationPhaseDurationMax);

    // Update display for any sliders or ranges
    updateTransmissibilityRange();
    updateSeverityLevelRange();
    updateHealSpeedRange();
    updateHealChanceRange();
    updateIncubationPhaseDurationRange();
}



drawGrid();
