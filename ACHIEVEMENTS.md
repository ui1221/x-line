# ACHIEVEMENTS

X-LINEの実績仕様です。実装上の定義は `app.js` の `buildAchievements()` と各 `record...()` 関数を参照します。

## 保存データ

実績データは `localStorage` に保存します。

- 保存キー: `x-line-achievements-v1`
- 取得済み実績: `unlocked`
- プレイ日: `playDates`
- 累計ライン数: `totalLines`
- Clean Up対象ライン数: `cleanupLines`
- Blastゲージ発動回数: `blastGaugeFills`
- 通算プレイ時間: `totalPlayMs`
- 日別プレイ時間: `dailyPlayMs`
- モード別プレイ回数: `modePlays`
- ラインを一度も消せずにゲームオーバーした回数: `noClearGameOvers`

保存形式を変える場合は、既存ユーザーの `localStorage` と互換性を保つこと。

## 実績カテゴリ

### Play Days

プレイした日数で解除します。同じ日に何度遊んでも1日分です。

- 1日
- 3日
- 7日
- 15日
- 30日
- 60日
- 77日
- 100日

カウントタイミング:

- モード開始時に `recordGameStart(modeKey)` で今日の日付を記録する。

### Total Lines

全モード合計で消したライン数です。

- 1
- 10
- 25
- 50
- 100
- 250
- 500
- 1000
- 2000
- 3000
- 5000
- 7500
- 9999

カウントタイミング:

- ライン消去確定時に `recordLineClear(clearedRows, cleanupLineCount)` で `clearedRows.length` を加算する。
- Blastのボム効果で追加消去された行も、消えた行として加算される。

### Clean Up Lines

Clean Upのお邪魔ブロックを含むラインを消した数です。

- 1
- 10
- 25
- 50
- 100
- 150
- 200
- 300

カウントタイミング:

- ライン消去確定時、消える行に灰色ブロック `G` が含まれていた数を加算する。
- 実績説明文は「お邪魔ブロックを含むラインをxライン消す」。

### Blast Gauge

Blastゲージをためて効果を発動した回数です。

- 1
- 3
- 5
- 10
- 20
- 30
- 50
- 75
- 100

カウントタイミング:

- ゲージが100%になり、`triggerBlastEffect()` が実行された時点で `recordBlastGaugeFill()` を呼ぶ。
- 4ライン消し、Back-to-Back、Tスピン、コンボによる追加ゲージボーナスはない。

### Mode Plays

各モードを遊んだ回数です。対象モードごとに同じ段階を持ちます。

対象モード:

- Endless
- 200 Lines
- Clean Up
- Long Line
- Blast

段階:

- 1回
- 3回
- 5回
- 10回
- 20回
- 30回
- 40回
- 50回

カウントタイミング:

- モード開始時に `recordGameStart(modeKey)` で `modePlays[modeKey]` を加算する。

### Zero Clear

一度もラインを消せずにゲームオーバーになると解除します。

- 1回

カウントタイミング:

- `endGame()` 時、`currentRunLines === 0` の場合に `recordNoClearGameOver()` を呼ぶ。

## 通知

- 新しく解除された実績は `pendingAchievementUnlocks` に入る。
- ゲームオーバーまたはクリア時に `showAchievementBanners()` で通知する。
- 一度に表示するバナーは最大3件。
- 4件以上ある場合は「ほかx個の実績」とまとめる。
- バナーには実績アイコン画像とバッジを表示する。

## 表示

- 実績一覧はタイトル画面の `Awards` から開く。
- アイコンを押すと、タイトル、説明、進行状況、取得日を表示する。
- 未取得でも進行状況は `現在値 / 目標値` として見せる。
- 実績アイコン画像は原則WebPを使う。

## 追加時の注意

- 実績を追加したら、`buildAchievements()` に定義を追加する。
- 新しいカウント値が必要なら `defaultAchievementState()` と `loadAchievementState()` に互換性を持って追加する。
- 実績画像を追加したら、`sw.js` のキャッシュ対象に入れ、`cacheName` を更新する。
- 実績タイトルは短くする。バナーとアイコン一覧で省略されにくくするため。
- 似た名前の実績を避ける。例: `Blast x1` と `Blast Gauge x1` は区別する。
