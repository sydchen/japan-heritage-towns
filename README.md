# 日本重要傳統的建造物群保存地區互動地圖

受到日本47[都道府縣制縣等級](https://zhung.com.tw/japanex/)的啟發, 一直想弄一個日本重要傳統建築物保存地區(重要伝統的建造物群保存地区, 簡稱: 重傳建)的版本, 這是需要日本政府文化廳審核, 才能列進去的, 本專案資料目前收錄126處。有些行政區甚至沒有, 例如山形縣, 熊本縣。

介面提供繁體中文，保存地區名稱與原始介紹沿用日文。

## 本機預覽

需要 Python 3。在專案目錄執行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

再開啟 <http://127.0.0.1:4173>。已安裝 npm 時，也可使用 `npm run dev` 啟動同一個伺服器，仍需 Python 3。

JavaScript 與 CSS 保持未壓縮版本，一般預覽不需要安裝 npm 套件或建置。D3.js 從 CDN 載入，需要網路連線。造訪紀錄儲存於瀏覽器，可透過「旅行紀錄」匯出與匯入。

## 地圖輪廓

頁面使用 D3.js 與 SVG，支援地圖縮放、拖曳及鍵盤選取。`data/japan-map.json` 是由原始 `gadm41_JPN_1.json` 產生的簡化版本；透過 TopoJSON 共用邊界簡化，減少海岸線碎節點，保留都道府縣之間一致的邊界。原始資料不會被覆寫。

若更新地理資料或調整平滑程度，需要 Node.js 與 npm，執行：

```sh
npm ci
npm run build:map
```

平滑程度由 `scripts/build-map.mjs` 的 `MIN_TRIANGLE_AREA` 控制；數值越大，輪廓越簡潔。工具會覆寫 `data/japan-map.json`，保留原始資料；這個步驟只處理地理資料，不會壓縮 JavaScript。生成的 JSON 已包含在專案中，一般預覽與部署不需要安裝這些開發工具。

## 資料來源與版權

- 地理資訊資料: GADM (Global Administrative Areas) - gadm.org
- 重要伝統的建造物群保存地区資料來源: Japan Agency for Cultural Affairs (文化庁)
- 文化遺產資料和圖片僅用於教育和文化保護目的。所有版權均歸其各自所有者所有。


## Demo

[日本 - 重要伝統的建造物群保存地区](https://sydchen.github.io/japan-heritage-towns/)
