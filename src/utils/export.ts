import { Task } from '../types';

export interface ExportOptions {
  periodLabel?: string; // e.g. "နေ့စဉ် မှတ်တမ်း", "အပတ်စဉ် မှတ်တမ်း", "လစဉ် မှတ်တမ်း"
  statusFilterLabel?: string;
}

export function exportToCSV(tasks: Task[], options: ExportOptions = {}) {
  const { periodLabel = 'လုပ်ငန်းမှတ်တမ်း အားလုံး', statusFilterLabel = 'အားလုံး' } = options;

  // UTF-8 Byte Order Mark (BOM) guarantees Excel and spreadsheet software render Myanmar Unicode cleanly
  let csv = '\uFEFF';
  
  // Header Metadata
  csv += `"အစီရင်ခံစာ အမျိုးအစား:","${periodLabel} (${statusFilterLabel})"\n`;
  csv += `"ထုတ်ယူသည့် ရက်စွဲ:","${new Date().toLocaleDateString('my-MM')} ${new Date().toLocaleTimeString('my-MM')}"\n`;
  csv += `"စုစုပေါင်း မှတ်တမ်း:","${tasks.length} ခု"\n\n`;

  // Column Headers
  csv += 'စဉ်,လုပ်ဆောင်ဖွယ် ခေါင်းစဉ် (တာဝန်),သတ်မှတ်ရက်စွဲ,အချိန်,ကဏ္ဍ,ဦးစားပေး,အခြေအနေ (Status),ပြီးစီးသည့်ရက်စွဲ,အသံသတိပေးချက်\n';

  tasks.forEach((t, index) => {
    const escapedTitle = `"${(t.title || '').replace(/"/g, '""')}"`;
    const escapedTTS = `"${(t.ttsMessage || '').replace(/"/g, '""')}"`;
    const priorityLabel =
      t.priority === 'high' ? 'အရေးကြီး (High)' : t.priority === 'medium' ? 'အလယ်အလတ် (Medium)' : 'ပုံမှန် (Low)';
    const statusLabel = t.completed ? 'ပြီးစီးပြီး (Completed)' : 'မပြီးပြတ်သေး (Unfulfilled)';
    const completedDate = t.completedAt ? new Date(t.completedAt).toLocaleString('my-MM') : '-';

    csv += `${index + 1},${escapedTitle},${t.date},${t.time},${t.category},${priorityLabel},${statusLabel},"${completedDate}",${escapedTTS}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = `မြန်မာ_လုပ်ငန်းမှတ်တမ်း_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function exportToPDF(tasks: Task[], options: ExportOptions = {}) {
  const { periodLabel = 'လုပ်ငန်းမှတ်တမ်း အားလုံး', statusFilterLabel = 'အားလုံး' } = options;

  // Ensure all web fonts (Padauk Burmese font) are fully loaded
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const unfulfilledCount = tasks.filter((t) => !t.completed).length;
  const rate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const todayStr = new Date().toLocaleDateString('my-MM', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const printContainer = document.createElement('div');
  printContainer.id = 'temp-pdf-export-container';
  printContainer.style.padding = '32px 36px';
  printContainer.style.background = '#FFFFFF';
  printContainer.style.color = '#172033';
  printContainer.style.fontFamily = "'Padauk', 'Plus Jakarta Sans', system-ui, sans-serif";
  printContainer.style.fontSize = '12px';
  printContainer.style.lineHeight = '1.6';

  printContainer.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Padauk:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
      #temp-pdf-export-container * {
        font-family: 'Padauk', 'Plus Jakarta Sans', sans-serif !important;
        box-sizing: border-box;
      }
    </style>

    <!-- Header Section -->
    <div style="border-bottom: 2px solid #5B7CFA; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #5B7CFA; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px;">
          Burmese Task & Voice Reminder App
        </div>
        <h1 style="font-size: 20px; font-weight: 700; color: #172033; margin: 0 0 4px 0;">
          ${periodLabel} - တာဝန်နှင့် လုပ်ငန်းမှတ်တမ်းများ
        </h1>
        <div style="font-size: 11px; color: #64748B;">
          အမျိုးအစား: ${statusFilterLabel} · ထုတ်ယူသည့်ရက်စွဲ: ${todayStr}
        </div>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; background-color: #EEF2FF; color: #4361EE; font-size: 11px; font-weight: 600;">
          ပြီးစီးမှုနှုန်း: ${rate}%
        </span>
      </div>
    </div>

    <!-- Summary Statistics KPI Strip -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
      <div style="flex: 1; padding: 10px 14px; border-radius: 8px; background-color: #F8FAFC; border: 1px solid #E2E8F0;">
        <div style="font-size: 10px; color: #64748B;">စုစုပေါင်း တာဝန်များ</div>
        <div style="font-size: 18px; font-weight: 700; color: #172033;">${tasks.length} ခု</div>
      </div>
      <div style="flex: 1; padding: 10px 14px; border-radius: 8px; background-color: #F0FDF4; border: 1px solid #DCFCE7;">
        <div style="font-size: 10px; color: #15803D;">ပြီးစီးခဲ့သော လုပ်ငန်းများ</div>
        <div style="font-size: 18px; font-weight: 700; color: #15803D;">${completedCount} ခု</div>
      </div>
      <div style="flex: 1; padding: 10px 14px; border-radius: 8px; background-color: #FEF2F2; border: 1px solid #FEE2E2;">
        <div style="font-size: 10px; color: #B91C1C;">မပြီးပြတ်သေးသော တာဝန်များ</div>
        <div style="font-size: 18px; font-weight: 700; color: #B91C1C;">${unfulfilledCount} ခု</div>
      </div>
      <div style="flex: 1; padding: 10px 14px; border-radius: 8px; background-color: #EFF6FF; border: 1px solid #DBEAFE;">
        <div style="font-size: 10px; color: #1D4ED8;">ပြီးစီးမှု ရာခိုင်နှုန်း</div>
        <div style="font-size: 18px; font-weight: 700; color: #1D4ED8;">${rate}%</div>
      </div>
    </div>

    <!-- Table of Records -->
    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
      <thead>
        <tr style="background-color: #F1F5F9; color: #334155; text-align: left;">
          <th style="border: 1px solid #CBD5E1; padding: 8px; width: 35px; text-align: center;">စဉ်</th>
          <th style="border: 1px solid #CBD5E1; padding: 8px;">လုပ်ဆောင်ဖွယ် ခေါင်းစဉ် (တာဝန်)</th>
          <th style="border: 1px solid #CBD5E1; padding: 8px; width: 85px;">ရက်စွဲ/အချိန်</th>
          <th style="border: 1px solid #CBD5E1; padding: 8px; width: 80px;">ကဏ္ဍ</th>
          <th style="border: 1px solid #CBD5E1; padding: 8px; width: 70px;">ဦးစားပေး</th>
          <th style="border: 1px solid #CBD5E1; padding: 8px; width: 90px; text-align: center;">အခြေအနေ</th>
        </tr>
      </thead>
      <tbody>
        ${
          tasks.length === 0
            ? '<tr><td colspan="6" style="border: 1px solid #E2E8F0; padding: 20px; text-align: center; color: #94A3B8;">ဤကာလအတွင်း မှတ်တမ်း မရှိသေးပါ</td></tr>'
            : tasks
                .map(
                  (t, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
            <td style="border: 1px solid #E2E8F0; padding: 8px; text-align: center; color: #64748B;">${idx + 1}</td>
            <td style="border: 1px solid #E2E8F0; padding: 8px; font-weight: 500;">
              <div style="color: #172033; font-weight: 600;">${t.title}</div>
              ${
                t.ttsMessage && t.ttsMessage !== t.title
                  ? `<div style="font-size: 9.5px; color: #64748B; margin-top: 2px;">အသံသတိပေးချက်: ${t.ttsMessage}</div>`
                  : ''
              }
            </td>
            <td style="border: 1px solid #E2E8F0; padding: 8px; color: #475569; white-space: nowrap;">
              <div>${t.date}</div>
              <div style="font-size: 10px; color: #64748B;">${t.time}</div>
            </td>
            <td style="border: 1px solid #E2E8F0; padding: 8px; color: #334155;">${t.category}</td>
            <td style="border: 1px solid #E2E8F0; padding: 8px; color: ${
              t.priority === 'high' ? '#DC2626' : t.priority === 'medium' ? '#D97706' : '#2563EB'
            }; font-weight: 600;">
              ${t.priority === 'high' ? 'အရေးကြီး' : t.priority === 'medium' ? 'အလယ်' : 'ပုံမှန်'}
            </td>
            <td style="border: 1px solid #E2E8F0; padding: 8px; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9.5px; font-weight: 700; background-color: ${
                t.completed ? '#DCFCE7' : '#FEE2E2'
              }; color: ${t.completed ? '#15803D' : '#B91C1C'};">
                ${t.completed ? '✓ ပြီးစီး' : '✕ မပြီးပြတ်'}
              </span>
            </td>
          </tr>
        `
                )
                .join('')
        }
      </tbody>
    </table>

    <!-- Footer -->
    <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; font-size: 10px; color: #94A3B8;">
      <span>Burmese Voice Daily Reminder App • တာဝန်နှင့် လုပ်ငန်းဆောင်ရွက်မှု မှတ်တမ်း</span>
      <span>ထုတ်ယူသည့်အချိန်: ${new Date().toLocaleTimeString('my-MM')}</span>
    </div>
  `;

  document.body.appendChild(printContainer);

  const winHtml2Pdf = (
    window as unknown as {
      html2pdf?: () => {
        from: (el: HTMLElement) => {
          set: (opt: unknown) => {
            save: () => Promise<void>;
          };
        };
      };
    }
  ).html2pdf;

  if (typeof winHtml2Pdf === 'function') {
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `မြန်မာ_${periodLabel.replace(/\s+/g, '_')}_အစီရင်ခံစာ_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    try {
      await winHtml2Pdf().from(printContainer).set(opt).save();
    } catch (err) {
      console.warn('html2pdf render failed, using window.print fallback:', err);
      window.print();
    } finally {
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
    }
  } else {
    window.print();
    if (document.body.contains(printContainer)) {
      document.body.removeChild(printContainer);
    }
  }
}
