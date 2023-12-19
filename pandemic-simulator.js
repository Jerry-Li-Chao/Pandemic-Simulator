const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridWidth = 50;
const gridHeight = 40;
// const cellSize = 20;
const STATES = {
    HEALTHY: 'healthy',
    INCUBATING: 'incubating', // New state for incubation phase
    SYMPTOMATIC: 'symptomatic', // New state for symptomatic phase
    DEAD: 'dead', 
    HEALING: 'healing',
    HEALED: 'healed',
    WALL: 'wall'
};

let daysWithoutRemoval = 0;
let bodyCountval = 0;
let removalDaysval = 10;

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

let healedColorIsYellow = document.getElementById('toggleHealedColor').checked;
const toggleHealedColor = document.getElementById('toggleHealedColor');
const healedBox = document.querySelector('.healed-box');

function updateHealedColor() {
    if (toggleHealedColor.checked) {
        healedBox.classList.add('healed-box-yellow');
        healedBox.classList.remove('healed-box-green');
        healedColorIsYellow = true
    } else {
        healedBox.classList.add('healed-box-green');
        healedBox.classList.remove('healed-box-yellow');
        healedColorIsYellow = false;
    }
    drawGrid();
}

toggleHealedColor.addEventListener('change', updateHealedColor);


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
    if (parseFloat(severityLevelMin.value) > parseFloat(severityLevelMax.value)) {
        severityLevelMin.value = severityLevelMax.value;
    }

    severityLevelRange.textContent = `⬇ ${severityLevelMin.value} - ${severityLevelMax.value}🩸/Day`;
}

function updateSkewnessValue() {
    // when skewness is 1, show text "Mild ≈ Severe Cases"
    // when skewness is greater than 1, show text "More Mild Cases"
    // when skewness is greater than 1.5, show text "Much More Mild Cases"
    // when skewness is greater than 2, show text "Mostly Mild Cases"
    // when skewness is less than 1 but greater than 0.5, show text "More Severe Cases"
    // when skewness is less than 0.5, but greater than 0.1, show text "Much More Severe Cases"
    // when skewness is less than 0.1, but greater than 0. show text "Mostly Severe Cases"
    if (skewnessSlider.value == 1) {
        skewnessValue.textContent = "Mild ≈ Severe Cases";
    }
    else if (skewnessSlider.value > 1) {
        if (skewnessSlider.value > 2) {
            skewnessValue.textContent = "Mostly Mild Cases";
        }
        else if (skewnessSlider.value > 1.5) {
            skewnessValue.textContent = "Much More Mild Cases";
        }
        else {
            skewnessValue.textContent = "More Mild Cases";
        }
    }
    else {
        if (skewnessSlider.value < 0.1) {
            skewnessValue.textContent = "Mostly Severe Cases";
        }
        else if (skewnessSlider.value < 0.5) {
            skewnessValue.textContent = "Much More Severe Cases";
        }
        else {
            skewnessValue.textContent = "More Severe Cases";
        }
    }

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
    if (parseFloat(healChanceMin.value) > parseFloat(healChanceMax.value)) {
        healChanceMin.value = healChanceMax.value;
    }

    healChanceRange.textContent = `${healChanceMin.value}% - ${healChanceMax.value}%`;
    updateHealChanceSkewnessValue();
}

function updateHealChanceSkewnessValue() {
    if (healChanceSkewness.value == 1) {
        healChanceSkewnessValue.textContent = `Uniform Distribution of ${healChanceMin.value}% - ${healChanceMax.value}% Heal Chance`;
    }
    else if (healChanceSkewness.value > 1) {
        if (healChanceSkewness.value > 2) {
            healChanceSkewnessValue.textContent = `Mostly Heal with ${healChanceMin.value}% Chance`;
        }
        else if (healChanceSkewness.value > 1.5) {
            healChanceSkewnessValue.textContent = `Much More Heal with ${healChanceMin.value}% Chance`;
        }
        else {
            healChanceSkewnessValue.textContent = `More Heal with ${healChanceMin.value}% Chance`;
        }
    }
    else {
        if (healChanceSkewness.value < 0.1) {
            healChanceSkewnessValue.textContent = `Mostly Heal with ${healChanceMax.value}% Chance`;
        }
        else if (healChanceSkewness.value < 0.5) {
            healChanceSkewnessValue.textContent = `Much More Heal with ${healChanceMax.value}% Chance`;
        }
        else {
            healChanceSkewnessValue.textContent = `More Heal with ${healChanceMax.value}% Chance`;
        }
    }
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
    return getSkewedRandomValue(80, 180, 1);
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
    const minSeverityLevel = parseFloat(severityLevelMin.value);
    const maxSeverityLevel = parseFloat(severityLevelMax.value);
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



// Get references to the slider and the span element
var slider = document.getElementById("wallThicknessSlider");
var output = document.getElementById("wallThicknessValue");

let mouseIsDown = false;
let PaintInfected = slider.value == '0';


// Display the default slider value
output.innerHTML = slider.value;

let drawWallIsPressed = slider.value !== '0';
let drawWallThickness = slider.value;
output.innerHTML = slider.value; // Display the default slider value

// Update the value in the span element whenever the slider value changes
slider.oninput = function() {
    output.innerHTML = this.value;
    drawWallIsPressed = this.value !== '0';
    PaintInfected = this.value == '0';
    drawWallThickness = this.value;
}

// Event listener for mouse down on the canvas
canvas.addEventListener('mousedown', function(event) {
    mouseIsDown = true;
    if (mouseIsDown && PaintInfected) {
        infectCell(event);
    }
    else if(mouseIsDown && drawWallIsPressed) {
        drawWall(event);
    }
});

// Event listener for mouse move on the canvas
canvas.addEventListener('mousemove', function(event) {
    if (mouseIsDown && PaintInfected) {
        infectCell(event);
    }
    else if(mouseIsDown && drawWallIsPressed) {
        drawWall(event);
    }
});

// Event listener for mouse up on the canvas
canvas.addEventListener('mouseup', function(event) {
    mouseIsDown = false;
});

// Function to create a mock event object for touch events
function createMockEvent(touch, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
        clientX: touch.clientX,
        clientY: touch.clientY
    };
}

// Event listener for touchstart
canvas.addEventListener('touchstart', function(event) {
    if (event.cancelable) {
        event.preventDefault();
    }
    if (event.touches.length > 0) {
        const mockEvent = createMockEvent(event.touches[0], canvas);
        if(drawWallIsPressed) {
            drawWall(mockEvent);
        }
        else{
            infectCell(mockEvent);
        }
    }
}, { passive: false });

// Event listener for touchmove
canvas.addEventListener('touchmove', function(event) {
    if (event.cancelable) {
        event.preventDefault();
    }
    if (event.touches.length > 0) {
        const mockEvent = createMockEvent(event.touches[0], canvas);
        if(drawWallIsPressed) {
            drawWall(mockEvent);
        }
        else{
            infectCell(mockEvent);
        }
    }
}, { passive: false });

// Event listener for touchend
canvas.addEventListener('touchend', function(event) {
    if (event.cancelable) {
        event.preventDefault();
    }
}, { passive: false });

// added a cool rippling effect
document.getElementById('makeAllHealthyButton').addEventListener('click', function() {
    let centerX = Math.floor(gridWidth / 2);
    let centerY = Math.floor(gridHeight / 2);
    let maxDistance = Math.ceil(Math.sqrt(Math.pow(Math.max(centerX, gridWidth - centerX), 2) + Math.pow(Math.max(centerY, gridHeight - centerY), 2)));

    for (let d = 0; d <= maxDistance; d++) {
        setTimeout(function() {
            for (let y = 0; y < gridHeight; y++) {
                for (let x = 0; x < gridWidth; x++) {
                    let distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                    if (Math.floor(distance) === d) {
                        grid[y][x].state = STATES.HEALTHY;
                        grid[y][x].health = 100;
                    }
                }
            }
            drawGrid();
        }, d * 50); // Delay of 50ms between each ring
    }
});



// chartResetButton
document.getElementById('chartResetButton').addEventListener('click', function() {
    // Resetting the population chart
    populationChart.data.labels = []; // Clear the labels
    populationChart.data.datasets.forEach((dataset) => {
        dataset.data = []; // Clear each dataset
    });
    populationChart.update(); // Update the chart to reflect the changes

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


function drawWall(event) {
    if (!isRunning) {
        const rect = canvas.getBoundingClientRect();
        const centerX = Math.floor((event.clientX - rect.left) / cellSize);
        const centerY = Math.floor((event.clientY - rect.top) / cellSize);

        // Calculate start and end points for the loop
        const startOffset = Math.floor(drawWallThickness / 2);
        const endOffset = drawWallThickness % 2 === 0 ? startOffset - 1 : startOffset;

        for (let y = centerY - startOffset; y <= centerY + endOffset; y++) {
            for (let x = centerX - startOffset; x <= centerX + endOffset; x++) {
                if (grid[y] && grid[y][x]) {
                    grid[y][x].state = STATES.WALL;
                }
            }
        }

        drawGrid();
    }
}



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
                stayingFor: getSkewedRandomValue(80, 180, 1),
                stayed: 0
            });
        }
        arr.push(row);
    }
    return arr;
}

function createRipplingGrid(width, height) {
    let centerX = Math.floor(width / 2);
    let centerY = Math.floor(height / 2);
    let maxDistance = Math.ceil(Math.sqrt(Math.pow(Math.max(centerX, width - centerX), 2) + Math.pow(Math.max(centerY, height - centerY), 2)));

    // Apply rippling effect to turn cells healthy with a delay
    for (let d = 0; d <= maxDistance; d++) {
        setTimeout(function() {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                    if(Math.floor(distance) === d){
                        const isSick = Math.random() < initialSickPercentage;
                        grid[y][x] = {
                            state: isSick ? STATES.INCUBATING : STATES.HEALTHY,
                            health: isSick ? 100 - getSeverityLevel() * incubationReducedSeverityMultiplier : 100,
                            sickDays: 0,
                            incubationPhaseDuration: 0,
                            healSpeed: 0,
                            stayingFor: getSkewedRandomValue(80, 180, 1),
                            stayed: 0
                        };
                    }
                }
            }
            drawGrid(); // Redraw the grid after each update
        }, d * 50); // Delay of 50ms between each ring
    }
}


let brightness = 0.7; // Default brightness
// when health is 100, rgb(0, 255, 85) = green
// when health is 0, rgb(255, 0, 0) = bright red
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
            label: 'Recovered',
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




function showToast(textInput) {
    Toastify({
        text: textInput,
        duration: 3000,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: 'center', // `left`, `center` or `right`
        style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)"
        },
        stopOnFocus: true, // Prevents dismissing of toast on hover
    }).showToast();
}

let prevTotalHealth = 0;
let unchangedIterations = 0;

function updateChart() {
    let healthyCount = 0, sickCount = 0, healedCount = 0, deadCount = 0, healingCount = 0;
    let totalHealth = 0, totalCells = 0;

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
                    healthyCount++;
                    break;
                case STATES.HEALING:
                    healingCount++;
                    break;
                case STATES.DEAD:
                    deadCount++;
                    break;
            }
            if(grid[y][x].state != STATES.WALL) {
                totalHealth += grid[y][x].health;
                totalCells++;
            }
            
        }
    }

    // Calculate the average health
    let averageHealth = totalHealth / totalCells;

    // Check if totalHealth has changed
    if (totalHealth === prevTotalHealth) {
        unchangedIterations++;
        if (unchangedIterations >= 20) {
            isRunning = false; // Stop the simulation
            const toggleButton = document.getElementById('toggleButton');
            toggleButton.classList.remove('stop');
            toggleButton.classList.add('start');
            toggleButton.textContent = 'Start';
            unchangedIterations = 0;
            if (averageHealth > 90) {
                showToast("Pandemic Ended! We are still Relatively Healthy! 😊");
            } else if (averageHealth > 80) {
                showToast("Pandemic Ended! Stay Strong, Guys! 💪");
            } else if (averageHealth > 60) {
                showToast("Pandemic Ended! We will recover! 😷");
            } else {
                showToast("Pandemic Ended! What a Deadly Pandemic! 😢");
            }
        }
    } else {
        unchangedIterations = 0; // Reset the counter if totalHealth has changed
    }

    // Update previous totalHealth
    prevTotalHealth = totalHealth;

    let currentTimeStep = populationChart.data.labels.length + 1;
    populationChart.data.labels.push(currentTimeStep);
    populationChart.data.datasets[0].data.push(healthyCount);
    populationChart.data.datasets[1].data.push(sickCount + healingCount);
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
                    // green
                    ctx.fillStyle = `rgb(0, 255, 85)`;
                    break;
                case STATES.INCUBATING:
                    // ctx.fillStyle = `rgba(173, 216, 230, 0.7)`;
                    ctx.fillStyle = getHealthColor(grid[y][x].health);
                    break;
                case STATES.SYMPTOMATIC:
                    ctx.fillStyle = getHealthColor(grid[y][x].health);
                    break;
                case STATES.HEALING:
                    ctx.fillStyle = getHealthColor(grid[y][x].health);
                    break;
                case STATES.HEALED:
                    if(healedColorIsYellow) {
                        // yellow
                        ctx.fillStyle = `rgb(240, 240, 85)`;
                    }
                    else {
                        if(grid[y][x].health == 100){
                            ctx.fillStyle = `rgb(0, 255, 85)`;
                        }
                        else{
                            ctx.fillStyle = getHealthColor(grid[y][x].health);
                        }
                    }
                    break;
                case STATES.DEAD:
                    ctx.fillStyle = 'black';
                    break;
                case STATES.WALL:
                    ctx.fillStyle = 'white';
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
                    nextGrid[y][x].health -= getSeverityLevel();
                    if (nextGrid[y][x].health <= 0) {
                        nextGrid[y][x].state = STATES.DEAD;
                        nextGrid[y][x].health = 0;
                    }
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
        // return 0, if daysWithoutRemoval < days, it's not yet time to remove the body. 
        // return 0, if there is no dead body to remove. New bodies will be removed asap, without needing to wait days to remove
        // return 1 if some bodies are removed and drawGrid() is called
        if(bodyCountval != 0){
            let result = updateGridBasedOnRemovalRate(daysWithoutRemoval);
            if(result === 1){
                daysWithoutRemoval = 0;
            }
            else if(result === 0){
                daysWithoutRemoval++;
            }
        }
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
    // grid = createGrid(gridWidth, gridHeight);
    // drawGrid();
    createRipplingGrid(gridWidth, gridHeight);
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

const bodyCountSlider = document.getElementById('bodyCount');
const bodyCountValue = document.getElementById('bodyCountValue');
const removalDaysSlider = document.getElementById('removalDays');
const removalDaysValue = document.getElementById('removalDaysValue');

function updateSliderValues() {
    bodyCountValue.textContent = bodyCountSlider.value;
    bodyCountval = parseInt(bodyCountSlider.value, 10);
    removalDaysValue.textContent = removalDaysSlider.value;
}

// return 0, if daysWithoutRemoval < days, it's not yet time to remove the body. 
// return 0, if there is no dead body to remove. New bodies will be removed asap, without needing to wait days to remove
// return 1 if some bodies are removed and drawGrid() is called
function updateGridBasedOnRemovalRate(daysWithoutRemoval) {
    const bodies = parseInt(bodyCountSlider.value, 10);
    const days = parseInt(removalDaysSlider.value, 10);

    let dead_list = [];
    // Logic to update the grid based on the removal rate
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
                if (grid[y][x].state === STATES.DEAD) {
                    // push an object of {y, x, grid[y][x]} to dead_list
                    dead_list.push({y, x});
                }
        }
    }

    // choose randomly from dead_list to change cell state to getNewCellState()
    if(dead_list.length != 0) {
        for (let i = 0; i < bodies; i++) {
            let randomIndex = Math.floor(Math.random() * dead_list.length);
            let newY = dead_list[randomIndex].y;
            let newX = dead_list[randomIndex].x;
            if(daysWithoutRemoval >= days){
                grid[newY][newX] = getNewCellState();
            }
            else{
                return 0;
            }
        }
    }
    else {
        return 0;
    }
    
    drawGrid(); // Redraw the grid to reflect the changes
    return 1;
}

bodyCountSlider.addEventListener('input', updateSliderValues);
removalDaysSlider.addEventListener('input', updateSliderValues);

// Initial call to set the values and update the grid
updateSliderValues();


// I want to modify the setPresetValues() to pass in the values, instead of hard code the values
document.getElementById('covid19').addEventListener('click', function() {
    setPresetValues({
        initialSick: 2,
        transmissibilityMin: 2,
        transmissibilityMax: 5,
        simulationSpeed: 10,
        severityLevelMin: 3,
        severityLevelMax: 6,
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
    showToast("COVID-19 Preset Loaded! 😷");
});

document.getElementById('ebola').addEventListener('click', function() {
    setPresetValues({
        initialSick: 1,
        transmissibilityMin: 1.3,
        transmissibilityMax: 2.7,
        simulationSpeed: 15,
        severityLevelMin: 5,
        severityLevelMax: 7,
        skewnessSlider: 0.5,
        healSpeedMin: 3,
        healSpeedMax: 5,
        healingInfectionChance_ReductionMultipler: 0.3,
        healedReInfectionChance_ReductionMultipler: 0.1,
        healChanceMin: 3.5,
        healChanceMax: 7,
        healChanceSkewness: 1,
        incubationInfectionRateMultiplier: 1.5,
        incubationReducedSeverityMultiplier: 0.3,
        incubationPhaseDurationMin: 2,
        incubationPhaseDurationMax: 10
    });
    // click on randomizeButton to randomize the grid
    document.getElementById('randomizeButton').click();
    showToast("Ebola Preset Loaded! 😷");
});

document.getElementById('hiv').addEventListener('click', function() {
    setPresetValues({
        initialSick: 1,
        transmissibilityMin: 0.05,
        transmissibilityMax: 0.1,
        simulationSpeed: 40,
        severityLevelMin: 0.05,
        severityLevelMax: 0.1,
        skewnessSlider: 1,
        healSpeedMin: 0,
        healSpeedMax: 0,
        healingInfectionChance_ReductionMultipler: 1,
        healedReInfectionChance_ReductionMultipler: 1,
        healChanceMin: 0,
        healChanceMax: 0,
        healChanceSkewness: 1,
        incubationInfectionRateMultiplier: 1,
        incubationReducedSeverityMultiplier: 0.1,
        incubationPhaseDurationMin: 730,
        incubationPhaseDurationMax: 3650
    });
    // click on randomizeButton to randomize the grid
    document.getElementById('randomizeButton').click();
    showToast("HIV Preset Loaded! 😷");
});

document.getElementById('hiv-with-PrEP').addEventListener('click', function() {
    setPresetValues({
        initialSick: 1,
        transmissibilityMin: 0.05,
        transmissibilityMax: 0.1,
        simulationSpeed: 40,
        severityLevelMin: 0.05,
        severityLevelMax: 0.1,
        skewnessSlider: 1,
        healSpeedMin: 0,
        healSpeedMax: 0,
        healingInfectionChance_ReductionMultipler: 1,
        healedReInfectionChance_ReductionMultipler: 1,
        healChanceMin: 0,
        healChanceMax: 0,
        healChanceSkewness: 1,
        incubationInfectionRateMultiplier: 0.1,
        incubationReducedSeverityMultiplier: 0.01,
        incubationPhaseDurationMin: 5475,
        incubationPhaseDurationMax: 5475
    });
    // click on randomizeButton to randomize the grid
    document.getElementById('randomizeButton').click();
    showToast("HIV with PrEP Preset Loaded! 😷");
});

document.getElementById('flu').addEventListener('click', function() {
    setPresetValues({
        initialSick: 1,
        transmissibilityMin: 3,
        transmissibilityMax: 10,
        simulationSpeed: 10,
        severityLevelMin: 2,
        severityLevelMax: 6,
        skewnessSlider: 3,
        healSpeedMin: 7,
        healSpeedMax: 10,
        healingInfectionChance_ReductionMultipler: 0.5,
        healedReInfectionChance_ReductionMultipler: 0.1,
        healChanceMin: 15,
        healChanceMax: 20,
        healChanceSkewness: 1,
        incubationInfectionRateMultiplier: 0.7,
        incubationReducedSeverityMultiplier: 0.6,
        incubationPhaseDurationMin: 1,
        incubationPhaseDurationMax: 4
    });
    // click on randomizeButton to randomize the grid
    document.getElementById('randomizeButton').click();
    showToast("Flu Preset Loaded! 😷");
});

document.getElementById('tuberculosis').addEventListener('click', function() {
    setPresetValues({
        initialSick: 1,
        transmissibilityMin: 1.5,
        transmissibilityMax: 4,
        simulationSpeed: 15,
        severityLevelMin: 3,
        severityLevelMax: 6,
        skewnessSlider: 2,
        healSpeedMin: 3,
        healSpeedMax: 6,
        healingInfectionChance_ReductionMultipler: 0.4,
        healedReInfectionChance_ReductionMultipler: 0.2,
        healChanceMin: 15,
        healChanceMax: 20,
        healChanceSkewness: 0.6,
        incubationInfectionRateMultiplier: 1.2,
        incubationReducedSeverityMultiplier: 0.05,
        incubationPhaseDurationMin: 21,
        incubationPhaseDurationMax: 56
    });
    
    // click on randomizeButton to randomize the grid
    document.getElementById('randomizeButton').click();
    showToast("Tuberculosis Preset Loaded! 😷");
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
    setValueAndDispatchEvent('severityLevelMax', values.severityLevelMax);
    setValueAndDispatchEvent('severityLevelMin', values.severityLevelMin);
    setValueAndDispatchEvent('skewnessSlider', values.skewnessSlider);
    setValueAndDispatchEvent('healSpeedMax', values.healSpeedMax);
    setValueAndDispatchEvent('healSpeedMin', values.healSpeedMin);
    setValueAndDispatchEvent('healingInfectionChance_ReductionMultipler', values.healingInfectionChance_ReductionMultipler);
    setValueAndDispatchEvent('healedReInfectionChance_ReductionMultipler', values.healedReInfectionChance_ReductionMultipler);
    setValueAndDispatchEvent('healChanceMax', values.healChanceMax);
    setValueAndDispatchEvent('healChanceMin', values.healChanceMin);
    setValueAndDispatchEvent('healChanceSkewness', values.healChanceSkewness);
    setValueAndDispatchEvent('incubationInfectionRateMultiplier', values.incubationInfectionRateMultiplier);
    setValueAndDispatchEvent('incubationReducedSeverityMultiplier', values.incubationReducedSeverityMultiplier);
    setValueAndDispatchEvent('incubationPhaseDurationMax', values.incubationPhaseDurationMax);
    setValueAndDispatchEvent('incubationPhaseDurationMin', values.incubationPhaseDurationMin);

    // Update display for any sliders or ranges
    updateTransmissibilityRange();
    updateSeverityLevelRange();
    updateHealSpeedRange();
    updateHealChanceRange();
    updateIncubationPhaseDurationRange();
}



drawGrid();

// Initial call to set the correct color based on the default checkbox state
updateHealedColor();