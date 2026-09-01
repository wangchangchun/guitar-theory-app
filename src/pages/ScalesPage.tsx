import { useState } from "react";
import { SCALES, scaleById } from "../data/scales";
import { noteToPc, spellChordTones } from "../data/theory";
import { playMidiNotes } from "../audio/audioEngine";
import { Fretboard } from "../components/fretboard/Fretboard";
import { PageIntro } from "../components/PageIntro";
import { TeachingUnit, KeyPoint } from "../components/TeachingUnit";
import { ScaleFormula } from "../components/scale/ScaleFormula";
import { ScaleDerivation } from "../components/scale/ScaleDerivation";
import { ScaleFamilyTree } from "../components/scale/ScaleFamilyTree";
import { ChromaticRow } from "../components/scale/ChromaticRow";
import { PianoKeys, type PianoMark } from "../components/PianoKeys";
import { useNav } from "../nav";

const ROOT_OPTIONS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

/**
 * 音階學習順序：每一步的音階，都是從前面步驟已經學過的音階變化出來的，
 * 所以照順序走下來不會出現「用還沒學過的東西解釋」的狀況。
 */
const SCALE_TIERS: {
  label: string;
  hint: string;
  badge: string;
  ids: string[];
}[] = [
  {
    label: "第 1 步",
    hint: "先建立參考點：聽出大調與小調的明暗差別",
    badge: "bg-olive-700/15 text-olive-700",
    ids: ["major", "natural-minor"],
  },
  {
    label: "第 2 步",
    hint: "最好上手：各拿掉兩個容易打架的音，就是五聲",
    badge: "bg-olive-700/15 text-olive-700",
    ids: ["major-pentatonic", "minor-pentatonic"],
  },
  {
    label: "第 3 步",
    hint: "加上味道：動一個音就換一種風格",
    badge: "bg-navy-700/15 text-navy-700",
    ids: ["blues", "mixolydian"],
  },
  {
    label: "第 4 步",
    hint: "進階色彩：調式的洋氣與古典的緊張感",
    badge: "bg-blood-700/15 text-blood-700",
    ids: ["dorian", "harmonic-minor"],
  },
];

/**
 * 音階教學：由淺入深切成六個單元——
 * 先講「音階是什麼」，再看這條音階怎麼組成、從哪條音階變來，
 * 最後才把它放到指板上、切成把位、講實戰用法。
 */
export function ScalesPage() {
  const { navigate } = useNav();
  const [root, setRoot] = useState("C");
  const [scaleId, setScaleId] = useState("major");
  const [showDegrees, setShowDegrees] = useState(true);
  const [position, setPosition] = useState<number | null>(null);

  const scale = scaleById(scaleId);
  const rootPc = noteToPc(root);
  const tones = spellChordTones(root, scale.intervals);

  // 把位：以第六弦上的每個把位錨點音為起點，第 1 把位從根音出發、
  // 依琴格順序沿指板往上排列（音階指型每 12 格循環一次）
  const anchorIntervals = scale.positionAnchors ?? scale.intervals;
  const anchors = anchorIntervals
    .map((s) => ({ interval: s, fret: (rootPc + s - 4 + 12) % 12 }))
    .sort((a, b) => a.fret - b.fret);
  const rootIdx = anchors.findIndex((a) => a.interval === 0);
  const positions = anchors.map(
    (_, i) => anchors[(rootIdx + i) % anchors.length],
  );

  const activePos = position !== null ? positions[position] : null;
  const fretWindow = activePos
    ? { from: Math.max(0, activePos.fret - 1), to: activePos.fret + 3 }
    : null;

  const selectScale = (id: string) => {
    setScaleId(id);
    setPosition(null);
  };

  const playScale = () => {
    // 從低音把位的根音往上彈一個八度
    const rootMidi = 40 + ((rootPc - 4 + 12) % 12);
    playMidiNotes(
      [...scale.intervals, 12].map((s) => rootMidi + s),
      "arpeggio",
    );
  };

  // 鋼琴上把這條音階的音標出來：線性排列比指板直觀
  const pianoRootMidi = 48 + rootPc;
  const pianoMarks: PianoMark[] = [
    ...scale.intervals.map((s, i) => ({
      midi: pianoRootMidi + s,
      label: tones[i],
      kind: (s === 0 ? "stack" : "scale") as PianoMark["kind"],
      ring: s === 0,
    })),
    {
      midi: pianoRootMidi + 12,
      label: tones[0],
      kind: "stack" as PianoMark["kind"],
      ring: true,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        storageKey="scales"
        phase="階段 2 · 指板導航"
        what="這一頁分成六個單元，由淺入深：先弄懂音階是什麼、這條音階怎麼組成、它從哪條音階變來，再把它放到指板上、切成把位、最後講實戰怎麼用。照單元順序往下讀就好。"
        lessons={[
          {
            level: "入門",
            title: "單元 1–2：音階是什麼、怎麼組成",
            learn:
              "從預設的 C 大調開始：看十二半音列裡哪幾個被挑出來，再看「全全半全全全半」的間隔公式與鋼琴圖——C 大調正好是全部白鍵。",
            guitar:
              "從第五弦第 3 格的 C 出發，照公式 2-2-1-2-2-2-1 格往上爬一個八度，邊彈邊唱 Do Re Mi。",
          },
          {
            level: "入門",
            title: "單元 3：音階家族樹",
            learn:
              "切到自然小調，看對照表——只是把大調的 3、6、7 各降半音。八條音階不用各背一組，全部都從大調長出來。",
            guitar:
              "彈 C 大調一個八度，再把 E、A、B 三個音各降一格彈成 C 自然小調，聽同一個根音怎麼由亮轉暗。",
          },
          {
            level: "入門",
            title: "單元 2–3：五聲怎麼來的",
            learn:
              "切到小調五聲：對照表顯示它是自然小調拿掉 2 和 ♭6。少了那兩個最容易和和弦擦撞的音，所以怎麼彈都安全。",
            guitar:
              "把根音換成 A，在第 5–8 格彈 A 小調五聲，上行下行各三次，邊彈邊唱級數「1、♭3、4、5、♭7」。",
          },
          {
            level: "進階",
            title: "單元 4–5：上指板與切把位",
            learn:
              "單元 4 看整片指板上這條音階的所有音；單元 5 用把位按鈕把它切成一段段——相鄰把位共用一半的音。",
            guitar:
              "第 1 把位彈到第一弦最高音，沿第一弦滑 3 格接第 2 把位往回下行——體驗滑音換把位。",
          },
          {
            level: "挑戰",
            title: "單元 3：一個音的差別",
            learn:
              "比較自然小調與 Dorian（♭6 還原成 6）、再看和聲小調（♭7 升回 7）——對照表會把改動的那一格標成靛藍。",
            guitar:
              "彈 Am–E7–Am 循環，在 E7 那小節把所有 G 換成 G#——聽「回家」的力量瞬間變強。",
            chords: ["Am", "E7"],
          },
        ]}
        notes={[
          "單元 2 的根音與音階選擇，會同時影響底下所有單元的圖",
          "想背「每弦精確按哪幾個音」的標準指型，做完這頁再去「指型把位」",
        ]}
      />

      {/* 單元 1：音階是什麼 */}
      <TeachingUnit
        n={1}
        level="入門"
        title="音階是什麼？"
        question="吉他上有這麼多音，為什麼只有某幾個「可以用」？"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-ink-700">
            吉他上<span className="font-semibold text-navy-700">往前一格 ＝ 升高一個半音</span>
            ，這是音樂裡最小的距離單位；兩格 ＝ 一個全音。從任何一個音往上連走 12
            格，就會回到同一個音（高一個八度）——所以整個音樂只有
            <span className="font-semibold text-navy-700">12 個不同的音</span>，之後不斷循環。
          </p>
          <p className="text-sm leading-relaxed text-ink-700">
            <span className="font-semibold text-ink-900">音階，就是從這 12 個音裡挑出幾個來用。</span>
            挑哪幾個、彼此間隔多遠，決定了它聽起來是明亮還是憂鬱。下面這排是從
            <span className="mx-1 font-mono font-semibold text-navy-700">{root}</span>
            出發的 12 個半音，亮起來的就是{scale.name}挑中的音：
          </p>
          <ChromaticRow rootPc={rootPc} intervals={scale.intervals} />
          <KeyPoint>
            被挑中的音叫「<span className="font-semibold">音階內音</span>」，配這個調的和弦怎麼彈都對；
            沒被挑中的音不是不能用，但停在上面會聽起來「走音」——它們只適合快速經過。
          </KeyPoint>
        </div>
      </TeachingUnit>

      {/* 單元 2：選音階、看組成 */}
      <TeachingUnit
        n={2}
        level="入門"
        title="這條音階是怎麼組成的？"
        question="它由哪些音組成？音跟音之間隔多遠？"
      >
        <div className="flex flex-col gap-4">
          {/* 根音 */}
          <div>
            <h3 className="mb-1.5 text-xs font-semibold text-ink-700">
              ① 選根音（這條音階的「家」，也是唱名的 Do／La）
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {ROOT_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoot(r)}
                  className={`w-10 rounded-lg py-1.5 font-mono text-sm font-semibold transition-colors ${
                    root === r
                      ? "bg-navy-700 text-white"
                      : "bg-paper-300 text-ink-700 hover:bg-paper-400"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 音階（依學習順序分組） */}
          <div>
            <h3 className="mb-1.5 text-xs font-semibold text-ink-700">
              ② 選音階（照第 1 步往第 4 步走，後面的都由前面變化而來）
            </h3>
            <div className="flex flex-col gap-2">
              {SCALE_TIERS.map((tier) => (
                <div key={tier.label} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`w-14 shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold ${tier.badge}`}
                    >
                      {tier.label}
                    </span>
                    {tier.ids.map((id) => {
                      const s = scaleById(id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => selectScale(s.id)}
                          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                            scaleId === s.id
                              ? "bg-navy-700 text-white"
                              : "bg-paper-300 text-ink-700 hover:bg-paper-400"
                          }`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="ml-16 text-[11px] text-ink-500">{tier.hint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 組成公式 */}
          <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold">
                <span className="text-navy-700">{root}</span> {scale.name}
                <span className="ml-2 text-xs font-normal text-ink-600">
                  共 {scale.intervals.length} 個音
                </span>
              </h3>
              <button
                onClick={playScale}
                className="rounded-lg bg-navy-700 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-navy-600"
              >
                ♪ 播放音階
              </button>
            </div>
            <p className="mb-2.5 text-xs leading-relaxed text-ink-600">
              從根音出發，照下面的間隔一格一格往上數，就會排出這條音階。
              虛線框是間隔，<span className="font-semibold text-gold-700">半音（1 格）</span>
              是音階裡的地標——它落在哪裡決定了這條音階的性格。
            </p>
            <ScaleFormula
              intervals={scale.intervals}
              degrees={scale.degrees}
              tones={tones}
            />
          </div>

          {/* 鋼琴視覺 */}
          <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
            <h3 className="mb-1.5 text-sm font-semibold text-ink-700">
              🎹 在鋼琴上看最清楚
            </h3>
            <p className="mb-2.5 text-xs leading-relaxed text-ink-600">
              鋼琴的音是線性排列的，一眼就看得出間隔。相鄰兩鍵（含黑鍵）＝ 半音。
              靛藍是根音、淺色是其他音階內音；點任一鍵可試聽。
            </p>
            <PianoKeys marks={pianoMarks} />
          </div>

          <p className="text-sm leading-relaxed text-ink-700">
            <span className="mr-1 font-semibold text-gold-700">聽起來像什麼？</span>
            {scale.mood}
          </p>
        </div>
      </TeachingUnit>

      {/* 單元 3：從哪裡變來的 */}
      <TeachingUnit
        n={3}
        level="入門"
        title="它是從哪條音階變來的？"
        question="這麼多音階，真的要每一條都背一組音嗎？"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-ink-700">
            不用。<span className="font-semibold text-ink-900">所有音階都是從大調音階長出來的</span>
            ——每一條只是把前一條動了一兩個音。記住「動了哪個音、聲音變怎樣」，
            比背八組音名有用得多。
          </p>

          {scale.derivation ? (
            <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
              <ScaleDerivation
                derivation={scale.derivation}
                scaleName={scale.name}
                onPickParent={selectScale}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-gold-700/30 bg-gold-700/[0.08] p-3.5">
              <p className="text-sm leading-relaxed text-ink-700">
                <span className="mr-1 font-bold text-gold-700">📐 這條就是參考原點</span>
                {scale.name}沒有「從哪裡變來」——它是所有音階的度量衡。
                其他音階寫成 ♭3、♭7，意思都是「相對大調音階降了半音」。
                所以先把它的聲音聽熟，後面每一條才會有「差在哪」的感覺。
              </p>
            </div>
          )}

          {/* 家族樹 */}
          <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
            <h3 className="mb-1 text-sm font-semibold text-ink-700">
              音階家族樹（點任一條可切換）
            </h3>
            <p className="mb-2.5 text-xs leading-relaxed text-ink-600">
              左邊的灰標籤就是「做了什麼改變」。從上往下看，就是這一頁建議的學習順序。
            </p>
            <ScaleFamilyTree activeId={scaleId} onPick={selectScale} />
          </div>
        </div>
      </TeachingUnit>

      {/* 單元 4：上指板 */}
      <TeachingUnit
        n={4}
        level="進階"
        title="這些音在指板上長在哪裡？"
        question="同一個音階的音，散佈在吉他指板的什麼位置？"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-ink-700">
            吉他的麻煩在於：同一個音會在指板上出現很多次。下面是整片指板上
            <span className="font-semibold text-navy-700">
              {" "}
              {root} {scale.name}{" "}
            </span>
            的所有音——先感受一下它有多密，這正是下一個單元要處理的問題。
          </p>

          <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
            <div className="mb-2.5 flex flex-wrap items-center justify-end gap-2">
              <span className="mr-auto text-xs font-semibold text-ink-600">
                圓點上顯示：
              </span>
              <div className="flex overflow-hidden rounded-lg border border-line-200 text-xs">
                <button
                  onClick={() => setShowDegrees(true)}
                  className={`px-3 py-1.5 font-medium ${
                    showDegrees ? "bg-paper-400 text-navy-700" : "text-ink-600"
                  }`}
                >
                  級數
                </button>
                <button
                  onClick={() => setShowDegrees(false)}
                  className={`px-3 py-1.5 font-medium ${
                    !showDegrees ? "bg-paper-400 text-navy-700" : "text-ink-600"
                  }`}
                >
                  音名
                </button>
              </div>
            </div>
            <Fretboard
              rootPc={rootPc}
              intervals={scale.intervals}
              degrees={scale.degrees}
              showDegrees={showDegrees}
              fretWindow={null}
            />
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              <span className="text-navy-700">●</span> 根音
              {scale.degrees.includes("♭5") && (
                <>
                  　<span className="text-gold-700">●</span> 藍調音（♭5）
                </>
              )}
              　點任一音可試聽。
              <span className="ml-1">
                「級數」＝ 這個音與根音差幾度，換調時級數不變、音名會變——
                所以背級數比背音名划算。
              </span>
            </p>
          </div>
        </div>
      </TeachingUnit>

      {/* 單元 5：切把位 */}
      <TeachingUnit
        n={5}
        level="進階"
        title="把整片指板切成「把位」"
        question="這麼多點背不起來，該怎麼切成好記的段落？"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-ink-700">
            解法是切段：把音階切成幾個
            <span className="font-semibold text-navy-700">手不用大幅移動就能彈完</span>
            的區塊，一個區塊就是一個「把位（Box）」。
            <span className="font-semibold text-ink-900">
              第 N 把位 ＝ 從第六弦上「音階第 N 個音」出發的那一段
            </span>
            ——這就是編號的由來。
          </p>

          <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-ink-600">把位：</span>
              <button
                onClick={() => setPosition(null)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  position === null
                    ? "bg-navy-700 text-white"
                    : "bg-paper-300 text-ink-700 hover:bg-paper-400"
                }`}
              >
                全部
              </button>
              {positions.map((p, i) => (
                <button
                  key={p.interval}
                  onClick={() => setPosition(i)}
                  className={`w-9 rounded-lg py-1 text-xs font-semibold transition-colors ${
                    position === i
                      ? "bg-navy-700 text-white"
                      : "bg-paper-300 text-ink-700 hover:bg-paper-400"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              {activePos && fretWindow && (
                <span className="text-xs text-ink-500">
                  第 {position! + 1} 把位：
                  {activePos.fret === 0
                    ? "開放把位（0–3 格）"
                    : `第 ${fretWindow.from}–${fretWindow.to} 格`}
                </span>
              )}
            </div>

            <Fretboard
              rootPc={rootPc}
              intervals={scale.intervals}
              degrees={scale.degrees}
              showDegrees={showDegrees}
              fretWindow={fretWindow}
            />
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              選定把位後，把位外的音會變暗——但它們沒有消失，
              只是暫時不用管。相鄰兩個把位一定會共用一部分的音，那就是換把位時的接點。
            </p>
          </div>

          <KeyPoint label="下一步">
            這一頁的把位只框出「大概的範圍」。想知道
            <span className="font-semibold">每條弦精確按哪幾個音</span>
            的標準指型（五聲 box、一弦三音 3NPS），到
            <button
              onClick={() => navigate("fingering")}
              className="mx-1 rounded-md bg-navy-700/15 px-2 py-0.5 font-semibold text-navy-700 transition-colors hover:bg-navy-700/25"
            >
              指型把位 ↗
            </button>
            繼續。
          </KeyPoint>
        </div>
      </TeachingUnit>

      {/* 單元 6：實戰怎麼用 */}
      <TeachingUnit
        n={6}
        level="挑戰"
        title="什麼時候該拿這條音階出來用？"
        question="學會了指型，實際彈的時候怎麼選？"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-ink-700">
            {scale.description}
          </p>
          <p className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5 text-sm leading-relaxed text-ink-700">
            <span className="mr-1 font-semibold text-gold-700">🎸 實戰用法</span>
            {scale.usage}
          </p>
          <p className="text-xs leading-relaxed text-ink-500">
            提醒：音階不是拿來從頭彈到尾的。它是一組「安全音」的清單——
            旋律怎麼走由你決定，音階只負責告訴你踩哪裡不會錯。
            真正的味道來自推弦、滑音、留白與節奏。
          </p>
        </div>
      </TeachingUnit>

      {/* 全部音階速查 */}
      <details className="rounded-2xl border border-line-200 bg-paper-100 px-5 py-3.5">
        <summary className="cursor-pointer text-sm font-semibold text-ink-700">
          八條音階速查表（學完再看）
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-max text-left text-xs">
            <thead>
              <tr className="border-b border-line-200 text-ink-600">
                <th className="py-1.5 pr-4 font-semibold">音階</th>
                <th className="py-1.5 pr-4 font-semibold">級數</th>
                <th className="py-1.5 pr-4 font-semibold">怎麼來的</th>
                <th className="py-1.5 font-semibold">聲音</th>
              </tr>
            </thead>
            <tbody>
              {SCALES.map((s) => (
                <tr key={s.id} className="border-b border-line-200/60">
                  <td className="py-1.5 pr-4">
                    <button
                      onClick={() => selectScale(s.id)}
                      className={`font-semibold transition-colors hover:text-navy-600 ${
                        s.id === scaleId ? "text-navy-700" : "text-ink-900"
                      }`}
                    >
                      {s.name}
                    </button>
                  </td>
                  <td className="py-1.5 pr-4 font-mono text-ink-700">
                    {s.degrees.join(" ")}
                  </td>
                  <td className="py-1.5 pr-4 text-ink-600">
                    {s.derivation
                      ? `${scaleById(s.derivation.fromId).name}：${s.derivation.summary}`
                      : "參考原點"}
                  </td>
                  <td className="py-1.5 text-ink-600">{s.mood}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
