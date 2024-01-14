const fs = require("node:fs").promises;
const path = require("node:path");
const process = require("node:process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const cron = require("node-cron");
const { app, BrowserWindow } = require("electron");
require("dotenv").config();

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        fullscreen: true,
        webPreferences: {
            preload: path.join(__dirname, "view", "preload.js")
        }
    });

    mainWindow.loadFile(path.join(__dirname, "view", "index.html"));
    //mainWindow.webContents.openDevTools();

    cron.schedule("* * * * * *", () => {
        mainWindow.webContents.send("clockUpdate");
    });

    authorize().then(listEvents).catch(console.error);
    cron.schedule("0 0 * * * *", async () => {
        authorize().then(listEvents).catch(console.error);
    });
};

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    app.quit();
});

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: "authorized_user",
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

async function listEvents(auth) {
    const calendar = google.calendar({ version: "v3", auth });
    const primaryEvents = (await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: "startTime",
    })).data.items;
    const generalEducationClassEvents = (await calendar.events.list({
        calendarId: process.env.general_education_class_cid,
        timeMin: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: "startTime",
    })).data.items;
    const departmentClassEvents = (await calendar.events.list({
        calendarId: process.env.department_class_cid,
        timeMin: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: "startTime",
    })).data.items;
    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send("scheduleUpdate", [...primaryEvents, ...generalEducationClassEvents, ...departmentClassEvents].sort((a, b) => {
        const startA = new Date(a.start.dateTime || a.start.date);
        const startB = new Date(b.start.dateTime || b.start.date);
        return startA.getTime() - startB.getTime();
    }).filter((event) => {
        if (new Date().getHours() >= 18) {
            const now = new Date().toLocaleDateString();
            const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString();
            const start = new Date(event.start.dateTime || event.start.date).toLocaleDateString();
            return now == start || tomorrow == start;
        } else {
            const now = new Date().toLocaleDateString();
            const start = new Date(event.start.dateTime || event.start.date).toLocaleDateString();
            return now == start;
        }
    }).map((event) => {
        const start = new Date(event.start.dateTime || event.start.date);
        const end = new Date(event.end.dateTime || event.end.date);
        return {
            time: {
                start: {
                    date: start.getDate(),
                    hours: start.getHours(),
                    minutes: start.getMinutes(),
                },
                end: {
                    date: end.getDate(),
                    hours: end.getHours(),
                    minutes: end.getMinutes(),
                }
            },
            title: event.summary
        };
    }));
}