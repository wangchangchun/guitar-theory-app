import { useState } from "react";
import { scaleById } from "../data/scales";
import { buildPattern } from "../data/patterns";
import { noteToPc, spellChordTones } from "../data/theory";
import { Fretboard } from "../components/fretboard/Fretboard";
import { StringAnchors } from "../components/fretboard/StringAnchors";
import { PageIntro } from "../components/PageIntro";
import { TeachingUnit, KeyPoint } from "../components/TeachingUnit";
import { getAudioTime, noteAt } from "../audio/audioEngine";
import { useNav } from "../nav";

const ROOT_OPTIONS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

function playPattern(midis: number[]) {
  const start = getAudioTime() + 0.1;
  midis.forEach((m, i) => noteAt(m, start + i * 0.17, 0.25));
}

/**
 * 指型把位：由淺入深切成六個單元——
 * 先講「為什麼需要把位」，再用第六弦起點圖說清楚把位編號怎麼來的，
 * 然後才進五聲把位、把位咬合、一弦三音，最後比較兩套系統。
 */
export function FingeringSystemsPage() {
  const { navigate } = useNav();
  const [root, setRoot] = useState("A");
  const [pentScaleId, setPentScaleId] = useState("minor-pentatonic");
  const [pentBox, setPentBox] = useState(0);
  const [npsScaleId, setNpsScaleId] = useState("major");
  const [npsPos, setNpsPos] = useState(0);

  const rootPc = noteToPc(root);

  const pentScale = scaleById(pentScaleId);
  const pentPattern = buildPattern(
    rootPc, pentScale.intervals, pentScale.degrees, pentBox, 2,
  );
  const pentTones = spellChordTones(root, pentScale.intervals);
  const pentStart = pentTones[pentBox];
  const pentStartFret = (rootPc + pentScale.intervals[pentBox] - 4 + 24) % 12;

  const npsScale = scaleById(npsScaleId);
  const npsPattern = buildPattern(
    rootPc, npsScale.intervals, npsScale.degrees, npsPos, 3,
  );
  const npsTones = spellChordTones(root, npsScale.intervals);
  const npsStart = npsTones[npsPos];

  const fretCountFor = (maxFret: number) => Math.max(15, maxFret);

  const positionButtons = (
    count: number,
    active: number,
    onPick: (i: number) => void,
  ) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-ink-600">把位：</span>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          onClick={() => onPick(i)}
          className={`w-9 rounded-lg py-1 text-xs font-semibold transition-colors ${
            active === i
              ? "bg-navy-700 text-white"
              : "bg-paper-300 text-ink-700 hover:bg-paper-400"
          }`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        storageKey="fingering"
        phase="階段 2 · 指板導航"
        what="這一頁分成六個單元，由淺入深：先弄懂「把位」是什麼、編號怎麼來的（哪裡是第 1 把位、為什麼），再練五聲的 5 個把位、把位之間怎麼接，最後才是速彈用的一弦三音 3NPS。"
        lessons={[
          {
            level: "入門",
            title: "單元 1–2：把位是什麼、怎麼編號",
            learn:
              "先看整片指板有多密，再看第六弦起點圖——第 N 把位就是從第六弦上「音階第 N 個音」出發的那一段，編號不是隨便排的。",
            guitar:
              "在第六弦上把 A 小調五聲的 5 個音（5、8、10、12、15 格）依序彈一遍，唸出「這是第 1／2／3／4／5 把位的起點」。",
          },
          {
            level: "入門",
            title: "單元 3：把第 1 把位彈熟",
            learn:
              "用預設 A＋小調五聲，選把位 1，按「▶ 播放把位」聽這段指型——每弦正好 2 個音。",
            guitar:
              "配節拍器 60 BPM 八分音符，第 1 把位上行下行完全不出錯後 +10 BPM，到 100 為止。",
          },
          {
            level: "進階",
            title: "單元 4：把位怎麼咬合",
            learn:
              "切到把位 2：變暗的點裡有一半跟把位 1 重疊——第 N 把位的高音側＝第 N+1 把位的低音側。",
            guitar:
              "把位 1 彈到第一弦最高音，沿第一弦滑到把位 2 往回下行，體驗共用音無縫換把位。",
          },
          {
            level: "進階",
            title: "單元 3：同指型換根音",
            learn:
              "切到大調五聲：指型長得一樣，只是根音落點不同——A 小調五聲和 C 大調五聲根本是同一組音。",
            guitar:
              "彈 C 大調五聲把位 1，再彈 A 小調五聲把位 1，聽同一組音因為「家」不同而變色。",
          },
          {
            level: "挑戰",
            title: "單元 5：一弦三音（3NPS）",
            learn:
              "每弦固定 3 音、共 7 個把位，換弦點與撥序完全規律——速彈的高速公路。編號規則跟五聲完全一樣。",
            guitar:
              "C 大調 3NPS 第 1 把位用「按-捶-捶」（食中小 hammer-on）legato 上行，感受每弦動作一模一樣。",
          },
        ]}
        notes={[
          "共同規則：第 N 把位就從第六弦的「音階第 N 個音」出發——五聲、3NPS 都一樣",
          "先把單元 2 的編號規則看懂，後面的把位按鈕才不會像亂數",
        ]}
      />

      {/* 單元 1：為什麼需要把位 */}
      <TeachingUnit
        n={1}
        level="入門"
        title="為什麼需要「把位」？"
        question="音階的音散佈在整片指板上，難道要全部背下來嗎？"
      >
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-1.5 text-xs font-semibold text-ink-700">
              先選根音（會影響底下所有單元的圖）
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

          <p className="text-sm leading-relaxed text-ink-700">
            這是整片指板上{" "}
            <span className="font-semibold text-navy-700">
              {root} {pentScale.name}
            </span>{" "}
            的所有音。只有五個不同的音，但因為六條弦互相重疊，
            在 15 格內就出現了三十幾次——
            <span className="font-semibold text-ink-900">直接背整片是背不起來的</span>。
          </p>

          <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
            <Fretboard
              rootPc={rootPc}
              intervals={pentScale.intervals}
              degrees={pentScale.degrees}
              showDegrees
              fretWindow={null}
            />
          </div>

          <p className="text-sm leading-relaxed text-ink-700">
            解法是<span className="font-semibold text-navy-700">切段</span>：
            規定「每條弦只彈固定幾個音」，音階就被切成幾塊手不用移動就能彈完的形狀，
            一塊就是一個「<span className="font-semibold">把位</span>」（也叫 Box、Position）。
            切法有兩套，這一頁都會教：
          </p>
          <ul className="flex flex-col gap-1 text-sm leading-relaxed text-ink-700">
            <li>
              ・<span className="font-semibold text-navy-700">五聲把位</span>
              ：每弦 2 音 → 五聲音階剛好切成 5 個把位（單元 3）
            </li>
            <li>
              ・<span className="font-semibold text-gold-700">一弦三音 3NPS</span>
              ：每弦 3 音 → 七聲音階剛好切成 7 個把位（單元 5）
            </li>
          </ul>
          <KeyPoint>
            把位不是新的樂理，音一個都沒變——
            只是把同一堆音重新分組，讓手記得住。
          </KeyPoint>
        </div>
      </TeachingUnit>

      {/* 單元 2：編號規則 */}
      <TeachingUnit
        n={2}
        level="入門"
        title="哪裡是第 1 把位？為什麼它是第 1、那個是第 2？"
        question="把位的號碼是怎麼決定的？"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-ink-700">
            編號的規則只有一條，而且五聲和 3NPS 完全共用：
          </p>
          <p className="rounded-xl border border-navy-700/30 bg-navy-700/[0.08] px-4 py-3 text-sm font-semibold leading-relaxed text-ink-900">
            第 N 把位 ＝ 從<span className="text-navy-700">第六弦（最粗的低音 E 弦）</span>上
            「這條音階的第 N 個音」出發的那一段。
          </p>
          <p className="text-sm leading-relaxed text-ink-700">
            所以只要看第六弦就好。下面把{" "}
            <span className="font-semibold text-navy-700">
              {root} {pentScale.name}
            </span>{" "}
            的音在第六弦上依序標出來——圈裡的號碼就是把位編號，
            下面寫著它在第幾格。
            <span className="font-semibold text-ink-900">
              第 1 把位一定從根音開始
            </span>
            ，接下來照音階順序往上排。
          </p>

          <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
            <StringAnchors
              rootPc={rootPc}
              anchorIntervals={pentScale.intervals}
              anchorDegrees={pentScale.degrees}
              active={pentBox}
              onPick={setPentBox}
            />
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              點圈圈或下面那排都可以切換把位（單元 3 的指板圖會跟著變）。
              <span className="mt-1 block">
                <span className="font-semibold text-ink-700">為什麼號碼在圖上看起來沒有從左排到右？</span>
                因為音每 12 格就重複一次。編號是照「音階的第幾個音」給的，不是照琴格由左到右給的——
                排到後面幾個把位時，起點音會先繞回低音處出現。淡色的圈就是同一個起點高 12 格的位置，
                從那裡看就是漂亮的 1→2→3→4→5 往上排。兩個位置彈起來一模一樣，只差一個八度。
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
            <h3 className="mb-2 text-sm font-semibold text-ink-700">
              以現在選的 {root} {pentScale.name} 為例
            </h3>
            <p className="text-sm leading-relaxed text-ink-700">
              音階的音依序是{" "}
              <span className="font-mono font-semibold text-navy-700">
                {pentTones.join(" · ")}
              </span>
              。所以第 1 把位從{" "}
              <span className="font-mono font-semibold text-navy-700">
                {pentTones[0]}
              </span>{" "}
              起、第 2 把位從{" "}
              <span className="font-mono font-semibold text-navy-700">
                {pentTones[1]}
              </span>{" "}
              起、第 3 把位從{" "}
              <span className="font-mono font-semibold text-navy-700">
                {pentTones[2]}
              </span>{" "}
              起⋯⋯依此類推。
              你現在選的是<span className="font-semibold">第 {pentBox + 1} 把位</span>
              ，起點是第六弦{" "}
              {pentStartFret === 0 ? "空弦" : `第 ${pentStartFret} 格`}的{" "}
              <span className="font-mono font-semibold text-navy-700">
                {pentStart}
              </span>
              。
            </p>
          </div>

          <KeyPoint label="常見誤會">
            「第 1 把位」不是指「第 1 格」。它跟琴格號碼沒有關係——
            換一個根音，同一個第 1 把位就整組平移到別的格數去了。
            把位編號永遠是相對根音的，不是相對琴頭的。
          </KeyPoint>
        </div>
      </TeachingUnit>

      {/* 單元 3：五聲把位 */}
      <TeachingUnit
        n={3}
        level="入門"
        title="五聲把位：每弦 2 音 × 5 個把位"
        question="第 1 把位實際上要按哪幾個音？"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-ink-700">
            現在把規則套下去：從剛才那個起點開始，
            <span className="font-semibold text-navy-700">每條弦取 2 個音、由低到高往上排</span>
            ，六條弦共 12 個音——這就是一個完整的五聲把位。
            亮的是這個把位要按的音，暗的是同音階的其他音。
          </p>

          <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex overflow-hidden rounded-lg border border-line-200 text-xs">
                <button
                  onClick={() => { setPentScaleId("minor-pentatonic"); setPentBox(0); }}
                  className={`px-3 py-1.5 font-medium ${
                    pentScaleId === "minor-pentatonic"
                      ? "bg-paper-400 text-navy-700"
                      : "text-ink-600"
                  }`}
                >
                  小調五聲
                </button>
                <button
                  onClick={() => { setPentScaleId("major-pentatonic"); setPentBox(0); }}
                  className={`px-3 py-1.5 font-medium ${
                    pentScaleId === "major-pentatonic"
                      ? "bg-paper-400 text-navy-700"
                      : "text-ink-600"
                  }`}
                >
                  大調五聲
                </button>
              </div>
              <button
                onClick={() => playPattern(pentPattern.map((n) => n.midi))}
                className="rounded-lg bg-navy-700 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-navy-600"
              >
                ▶ 播放把位
              </button>
            </div>

            <div className="mb-3">{positionButtons(5, pentBox, setPentBox)}</div>

            <Fretboard
              rootPc={rootPc}
              intervals={pentScale.intervals}
              degrees={pentScale.degrees}
              showDegrees
              pattern={pentPattern}
              fretCount={fretCountFor(Math.max(...pentPattern.map((n) => n.fret)))}
            />
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              第 {pentBox + 1} 把位從第六弦的音階第 {pentBox + 1} 個音
              <span className="mx-1 font-mono text-navy-700">{pentStart}</span>
              出發（{root} {pentScale.name}＝{pentTones.join("·")}）。
              {pentScaleId === "minor-pentatonic" && pentBox === 0 && (
                <>
                  　💡 第 1 把位跟第六弦根音的 E 手型封閉和弦重疊：和弦按著不動，solo 音就在手邊。
                </>
              )}
            </p>
          </div>

          <KeyPoint label="練習順序">
            不要五個一起背。先把<span className="font-semibold">第 1 把位</span>
            彈到閉著眼睛都不會錯，再加第 2 把位——
            大多數搖滾 solo 光靠第 1 把位就能撐完整段。
          </KeyPoint>
        </div>
      </TeachingUnit>

      {/* 單元 4：把位咬合 */}
      <TeachingUnit
        n={4}
        level="進階"
        title="把位跟把位怎麼接起來？"
        question="五個把位是各自獨立的嗎？中間要怎麼換？"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-ink-700">
            它們不是五個獨立的形狀，而是
            <span className="font-semibold text-navy-700">互相咬合的一條鏈</span>。
            回到上一個單元的指板圖，把把位從 1 切到 2，注意看：
            <span className="font-semibold text-ink-900">
              第 N 把位的高音側，就是第 N+1 把位的低音側
            </span>
            ——中間那幾個音是兩個把位共用的。
          </p>
          <p className="text-sm leading-relaxed text-ink-700">
            這些共用音就是換把位的門。實戰上最常見的做法是：
            在第一弦或第二弦上用一個<span className="font-semibold text-gold-700">滑音</span>
            滑到共用音，手就自然落到下一個把位了——聽起來完全沒有接縫。
          </p>
          <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
            <h3 className="mb-1.5 text-sm font-semibold text-ink-700">
              動手驗證
            </h3>
            <ol className="flex list-decimal flex-col gap-1 pl-4 text-xs leading-relaxed text-ink-600">
              <li>回到單元 3，選把位 1，記住第一弦上的兩個音。</li>
              <li>切到把位 2，看第一弦——其中一個音跟把位 1 一模一樣。</li>
              <li>
                上琴：把位 1 彈到第一弦最高音，沿第一弦滑到把位 2 的音，
                再往回下行彈完把位 2。
              </li>
              <li>
                最後把 1→2→3→4→5 串起來上行，再倒著下行回來——
                這就是所謂「打通整片指板」。
              </li>
            </ol>
          </div>
          <KeyPoint>
            第 5 把位的上面就是第 1 把位（高 12 格）。
            所以五個把位串完會繞回原點——指板上永遠不會「走到底」。
          </KeyPoint>
        </div>
      </TeachingUnit>

      {/* 單元 5：一弦三音 */}
      <TeachingUnit
        n={5}
        level="挑戰"
        title="一弦三音（3NPS）：每弦 3 音 × 7 個把位"
        question="七聲音階（大調／小調）要怎麼切？"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-ink-700">
            五聲有 5 個音、每弦 2 音，切成 5 個把位。
            七聲音階有 7 個音，改成
            <span className="font-semibold text-gold-700">每弦 3 音</span>
            ，就切成 7 個把位。
            <span className="font-semibold text-ink-900">編號規則一模一樣</span>
            ——第 N 把位還是從第六弦的音階第 N 個音出發。
          </p>

          <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
            <h3 className="mb-2 text-sm font-semibold text-ink-700">
              第六弦上的 7 個起點
            </h3>
            <StringAnchors
              rootPc={rootPc}
              anchorIntervals={npsScale.intervals}
              anchorDegrees={npsScale.degrees}
              active={npsPos}
              onPick={setNpsPos}
            />
          </div>

          <div className="rounded-xl border border-line-200 bg-paper-200/50 p-3.5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex overflow-hidden rounded-lg border border-line-200 text-xs">
                <button
                  onClick={() => { setNpsScaleId("major"); setNpsPos(0); }}
                  className={`px-3 py-1.5 font-medium ${
                    npsScaleId === "major" ? "bg-paper-400 text-navy-700" : "text-ink-600"
                  }`}
                >
                  大調
                </button>
                <button
                  onClick={() => { setNpsScaleId("natural-minor"); setNpsPos(0); }}
                  className={`px-3 py-1.5 font-medium ${
                    npsScaleId === "natural-minor"
                      ? "bg-paper-400 text-navy-700"
                      : "text-ink-600"
                  }`}
                >
                  自然小調
                </button>
              </div>
              <button
                onClick={() => playPattern(npsPattern.map((n) => n.midi))}
                className="rounded-lg bg-navy-700 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-navy-600"
              >
                ▶ 播放把位
              </button>
            </div>

            <div className="mb-3">{positionButtons(7, npsPos, setNpsPos)}</div>

            <Fretboard
              rootPc={rootPc}
              intervals={npsScale.intervals}
              degrees={npsScale.degrees}
              showDegrees
              pattern={npsPattern}
              fretCount={fretCountFor(Math.max(...npsPattern.map((n) => n.fret)))}
            />
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              第 {npsPos + 1} 把位從第六弦的音階第 {npsPos + 1} 個音
              <span className="mx-1 font-mono text-gold-700">{npsStart}</span>
              出發（{root} {npsScale.name}＝{npsTones.join("·")}）。
              每弦固定 3 音，換弦點與撥序完全規律——交替撥弦或捶勾（legato）
              的動作在每條弦上都一樣，因此是速彈樂手的預設系統；代價是常需要跨 5–6 格的手指伸展。
            </p>
          </div>
        </div>
      </TeachingUnit>

      {/* 單元 6：怎麼選 */}
      <TeachingUnit
        n={6}
        level="挑戰"
        title="兩套系統怎麼選？"
        question="實際彈的時候該用五聲 box 還是 3NPS？"
      >
        <div className="flex flex-col gap-3">
          <ul className="grid gap-x-6 gap-y-1.5 text-sm leading-relaxed text-ink-700 sm:grid-cols-2">
            <li>
              ・<span className="font-semibold text-navy-700">五聲 box</span>
              ：藍調／搖滾即興的預設。音少不出錯、推弦揉弦空間大，先把 5 個把位串起來。
            </li>
            <li>
              ・<span className="font-semibold text-gold-700">3NPS</span>
              ：七聲音階（大調／小調／調式）的高速公路。跑句、模進、legato 首選。
            </li>
            <li>・兩套用的是同一組音——差別只在「每弦切幾個音」，不是不同的樂理。</li>
            <li>
              ・實戰常混用：骨架用五聲 box，經過句借 3NPS 的規律指型衝上去再回來。
            </li>
          </ul>
          <KeyPoint label="下一步">
            把位解決的是「手放哪裡」。接下來要解決「指板上每個點叫什麼名字」——
            到
            <button
              onClick={() => navigate("fretmap")}
              className="mx-1 rounded-md bg-navy-700/15 px-2 py-0.5 font-semibold text-navy-700 transition-colors hover:bg-navy-700/25"
            >
              指板地圖 ↗
            </button>
            繼續。
          </KeyPoint>
        </div>
      </TeachingUnit>
    </div>
  );
}
