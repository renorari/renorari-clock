const { ipcRenderer } = require("electron");

function clockUpdate() {
    const date = new Date();
    const hours = date.getHours();
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const seconds = ("0" + date.getSeconds()).slice(-2);
    const time = `${hours}:${minutes}:${seconds}`;
    document.querySelector("#clock").innerHTML = time;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const week = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    const dateStr = `${month}月${day}日 (${week})`;
    document.querySelector("#date").innerHTML = dateStr;
}

window.addEventListener("DOMContentLoaded", () => {
    clockUpdate();
    ipcRenderer.on("clockUpdate", () => {
        clockUpdate();
    });
    ipcRenderer.on("scheduleUpdate", (_event, schedules) => {
        const scheduleList = document.querySelector("#schedule");
        scheduleList.innerHTML = "";
        if (schedules.length == 0) {
            document.querySelector("#info").style.display = "none";
            return;
        } else {
            document.querySelector("#info").style.display = "block";
        }
        schedules.forEach((schedule) => {
            const event = document.createElement("div");
            event.classList.add("event");
            const eventTime = document.createElement("span");
            eventTime.classList.add("event-time");
            eventTime.innerHTML = `${schedule.time.start.date}日 ${schedule.time.start.hours}:${("0" + schedule.time.start.minutes).slice(-2)} - ${schedule.time.end.hours}:${("0" + schedule.time.end.minutes).slice(-2)}`;
            event.appendChild(eventTime);
            const eventTitle = document.createElement("span");
            eventTitle.classList.add("event-title");
            eventTitle.innerHTML = schedule.title;
            if (schedule.time.start.date == new Date().getDate() && schedule.time.end.hours < new Date().getHours() && schedule.time.end.minutes < new Date().getMinutes()) {
                event.classList.add("finished");
            }
            event.appendChild(eventTitle);
            scheduleList.appendChild(event);
        });
    });
});