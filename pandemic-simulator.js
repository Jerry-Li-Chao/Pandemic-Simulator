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
let severityLevel = 5; // Default severity level
let healSpeed = 5; // Default heal speed
let healedReInfectionChance_ReductionMultipler = 0.25; // Default healed infection chance
let healChance = 0.2; // Default heal chance

let incubationInfectionRateMultiplier = 1.5;
let incubationReducedSeverityMultiplier = 0.1;

// Default healing infection chance reduction multipler
let healingInfectionChance_ReductionMultipler = 0.8; 

document.getElementById('severityLevel').addEventListener('input', function() {
    severityLevel = parseInt(this.value);
});

document.getElementById('healSpeed').addEventListener('input', function() {
    healSpeed = parseInt(this.value);
});

document.getElementById('healedReInfectionChance_ReductionMultipler').addEventListener('input', (event) => {
    healedReInfectionChance_ReductionMultipler = event.target.value / 100;
});

document.getElementById('healChance').addEventListener('input', (event) => {
    healChance = event.target.value / 100;
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

    incubationPhaseDurationRange.textContent = `${incubationPhaseDurationMin.value} - ${incubationPhaseDurationMax.value} Days (Normal Distribution)`;
}

incubationPhaseDurationMin.addEventListener('input', updateIncubationPhaseDurationRange);
incubationPhaseDurationMax.addEventListener('input', updateIncubationPhaseDurationRange);

updateIncubationPhaseDurationRange(); // Initial call to set the text


function generateNormallyDistributedValue(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num * stdDev + mean; // Adjust for mean and standard deviation
    return num;
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
            grid[y][x].health = 100 - severityLevel * incubationReducedSeverityMultiplier; // Set health based on severity level
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
                health: isSick ? 100 - severityLevel * incubationReducedSeverityMultiplier : 100,
                sickDays: 0, // Track the number of days a person has been sick
                incubationPhaseDuration: 0
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
        }, {
            label: 'Sick',
            backgroundColor: 'red',
            borderColor: 'red',
            data: [],
            fill: false,
        }, {
            label: 'Healed',
            backgroundColor: '#F0F055', // Light yellow
            borderColor: '#F0F055',
            data: [],
            fill: false,
        }, {
            label: 'Dead',
            backgroundColor: 'black',
            borderColor: 'black',
            data: [],
            fill: false,
        }, {
            label: 'Average Health',
            backgroundColor: 'blue',
            borderColor: 'blue',
            data: [],
            fill: false,
            yAxisID: 'y-axis-health'
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

            // If the cell is healthy, healing or healed, it can get infected
            if(nextGrid[y][x].state === STATES.HEALTHY 
                || nextGrid[y][x].state === STATES.HEALING 
                || nextGrid[y][x].state === STATES.HEALED){
                if(Math.random() < calculateInfectionChance(x, y)){
                    nextGrid[y][x].state = STATES.INCUBATING;
                    nextGrid[y][x].sickDays = 0;
                    nextGrid[y][x].incubationPhaseDuration = getIncubationDuration();
                    console.log(nextGrid[y][x].incubationPhaseDuration)
                }
            }
            
            if (grid[y][x].state === STATES.INCUBATING) {
                nextGrid[y][x].sickDays++;
                if (nextGrid[y][x].sickDays >= nextGrid[y][x].incubationPhaseDuration) {
                    nextGrid[y][x].state = STATES.SYMPTOMATIC;
                } else {
                    nextGrid[y][x].health -= severityLevel * incubationReducedSeverityMultiplier;
                }
            } else if (grid[y][x].state === STATES.SYMPTOMATIC) {
                nextGrid[y][x].health -= severityLevel;
                if (nextGrid[y][x].health <= 0) {
                    nextGrid[y][x].state = STATES.DEAD;
                    nextGrid[y][x].health = 0;
                }
                // chance to starting healing
                else if(Math.random() < healChance){
                    nextGrid[y][x].state = STATES.HEALING;
                }
            } else if (grid[y][x].state === STATES.HEALING) {
                nextGrid[y][x].health += healSpeed;
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
    document.getElementById('simulationSpeedValue').textContent = this.value;
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




drawGrid();
