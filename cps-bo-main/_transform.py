#!/usr/bin/env python3
"""
XinBonus-BO 頁面重構轉換腳本
自動移除重複的 sidebar/header/CSS/appData，注入共用資源引用
"""
import re, os, sys

BASE = r'c:\Users\Yvonne\Documents\Gitlab\XinBonus-BO'

PAGES = {
    # 已有 layout-sidebar 但 appData 未移除的檔案
    'RecordManagement/DataExchangeRecord.html': {'title': '資料交換紀錄', 'parent': '紀錄管理', 'partial': True},
    'RecordManagement/JackpotRecord.html':      {'title': '彩池紀錄',     'parent': '紀錄管理', 'partial': True},
    # 未處理的檔案
    'FinanceManagement/RechargeRecord.html':    {'title': '儲值紀錄',     'parent': '財務管理'},
    'FinanceManagement/TransactionRecord.html': {'title': '交易紀錄',     'parent': '財務管理'},
    'RecordManagement/BetRecord.html':          {'title': '押注紀錄',     'parent': '紀錄管理'},
    'RecordManagement/LoginRecord.html':        {'title': '登入紀錄',     'parent': '紀錄管理'},
    'SettingManagement/VipSetting.html':        {'title': 'VIP 階級',     'parent': '設定管理'},
    'SettingManagement/VipSetting2.html':       {'title': 'VIP 階級 v2',  'parent': '設定管理'},
}

def remove_style_block(content):
    """移除 <style>...</style> 區塊"""
    return re.sub(r'\n?[ \t]*<style>.*?</style>\n?', '\n', content, flags=re.DOTALL)

def add_styles_link(content, prefix):
    """在 tailwind.config script 後加入 styles.css"""
    css_link = f'    <link rel="stylesheet" href="{prefix}_shared/styles.css">'
    # 找到 tailwind config 結束的 </script>，在其後插入
    # 搜尋特定模式：tailwind.config 區塊後的 </script>
    pattern = r'(    </script>\n)(    (?:<link|<script))'
    replacement = r'\1' + css_link + r'\n\2'
    new_content = re.sub(pattern, replacement, content, count=1)
    if new_content == content:
        # fallback: 在 </head> 前插入
        new_content = content.replace('</head>', css_link + '\n</head>', 1)
    return new_content

def remove_toast_overlay_sidebar(content):
    """移除 toast 容器、手機遮罩、sidebar aside"""
    # Toast 容器：fixed top-5 right-5 z-[250]
    content = re.sub(
        r'\n[ \t]*<!-- Toast[^>]*-->\n[ \t]*<div class="fixed top-5 right-5 z-\[2[0-9]+\].*?</div>\n',
        '\n',
        content, flags=re.DOTALL
    )
    # 有時沒有 comment，直接找 div
    content = re.sub(
        r'\n[ \t]*<div class="fixed top-5 right-5 z-\[2[0-9]+\].*?</div>\n',
        '\n',
        content, flags=re.DOTALL
    )
    # 手機遮罩
    content = re.sub(
        r'\n[ \t]*<!-- Sidebar Overlay[^>]*-->\n[ \t]*<div x-show="sidebarOpen" class="fixed inset-0 bg-black.*?</div>\n',
        '\n',
        content, flags=re.DOTALL
    )
    content = re.sub(
        r'\n[ \t]*<div x-show="sidebarOpen" class="fixed inset-0 bg-black/50.*?x-transition\.opacity></div>\n',
        '\n',
        content, flags=re.DOTALL
    )
    # Sidebar aside（含 comment）
    content = re.sub(
        r'\n[ \t]*<!-- Sidebar[^>]*-->\n[ \t]*<aside.*?</aside>\n',
        '\n    <div id="layout-sidebar"></div>\n',
        content, flags=re.DOTALL
    )
    # 沒有 comment 的情況
    content = re.sub(
        r'\n[ \t]*<aside class="fixed inset-y-0.*?</aside>\n',
        '\n    <div id="layout-sidebar"></div>\n',
        content, flags=re.DOTALL
    )
    return content

def add_layout_sidebar_if_missing(content):
    """若 layout-sidebar 不存在，在 <main 前加入"""
    if 'id="layout-sidebar"' not in content:
        content = re.sub(
            r'(\n[ \t]*<main )',
            '\n    <div id="layout-sidebar"></div>\n\1',
            content, count=1
        )
    return content

def remove_header_add_mount(content):
    """移除 main 內的 <header>，插入 layout-header 掛載點"""
    # 移除 header comment
    content = re.sub(
        r'\n[ \t]*<!-- Header[^>]*-->\n[ \t]*<header .*?</header>\n',
        '\n        <div id="layout-header"></div>\n',
        content, flags=re.DOTALL
    )
    # 沒有 comment 的
    content = re.sub(
        r'\n[ \t]*<header class="h-16 bg-white border-b border-gray-200.*?</header>\n',
        '\n        <div id="layout-header"></div>\n',
        content, flags=re.DOTALL
    )
    return content

def fix_layout_header_position(content):
    """確保 layout-header 是 main 的第一個子元素"""
    if 'id="layout-header"' not in content:
        # 找 main 標籤後插入
        content = re.sub(
            r'(<main[^>]*>)\n',
            r'\1\n        <div id="layout-header"></div>\n',
            content, count=1
        )
    return content

def remove_appdata(content):
    """移除 function appData() { return { ... } } 區塊"""
    # 找到 function appData() 開始位置
    match = re.search(r'\n[ \t]*/?\*?[ \t]*(?:Updated|Added|Global).*?\n[ \t]*function appData\(\)', content)
    if not match:
        match = re.search(r'\n[ \t]*function appData\(\)', content)
    if not match:
        return content

    start = match.start()

    # 從 function 起找配對的 }
    depth = 0
    in_function = False
    i = content.find('function appData()', start)
    while i < len(content):
        ch = content[i]
        if ch == '{':
            depth += 1
            in_function = True
        elif ch == '}':
            depth -= 1
            if in_function and depth == 0:
                end = i + 1
                # 吃掉後面的空行
                while end < len(content) and content[end] in ' \t\n':
                    end += 1
                break
        i += 1

    content = content[:start] + '\n' + content[end:]
    return content

def add_page_config_and_scripts(content, title, parent, prefix):
    """在 </body> 前加入 PAGE_CONFIG 和共用 script"""
    snippet = f'''
    <script>
        window.PAGE_CONFIG = {{
            title:  '{title}',
            parent: '{parent}'
        }};
    </script>
    <script src="{prefix}_shared/shared.js"></script>
    <script src="{prefix}_shared/layout.js"></script>
'''
    # 找最後一個 </script> 前的位置（page-specific JS 後），在 </body> 前插入
    # 策略：在第一個 <script> 出現前先尋找 </body>
    # 實際上要插在最後一個 page-specific script 前
    # 最保險：找倒數第二個 </script> 後面插入

    # 找到第一個 page-specific function 的 script 開頭
    # 例如 function memberListPage 或 function betRecordPage 等
    pattern = r'\n    <script>\s*\n\s*(?:function|/\*|const |var |let |//)'
    match = re.search(pattern, content)
    if match:
        insert_pos = match.start()
        content = content[:insert_pos] + '\n' + snippet + content[insert_pos:]
    else:
        # fallback: 在 </body> 前插入
        content = content.replace('</body>', snippet + '\n</body>', 1)

    return content

def fix_breadcrumb(content, title, parent):
    """標準化麵包屑樣式"""
    if not parent:
        return content

    # 常見的舊式麵包屑：ph-dot, text-primary font-bold 等
    old_patterns = [
        # 有 ph-dot 的舊式
        rf'<div class="text-sm text-gray-500 flex items-center gap-2"><span>{re.escape(parent)}</span>.*?<span[^>]*>{re.escape(title)}</span></div>',
        rf'<div class="text-sm[^"]*">\s*<span>{re.escape(parent)}</span>.*?<span[^>]*>{re.escape(title)}</span>\s*</div>',
    ]
    new_breadcrumb = f'<nav class="flex items-center gap-1.5 text-sm">\n                    <span class="text-gray-500">{parent}</span>\n                    <i class="ph ph-caret-right text-gray-300 text-xs"></i>\n                    <span class="font-semibold text-gray-800">{title}</span>\n                </nav>'

    for pattern in old_patterns:
        new_content = re.sub(pattern, new_breadcrumb, content, flags=re.DOTALL)
        if new_content != content:
            content = new_content
            break

    return content

def transform(rel_path, config):
    filepath = os.path.join(BASE, rel_path)
    if not os.path.exists(filepath):
        print(f'SKIP (not found): {rel_path}')
        return

    prefix = '../' if '/' in rel_path else './'
    title = config['title']
    parent = config.get('parent', '')
    is_partial = config.get('partial', False)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if is_partial:
        # 只需要移除 appData 並加 PAGE_CONFIG + scripts
        content = remove_appdata(content)
        content = add_page_config_and_scripts(content, title, parent, prefix)
        # 確保 layout-header 存在
        if 'id="layout-header"' not in content:
            content = fix_layout_header_position(content)
        # 加 styles.css
        if '_shared/styles.css' not in content:
            content = remove_style_block(content)
            content = add_styles_link(content, prefix)
    else:
        # 完整轉換
        content = remove_style_block(content)
        content = add_styles_link(content, prefix)
        content = remove_toast_overlay_sidebar(content)
        content = add_layout_sidebar_if_missing(content)
        content = remove_header_add_mount(content)
        content = fix_layout_header_position(content)
        content = remove_appdata(content)
        content = add_page_config_and_scripts(content, title, parent, prefix)
        content = fix_breadcrumb(content, title, parent)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'OK: {rel_path}')

for rel_path, config in PAGES.items():
    transform(rel_path, config)

print('All done.')
