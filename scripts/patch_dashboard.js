const fs = require("fs");
const indexJsFile = "node_modules/@discord-tickets/settings/build/server/index.js";
if (fs.existsSync(indexJsFile)) {
    let c = fs.readFileSync(indexJsFile, "utf8");
    if (!c.includes("hack_errorlog")) {
        const hackScript = `<script>
        window.addEventListener("load", () => {
            setInterval(() => {
                const labels = Array.from(document.querySelectorAll("label"));
                const logChannelLabel = labels.find(l => l.innerText.includes("Log channel") && !l.innerText.includes("Error log channel"));
                if (logChannelLabel && !document.getElementById("hack_errorlog")) {
                    const parentDiv = logChannelLabel.parentElement;
                    const newDiv = parentDiv.cloneNode(true);
                    newDiv.id = "hack_errorlog";
                    newDiv.querySelector("label").childNodes[0].nodeValue = "Error log channel ";
                    newDiv.querySelector("i").title = "Which channel should error logs be sent to?";
                    const select = newDiv.querySelector("select");
                    select.name = "errorLogChannelHack";
                    
                    const origSelect = parentDiv.querySelector("select");
                    select.innerHTML = origSelect.innerHTML;
                    select.value = window.hack_errorLogChannel || "";
                    select.addEventListener("change", (e) => {
                        window.hack_errorLogChannel = e.target.value;
                    });
                    
                    parentDiv.parentElement.insertBefore(newDiv, parentDiv.nextSibling);
                }
            }, 1000);
        });
        const origFetch = window.fetch;
        window.fetch = async (...args) => {
            if (typeof args[0] === "string" && args[0].includes("/settings") && args[1] && args[1].method === "PATCH") {
                try {
                    const body = JSON.parse(args[1].body);
                    if (window.hack_errorLogChannel) {
                        body.errorLogChannel = window.hack_errorLogChannel;
                    } else {
                        body.errorLogChannel = null;
                    }
                    args[1].body = JSON.stringify(body);
                } catch(e){}
            }
            const res = await origFetch(...args);
            if (typeof args[0] === "string" && args[0].includes("/settings") && (!args[1] || args[1].method === "GET")) {
                const clone = res.clone();
                clone.json().then(data => {
                    if (data && data.errorLogChannel !== undefined) {
                        window.hack_errorLogChannel = data.errorLogChannel || "";
                        const hackSelect = document.querySelector("#hack_errorlog select");
                        if (hackSelect) hackSelect.value = window.hack_errorLogChannel;
                    }
                }).catch(()=>{});
            }
            return res;
        };
        </script>`;
        c = c.replace("</body>", hackScript + "</body>");
        fs.writeFileSync(indexJsFile, c, "utf8");
        console.log("Patched dashboard UI successfully");
    }
}

const file1 = "node_modules/@discord-tickets/settings/build/server/chunks/_page.svelte-DJSfHtdy.js";
if (fs.existsSync(file1)) {
    let c1 = fs.readFileSync(file1, "utf8");
    const searchStr1 = `<div><label class="font-medium">Log channel <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which channel should logs be sent to?"></i> <select class="input form-multiselect"><option value="">None</option><hr><!--[-->\`;`;
    const replaceStr1 = `<div><label class="font-medium">Log channel <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which channel should logs be sent to?"></i> <select class="input form-multiselect"><option value="">None</option><hr><!--[-->\`;` +
    `\n    for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {` +
    `\n      let channel = each_array_3[$$index_3];` +
    `\n      $$payload.out += \`<option\${attr("value", channel.id)} class="p-1"\${attr("style", channel._style)}>\${escape_html(channel.unicodeEmoji || "")} \${escape_html(channel.name ?? "")}</option>\`;` +
    `\n    }` +
    `\n    $$payload.out += \`<!--]--></select></label></div> <div><label class="font-medium">Error log channel <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which channel should error logs be sent to?"></i> <select name="errorLogChannelHack" class="input form-multiselect"><option value="">None</option><hr><!--[-->\`;`;
    if (!c1.includes("Error log channel")) {
        c1 = c1.replace(searchStr1, replaceStr1);
        fs.writeFileSync(file1, c1);
    }
}

