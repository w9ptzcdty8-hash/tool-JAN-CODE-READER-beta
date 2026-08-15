// ========================================
// MRS WORKS - JAN Code Reader Main Script
// ========================================

let currentJanCode = "";
let targetSearchCode = "";
let savedItems = [];

document.addEventListener("DOMContentLoaded", () => {
    loadSavedItems();
    initScanner();
    initEventListeners();
});

// ローカルストレージから保存リストを取得
function loadSavedItems() {
    try {
        const stored = localStorage.getItem("jan_reader_saved");
        if (stored) {
            savedItems = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Failed to load saved items:", e);
        savedItems = [];
    }
    renderSavedList();
}

// 保存リストをストレージに保存
function saveSavedItems() {
    try {
        localStorage.setItem("jan_reader_saved", JSON.stringify(savedItems));
    } catch (e) {
        console.error("Failed to save items:", e);
    }
}

function initScanner() {
    const statusText = document.getElementById("status-text");

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#interactive"),
            constraints: {
                facingMode: "environment",
                width: { min: 640 },
                height: { min: 480 },
                aspectRatio: { min: 1, max: 2 }
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 2,
        decoder: {
            readers: ["ean_reader"]
        },
        locate: true
    }, (err) => {
        if (err) {
            console.error("Quagga initialization failed: ", err);
            statusText.textContent = "カメラの起動に失敗しました";
            return;
        }
        Quagga.start();
        statusText.textContent = "スキャン中…";
    });

    Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        if (code && code.length === 13) {
            onScanSuccess(code);
        }
    });
}

function onScanSuccess(code) {
    if (currentJanCode === code) return;

    currentJanCode = code;

    const statusText = document.getElementById("status-text");
    const janDisplay = document.getElementById("jan-code-display");
    const guideBox = document.getElementById("scanner-guide");
    const btnCopy = document.getElementById("btn-copy");
    const btnSave = document.getElementById("btn-save");
    const btnSearchMain = document.getElementById("btn-search-main");

    statusText.textContent = "読み取り成功";
    janDisplay.textContent = code;

    btnCopy.disabled = false;
    btnSave.disabled = false;
    btnSearchMain.disabled = false;

    guideBox.classList.remove("success");
    void guideBox.offsetWidth;
    guideBox.classList.add("success");

    if ("vibrate" in navigator) {
        navigator.vibrate(200);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            alert("コピーしました: " + text);
        }).catch(() => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        alert("コピーしました: " + text);
    } catch (err) {
        alert("コピーに失敗しました");
    }
    document.body.removeChild(textArea);
}

function openSearchModal(code) {
    targetSearchCode = code;
    const modal = document.getElementById("search-modal");
    const modalCode = document.getElementById("modal-jan-code");
    modalCode.textContent = code;
    modal.classList.remove("hidden");
}

function closeSearchModal() {
    const modal = document.getElementById("search-modal");
    modal.classList.add("hidden");
    targetSearchCode = "";
}

function executeSearch(site) {
    if (!targetSearchCode) return;

    let url = "";
    const code = encodeURIComponent(targetSearchCode);

    switch (site) {
        case "google":
            url = `https://www.google.com/search?q=${code}`;
            break;
        case "amazon":
            url = `https://www.amazon.co.jp/s?k=${code}`;
            break;
        case "rakuten":
            url = `https://search.rakuten.co.jp/search/mall/${code}/`;
            break;
        case "mercari":
            url = `https://jp.mercari.com/search?keyword=${code}`;
            break;
    }

    if (url) {
        window.open(url, "_blank");
    }
    closeSearchModal();
}

function renderSavedList() {
    const container = document.getElementById("saved-list");
    container.innerHTML = "";

    if (savedItems.length === 0) {
        container.innerHTML = '<p style="color:#666; font-size:0.85rem; text-align:center;">保存されたコードはありません</p>';
        return;
    }

    savedItems.forEach((item, index) => {
        const itemEl = document.createElement("div");
        itemEl.className = "saved-item";

        const infoEl = document.createElement("div");
        infoEl.className = "saved-item-info";

        const codeEl = document.createElement("div");
        codeEl.className = "saved-item-code";
        codeEl.textContent = item.code;

        const memoInput = document.createElement("input");
        memoInput.type = "text";
        memoInput.className = "saved-item-memo";
        memoInput.placeholder = "メモを入力...";
        memoInput.value = item.memo || "";
        memoInput.addEventListener("input", (e) => {
            savedItems[index].memo = e.target.value;
            saveSavedItems();
        });

        infoEl.appendChild(codeEl);
        infoEl.appendChild(memoInput);

        const actionsEl = document.createElement("div");
        actionsEl.className = "saved-item-actions";

        const searchBtn = document.createElement("button");
        searchBtn.className = "btn-icon-sub";
        searchBtn.textContent = "検索";
        searchBtn.addEventListener("click", () => {
            openSearchModal(item.code);
        });

        const copyBtn = document.createElement("button");
        copyBtn.className = "btn-icon-sub";
        copyBtn.textContent = "コピー";
        copyBtn.addEventListener("click", () => {
            copyToClipboard(item.code);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn-icon-sub btn-danger";
        deleteBtn.textContent = "削除";
        deleteBtn.addEventListener("click", () => {
            savedItems.splice(index, 1);
            saveSavedItems();
            renderSavedList();
        });

        actionsEl.appendChild(searchBtn);
        actionsEl.appendChild(copyBtn);
        actionsEl.appendChild(deleteBtn);

        itemEl.appendChild(infoEl);
        itemEl.appendChild(actionsEl);

        container.appendChild(itemEl);
    });
}

function initEventListeners() {
    const btnCopy = document.getElementById("btn-copy");
    const btnSave = document.getElementById("btn-save");
    const btnSearchMain = document.getElementById("btn-search-main");
    const btnCloseModal = document.getElementById("btn-close-modal");
    const modalOptions = document.querySelectorAll(".btn-search-option");

    btnCopy.addEventListener("click", () => {
        if (currentJanCode) {
            copyToClipboard(currentJanCode);
        }
    });

    btnSave.addEventListener("click", () => {
        if (!currentJanCode) return;
        
        const exists = savedItems.some(item => item.code === currentJanCode);
        if (!exists) {
            savedItems.unshift({
                code: currentJanCode,
                memo: "",
                createdAt: new Date().toISOString()
            });
            saveSavedItems();
            renderSavedList();
            alert("保存リストに追加しました");
        } else {
            alert("このコードはすでに保存されています");
        }
    });

    btnSearchMain.addEventListener("click", () => {
        if (currentJanCode) {
            openSearchModal(currentJanCode);
        }
    });

    btnCloseModal.addEventListener("click", closeSearchModal);

    modalOptions.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const site = e.currentTarget.getAttribute("data-site");
            executeSearch(site);
        });
    });
}
