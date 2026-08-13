/* ============================================================
   CPS-BO 共用 Alpine.js 資料層
   所有頁面共用的 appData()、選單結構、工具函式
   ============================================================ */

/* 全域 hover 計時器陣列（與 appData 共享） */
const timeouts = [];

/* ============================================================
   下載 / 匯入 / 匯出 共用行為
   全站「下載」「匯入」「匯出」功能一律呼叫此處函式，
   不要在頁面內各自實作觸發邏輯或 Toast 文案
   ============================================================ */

/* 依目前頁面所在目錄，換算「下載紀錄」頁面的相對路徑 */
function downloadRecordHref() {
    const dirs = window.location.pathname.split('/').filter(Boolean);
    dirs.pop();
    if (dirs.length === 0) return 'RecordManagement/DownloadRecord.html';
    if (dirs[dirs.length - 1] === 'RecordManagement') return 'DownloadRecord.html';
    return '../RecordManagement/DownloadRecord.html';
}

/* 下載：不做真實檔案下載，一律 toast 提示稍後前往「下載紀錄」頁下載 */
function notifyDownload() {
    window.dispatchEvent(new CustomEvent('notify', {
        detail: { message: `檔案生成中，請稍後前往【 <a href="${downloadRecordHref()}" class="underline text-blue-300 hover:text-blue-200">下載紀錄</a> 】下載` }
    }));
}

/* 匯出：傳入已選取項目陣列時，若為空陣列提示「至少選擇 1 項」，否則提示產出中；
   單筆匯出（無批量選取概念）呼叫時可不傳參數 */
function notifyExport(selectedIds) {
    const message = Array.isArray(selectedIds) && selectedIds.length === 0
        ? '至少選擇 1 項'
        : '檔案產出中，請稍後進行下載';
    window.dispatchEvent(new CustomEvent('notify', { detail: { message } }));
}

/* 匯入：一律觸發全站共用的隱藏檔案輸入框（由 layout.js 注入），不做檔案內容預覽/欄位對應 UI */
function triggerImport() {
    const input = document.getElementById('global-import-input');
    if (input) input.click();
}

function appData() {
    return {
        /* ── 側邊欄狀態 ── */
        sidebarOpen: false,
        isMobile: window.innerWidth < 1024,
        hoverIndex: -1,

        /* ── 外觀 ── */
        isDark: false,

        /* ── 時鐘 ── */
        currentTime: '',

        /* ── Toast 通知 ── */
        toasts: [],

        /* ── 維護設定彈窗 ── */
        maintenanceModalOpen: false,
        maintenanceIsEditing: false,
        maintenanceStart: '',
        maintenanceEnd: '',
        maintenanceUpdatedAt: '2025/11/01 00:00:00',
        maintenanceOperator: 'admin',

        /* ── 頁面設定（由各頁 window.PAGE_CONFIG 提供） ── */
        get pageTitle()       { return (window.PAGE_CONFIG || {}).title  || ''; },
        get breadcrumbParent(){ return (window.PAGE_CONFIG || {}).parent || ''; },

        /* ── 選單結構 ── */
        menuItems: [
            {
                name: '焦點資訊', icon: 'ph-house', url: '/Dashboard_v1'
            },
            {
                name: '報表管理', icon: 'ph-chart-bar', isOpen: false,
                items: [
                    { name: '交收報表', url: '/ReportManagement/Commission' },
                    { name: '遊戲報表', url: '/ReportManagement/GameReport' },
                    { name: '金流報表', url: '/ReportManagement/PaymentReport' },
                    { name: '玩家報表', url: '/ReportManagement/PlayerReport' },
                    { name: '活動報表', url: '/ReportManagement/ActivityReport' }
                ]
            },
            {
                name: '紀錄管理', icon: 'ph-clipboard-text', isOpen: false,
                items: [
                    { name: '押注紀錄',       url: '/RecordManagement/BetRecord' },
                    { name: '活動遊戲紀錄', url: '/RecordManagement/ActivityGameRecord' },
                    { name: '登入紀錄',     url: '/RecordManagement/LoginRecord' },
                    { name: '獎勵紀錄',     url: '/RecordManagement/RewardRecord' },
                    { name: '成就徽章紀錄', url: '/RecordManagement/AchievementBadgeRecord' },
                    { name: '序號兌換紀錄', url: '/RecordManagement/SerialCodeExchangeRecord' },
                    { name: '異動紀錄',     dev: true },
                    { name: 'VIP 階級紀錄', url: '/RecordManagement/VipRecord' },
                    { name: '彩池紀錄',     url: '/RecordManagement/JackpotRecord' },
                    { name: '資料交換紀錄', url: '/RecordManagement/DataExchangeRecord' },
                    { name: '下載紀錄',     url: '/RecordManagement/DownloadRecord' },
                    { name: '執行異常紀錄', url: '/RecordManagement/ExecutionErrorRecord' }
                ]
            },
            {
                name: '財務管理', icon: 'ph-currency-circle-dollar', isOpen: false,
                items: [
                    { name: '系統存提紀錄', url: '/FinanceManagement/DepositAdjustment' },
                    { name: '儲值紀錄',     url: '/FinanceManagement/RechargeRecord' },
                    { name: '交易紀錄',     url: '/FinanceManagement/TransactionRecord' }
                ]
            },
            {
                name: '設定管理', icon: 'ph-gear', isOpen: false,
                items: [
                    { name: '站台設定', url: '/SettingManagement/SiteSetting' },
                    { name: '站台資訊', dev: true },
                    { name: 'VIP 階級', url: '/SettingManagement/VipSetting' },
                    { name: '成就徽章', url: '/SettingManagement/AchievementBadge' }
                ]
            },
            {
                name: '客端管理', icon: 'ph-megaphone', isOpen: false,
                items: [
                    { name: 'CTA 客端路由', url: '/PortalManagement/CTADestination' },
                    { name: '跑馬燈公告',   url: '/PortalManagement/MarqueeAnnouncement' },
                    { name: '輪播廣告',     url: '/PortalManagement/CarouselAd' },
                    { name: '優惠活動',     url: '/PortalManagement/PromotionSetting' }
                ]
            },
            {
                name: '活動管理', icon: 'ph-gift', isOpen: false,
                items: [
                    { name: '終身限定', url: '/ActivityManagement/LifetimeActivity' },
                    { name: '週期任務', url: '/ActivityManagement/PeriodicTask' },
                    { name: '序號設定', url: '/ActivityManagement/SerialCodeSetting' }
                ]
            },
            {
                name: '遊戲管理', icon: 'ph-game-controller', isOpen: false,
                items: [
                    { name: '遊戲類型',   dev: true },
                    { name: '遊戲供應商', dev: true },
                    { name: '遊戲平台',   dev: true },
                    { name: '遊戲設定',   url: '/GameManagement/GameSetting' },
                    { name: '遊戲曝光',   url: '/GameManagement/GameExposure' },
                    { name: '彩池設定',   url: '/GameManagement/JackpotSetting' },
                    { name: '免費旋轉',   url: '/GameManagement/FreeSpinActivity' }
                ]
            },
            {
                name: '儲值管理', icon: 'ph-credit-card', isOpen: false,
                items: [
                    { name: '金流設定', url: '/RechargeManagement/PaymentSetting' },
                    { name: '金流商戶', url: '/RechargeManagement/PaymentMerchants' },
                    { name: '儲值優惠', url: '/RechargeManagement/RechargeBonus' }
                ]
            },
            {
                name: '會員管理', icon: 'ph-users', isOpen: false,
                items: [
                    { name: '會員列表', url: '/MemberManagement/MemberList' }
                ]
            },
            {
                name: '用戶管理', icon: 'ph-user-gear', isOpen: false,
                items: [
                    { name: '用戶列表', url: '/AdminManagement/AdminList' },
                    { name: '角色權限', url: '/AdminManagement/RolePermissions' }
                ]
            },
            {
                name: '助理精靈', icon: 'ph-magic-wand', isOpen: false,
                items: [
                    { name: '維護設定', url: '#', modal: 'maintenance' },
                    { name: '風控設定', dev: true },
                    { name: '模擬注單生成', dev: true }
                ]
            }
        ],

        /* ── 初始化 ── */
        init() {
            /* 依目前 URL 自動設定 active 狀態，無需各頁手動標記 */
            const path = window.location.pathname.replace(/\.html$/, '');
            this.menuItems.forEach(menu => {
                if (menu.url) {
                    menu.active = path.endsWith(menu.url);
                }
                if (menu.items) {
                    menu.items.forEach(sub => {
                        if (sub.url) sub.active = path.endsWith(sub.url);
                    });
                    if (menu.items.some(s => s.active)) menu.isOpen = true;
                }
            });

            this.updateClock();
            setInterval(() => this.updateClock(), 1000);

            window.addEventListener('resize', () => {
                const wasMobile = this.isMobile;
                this.isMobile = window.innerWidth < 1024;
                if (wasMobile === false && this.isMobile === true) {
                    this.sidebarOpen = false;
                }
            });
        },

        /* ── 工具函式 ── */
        updateClock() {
            this.currentTime = new Date().toLocaleTimeString('en-GB', {
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        },

        clearAllTimeouts() {
            timeouts.forEach(clearTimeout);
            timeouts.length = 0;
            this.hoverIndex = -1;
        },

        toggleSidebar() {
            this.sidebarOpen = !this.sidebarOpen;
            if (this.sidebarOpen) {
                this.hoverIndex = -1;
                this.menuItems.forEach(menu => {
                    if (menu.items) menu.isOpen = menu.items.some(s => s.active);
                });
            } else {
                this.menuItems.forEach(menu => { menu.isOpen = false; });
            }
            setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
        },

        toggleMenu(index) {
            if (!this.sidebarOpen) {
                this.sidebarOpen = true;
                this.hoverIndex = -1;
                setTimeout(() => {
                    this.menuItems.forEach((m, i) => { m.isOpen = (i === index); });
                }, 150);
            } else {
                this.menuItems[index].isOpen = !this.menuItems[index].isOpen;
            }
        },

        handleSubClick(item, e) {
            if (item.dev) {
                if (e) e.preventDefault();
                this.addToast('功能開發中');
            } else if (item.modal === 'maintenance') {
                if (e) e.preventDefault();
                this.maintenanceIsEditing = false;
                this.maintenanceModalOpen = true;
            }
        },

        addToast(message) {
            const id = Date.now();
            this.toasts.push({
                id,
                message: typeof message === 'string' ? message : (message.message || ''),
                visible: true
            });
            setTimeout(() => {
                this.toasts = this.toasts.filter(t => t.id !== id);
            }, 3000);
        }
    };
}
