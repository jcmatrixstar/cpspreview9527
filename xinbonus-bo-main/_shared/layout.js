/* ============================================================
   CPS-BO 共用版面注入
   透過 alpine:init 事件，在 Alpine 初始化前注入 Sidebar 與 Header
   ============================================================ */

(function () {
    'use strict';

    /* ── 嵌入模式：?frame=1 時隱藏側邊欄與頂部 ── */
    var isFrame = new URLSearchParams(window.location.search).get('frame') === '1';

    /* ── Sidebar HTML（含 Toast 容器與手機遮罩） ── */
    function renderSidebar() {
        if (isFrame) return '';
        return /* html */`
        <!-- Toast 通知 -->
        <div class="fixed top-5 right-5 z-[500] flex flex-col gap-2 pointer-events-none">
            <template x-for="toast in toasts" :key="toast.id">
                <div class="pointer-events-auto bg-gray-800 text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 min-w-[240px]"
                     x-show="toast.visible"
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0 translate-y-2"
                     x-transition:enter-end="opacity-100 translate-y-0"
                     x-transition:leave="transition ease-in duration-300"
                     x-transition:leave-start="opacity-100 translate-y-0"
                     x-transition:leave-end="opacity-0 translate-y-2">
                    <i class="ph ph-info text-yellow-400 text-xl"></i>
                    <span x-html="toast.message" class="text-sm font-medium"></span>
                </div>
            </template>
        </div>

        <!-- 全站共用：匯入用隱藏檔案輸入框（triggerImport() 統一觸發） -->
        <input type="file" id="global-import-input" class="hidden">

        <!-- 手機側邊欄遮罩 -->
        <div x-show="sidebarOpen"
             class="fixed inset-0 bg-black/50 z-[150] lg:hidden"
             @click="sidebarOpen = false"
             x-transition.opacity></div>

        <!-- 側邊欄 -->
        <aside class="fixed inset-y-0 left-0 z-[200] h-full bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0"
               :class="[
                   sidebarOpen ? 'lg:w-64' : 'lg:w-20',
                   sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
               ]">

            <!-- Logo / 品牌 -->
            <div class="h-16 flex items-center px-5 border-b border-gray-100 flex-shrink-0 gap-3 overflow-hidden justify-between lg:justify-start">
                <button @click="toggleSidebar()"
                        class="text-gray-500 hover:text-primary focus:outline-none flex-shrink-0 w-8 transition-transform active:scale-95">
                    <i class="ph text-2xl" :class="(sidebarOpen && isMobile) ? 'ph-x' : 'ph-list'"></i>
                </button>
                <span class="text-xl font-bold text-gray-800 whitespace-nowrap overflow-hidden transition-opacity duration-200"
                      :class="sidebarOpen ? 'opacity-100 delay-100' : 'opacity-0 w-0 lg:opacity-0'">合規後台</span>
            </div>

            <!-- 導覽選單 -->
            <nav class="flex-1 py-4 px-3 space-y-1 select-none overflow-y-auto overflow-x-hidden no-scrollbar"
                 :class="sidebarOpen ? 'custom-scroll' : ''">

                <template x-for="(menu, index) in menuItems" :key="index">
                    <div class="relative group mb-1"
                         x-data="{ top: 0, hoverActive: false, hoverTimeout: null }"
                         @mouseenter="clearAllTimeouts(); top = $el.getBoundingClientRect().top; hoverActive = true; hoverIndex = index;"
                         @mouseleave="if (!sidebarOpen) { hoverTimeout = setTimeout(() => { hoverActive = false; if (hoverIndex === index) hoverIndex = -1; }, 100); timeouts.push(hoverTimeout); }">

                        <!-- 有子選單 -->
                        <template x-if="menu.items && menu.items.length > 0">
                            <div>
                                <button @click="toggleMenu(index)"
                                        class="w-full flex items-center px-3 py-2.5 rounded-lg hover:bg-blue-50 text-gray-600 transition-all outline-none focus:ring-2 focus:ring-blue-100 menu-btn"
                                        :class="[!sidebarOpen ? 'justify-center' : 'justify-between', (menu.isOpen && sidebarOpen) || (!sidebarOpen && menu.items && menu.items.some(s => s.active)) ? 'bg-blue-50 text-primary' : '']">
                                    <div class="flex items-center gap-3">
                                        <i :class="['ph text-xl flex-shrink-0 transition-colors', menu.icon, (menu.isOpen && sidebarOpen) || (!sidebarOpen && menu.items && menu.items.some(s => s.active)) ? 'text-primary' : 'text-gray-500 group-hover:text-primary']"></i>
                                        <span class="text-sm font-medium whitespace-nowrap transition-opacity duration-200"
                                              x-show="sidebarOpen"
                                              x-transition:enter="transition ease-out duration-200"
                                              x-transition:enter-start="opacity-0"
                                              x-transition:enter-end="opacity-100"
                                              x-text="menu.name"></span>
                                    </div>
                                    <i class="ph ph-caret-right transition-transform duration-200 text-gray-400"
                                       x-show="sidebarOpen"
                                       :class="menu.isOpen ? 'rotate-90 text-primary' : ''"></i>
                                    <div class="active-indicator" x-show="!sidebarOpen" :style="menu.items && menu.items.some(s => s.active) ? 'opacity: 1' : ''"></div>
                                </button>

                                <!-- 展開子選單 -->
                                <div x-show="menu.isOpen && sidebarOpen" x-collapse class="pl-10 pr-2 space-y-1 mt-1 overflow-hidden">
                                    <template x-for="sub in menu.items" :key="sub.name">
                                        <a :href="sub.url || '#'"
                                           @click="handleSubClick(sub, $event)"
                                           class="w-full text-left px-3 py-2 text-sm rounded-md transition-colors truncate flex items-center gap-2"
                                           :class="sub.active ? 'text-primary bg-blue-50 font-bold' : 'text-gray-500 hover:text-primary hover:bg-blue-50'">
                                            <span class="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors"
                                                  :class="sub.active ? 'bg-primary' : 'bg-gray-300'"></span>
                                            <span x-text="sub.name"></span>
                                            <i x-show="sub.dev" class="ph-fill ph-wrench text-xs text-gray-400 ml-auto mr-1"></i>
                                        </a>
                                    </template>
                                </div>

                                <!-- 折疊時 hover 彈出選單 -->
                                <template x-teleport="body">
                                    <div x-show="!sidebarOpen && hoverIndex === index"
                                         @mouseenter="clearAllTimeouts(); hoverIndex = index;"
                                         @mouseleave="hoverIndex = -1"
                                         class="fixed z-[2000] hidden lg:block"
                                         :style="{ top: top + 'px', left: '5rem' }"
                                         x-transition:enter="transition ease-out duration-200"
                                         x-transition:enter-start="opacity-0 translate-x-2"
                                         x-transition:enter-end="opacity-100 translate-x-0"
                                         x-transition:leave="transition ease-in duration-150"
                                         x-transition:leave-start="opacity-100 translate-x-0"
                                         x-transition:leave-end="opacity-0 translate-x-2">
                                        <div class="bg-white border border-gray-200 rounded-lg shadow-xl p-2 min-w-[180px]">
                                            <div class="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50 border-b border-gray-100 mb-1 rounded-t"
                                                 x-text="menu.name"></div>
                                            <div class="py-1">
                                                <template x-for="sub in menu.items" :key="sub.name">
                                                    <a :href="sub.url || '#'"
                                                       @click="handleSubClick(sub, $event)"
                                                       class="flex items-center justify-between px-4 py-2 text-sm transition-colors rounded hover:bg-blue-50 hover:text-primary"
                                                       :class="sub.active ? 'text-primary bg-blue-50 font-bold' : 'text-gray-600'">
                                                        <span x-text="sub.name"></span>
                                                        <i x-show="sub.dev" class="ph-fill ph-wrench text-xs text-gray-400 ml-2"></i>
                                                    </a>
                                                </template>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </template>

                        <!-- 無子選單（直連） -->
                        <template x-if="!menu.items || menu.items.length === 0">
                            <div>
                                <a :href="menu.url"
                                   @click="handleSubClick(menu, $event)"
                                   class="w-full flex items-center px-3 py-2.5 rounded-lg hover:bg-blue-50 text-gray-600 transition-all outline-none focus:ring-2 focus:ring-blue-100 menu-btn"
                                   :class="[!sidebarOpen ? 'justify-center' : '', menu.active ? 'bg-blue-50 text-primary font-bold' : '']">
                                    <div class="flex items-center gap-3">
                                        <i :class="['ph text-xl flex-shrink-0 transition-colors', menu.icon, menu.active ? 'text-primary' : 'text-gray-500 group-hover:text-primary']"></i>
                                        <span class="text-sm font-medium whitespace-nowrap transition-opacity duration-200"
                                              x-show="sidebarOpen"
                                              x-transition:enter="transition ease-out duration-200"
                                              x-transition:enter-start="opacity-0"
                                              x-transition:enter-end="opacity-100"
                                              x-text="menu.name"></span>
                                    </div>
                                    <div class="active-indicator" x-show="!sidebarOpen"></div>
                                </a>
                                <template x-teleport="body">
                                    <div x-show="!sidebarOpen && hoverIndex === index"
                                         @mouseenter="clearAllTimeouts(); hoverIndex = index;"
                                         @mouseleave="hoverIndex = -1"
                                         class="fixed z-[1999] hidden lg:block pl-2"
                                         :style="{ top: (top + 10) + 'px', left: '5rem' }"
                                         x-transition:enter="transition ease-out duration-200"
                                         x-transition:enter-start="opacity-0"
                                         x-transition:enter-end="opacity-100">
                                        <div class="sidebar-tooltip-content" x-text="menu.name"></div>
                                    </div>
                                </template>
                            </div>
                        </template>

                    </div>
                </template>
            </nav>

            <!-- 側邊欄底部（時鐘 / 深色模式） -->
            <div class="border-t border-gray-200 bg-gray-50 flex-shrink-0 transition-all duration-300 relative z-20"
                 :class="sidebarOpen ? 'p-4' : 'p-4 flex flex-col items-center gap-4'">

                <!-- 展開狀態 -->
                <div x-show="sidebarOpen" class="flex items-center justify-between">
                    <div class="relative" x-data="{ open: false }">
                        <button @click="open = !open"
                                class="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 transition-all"
                                title="顯示模式">
                            <i :class="isDark ? 'ph-moon' : 'ph-sun'" class="ph text-xl"></i>
                        </button>
                        <div x-show="open" @click.outside="open = false"
                             class="absolute bottom-full left-0 mb-2 w-32 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50">
                            <button @click="isDark = false; open = false"
                                    class="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 text-gray-700">
                                <i class="ph ph-sun text-orange-500"></i> Light
                            </button>
                            <button @click="isDark = true; open = false"
                                    class="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 text-gray-700">
                                <i class="ph ph-moon text-indigo-500"></i> Dark
                            </button>
                        </div>
                    </div>
                    <div class="text-right flex flex-col">
                        <span class="text-xs font-bold text-gray-700 font-mono" x-text="currentTime"></span>
                        <span class="text-[10px] text-gray-400 scale-90 origin-right">(GMT+8)</span>
                    </div>
                </div>

                <!-- 折疊狀態 -->
                <div x-show="!sidebarOpen" class="flex flex-col gap-4 items-center relative w-full">
                    <div class="relative group w-full flex justify-center"
                         x-data="{ top: 0, hoverTimeout: null }"
                         @mouseenter="clearAllTimeouts(); top = $el.getBoundingClientRect().top; hoverIndex = menuItems.length;"
                         @mouseleave="hoverTimeout = setTimeout(() => { if (hoverIndex === menuItems.length) hoverIndex = -1; }, 100); timeouts.push(hoverTimeout);">
                        <button @click="isDark = !isDark" class="text-gray-500 hover:text-primary transition-colors">
                            <i :class="isDark ? 'ph-moon' : 'ph-sun'" class="ph text-xl"></i>
                        </button>
                        <template x-teleport="body">
                            <div x-show="!sidebarOpen && hoverIndex === menuItems.length"
                                 @mouseenter="clearAllTimeouts(); hoverIndex = menuItems.length;"
                                 @mouseleave="hoverIndex = -1"
                                 class="fixed z-[1999] pl-2"
                                 :style="{ top: (top + 5) + 'px', left: '5rem' }">
                                <div class="sidebar-tooltip-content">顯示模式</div>
                            </div>
                        </template>
                    </div>
                    <div class="relative group w-full flex justify-center"
                         x-data="{ top: 0, hoverTimeout: null }"
                         @mouseenter="clearAllTimeouts(); top = $el.getBoundingClientRect().top; hoverIndex = menuItems.length + 1;"
                         @mouseleave="hoverTimeout = setTimeout(() => { if (hoverIndex === menuItems.length + 1) hoverIndex = -1; }, 100); timeouts.push(hoverTimeout);">
                        <i class="ph ph-clock text-gray-400 hover:text-gray-600 cursor-default text-xl"></i>
                        <template x-teleport="body">
                            <div x-show="!sidebarOpen && hoverIndex === menuItems.length + 1"
                                 @mouseenter="clearAllTimeouts(); hoverIndex = menuItems.length + 1;"
                                 @mouseleave="hoverIndex = -1"
                                 class="fixed z-[1999] pl-2"
                                 :style="{ top: top + 'px', left: '5rem' }">
                                <div class="sidebar-tooltip-content flex flex-col items-start gap-0.5">
                                    <span class="text-[10px] text-gray-400">GMT+8</span>
                                    <span class="font-mono text-xs font-bold" x-text="currentTime"></span>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </aside>

        <!-- 維護設定彈窗 -->
        <div x-show="maintenanceModalOpen"
             class="fixed inset-0 z-[350] flex items-center justify-center"
             x-transition:enter="transition ease-out duration-200"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-150"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="maintenanceModalOpen = false"></div>
            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 z-10 flex flex-col">
                <!-- 標題 -->
                <div class="px-6 pt-6 pb-4 border-b border-gray-100">
                    <h2 class="text-lg font-bold text-gray-800">維護設定</h2>
                </div>
                <!-- 內容 -->
                <div class="px-6 py-5 space-y-4 flex-1">
                    <!-- 提醒文案 -->
                    <div class="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                        <i class="ph ph-warning-circle text-amber-500 text-lg flex-shrink-0"></i>
                        <p class="text-sm text-amber-700">維護時間生效時會自動踢出玩家</p>
                    </div>
                    <!-- 其他資訊 -->
                    <div class="space-y-2">
                        <div class="bg-[#dfe3e8] border border-[#cbd5e1] rounded-lg px-5 py-4 grid grid-cols-2 gap-y-4 text-sm">
                            <div class="space-y-1">
                                <p class="text-gray-500 text-xs font-medium">最後異動時間</p>
                                <div class="text-gray-700 font-mono text-xs" x-text="maintenanceUpdatedAt"></div>
                            </div>
                            <div class="space-y-1">
                                <p class="text-gray-500 text-xs font-medium">操作者</p>
                                <div class="text-gray-700 font-medium text-sm" x-text="maintenanceOperator"></div>
                            </div>
                        </div>
                    </div>
                    <!-- 維護時間 -->
                    <div class="space-y-2">
                        <label class="block text-sm font-semibold text-gray-700">維護時間</label>
                        <!-- 檢視模式 -->
                        <div x-show="!maintenanceIsEditing" class="flex items-center gap-3">
                            <div class="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-100 rounded text-sm text-gray-700"
                                 x-text="maintenanceStart ? maintenanceStart.replace('T', ' ') : '(未設定)'"></div>
                            <span class="text-gray-400 text-sm flex-shrink-0">至</span>
                            <div class="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-100 rounded text-sm text-gray-700"
                                 x-text="maintenanceEnd ? maintenanceEnd.replace('T', ' ') : '(未設定)'"></div>
                        </div>
                        <!-- 編輯模式 -->
                        <div x-show="maintenanceIsEditing" class="flex items-center gap-3">
                            <input type="datetime-local" x-model="maintenanceStart"
                                   class="flex-1 min-w-0 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
                            <span class="text-gray-400 text-sm flex-shrink-0">至</span>
                            <input type="datetime-local" x-model="maintenanceEnd"
                                   class="flex-1 min-w-0 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
                        </div>
                    </div>
                </div>
                <!-- 置底按鈕 -->
                <div class="px-6 py-4 border-t border-gray-200 bg-white rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
                    <!-- 檢視模式按鈕 -->
                    <template x-if="!maintenanceIsEditing">
                        <div class="flex gap-3">
                            <button @click="maintenanceModalOpen = false"
                                    class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
                                關閉
                            </button>
                            <button @click="maintenanceIsEditing = true"
                                    class="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white rounded text-sm font-medium transition-colors">
                                編輯
                            </button>
                        </div>
                    </template>
                    <!-- 編輯模式按鈕 -->
                    <template x-if="maintenanceIsEditing">
                        <div class="flex gap-3">
                            <button @click="maintenanceIsEditing = false"
                                    class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
                                取消
                            </button>
                            <button @click="maintenanceIsEditing = false; addToast('維護設定已儲存')"
                                    class="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-sm font-medium transition-colors">
                                確認
                            </button>
                        </div>
                    </template>
                </div>
            </div>
        </div>`;
    }

    /* ── Header HTML（標題由 PAGE_CONFIG.title 決定） ── */
    function renderHeader(config) {
        if (isFrame) return '';
        const title = (config || {}).title || '';
        return /* html */`
        <header class="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 flex-shrink-0 z-[100] shadow-sm relative">
            <div class="flex items-center gap-4">
                <!-- 手機漢堡按鈕 -->
                <button @click="sidebarOpen = true" class="lg:hidden text-gray-500 hover:text-primary focus:outline-none">
                    <i class="ph ph-list text-2xl"></i>
                </button>
                <h1 class="text-xl font-bold text-gray-800 tracking-tight">${title}</h1>
            </div>

            <div class="flex items-center gap-3 md:gap-5">
                <!-- 語系切換 -->
                <div class="relative" x-data="{ open: false }" @click.outside="open = false">
                    <button @click="open = !open"
                            class="flex items-center justify-center h-9 px-3 gap-2 hover:bg-gray-100 rounded-full transition-all border border-transparent hover:border-gray-200">
                        <img src="https://flagcdn.com/w20/tw.png" alt="TW" style="width:20px;height:auto;border-radius:2px">
                        <span class="text-sm font-medium text-gray-600 hidden md:block">繁中</span>
                        <i class="ph ph-caret-down text-gray-400 text-xs hidden md:block"></i>
                    </button>
                    <div x-show="open" x-cloak
                         class="absolute right-0 top-11 w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 overflow-hidden">
                        <button @click="open = false"
                                class="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center gap-3">
                            <img src="https://flagcdn.com/w20/tw.png" alt="TW" style="width:20px;height:auto;border-radius:2px"><span class="font-bold text-gray-700">繁中</span>
                        </button>
                        <button @click="open = false"
                                class="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center gap-3">
                            <img src="https://flagcdn.com/w20/us.png" alt="US" style="width:20px;height:auto;border-radius:2px"><span class="text-gray-700">EN</span>
                        </button>
                    </div>
                </div>

                <!-- 通知中心 -->
                <div class="relative" x-data="{ open: false }" @click.outside="open = false">
                    <button @click="open = !open"
                            class="relative p-2 text-gray-500 hover:bg-gray-100 hover:text-primary rounded-full transition-colors">
                        <i class="ph ph-bell text-xl"></i>
                        <span class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
                    </button>
                    <div x-show="open" x-cloak
                         class="fixed left-4 right-4 top-16 md:absolute md:left-auto md:right-0 md:top-12 md:w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[110]">
                        <div class="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                            <span class="font-bold text-gray-800">通知中心</span>
                            <span class="text-xs text-blue-600 cursor-pointer hover:underline">全部已讀</span>
                        </div>
                        <div class="max-h-[320px] overflow-y-auto custom-scroll">
                            <div class="px-4 py-2 text-[10px] font-bold text-gray-400 bg-gray-50 uppercase tracking-wider">未讀訊息 (2)</div>
                            <div class="px-4 py-3 bg-yellow-50 hover:bg-yellow-100 border-b border-gray-100 border-l-4 border-l-red-500 cursor-pointer transition-colors group">
                                <div class="flex justify-between items-start">
                                    <p class="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">⚠️ 【 即將流失 】</p>
                                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                                </div>
                                <p class="text-xs font-bold text-gray-700 mt-1">5 名玩家已無活動，請立即巡檢關懷</p>
                                <p class="text-[10px] text-gray-500 mt-1.5 font-medium">2025/11/28 12:00:00</p>
                            </div>
                            <div class="px-4 py-3 bg-yellow-50 hover:bg-yellow-100 border-b border-gray-100 border-l-4 border-l-red-500 cursor-pointer transition-colors">
                                <p class="text-sm font-bold text-gray-900">‼️ 【 流量異常 】</p>
                                <p class="text-xs font-bold text-gray-700 mt-1">登入頻率進入高峰</p>
                                <p class="text-[10px] text-gray-500 mt-1.5 font-medium">2025/11/28 20:45:37</p>
                            </div>
                            <div class="px-4 py-2 text-[10px] font-bold text-gray-400 bg-gray-50 uppercase tracking-wider">已讀訊息 (3)</div>
                            <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 flex gap-3 items-start opacity-75">
                                <div class="bg-blue-100 text-blue-600 rounded-full p-1 flex-shrink-0"><i class="ph-fill ph-wrench"></i></div>
                                <div>
                                    <p class="text-sm font-medium text-gray-700">✅ 系統維護完成</p>
                                    <p class="text-[10px] text-gray-400 mt-1">2025/11/27 04:00:00</p>
                                </div>
                            </div>
                            <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 flex gap-3 items-start opacity-75">
                                <div class="bg-gray-100 text-gray-500 rounded-full p-1 flex-shrink-0"><i class="ph-fill ph-file-text"></i></div>
                                <div>
                                    <p class="text-sm font-medium text-gray-700">📃 月報表已生成</p>
                                    <p class="text-[10px] text-gray-400 mt-1">2025/11/26 09:00:00</p>
                                </div>
                            </div>
                            <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 flex gap-3 items-start opacity-75">
                                <div class="bg-purple-100 text-purple-600 rounded-full p-1 flex-shrink-0"><i class="ph-fill ph-megaphone"></i></div>
                                <div>
                                    <p class="text-sm font-medium text-gray-700">📢 雙11活動公告發布</p>
                                    <p class="text-[10px] text-gray-400 mt-1">2025/11/10 10:30:00</p>
                                </div>
                            </div>
                        </div>
                        <div class="px-4 py-2 border-t border-gray-100 text-center">
                            <button class="text-xs text-gray-500 hover:text-primary font-medium">查看所有通知</button>
                        </div>
                    </div>
                </div>

                <div class="h-6 w-px bg-gray-200"></div>

                <!-- 使用者選單 -->
                <div class="relative" x-data="{ open: false }" @click.outside="open = false">
                    <button @click="open = !open"
                            class="flex items-center gap-2 hover:bg-gray-100 p-1 pr-2 rounded-full transition-colors border border-transparent hover:border-gray-200">
                        <div class="w-8 h-8 rounded-full bg-[#E0E7FF] flex items-center justify-center text-[#4338CA] font-bold text-sm shadow-sm">Y</div>
                        <span class="text-sm font-medium text-gray-700 hidden md:block">Yvonne</span>
                        <i class="ph ph-caret-down text-gray-400 text-xs hidden md:block"></i>
                    </button>
                    <div x-show="open" x-cloak
                         class="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                        <a href="/AdminManagement/UserProfile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors">
                            <i class="ph ph-user mr-2"></i>用戶資訊
                        </a>
                        <div class="border-t border-gray-100 my-1"></div>
                        <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            <i class="ph ph-sign-out mr-2"></i>登出
                        </a>
                    </div>
                </div>
            </div>
        </header>`;
    }

    /* ── 在 Alpine 初始化前注入版面 HTML ── */
    document.addEventListener('alpine:init', function () {
        var config = window.PAGE_CONFIG || {};

        var sidebarEl = document.getElementById('layout-sidebar');
        if (sidebarEl) sidebarEl.innerHTML = renderSidebar();

        var headerEl = document.getElementById('layout-header');
        if (headerEl) headerEl.innerHTML = renderHeader(config);
    });

})();
