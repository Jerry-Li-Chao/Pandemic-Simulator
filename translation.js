let isChinese = false;

// document.getElementById('languageToggle').addEventListener('click', function() {
//     const elementsToTranslate = document.querySelectorAll('[data-translate]');
//     elementsToTranslate.forEach(element => {
//         const translationKey = element.getAttribute('data-translate');
//         if (!isChinese) {
//             element.textContent = translations[translationKey].zh;
//         } else {
//             element.textContent = translationKey;
//         }
//     });

//     // Toggle the language flag
//     isChinese = !isChinese;
//     // Change the button text
//     this.textContent = isChinese ? 'English' : 'Chinese';
// });

document.addEventListener("DOMContentLoaded", function () {
    const button = document.querySelector(".collapsible");
    const list = document.querySelector(".collapsible-list");

    button.addEventListener("click", function () {
        if (list.style.display === "none" || list.style.display === "") {
            list.style.display = "block";
            button.classList.add("active");
            button.classList.remove("shake");
            button.textContent = "Hide Guide";
        } else {
            list.style.display = "none";
            button.classList.remove("active");
            button.classList.add("shake");
            button.textContent = "Show Guide";
        }
    });

    button.addEventListener("animationend", function () {
        button.classList.remove("shake");
    });
});



const translations = {
    "Start": {
        "zh": "开始"
    },
    "Randomize Initial Population (Based on Initial Sick Population)":{
        "zh":"随机化初始人口（基于初始患者占比）"
    },
    "Make All Healthy":{
        "zh":"使所有人健康"
    },
    "Hold down 'Shift' to draw your own initial infected population":{
        "zh":"按下“Shift”以绘制自己的初始感染人口"
    },
    "Gradient of Green to Red: indicates the level of healthiness of that person":{
        "zh":"绿色到红色的渐变：表示此人的健康程度"
    },
    "It is allowed to adjust the variable when simulation is running, changes are applied in real time to the simulation":{
        "zh":"允许在模拟运行时调整变量，更改将实时应用于模拟"
    },
    
};