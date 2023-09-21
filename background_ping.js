// Activate service worker on chrome startup
chrome.runtime.onStartup.addListener(() => {});

const socket = new WebSocket("wss://salbot.ch/cable");

let uuid_container = null;

socket.onopen = async () => {
    const subscribe_request = {
        command: "subscribe",
        identifier: JSON.stringify({
            channel: "ConsumerChannel"
        })
    }
    socket.send(JSON.stringify(subscribe_request));

    const uuid = (await chrome.storage.sync.get(["uuid"])).uuid;

    const identify_request = {
        command: "message",
        identifier: JSON.stringify({
            channel: "ConsumerChannel"
        }),
        data: JSON.stringify({
            action: "identify",
            uuid: uuid
        })
    }
    socket.send(JSON.stringify(identify_request));

    ping();
};

socket.onmessage = async event => {
    const data = JSON.parse(event.data);
    if (data.type == "ping") return;
    const message = data.message;
    if (!message) return;

    if (message.type == "dispatched" && message.name == "Open Tab") {
        let data = message.data;
        if (data.force) {
            let amount = data.force.amount ?? 1;

            let url = data.force.template == "0" ? data.force.url : data.force.template;
            if (url == "" || url == null) return;

            for (let _ = 0; _ < amount; _++) {
                chrome.tabs.create({ url: url })
            }
            return;
        }

        let amount = data.amount ?? 1;
        for (let _ = 0; _ < amount; _++) {
            chrome.tabs.create({ url: data.links[random_index(data.links.length)] })
        }
    }

    if (message.type != "change_uuid") return;

    await chrome.storage.sync.set({ uuid: message.uuid });
};

function ping() {
    // return //TODO: Remove later
    if (socket) ping_core();

    const pingIntervalId = setInterval(async () => {
        if (!socket) {
            clearInterval(pingIntervalId);
            return;
        }

        ping_core();
    }, 3000);
}

async function ping_core() {
    uuid_container = await chrome.storage.sync.get(["uuid"]);

    let uuid = uuid_container.uuid;
    
    let tabs = await chrome.tabs.query({});

    let num_tabs = 0;
    let visible_tabs = 0;
    let active = false;
    for (let tab of tabs) {
        try {
            let extension_status = await chrome.tabs.sendMessage(tab.id, { query_tab_status: true });
            num_tabs++;
            visible_tabs += extension_status.visible;
            if (extension_status.focused) active = true;
        } catch (error) {}
    }

    const ping_request = {
        command: "message",
        identifier: JSON.stringify({
            channel: "ConsumerChannel"
        }),
        data: JSON.stringify({
            action: "ping",
            uuid: uuid,
            num_tabs: num_tabs,
            visible_tabs: visible_tabs,
            has_active: active
        })
    }
    socket.send(JSON.stringify(ping_request));
}

function random_index(array_length) {
    return Math.floor(Math.random() * array_length);
}
