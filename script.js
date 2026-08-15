// ========================================
// MRS WORKS - JAN Code Reader Main Script
// ========================================

let currentJanCode = "";

document.addEventListener("DOMContentLoaded", () => {
    initScanner();
    initEventListeners();
});

function initScanner() {
    const statusText = document.getElementById("status-text");

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#interactive"),
            constraints: {
                facingMode: "environment", // 背面カメラ指定
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
            readers: ["ean_reader"] // JANコード（EAN-13）に特化
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

    // 解析イベント検出
    Quagga.onDetected((result) => {
        const code = result.codeResult.code;

        // EAN-13の桁数検証 (13桁)
        if (code && code.length === 13) {
            onScanSuccess(code);
        }
    });
}

function onScanSuccess(code) {
    if (currentJanCode === code) return; // 同じコードの連続処理を防止

    currentJanCode = code;

    // UI要素の取得
    const statusText = document.getElementById("status-text");
    const janDisplay = document.getElementById("jan-code-display");
    const guideBox = document.getElementById("scanner-guide");
    const btnAmazon = document.getElementById("btn-amazon");
    const btnRakuten = document.getElementById("btn-rakuten");

    // UI更新
    statusText.textContent = "読み取り成功";
    janDisplay.textContent = code;

    // ボタン活性化
    btnAmazon.disabled = false;
    btnRakuten.disabled = false;

    // ガイド枠発光アニメーション
    guideBox.classList.remove("success");
    void guideBox.offsetWidth; // リフロー発生によるアニメーション再再生処理
    guideBox.classList.add("success");

    // バイブレーション（対応端末のみ）
    if ("vibrate" in navigator) {
        navigator.vibrate(200);
    }
}

function initEventListeners() {
    const btnAmazon = document.getElementById("btn-amazon");
    const btnRakuten = document.getElementById("btn-rakuten");

    btnAmazon.addEventListener("click", () => {
        if (!currentJanCode) return;
        const amazonUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(currentJanCode)}`;
        window.open(amazonUrl, "_blank");
    });

    btnRakuten.addEventListener("click", () => {
        if (!currentJanCode) return;
        const rakutenUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(currentJanCode)}/`;
        window.open(rakutenUrl, "_blank");
    });
}
