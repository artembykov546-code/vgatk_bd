// ============================================================
// report-export.js — Экспорт отчётов в Word, Excel, PDF
// ============================================================

/**
 * Получить HTML для документа
 */
function getReportHTML(data, columns, reportName, options, user) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
    const isLandscape = options.orientation === 'landscape';
    const fontSize = options.fontSize || 11;
    const userName = user?.full_name || user?.name || user?.login || 'Пользователь';
    const orgName = 'Учреждение образования "Витебский государственный аграрно-технический колледж"';

    // Строим таблицу
    let tableRows = '';
    data.forEach((row, i) => {
        tableRows += `<tr>`;
        columns.forEach(c => {
            let val = row[c] || '—';
            if (c === '№ п/п') val = i + 1;
            tableRows += `<td>${val}</td>`;
        });
        tableRows += `</tr>`;
    });

    return `
        <!DOCTYPE html>
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset="utf-8">
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <!--[if gte mso 9]>
            <xml>
                <w:WordDocument>
                    <w:View>Print</w:View>
                    <w:Zoom>100</w:Zoom>
                    <w:DoNotOptimizeForBrowser/>
                </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
                /* ===== ОРИЕНТАЦИЯ СТРАНИЦЫ ===== */
                @page {
                    size: ${isLandscape ? '297mm 210mm' : '210mm 297mm'};
                    mso-page-orientation: ${isLandscape ? 'landscape' : 'portrait'};
                    margin: 1.5cm 1.5cm 1.5cm 1.5cm;
                    mso-header-margin: 1.5cm;
                    mso-footer-margin: 1.5cm;
                }

                body {
                    font-family: 'Times New Roman', Times, serif;
                    font-size: ${fontSize}pt;
                    line-height: 1.3;
                    color: #000;
                }

                /* ===== ВЕРХНИЙ КОЛОНТИТУЛ ===== */
                .report-header {
                    text-align: center;
                    margin-bottom: 16px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #000;
                }

                .report-header .org-name {
                    font-size: ${fontSize + 4}pt;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .report-header .report-title {
                    font-size: ${fontSize + 6}pt;
                    font-weight: 700;
                    margin-top: 6px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }

                .report-header .report-subtitle {
                    font-size: ${fontSize + 2}pt;
                    font-weight: 600;
                    margin-top: 4px;
                }

                .report-header .report-meta {
                    font-size: ${fontSize}pt;
                    margin-top: 4px;
                    color: #555;
                }

                /* ===== ТАБЛИЦА ===== */
                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: ${fontSize - 1}pt;
                    margin-top: 12px;
                }

                .report-table th {
                    background: #e9ecef;
                    border: 1px solid #000;
                    padding: 5px 8px;
                    text-align: left;
                    font-weight: 700;
                }

                .report-table td {
                    border: 1px solid #000;
                    padding: 4px 8px;
                    vertical-align: middle;
                }

                /* ===== ПОДВАЛ ===== */
                .report-footer {
                    margin-top: 16px;
                    padding-top: 10px;
                    border-top: 1px solid #000;
                    font-size: ${fontSize - 1}pt;
                }

                .report-footer .total {
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                .report-footer .signature-block {
                    margin-top: 12px;
                }

                .report-footer .signature-block .row {
                    margin-top: 4px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .report-footer .signature-block .row .label {
                    font-weight: 600;
                }

                .report-footer .signature-block .row .value {
                    border-bottom: 1px solid #000;
                    padding-bottom: 2px;
                    min-width: 200px;
                    text-align: center;
                    font-weight: 600;
                }

                /* ===== ПУСТЫЕ ДАННЫЕ ===== */
                .empty-data {
                    text-align: center;
                    padding: 40px;
                    color: #999;
                    font-style: italic;
                }

                /* ===== ПРИНТ ===== */
                @media print {
                    body { margin: 0; }
                    .report-table { page-break-inside: auto; }
                    .report-table tr { page-break-inside: avoid; page-break-after: auto; }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <div class="org-name">${orgName}</div>
                <div class="report-title">ОТЧЁТ</div>
                <div class="report-subtitle">${reportName}</div>
                <div class="report-meta">Дата: ${dateStr} | Время: ${timeStr}</div>
            </div>

            ${data.length === 0 ? `
                <div class="empty-data">Нет данных для отображения</div>
            ` : `
                <table class="report-table">
                    <thead>
                        <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            `}

            <div class="report-footer">
                <div class="total">Всего записей: ${data.length}</div>
                <div class="signature-block">
                    <div>Руководитель учреждения образования: ______________</div>
                    <div class="row">
                        <span class="label">Отчёт сформировал(а):</span>
                        <span class="value">${userName}</span>
                    </div>
                    <div style="margin-top:4px;">Дата: ${dateStr}</div>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Экспорт в Word
 */
function exportToWord(data, columns, reportName, options, user) {
    if (!data || data.length === 0) {
        showToast('❌ Нет данных для экспорта', 'error');
        return;
    }

    const html = getReportHTML(data, columns, reportName, options, user);
    const blob = new Blob(['\uFEFF' + html], {
        type: 'application/msword;charset=utf-8'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
    link.download = `Отчёт_${reportName.replace(/\s/g, '_')}_${dateStr}.doc`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('✅ Отчёт сохранён в Word');
}

/**
 * Экспорт в Excel
 */
function exportToExcel(data, columns, reportName, user) {
    if (!data || data.length === 0) {
        showToast('❌ Нет данных для экспорта', 'error');
        return;
    }

    const dateStr = new Date().toLocaleDateString('ru-RU');
    const userName = user?.full_name || user?.name || user?.login || 'Пользователь';
    const orgName = 'Учреждение образования "Витебский государственный аграрно-технический колледж"';

    // ===== ПОДГОТОВКА ДАННЫХ =====
    const wsData = [
        [orgName],
        [`ОТЧЁТ: ${reportName}`],
        [`Дата: ${dateStr}`],
        [],
        columns,
        ...data.map((row, i) => columns.map(c => {
            if (c === '№ п/п') return i + 1;
            return row[c] || '—';
        })),
        [],
        [`Всего записей: ${data.length}`],
        [`Отчёт сформировал(а): ${userName}`],
        [`Дата: ${dateStr}`]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // ===== АВТОШИРИНА КОЛОНОК =====
    const colWidths = [];
    wsData.forEach(row => {
        row.forEach((cell, colIndex) => {
            const cellLength = String(cell || '').length;
            if (!colWidths[colIndex] || cellLength > colWidths[colIndex]) {
                colWidths[colIndex] = Math.min(cellLength + 4, 50);
            }
        });
    });
    ws['!cols'] = colWidths.map(w => ({ wch: Math.max(w || 10, 12) }));

    // ===== СТИЛИ ДЛЯ EXCEL =====
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
            const addr = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[addr]) continue;
            if (!ws[addr].s) ws[addr].s = {};

            // ГРАНИЦЫ для всех ячеек с данными
            if (R >= 4) {
                ws[addr].s.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }

            // ЗАГОЛОВКИ ТАБЛИЦЫ (строка 4) - жирный, по центру, фон
            if (R === 4) {
                ws[addr].s.font = { bold: true };
                ws[addr].s.alignment = { horizontal: 'center', vertical: 'center' };
                ws[addr].s.fill = { fgColor: { rgb: "E9ECEF" } };
            }

            // ДАННЫЕ - выравнивание по левому краю, перенос текста
            if (R > 4 && R < 4 + data.length + 1) {
                ws[addr].s.alignment = ws[addr].s.alignment || {};
                ws[addr].s.alignment.wrapText = true;
                ws[addr].s.alignment.vertical = 'center';
                ws[addr].s.alignment.horizontal = 'left';
            }

            // ЗАГОЛОВОК (первые 3 строки) - жирный, по центру
            if (R < 3) {
                ws[addr].s.font = { bold: true };
                ws[addr].s.alignment = { horizontal: 'center', vertical: 'center' };
            }

            // СТРОКА "Всего записей" - жирный
            if (R === 5 + data.length && C === 0) {
                ws[addr].s.font = { bold: true };
            }
        }
    }

    // ОБЪЕДИНЕНИЕ ЯЧЕЕК для заголовков
    if (data.length > 0) {
        // Заголовок "Учреждение образования" - объединяем все колонки
        const headerRange = XLSX.utils.decode_range(`A1:${XLSX.utils.encode_col(columns.length - 1)}1`);
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: columns.length - 1 } }
        ];
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Отчёт');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStrFile = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
    link.download = `Отчёт_${reportName.replace(/\s/g, '_')}_${dateStrFile}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('✅ Отчёт сохранён в Excel');
}

/**
 * Экспорт в PDF
 */
function exportToPDF(data, columns, reportName, options, user) {
    if (!data || data.length === 0) {
        showToast('❌ Нет данных для экспорта', 'error');
        return;
    }

    const html = getReportHTML(data, columns, reportName, options, user);
    const content = document.createElement('div');
    content.innerHTML = html;
    content.style.cssText = 'padding: 20px; background: white;';

    const isLandscape = options.orientation === 'landscape';
    const dateStr = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `Отчёт_${reportName.replace(/\s/g, '_')}_${dateStr}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: isLandscape ? 'landscape' : 'portrait'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(content).save()
        .then(() => showToast('✅ Отчёт сохранён в PDF'))
        .catch((error) => showToast('❌ Ошибка создания PDF: ' + error.message, 'error'));
}

// Экспортируем функции для использования в других файлах
window.ReportExport = {
    exportToWord,
    exportToExcel,
    exportToPDF,
    getReportHTML
};