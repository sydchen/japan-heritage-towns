// 計分系統變數
let score = 0;
let clickedProperties = new Set();

// 從localStorage載入保存的數據
function loadSavedData() {
    const savedScore = localStorage.getItem('japanMapScore');
    const savedProperties = localStorage.getItem('japanMapClickedProperties');

    if (savedScore !== null) {
        score = parseInt(savedScore, 10);
        // 地圖資料載入後更新進度卡片
    }

    if (savedProperties !== null) {
        const propertiesArray = JSON.parse(savedProperties);
        clickedProperties = new Set(propertiesArray);
    }
}

// 保存數據到localStorage
function saveData() {
    localStorage.setItem('japanMapScore', score.toString());
    localStorage.setItem('japanMapClickedProperties', JSON.stringify([...clickedProperties]));
}

// Keep the summary readable at every viewport size.
function updateScore() {
    const total = Object.values(culturalPropertiesData).reduce((sum, items) => sum + items.length, 0);
    const percent = total ? Math.round(score / total * 100) : 0;
    document.getElementById('score-value').textContent = score;
    document.getElementById('total-properties').textContent = total || '—';
    document.getElementById('progress-percent').textContent = `${percent}%`;
    document.getElementById('progress-fill').style.width = `${Math.min(100, percent)}%`;
    document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', Math.min(100, percent));
    updateLegendStats();
    saveData();
}

// 重置分數和點擊狀態
function resetScore() {
    if (confirm('確定要重置所有分數嗎？這將清除您的所有探索記錄。')) {
        score = 0;
        clickedProperties.clear();
        localStorage.removeItem('japanMapScore');
        localStorage.removeItem('japanMapClickedProperties');
        updateScore();

        // 更新地圖顏色為初始狀態
        updateMapColors();

        // 更新table狀態
        updateTableCheckboxes();

        // 更新圖例統計
        updateLegendStats();

        // 如果有打開的彈出視窗，重新載入內容
        const modal = document.getElementById('modal-overlay');
        if (modal.classList.contains('show')) {
            hideModal();
        }
    }
}

// 頁面載入時恢復保存的數據
loadSavedData();

// A fixed viewBox lets SVG scale without recalculating every path on resize.
const svg = d3.select('#japan-map');
const projection = d3.geoMercator();
const path = d3.geoPath(projection);
const infoDisplay = document.getElementById('prefecture-info');
const defaultMapHint = '選擇地圖上的都道府縣，開啟你的下一站。';

// 都道府縣地區對應
const prefectureRegions = {
    'Hokkaido': 'hokkaido',
    'Aomori': 'tohoku', 'Iwate': 'tohoku', 'Miyagi': 'tohoku', 'Akita': 'tohoku', 'Yamagata': 'tohoku', 'Fukushima': 'tohoku',
    'Ibaraki': 'kanto', 'Tochigi': 'kanto', 'Gunma': 'kanto', 'Saitama': 'kanto', 'Chiba': 'kanto', 'Tokyo': 'kanto', 'Kanagawa': 'kanto',
    'Niigata': 'chubu', 'Toyama': 'chubu', 'Ishikawa': 'chubu', 'Fukui': 'chubu', 'Yamanashi': 'chubu', 'Nagano': 'chubu', 'Gifu': 'chubu', 'Shizuoka': 'chubu', 'Aichi': 'chubu',
    'Mie': 'kansai', 'Shiga': 'kansai', 'Kyoto': 'kansai', 'Osaka': 'kansai', 'Hyōgo': 'kansai', 'Nara': 'kansai', 'Wakayama': 'kansai',
    'Tottori': 'chugoku', 'Shimane': 'chugoku', 'Okayama': 'chugoku', 'Hiroshima': 'chugoku', 'Yamaguchi': 'chugoku',
    'Tokushima': 'shikoku', 'Kagawa': 'shikoku', 'Ehime': 'shikoku', 'Kochi': 'shikoku',
    'Fukuoka': 'kyushu', 'Saga': 'kyushu', 'Nagasaki': 'kyushu', 'Kumamoto': 'kyushu', 'Oita': 'kyushu', 'Miyazaki': 'kyushu', 'Kagoshima': 'kyushu', 'Okinawa': 'kyushu'
};

// 地區顏色
const regionColors = {
    'hokkaido': '#bda675',
    'tohoku': '#8daaa2',
    'kanto': '#c8917f',
    'chubu': '#9ab498',
    'kansai': '#c7ba80',
    'chugoku': '#aaa0b7',
    'shikoku': '#c9a57e',
    'kyushu': '#bb8c72'
};

// 英文地區名轉日文
const regionNamesJapanese = {
    'hokkaido': '北海道地方',
    'tohoku': '東北地方',
    'kanto': '関東地方',
    'chubu': '中部地方',
    'kansai': '近畿地方',
    'chugoku': '中国地方',
    'shikoku': '四国地方',
    'kyushu': '九州地方'
};

// 日文都道府縣名稱對應英文名稱
const japaneseToEnglish = {
    '北海道': 'Hokkaido',
    '青森県': 'Aomori', '岩手県': 'Iwate', '宮城県': 'Miyagi', '秋田県': 'Akita', '山形県': 'Yamagata', '福島県': 'Fukushima',
    '茨城県': 'Ibaraki', '栃木県': 'Tochigi', '群馬県': 'Gunma', '埼玉県': 'Saitama', '千葉県': 'Chiba', '東京都': 'Tokyo', '神奈川県': 'Kanagawa',
    '新潟県': 'Niigata', '富山県': 'Toyama', '石川県': 'Ishikawa', '福井県': 'Fukui', '山梨県': 'Yamanashi', '長野県': 'Nagano', '岐阜県': 'Gifu', '静岡県': 'Shizuoka', '愛知県': 'Aichi',
    '三重県': 'Mie', '滋賀県': 'Shiga', '京都府': 'Kyoto', '大阪府': 'Osaka', '兵庫県': 'Hyōgo', '奈良県': 'Nara', '和歌山県': 'Wakayama',
    '鳥取県': 'Tottori', '島根県': 'Shimane', '岡山県': 'Okayama', '広島県': 'Hiroshima', '山口県': 'Yamaguchi',
    '徳島県': 'Tokushima', '香川県': 'Kagawa', '愛媛県': 'Ehime', '高知県': 'Kochi',
    '福岡県': 'Fukuoka', '佐賀県': 'Saga', '長崎県': 'Nagasaki', '熊本県': 'Kumamoto', '大分県': 'Oita', '宮崎県': 'Miyazaki', '鹿児島県': 'Kagoshima', '沖縄県': 'Okinawa'
};

// 存儲文化財產資料
let culturalPropertiesData = {};

// 同時載入 GeoJSON 和 CSV 資料
Promise.all([
    d3.json('data/japan-map.json'),
    d3.csv('cultural_properties.csv')
]).then(function([japan, csvData]) {

    // 處理 CSV 資料，建立都道府縣對應的文化財產
    csvData.forEach(function(d) {
        const englishName = japaneseToEnglish[d.都道府県];
        if (englishName) {
            if (!culturalPropertiesData[englishName]) {
                culturalPropertiesData[englishName] = [];
            }
            culturalPropertiesData[englishName].push({
                name: d.名称,
                type: d.種別,
                prefecture: d.都道府県,
                latitude: d.緯度,
                longitude: d.経度,
                description: d.解説文 || '', // 解説文欄位
                imageFileName: d.image_file_name || '', // 本地圖片檔案名稱
                imageCopyright: d.image_copyright || '' // 圖片版權欄位
            });
        }
    });


    const filteredFeatures = japan.features.map(feature => {
        if (feature.geometry.type !== 'MultiPolygon') return feature;
        const polygons = feature.geometry.coordinates;
        const largest = polygons.reduce((a, b) => d3.geoArea({ type: 'Polygon', coordinates: a }) > d3.geoArea({ type: 'Polygon', coordinates: b }) ? a : b);
        const coordinates = polygons.filter(polygon => {
            const shape = { type: 'Polygon', coordinates: polygon };
            const [longitude, latitude] = d3.geoCentroid(shape);
            if (polygon === largest) return true;
            if (feature.properties.NAME_1 === 'Okinawa') return d3.geoArea(shape) > 0.0000003;
            return latitude > 30.3 && longitude < 147 && d3.geoArea(shape) > 0.000001;
        });
        return { ...feature, geometry: { ...feature.geometry, coordinates } };
    });
    const mainland = { type: 'FeatureCollection', features: filteredFeatures.filter(d => d.properties.NAME_1 !== 'Okinawa') };
    projection.fitExtent([[160, 30], [935, 630]], mainland);
    const okinawa = filteredFeatures.find(d => d.properties.NAME_1 === 'Okinawa');
    const okinawaProjection = d3.geoMercator().fitExtent([[625, 490], [810, 625]], okinawa);
    const okinawaPath = d3.geoPath(okinawaProjection);
    const mapContent = svg.append('g').attr('class', 'map-content');
    const mapGroup = mapContent.append('g').attr('class', 'map-geography');

    function showPrefectureInfo(event, d) {
        const name = d.properties.NAME_1;
        const count = (culturalPropertiesData[name] || []).length;
        infoDisplay.replaceChildren();
        const title = document.createElement('strong');
        title.textContent = d.properties.NL_NAME_1 || name;
        const detail = document.createElement('span');
        detail.textContent = `${regionNamesJapanese[prefectureRegions[name]]} · ${count} 處保存地區`;
        infoDisplay.append(title, detail);
    }
    function openPrefecture(event, d) {
        const name = d.properties.NAME_1;
        showModal(d.properties.NL_NAME_1 || name, culturalPropertiesData[name] || [], name);
    }
    mapGroup.selectAll('path').data(filteredFeatures).join('path')
        .attr('d', d => d.properties.NAME_1 === 'Okinawa' ? okinawaPath(d) : path(d))
        .attr('class', d => d.properties.NAME_1 === 'Okinawa' ? 'prefecture prefecture-okinawa' : 'prefecture')
        .attr('fill', '#cbd8c1')
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', d => `${d.properties.NL_NAME_1 || d.properties.NAME_1}，${(culturalPropertiesData[d.properties.NAME_1] || []).length} 處保存地區`)
        .on('mouseenter focus', showPrefectureInfo)
        .on('mouseleave blur', () => { infoDisplay.textContent = defaultMapHint; })
        .on('click', openPrefecture)
        .on('keydown', (event, d) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openPrefecture(event, d);
            }
        });

    // Quiet geographic labels leave the prefectures as the main interaction.
    const labels = [
        ['北海道', [143, 43.4], 45, 0], ['東北', [141.3, 39.1], 50, 0],
        ['関東', [140.3, 35.8], 45, 12], ['中部', [137.4, 37.1], -30, -25],
        ['近畿', [135.2, 34.7], 5, 43], ['中国', [132.4, 35.4], -10, -30],
        ['四国', [133.5, 33.6], 0, 35], ['九州', [130.5, 32.5], -50, 10]
    ];
    labels.forEach(([text, coordinate, dx, dy]) => {
        const [x, y] = projection(coordinate);
        mapContent.append('text').attr('class', 'map-label').attr('x', x + dx).attr('y', y + dy).text(text);
    });
    mapContent.append('text').attr('class', 'map-label').attr('x', 655).attr('y', 650).text('沖縄 · OKINAWA');
    mapContent.append('path').attr('d', 'M610,475H830V640').attr('fill', 'none').attr('stroke', '#cbd4c4').attr('stroke-dasharray', '4 6');
    mapContent.append('text').attr('class', 'sea-label').attr('x', 410).attr('y', 260).text('日本海');
    mapContent.append('text').attr('class', 'sea-label').attr('x', 720).attr('y', 455).text('太平洋');
    const zoom = d3.zoom().scaleExtent([1, 4])
        .on('zoom', event => mapContent.attr('transform', event.transform));
    svg.call(zoom).on('wheel.zoom', null).on('dblclick.zoom', null);
    document.getElementById('zoom-in').addEventListener('click', () => svg.call(zoom.scaleBy, 1.35));
    document.getElementById('zoom-out').addEventListener('click', () => svg.call(zoom.scaleBy, 1 / 1.35));
    document.getElementById('zoom-reset').addEventListener('click', () => svg.call(zoom.transform, d3.zoomIdentity));
    function fitViewport() {
        const compact = window.innerWidth <= 768;
        svg.attr('viewBox', compact ? '245 -10 620 720' : '0 0 1000 700');
        svg.call(zoom.transform, d3.zoomIdentity);
    }
    window.matchMedia('(max-width: 768px)').addEventListener('change', fitViewport);
    fitViewport();
    document.getElementById('map-state').hidden = true;

    // 地圖繪製完成後，根據保存的數據恢復地圖顏色
    updateMapColors();

    updateScore();

    // 初始化圖例統計
    updateLegendStats();

    // 初始化摺疊功能
    initCollapsible();
}).catch(function(error) {
    console.error('載入資料失敗:', error);
    infoDisplay.textContent = '地圖資料載入失敗，請重新整理再試一次。';
    document.getElementById('map-state').innerHTML = '暫時無法展開地圖<button class="quiet-button" onclick="location.reload()">重新載入</button>';
});


const mobileLayout = window.matchMedia('(max-width: 768px)');
let selectedRegion = null;
mobileLayout.addEventListener('change', () => renderRegion(selectedRegion));

const dialogOpeners = new Map();
function syncDialogs() {
    const open = [...document.querySelectorAll('.modal-overlay.show, .simple-modal-overlay.show, .settings-modal-overlay.show')];
    const top = open.sort((a, b) => Number(getComputedStyle(a).zIndex) - Number(getComputedStyle(b).zIndex)).at(-1);
    document.querySelectorAll('.site-header, main, footer').forEach(element => { element.inert = Boolean(top); });
    document.querySelectorAll('.modal-overlay, .simple-modal-overlay, .settings-modal-overlay').forEach(element => { element.inert = Boolean(top && top !== element); });
    document.body.style.overflow = top ? 'hidden' : '';
}
function openDialog(id) {
    const overlay = document.getElementById(id);
    dialogOpeners.set(id, document.activeElement);
    overlay.classList.add('show');
    syncDialogs();
    overlay.querySelector('[role="dialog"]').focus();
}
function closeDialog(id) {
    document.getElementById(id).classList.remove('show');
    syncDialogs();
    const opener = dialogOpeners.get(id);
    if (opener?.isConnected) opener.focus();
}
document.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const dialog = document.activeElement.closest('[role="dialog"]');
    if (!dialog) return;
    const controls = [...dialog.querySelectorAll('button, a[href], input, [tabindex="0"]')].filter(element => element.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
    }
});
function toggleVisited(propertyId) {
    if (clickedProperties.has(propertyId)) clickedProperties.delete(propertyId);
    else clickedProperties.add(propertyId);
    score = clickedProperties.size;
    updateScore();
    updateMapColors();
    updateTableCheckboxes();
}

// 彈出視窗控制函數
function showModal(prefectureDisplayName, properties, englishPrefectureName) {
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');

    modalTitle.textContent = `${prefectureDisplayName} · 傳統街區`;

    modalText.replaceChildren();
    if (properties.length > 0) {
        const help = document.createElement('p');
        help.className = 'modal-help';
        help.textContent = '點選名稱認識這個地方；勾選右側圓圈，記錄已造訪。';
        modalText.append(help);
        properties.forEach(property => {
            const propertyId = `${property.prefecture}-${property.name}`;
            const item = document.createElement('div');
            item.className = 'cultural-property-item';
            item.dataset.propertyId = propertyId;
            const details = document.createElement('div');
            const name = document.createElement('div');
            name.className = 'property-name';
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'clickable-name';
            button.textContent = property.name;
            button.addEventListener('click', () => showSimpleModal(property.name, property.prefecture, property.type, property.description, property.imageFileName, property.imageCopyright));
            name.append(button);
            const type = document.createElement('div');
            type.className = 'property-type';
            type.textContent = property.type;
            details.append(name, type);
            const visited = document.createElement('button');
            visited.type = 'button';
            visited.className = 'visit-checkbox';
            visited.setAttribute('aria-label', `已造訪 ${property.name}`);
            visited.addEventListener('click', () => toggleVisited(propertyId));
            item.append(details, visited);
            modalText.append(item);
        });
        updateTableCheckboxes();
    } else {
        const empty = document.createElement('div');
        empty.className = 'no-properties';
        empty.textContent = '此都道府縣目前沒有登錄的傳統建築保存地區。';
        modalText.append(empty);
    }
    openDialog('modal-overlay');
}

function hideModal() {
    closeDialog('modal-overlay');
}

// 關閉按鈕事件
document.getElementById('modal-close').addEventListener('click', hideModal);

// 點擊背景關閉
document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        hideModal();
    }
});

// 簡單文化財產詳細視窗控制
function showSimpleModal(propertyName, prefecture, propertyType, description, imageFileName, imageCopyright) {
    const title = document.getElementById('simple-modal-title');
    const body = document.getElementById('simple-modal-body');

    title.textContent = propertyName;

    // 從CSV數據中找到對應的經緯度
    let latitude = '';
    let longitude = '';

    // 在culturalPropertiesData中尋找匹配的項目
    for (let prefKey in culturalPropertiesData) {
        const properties = culturalPropertiesData[prefKey];
        const foundProperty = properties.find(p => p.name === propertyName && p.prefecture === prefecture);
        if (foundProperty && foundProperty.latitude && foundProperty.longitude) {
            latitude = foundProperty.latitude;
            longitude = foundProperty.longitude;
            break;
        }
    }

    // 生成Google Maps連結
    let mapLink = '';
    if (latitude && longitude) {
        mapLink = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
    }

    body.innerHTML = `
        <div class="pop_class">
            ${imageFileName ? `
            <div class="property-photo">
                <img src="images/${escapeHTML(imageFileName)}"
                     style="max-width: 100%; max-height: 300px; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                     oncontextmenu="return false;"
                     onerror="this.style.display='none';"
                     alt="${escapeHTML(propertyName)}的街區風景">
                ${imageCopyright && imageCopyright !== '自由引用' ? `
                <div class="photo-credit">
                    圖片提供：${escapeHTML(imageCopyright)}
                </div>
                ` : ''}
            </div>
            ` : ''}
            <table class="map_item">
                <tbody>
                    <tr><td>名稱</td><td>：</td><td>${escapeHTML(propertyName)}</td></tr>
                    <tr><td>所在地</td><td>：</td><td>${escapeHTML(prefecture)}</td></tr>
                    <tr><td>種別</td><td>：</td><td>${escapeHTML(propertyType)}</td></tr>
                </tbody>
            </table>
            ${description ? `
            <div class="heritage-description">
                <p>${escapeHTML(description)}</p>
            </div>
            ` : ''}
            ${mapLink ? `
            <div style="text-align: center;">
                <a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="map_link">
                    在 Google 地圖開啟
                </a>
            </div>
            ` : ''}
        </div>
    `;

    openDialog('simple-modal-overlay');
}

function hideSimpleModal() {
    closeDialog('simple-modal-overlay');
}

// 簡單視窗關閉事件
document.getElementById('simple-modal-close').addEventListener('click', hideSimpleModal);

// 點擊背景關閉簡單視窗
document.getElementById('simple-modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        hideSimpleModal();
    }
});

// ESC鍵關閉
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const settingsModal = document.getElementById('settings-modal-overlay');
        const culturalModal = document.getElementById('modal-overlay');
        const simpleModal = document.getElementById('simple-modal-overlay');

        if (settingsModal.classList.contains('show')) {
            hideSettingsModal();
        } else if (simpleModal.classList.contains('show')) {
            hideSimpleModal();
        } else if (culturalModal.classList.contains('show')) {
            hideModal();
        }
    }
});

document.getElementById('open-settings').addEventListener('click', showSettingsModal);

// 設定彈出視窗控制
function showSettingsModal() {
    openDialog('settings-modal-overlay');
}

function hideSettingsModal() {
    closeDialog('settings-modal-overlay');
}


// 設定彈出視窗關閉事件
document.getElementById('settings-modal-close').addEventListener('click', hideSettingsModal);

// 點擊背景關閉設定彈出視窗
document.getElementById('settings-modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        hideSettingsModal();
    }
});

// 匯出旅行紀錄
function exportProgress() {
    const exportData = {
        score: score,
        clickedProperties: [...clickedProperties],
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `japan-cultural-properties-progress-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(link.href);
}

// 匯入旅行紀錄
function importProgress(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);

            // 驗證數據格式
            if (!importData.score && importData.score !== 0) {
                throw new Error('無效的數據格式：缺少分數資訊');
            }
            if (!Array.isArray(importData.clickedProperties)) {
                throw new Error('無效的數據格式：缺少點擊記錄');
            }

            // 確認是否覆蓋現有數據
            const confirmMessage = `確定要匯入旅行紀錄嗎？這會覆蓋目前的紀錄。\n\n目前已造訪：${score} 處\n匯入紀錄：${importData.score} 處\n匯出日期：${importData.exportDate ? new Date(importData.exportDate).toLocaleString() : '不明'}`;

            if (confirm(confirmMessage)) {
                // 恢復數據
                score = importData.score;
                clickedProperties = new Set(importData.clickedProperties);

                // 更新顯示
                updateScore();
                updateMapColors();
                updateTableCheckboxes();
                updateLegendStats();

                // 保存到localStorage
                saveData();

                // 關閉彈出視窗
                const modal = document.getElementById('modal-overlay');
                if (modal.classList.contains('show')) {
                    hideModal();
                }

                alert('已匯入並恢復旅行紀錄。');
            }
        } catch (error) {
            alert('匯入失敗：' + error.message + '\n\n請確認備份檔案格式。');
        }
    };
    reader.readAsText(file);
}

// 設定彈出視窗內的按鈕事件
document.getElementById('export-progress-button').addEventListener('click', function() {
    exportProgress();
    hideSettingsModal();
});

document.getElementById('import-progress-button').addEventListener('click', function() {
    document.getElementById('import-file-input').click();
});

document.getElementById('reset-progress-button').addEventListener('click', function() {
    resetScore();
    hideSettingsModal();
});

// 檔案選擇事件
document.getElementById('import-file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        importProgress(file);
        hideSettingsModal();
        // 清除檔案選擇，以便下次可以選擇同一檔案
        e.target.value = '';
    }
});

// Synchronize table and dialog buttons after visits, imports, and resets.
function updateTableCheckboxes() {
    document.querySelectorAll('.visit-column, .cultural-property-item').forEach(item => {
        const button = item.querySelector('.visit-checkbox');
        if (!button) return;
        const visited = clickedProperties.has(item.dataset.propertyId);
        button.classList.toggle('checked', visited);
        button.setAttribute('aria-pressed', String(visited));
    });
}

// 檢查某個縣是否有被訪問過的文化財產
function hasVisitedPropertiesInPrefecture(prefectureName) {
    const properties = culturalPropertiesData[prefectureName] || [];

    for (let property of properties) {
        const propertyId = `${property.prefecture}-${property.name}`;
        if (clickedProperties.has(propertyId)) {
            return true;
        }
    }

    return false;
}

// 計算每個地區的拜訪統計
function getRegionStats(region) {
    // 按地區整理都道府縣
    const regionPrefectures = {
        'hokkaido': ['Hokkaido'],
        'tohoku': ['Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima'],
        'kanto': ['Ibaraki', 'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa'],
        'chubu': ['Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu', 'Shizuoka', 'Aichi'],
        'kansai': ['Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyōgo', 'Nara', 'Wakayama'],
        'chugoku': ['Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi'],
        'shikoku': ['Tokushima', 'Kagawa', 'Ehime', 'Kochi'],
        'kyushu': ['Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa']
    };

    let totalProperties = 0;
    let visitedProperties = 0;

    if (regionPrefectures[region]) {
        regionPrefectures[region].forEach(function(prefecture) {
            const properties = culturalPropertiesData[prefecture] || [];
            totalProperties += properties.length;

            properties.forEach(function(property) {
                const propertyId = `${property.prefecture}-${property.name}`;
                if (clickedProperties.has(propertyId)) {
                    visitedProperties++;
                }
            });
        });
    }

    return { visited: visitedProperties, total: totalProperties };
}

// 更新圖例顯示統計
function updateLegendStats() {
    const regions = ['hokkaido', 'tohoku', 'kanto', 'chubu', 'kansai', 'chugoku', 'shikoku', 'kyushu'];

    regions.forEach(function(region) {
        const legendItem = document.querySelector(`[data-region="${region}"] .legend-text`);
        if (legendItem) {
            const stats = getRegionStats(region);
            // 提取基礎地區名稱（移除括號部分）
            let baseText = regionNamesJapanese[region];
            if (baseText.includes('(')) {
                baseText = baseText.split('(')[0].trim();
            }

            // 使用HTML結構讓統計數字變小
            legendItem.innerHTML = `${baseText} <span class="region-stats">${stats.visited} / ${stats.total} 已造訪</span>`;
        }
    });
}

// 檢查同地區其他有文化財產的縣是否都至少有一個被拜訪
function shouldRegionBeColored(region) {
    // 按地區整理都道府縣
    const regionPrefectures = {
        'hokkaido': ['Hokkaido'],
        'tohoku': ['Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima'],
        'kanto': ['Ibaraki', 'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa'],
        'chubu': ['Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu', 'Shizuoka', 'Aichi'],
        'kansai': ['Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyōgo', 'Nara', 'Wakayama'],
        'chugoku': ['Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi'],
        'shikoku': ['Tokushima', 'Kagawa', 'Ehime', 'Kochi'],
        'kyushu': ['Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa']
    };

    if (!regionPrefectures[region]) return false;

    const prefecturesInRegion = regionPrefectures[region];
    const prefecturesWithProperties = [];

    // 找出該地區有文化財產的縣
    prefecturesInRegion.forEach(function(prefecture) {
        const properties = culturalPropertiesData[prefecture] || [];
        if (properties.length > 0) {
            prefecturesWithProperties.push(prefecture);
        }
    });

    // 如果該地區沒有任何縣有文化財產，返回false
    if (prefecturesWithProperties.length === 0) {
        return false;
    }

    // 檢查每個有文化財產的縣是否都至少有一個被拜訪
    return prefecturesWithProperties.every(function(prefecture) {
        return hasVisitedPropertiesInPrefecture(prefecture);
    });
}

// 更新地圖顏色
function updateMapColors() {
    const svg = d3.select("#japan-map");
    svg.selectAll('path.prefecture')
        .attr('fill', function(d) {
            const prefectureName = d.properties.NAME_1;
            const region = prefectureRegions[prefectureName];

            // 檢查這個縣是否有被訪問過的文化財產
            if (hasVisitedPropertiesInPrefecture(prefectureName)) {
                return regionColors[region]; // 顯示該地區的顏色
            } else {
                // 如果該縣沒有被訪問的文化財產，檢查同地區是否應該上色
                if (shouldRegionBeColored(region)) {
                    return regionColors[region]; // 顯示該地區的顏色
                } else {
                    return '#cbd8c1'; // 尚未造訪的保存地區
                }
            }
        });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

// 生成指定地區的表格數據
function generateRegionTableData(region, targetTableId) {
    // 都道府縣日文名稱對應
    const prefectureJapaneseNames = {
        'Hokkaido': '北海道',
        'Aomori': '青森県', 'Iwate': '岩手県', 'Miyagi': '宮城県', 'Akita': '秋田県', 'Yamagata': '山形県', 'Fukushima': '福島県',
        'Ibaraki': '茨城県', 'Tochigi': '栃木県', 'Gunma': '群馬県', 'Saitama': '埼玉県', 'Chiba': '千葉県', 'Tokyo': '東京都', 'Kanagawa': '神奈川県',
        'Niigata': '新潟県', 'Toyama': '富山県', 'Ishikawa': '石川県', 'Fukui': '福井県', 'Yamanashi': '山梨県', 'Nagano': '長野県', 'Gifu': '岐阜県', 'Shizuoka': '静岡県', 'Aichi': '愛知県',
        'Mie': '三重県', 'Shiga': '滋賀県', 'Kyoto': '京都府', 'Osaka': '大阪府', 'Hyōgo': '兵庫県', 'Nara': '奈良県', 'Wakayama': '和歌山県',
        'Tottori': '鳥取県', 'Shimane': '島根県', 'Okayama': '岡山県', 'Hiroshima': '広島県', 'Yamaguchi': '山口県',
        'Tokushima': '徳島県', 'Kagawa': '香川県', 'Ehime': '愛媛県', 'Kochi': '高知県',
        'Fukuoka': '福岡県', 'Saga': '佐賀県', 'Nagasaki': '長崎県', 'Kumamoto': '熊本県', 'Oita': '大分県', 'Miyazaki': '宮崎県', 'Kagoshima': '鹿児島県', 'Okinawa': '沖縄県'
    };

    // 按地區整理都道府縣
    const regionPrefectures = {
        'hokkaido': ['Hokkaido'],
        'tohoku': ['Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima'],
        'kanto': ['Ibaraki', 'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa'],
        'chubu': ['Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu', 'Shizuoka', 'Aichi'],
        'kansai': ['Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyōgo', 'Nara', 'Wakayama'],
        'chugoku': ['Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi'],
        'shikoku': ['Tokushima', 'Kagawa', 'Ehime', 'Kochi'],
        'kyushu': ['Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa']
    };

    // 生成表格
    const table = document.getElementById(targetTableId || 'unified-table');
    let tableHTML = `
        <thead>
            <tr>
                <th>都道府縣</th>
                <th>傳統建築保存地區</th>
                <th>類型</th>
                <th>已造訪</th>
            </tr>
        </thead>
        <tbody>
    `;

    regionPrefectures[region].forEach(function(prefecture) {
        const properties = culturalPropertiesData[prefecture] || [];
        const prefectureJapanese = prefectureJapaneseNames[prefecture];

        if (properties.length > 0) {
            properties.forEach(function(property, index) {
                const propertyId = `${property.prefecture}-${property.name}`;
                const isVisited = clickedProperties.has(propertyId);
                const checkedClass = isVisited ? 'checked' : '';

                tableHTML += `
                    <tr>
                        <td class="prefecture-name">${index === 0 ? prefectureJapanese : ''}</td>
                        <td class="cultural-property-name"><button type="button" class="clickable-property" data-property-name="${escapeHTML(property.name)}" data-prefecture="${escapeHTML(property.prefecture)}" data-property-type="${escapeHTML(property.type)}" data-description="${escapeHTML(property.description || '')}" data-image-file-name="${escapeHTML(property.imageFileName || '')}" data-image-copyright="${escapeHTML(property.imageCopyright || '')}">${escapeHTML(property.name)}</button></td>
                        <td class="cultural-property-type">${property.type}</td>
                        <td class="visit-column" data-property-id="${escapeHTML(propertyId)}">
                            <button type="button" class="visit-checkbox ${checkedClass}" aria-pressed="${isVisited}" aria-label="已造訪 ${escapeHTML(property.name)}"></button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tableHTML += `
                <tr>
                    <td class="prefecture-name">${prefectureJapanese}</td>
                    <td colspan="3" style="color: #6c757d; font-style: italic;">此縣目前無登錄資料</td>
                </tr>
            `;
        }
    });

    tableHTML += '</tbody>';
    table.innerHTML = tableHTML;

    table.querySelectorAll('.visit-column').forEach(cell => {
        cell.querySelector('button').addEventListener('click', () => toggleVisited(cell.dataset.propertyId));
    });

    // 為文化財產名稱添加點擊事件
    table.querySelectorAll('.clickable-property').forEach(function(propertyCell) {
        propertyCell.addEventListener('click', function(e) {
            e.preventDefault();
            const propertyName = this.getAttribute('data-property-name');
            const prefecture = this.getAttribute('data-prefecture');
            const propertyType = this.getAttribute('data-property-type');
            const description = this.getAttribute('data-description');
            const imageFileName = this.getAttribute('data-image-file-name');
            const imageCopyright = this.getAttribute('data-image-copyright');

            showSimpleModal(propertyName, prefecture, propertyType, description, imageFileName, imageCopyright);
        });
    });
}

// 檢查是否為手機版
function isMobileView() {
    return window.innerWidth <= 768;
}

function renderRegion(region) {
    document.querySelectorAll('.collapsible-trigger').forEach(trigger => {
        const active = trigger.dataset.region === region;
        trigger.classList.toggle('active', active);
        trigger.setAttribute('aria-expanded', String(active));
        trigger.setAttribute('aria-controls', mobileLayout.matches ? `collapse-${trigger.dataset.region}` : 'unified-collapse');
    });
    document.querySelectorAll('.collapse-content').forEach(element => element.classList.remove('show'));
    document.getElementById('region-empty').hidden = Boolean(region);
    if (!region) return;
    const tableId = mobileLayout.matches ? `table-${region}` : 'unified-table';
    generateRegionTableData(region, tableId);
    document.getElementById(mobileLayout.matches ? `collapse-${region}` : 'unified-collapse').classList.add('show');
}
function initCollapsible() {
    document.querySelectorAll('.collapsible-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            selectedRegion = selectedRegion === trigger.dataset.region ? null : trigger.dataset.region;
            renderRegion(selectedRegion);
        });
    });
    renderRegion(null);
}
