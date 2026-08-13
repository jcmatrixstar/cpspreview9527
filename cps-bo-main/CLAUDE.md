# XinBonus-BO 設計規範

## 操作欄（列表表格）

### 超過 1 個操作選項時的響應式規則

**規則：** 操作欄有 2 個以上 icon 按鈕時，桌面（`lg+`）顯示個別 icon 按鈕，手機（`< lg`）改為單一 list icon，點擊展開下拉清單進行操作。

**實作範本（以 FreeSpinActivity 操作欄為例）：**

```html
<td class="w-10 lg:w-28 px-1 py-3 table-cell-nowrap text-center sticky right-0 bg-white shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.08)]"
    x-data="{ opOpen: false }" :class="{'!z-[50]': opOpen}" style="z-index:10">

    <!-- 桌面（lg+）：個別 icon 按鈕 -->
    <div class="hidden lg:inline-flex items-center justify-center gap-0.5">
        <button @click="..." class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-primary transition-colors">
            <i class="ph ph-caret-right text-lg"></i>
        </button>
        <!-- ...其他按鈕 -->
    </div>

    <!-- 手機（< lg）：list icon + 下拉清單 -->
    <div class="lg:hidden relative flex items-center justify-center">
        <button @click.stop="opOpen = !opOpen"
                class="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center">
            <i class="ph ph-list text-lg"></i>
        </button>
        <div x-show="opOpen" @click.outside="opOpen = false"
             class="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-[200] min-w-[120px] text-left" x-cloak>
            <button @click="...; opOpen = false"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 flex items-center gap-2">
                <i class="ph ph-caret-right"></i>操作名稱
            </button>
            <!-- ...其他選項 -->
        </div>
    </div>
</td>
```

**thead th 對應寬度：**

```html
<th class="w-10 lg:w-28 px-1 py-3 ... sticky right-0 ...">操作</th>
```

**注意事項：**
- `opOpen` 狀態用 `x-data` 定義在 `<td>` 上，每列獨立
- `:class="{'!z-[50]': opOpen}"` 確保下拉清單不被相鄰欄位遮蔽
- 下拉清單項目統一樣式：`px-4 py-2 text-sm flex items-center gap-2`
- 危險操作（如下架）使用 `hover:bg-red-50`，icon 加 `text-red-500`
- 若只有 1 個操作選項，則無需響應式切換，直接顯示單一 icon 按鈕即可

**參考實作：**
- [GameManagement/FreeSpinActivity.html](GameManagement/FreeSpinActivity.html) — tbody 操作欄
- [ActivityManagement/LimitedTimeActivity.html](ActivityManagement/LimitedTimeActivity.html) — tbody 操作欄

---

## 查詢條件（列表頁）

### 整體結構

**外框：**
```html
<div class="bg-white border border-gray-200 rounded-lg shadow-sm flex-shrink-0">
```

**欄位網格：**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end px-5 pt-5 pb-4">
```

**進階查詢內容：**
```html
<div x-show="advancedOpen" x-cloak class="border-t border-gray-100 px-5 py-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-end bg-gray-50/60">
```

**底部按鈕列：**
```html
<div class="flex items-center justify-between px-5 pb-4">
    <button @click="advancedOpen = !advancedOpen" class="flex text-sm text-gray-500 hover:text-primary items-center gap-1 font-medium transition-colors">
        <span x-text="advancedOpen ? '隱藏條件' : '進階'"></span>
        <i class="ph" :class="advancedOpen ? 'ph-caret-up' : 'ph-caret-down'"></i>
    </button>
    <div class="flex gap-2 items-center">
        <button @click="resetQuery()" class="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">清除</button>
        <button class="w-10 h-10 bg-primary hover:bg-blue-600 text-white rounded-lg shadow flex items-center justify-center transition-colors">
            <i class="ph ph-magnifying-glass text-lg font-bold"></i>
        </button>
    </div>
</div>
```

### 欄位類型一：文字 + Icon 切換型

適用：欄位有 2 種查詢模式可互換（例：名稱 ↔ 單號、暱稱 ↔ 錢包帳號）。

```html
<div class="floating-input-group">
    <label class="floating-label z-10" x-text="query.searchType === '名稱' ? '名稱' : '單號'"></label>
    <div class="flex relative">
        <button @click="query.searchType = query.searchType === '名稱' ? '單號' : '名稱'"
                class="flex items-center justify-center w-12 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg hover:bg-gray-100 transition-colors" title="點擊切換類型">
            <i class="ph text-xl text-gray-500" :class="query.searchType === '名稱' ? 'ph-text-aa' : 'ph-hash'"></i>
        </button>
        <input type="text" x-model="query.searchText" class="floating-input rounded-l-none bg-input-base focus:bg-white" placeholder="">
    </div>
</div>
```

**注意：** `floating-label` 需加 `z-10` 確保浮動標籤在 button 之上顯示。

**參考實作：**
- [RecordManagement/BetRecord.html](RecordManagement/BetRecord.html) — 暱稱/錢包帳號欄位

### 欄位類型二：下拉複選型

適用：可複選的選項清單（例：狀態、VIP 階級、對象、分類）。

```html
<div class="floating-input-group relative" x-data="{ open: false }">
    <label class="floating-label">欄位名稱</label>
    <button @click="open = !open" @click.outside="open = false"
            class="floating-input bg-input-base text-left flex justify-between items-center">
        <span class="truncate" x-text="query.field.length > 0 ? '已選 ' + query.field.length + ' 項' : '全部'"></span>
        <i class="ph ph-caret-down text-gray-400"></i>
    </button>
    <div x-show="open" class="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 shadow-lg rounded z-[110] p-2 max-h-48 overflow-y-auto">
        <template x-for="item in options" :key="item">
            <label class="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded">
                <input type="checkbox" class="checkbox-item" :value="item" x-model="query.field">
                <span class="text-sm" x-text="item"></span>
            </label>
        </template>
    </div>
</div>
```

**注意：** 下拉清單 `z-[110]`，避免被其他浮層遮蔽；選項過多時加 `max-h-48 overflow-y-auto`。

**參考實作：**
- [MemberManagement/MemberList.html](MemberManagement/MemberList.html) — VIP 階級欄位
- [PortalManagement/MarqueeAnnouncement.html](PortalManagement/MarqueeAnnouncement.html) — 狀態、對象、分類欄位

### 欄位類型三：起訖區間型

適用：時間範圍、數值區間。

```html
<div class="floating-input-group">
    <label class="floating-label">欄位名稱</label>
    <div class="flex items-center">
        <input type="text" x-model="query.fieldStart" class="floating-input rounded-r-none border-r-0 text-center text-xs bg-input-base focus:bg-white" placeholder="起">
        <div class="px-1 border-y border-gray-200 bg-input-base h-[42px] flex items-center text-gray-400">~</div>
        <input type="text" x-model="query.fieldEnd" class="floating-input rounded-l-none border-l-0 text-center text-xs bg-input-base focus:bg-white" placeholder="訖">
    </div>
</div>
```

### 欄位類型四：純文字型

```html
<div class="floating-input-group">
    <label class="floating-label">欄位名稱</label>
    <input type="text" x-model="query.field" class="floating-input bg-input-base focus:bg-white" placeholder="">
</div>
```

### Tooltip 方向（表頭欄位）

表頭在 sticky 環境下 tooltip 需向**下**顯示（`top-full mt-1`），避免被 overflow 截斷：

```html
<div class="absolute top-full left-0 mt-1 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-[100]">提示文字</div>
```

**參考實作：**
- [PortalManagement/MarqueeAnnouncement.html](PortalManagement/MarqueeAnnouncement.html) — 查詢條件、表頭 Tooltip

---

## 多語系欄位（新增 / 詳細 / 編輯 彈窗）

### 適用情境

彈窗內需同時維護繁中與英文版本的文字欄位（例：活動名稱、標語）。

### 支援語系

| 語系 | 值 | 旗幟圖片 | 顯示文字 |
|---|---|---|---|
| 繁體中文 | `'zh'` | `flagcdn.com/w20/tw.png` | 繁中 |
| 英文 | `'en'` | `flagcdn.com/w20/us.png` | 英文 |

### 資料模型規則

- 繁中欄位：`form.{field}` / `temp.{field}`（例：`form.name`, `temp.name`）
- 英文欄位：`form.{field}En` / `temp.{field}En`（例：`form.nameEn`, `temp.nameEn`）
- 語系狀態：`{fieldName}Lang: 'zh'`（例：`nameLang`, `taglineLang`），用 `x-data` 定義在欄位外層，**每個欄位各自獨立，不跨欄位共用**

### 整體結構

```html
<!-- 外層 x-data：僅管該欄位的語系切換狀態 -->
<div x-data="{ nameLang: 'zh' }">
    <label class="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
        <span class="text-red-500 mr-1" x-show="isAddMode">*</span>名稱
    </label>
    <div class="flex border border-gray-300 rounded-lg bg-white" style="overflow:visible">

        <!-- 語系選擇器 -->
        <div class="relative flex-shrink-0" x-data="{ langOpen: false }" @click.outside="langOpen=false">
            <button type="button" @click="langOpen=!langOpen"
                    class="h-[38px] px-2.5 flex items-center gap-1 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors rounded-l-lg">
                <img :src="nameLang==='zh' ? 'https://flagcdn.com/w20/tw.png' : 'https://flagcdn.com/w20/us.png'"
                     alt="" style="width:18px;height:auto;border-radius:2px">
                <i class="ph ph-caret-down text-gray-400 text-xs"
                   :class="langOpen ? 'rotate-180' : ''" style="transition:transform .15s"></i>
            </button>
            <div x-show="langOpen" x-transition.opacity.duration.100ms style="display:none"
                 class="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] overflow-hidden min-w-[100px]">
                <button type="button" @click="nameLang='zh'; langOpen=false"
                        :class="nameLang==='zh' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'"
                        class="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium">
                    <img src="https://flagcdn.com/w20/tw.png" alt="TW" style="width:16px;border-radius:2px"> 繁中
                </button>
                <button type="button" @click="nameLang='en'; langOpen=false"
                        :class="nameLang==='en' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'"
                        class="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium">
                    <img src="https://flagcdn.com/w20/us.png" alt="US" style="width:16px;border-radius:2px"> 英文
                </button>
            </div>
        </div>

        <!-- 顯示區 / 輸入區 -->
        <div class="flex-1 min-w-0">
            <!-- 詳細模式（唯讀）：單一 div，依語系切換 x-text -->
            <div x-show="!isEditing"
                 class="h-[38px] px-3 flex items-center text-sm font-medium text-gray-800 truncate"
                 x-text="nameLang==='zh' ? (form.name||'-') : (form.nameEn||'-')"></div>
            <!-- 編輯 / 新增模式：兩個 input 各自 x-show 顯隱 -->
            <input x-show="isEditing && nameLang==='zh'" style="display:none" type="text"
                   x-model="temp.name" placeholder="繁體中文名稱"
                   class="w-full h-[38px] px-3 text-sm outline-none bg-transparent">
            <input x-show="isEditing && nameLang==='en'" style="display:none" type="text"
                   x-model="temp.nameEn" placeholder="English Name"
                   class="w-full h-[38px] px-3 text-sm outline-none bg-transparent">
        </div>

    </div>
</div>
```

### 注意事項

- 語系選擇器高度與 input 一致：`h-[38px]`
- 容器必須加 `style="overflow:visible"` 確保語系下拉不被截斷
- 下拉 `z-[60]`；若在彈窗內有更高層的浮層需適度調高
- 詳細（唯讀）模式用單一 `div` + `x-text` 切換顯示，不渲染兩個 div
- 編輯模式用兩個 `input` 分別 `x-show`（不用 `x-if`，避免每次語系切換時清除 input focus 與 DOM 重建）
- **必填欄位**只在 `isAddMode` 時顯示紅色星號（`x-show="isAddMode"`）
- 每個多語系欄位的 `{fieldName}Lang` 與語系下拉 `{fieldName}LangOpen` 需各自獨立命名，例：`nameLang` / `langOpen`、`taglineLang` / `tlLangOpen`

**參考實作：**
- [ActivityManagement/PeriodicTask.html](ActivityManagement/PeriodicTask.html) — 基本卡片「名稱」、「標語」欄位
