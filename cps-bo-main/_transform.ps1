# XinBonus-BO HTML Transform Script
# Full transformation for 6 remaining files

$base = 'c:\Users\Yvonne\Documents\Gitlab\XinBonus-BO'
$Rx = [System.Text.RegularExpressions.Regex]
$S  = [System.Text.RegularExpressions.RegexOptions]::Singleline

$files = @(
    @{ path = 'FinanceManagement\RechargeRecord.html';  title = '儲值紀錄'; parent = '財務管理' },
    @{ path = 'FinanceManagement\TransactionRecord.html'; title = '交易紀錄'; parent = '財務管理' },
    @{ path = 'RecordManagement\BetRecord.html';        title = '押注紀錄'; parent = '紀錄管理' },
    @{ path = 'RecordManagement\LoginRecord.html';      title = '登入紀錄'; parent = '紀錄管理' },
    @{ path = 'SettingManagement\VipSetting.html';      title = 'VIP 階級'; parent = '設定管理' },
    @{ path = 'SettingManagement\VipSetting2.html';     title = 'VIP 階級'; parent = '設定管理' }
)

foreach ($item in $files) {
    $filepath = Join-Path $base $item.path
    if (-not (Test-Path $filepath)) { Write-Host "SKIP (not found): $($item.path)"; continue }

    $content = [System.IO.File]::ReadAllText($filepath, [System.Text.Encoding]::UTF8)
    $title   = $item.title
    $parent  = $item.parent

    # ── 1. Remove <style> block ───────────────────────────────────────────────
    $content = $Rx::Replace($content, '\r?\n[ \t]*<style>.*?</style>(\r?\n)?', "`n", $S)

    # ── 2. Add styles.css link after tailwind config </script> ───────────────
    if ($content -notmatch '_shared/styles\.css') {
        $cssLink = '    <link rel="stylesheet" href="../_shared/styles.css">'
        $r2 = [System.Text.RegularExpressions.Regex]::new('(    </script>)(\r?\n)([ \t]*(?:<link|<script))', $S)
        $replaced2 = $r2.Replace($content, '$1$2' + $cssLink + "`n" + '$3', 1)
        if ($replaced2 -ne $content) {
            $content = $replaced2
        } else {
            $content = $content.Replace('</head>', $cssLink + "`n</head>")
        }
    }

    # ── 3. Remove toast notification container ────────────────────────────────
    # Handles: optional comment + <div class="fixed top-5 right-5..."> ... </template> ... </div>
    $content = $Rx::Replace($content,
        '\r?\n[ \t]*(?:<!--[^\n]*-->\r?\n[ \t]*)?<div class="fixed top-5 right-5[^"]*">.*?</template>\r?\n[ \t]*</div>\r?\n',
        "`n", $S)
    # Fallback for toast without template (shouldn't happen but just in case)
    $content = $Rx::Replace($content,
        '\r?\n[ \t]*<div class="fixed top-5 right-5[^"]*">\s*</div>\r?\n',
        "`n", $S)

    # ── 4. Remove sidebar overlay div ────────────────────────────────────────
    $content = $Rx::Replace($content,
        '\r?\n[ \t]*(?:<!--[^\n]*-->\r?\n[ \t]*)?<div x-show="sidebarOpen" class="fixed inset-0 bg-black[^>]*></div>\r?\n',
        "`n", $S)

    # ── 5. Remove <aside> sidebar → insert layout-sidebar mount point ─────────
    if ($content -notmatch 'id="layout-sidebar"') {
        $content = $Rx::Replace($content,
            '\r?\n[ \t]*(?:<!--[^\n]*-->\r?\n[ \t]*)?<aside[^>]*>.*?</aside>\r?\n',
            "`n    <div id=`"layout-sidebar`"></div>`n", $S)
    }

    # ── 6. Remove <header> in <main> → insert layout-header mount point ───────
    if ($content -notmatch 'id="layout-header"') {
        $content = $Rx::Replace($content,
            '\r?\n[ \t]*(?:<!--[^\n]*-->\r?\n[ \t]*)?<header[^>]*>.*?</header>\r?\n',
            "`n        <div id=`"layout-header`"></div>`n", $S)
    }

    # ── 7. Remove function appData() block (brace-counting) ───────────────────
    $funcIdx = $content.IndexOf('function appData()')
    if ($funcIdx -ge 0) {
        # Start removal from the newline before function appData()
        $removeStart = $content.LastIndexOf("`n", $funcIdx)
        # Also remove any // comment line immediately before it
        if ($removeStart -gt 0) {
            $prevNl  = $content.LastIndexOf("`n", $removeStart - 1)
            if ($prevNl -ge 0) {
                $prevLine = $content.Substring($prevNl, $removeStart - $prevNl)
                if ($prevLine -match '^\r?\n\s*//') { $removeStart = $prevNl }
            }
        }

        # Brace-match to find closing } of appData
        $depth = 0; $inF = $false; $i = $funcIdx; $removeEnd = -1
        while ($i -lt $content.Length) {
            $ch = $content[$i]
            if     ($ch -eq '{') { $depth++; $inF = $true }
            elseif ($ch -eq '}' -and $inF) {
                $depth--
                if ($depth -eq 0) { $removeEnd = $i + 1; break }
            }
            $i++
        }

        if ($removeEnd -gt 0) {
            $content = $content.Substring(0, $removeStart) + "`n" + $content.Substring($removeEnd)
        }
    }

    # ── 7b. Remove const timeouts = [] (now in shared.js) ────────────────────
    $content = $Rx::Replace($content, '\r?\n[ \t]*const timeouts\s*=\s*\[\];\r?\n', "`n", $S)

    # ── 7c. Collapse 3+ blank lines → 2 ──────────────────────────────────────
    $content = $Rx::Replace($content, '(\r?\n){3,}', "`n`n", $S)

    # ── 8. Insert PAGE_CONFIG + shared.js + layout.js ────────────────────────
    if ($content -notmatch 'PAGE_CONFIG') {
        $pageSnippet = "`n    <script>`n        window.PAGE_CONFIG = {`n            title:  '$title',`n            parent: '$parent'`n        };`n    </script>`n    <script src=`"../_shared/shared.js`"></script>`n    <script src=`"../_shared/layout.js`"></script>"

        # Find the page-specific <script> block (starts with function/const/let/var//**)
        $r8 = [System.Text.RegularExpressions.Regex]::new('\n    <script>\s+(?:function|/\*|const |var |let |//)', $S)
        $m8 = $r8.Match($content)
        if ($m8.Success) {
            $content = $content.Substring(0, $m8.Index) + $pageSnippet + $content.Substring($m8.Index)
        } else {
            $content = $content.Replace('</body>', $pageSnippet + "`n</body>")
        }
    }

    # ── 9. Fix breadcrumb (ph-dot style → ph-caret-right) ────────────────────
    if ($content -match 'ph-dot') {
        $newBC = '<nav class="flex items-center gap-1.5 text-sm">' +
                 "`n                    <span class=`"text-gray-500`">$parent</span>" +
                 "`n                    <i class=`"ph ph-caret-right text-gray-300 text-xs`"></i>" +
                 "`n                    <span class=`"font-semibold text-gray-800`">$title</span>" +
                 "`n                </nav>"
        $r9 = [System.Text.RegularExpressions.Regex]::new(
            '<div class="text-sm text-gray-500 flex items-center gap-2"[^>]*>[\s\S]*?ph-dot[\s\S]*?</div>', $S)
        $content = $r9.Replace($content, $newBC)
    }

    # ── Write result ──────────────────────────────────────────────────────────
    [System.IO.File]::WriteAllText($filepath, $content, [System.Text.Encoding]::UTF8)
    Write-Host "OK: $($item.path)"
}

Write-Host "All done."
