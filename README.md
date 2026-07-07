# 🎸 搖滾吉他樂理教室

圖形化的搖滾吉他樂理學習 App，四大單元：和弦圖鑑、音階教學、歌曲進行、樂理練習。

- 43 組常用和弦：開放和弦、強力和弦（Power Chords）、封閉和弦（Barre Chords）、七和弦、掛留和弦
- SVG 指板圖：手指編號、空弦/悶音標記、封閉橫按、高把位起始格標示
- 點擊即發聲：Karplus-Strong 弦振動合成，支援刷弦與分解和弦兩種播放方式，無需載入音色檔
- 分類篩選 + 和弦詳細面板（組成音與音程級數、把位類型、練習提示）
- 和弦變化教室：以選中和弦的根音展示 8 種和弦怎麼變出來（C → Cm / C5 / Csus / C7 / Cmaj7 / Cm7），附按法圖、標記被動過的音、可逐一試聽
- 音階教學：全指板（15 格）高亮 7 種音階（大小調、五聲、藍調、Dorian、Mixolydian），12 個根音、級數/音名切換、點音試聽、播放整條音階；可選把位（五聲 Box 1–5、七聲 7 個把位），把位外的音自動變暗
- 歌曲進行：8 組經典搖滾進行（12 小節藍調、I–V–vi–IV、龐克 I–IV–V…），依 BPM 循環刷弦、小節跟播高亮、附按法與 solo 音階建議
- 樂理練習：組成音、音程辨認、和弦變化、認和弦四種題型隨機出題，即時解說與試聽

完整規劃見 [PLAN.md](./PLAN.md)。

部署於 GitHub Pages，透過 `.github/workflows/deploy-pages.yml` 於 push 到 `main` 時自動建置部署。

## 開發

```bash
npm install
npm run dev       # 開發伺服器
npm run build     # 型別檢查 + 產出 dist/
npm run preview   # 預覽建置結果
```

技術棧：React 18 + TypeScript + Vite + Tailwind CSS v4 + Web Audio API。

## 後續路線

- Phase 2 剩餘：和弦切換動畫、節拍器
- Phase 3：聽力測驗、自訂練習清單、Tauri/Capacitor 打包
