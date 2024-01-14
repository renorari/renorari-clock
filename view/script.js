var b = 16;
for (let i = 0; i < b; i++) {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.top = "0";
    div.style.left = "0";
    div.style.width = "100vw";
    div.style.height = `calc((100vh / 3 - 5rem) * ${1 - i / b})`;
    div.style.backdropFilter = `blur(${i}px)`;
    div.style.zIndex = `${-100 - i}`;
    document.getElementById("clock-background").appendChild(div);
}

//document.body.style.backgroundImage = "url(https://source.unsplash.com/random/1920x1080)";