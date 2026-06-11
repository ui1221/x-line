# RELEASE CHECKLIST

X-LINEを更新してGitHub Pagesへ出す前後の確認リストです。

## 変更前

- `git status --short` で未コミット/未追跡ファイルを確認する。
- 添付由来の `.codex-remote-attachments/` は基本的に触らない。
- 仕様を変える場合は、必要に応じて `GAME_DESIGN.md` も更新する。
- 実績を変える場合は、`ACHIEVEMENTS.md` も更新する。

## 実装後の基本確認

```powershell
node --check app.js
```

- ローカルで `http://127.0.0.1:4173/` が開けること。
- `index.html` / `app.js` / `styles.css` / `sw.js` がローカル配信されること。
- ブラウザのConsoleに明確なJSエラーが出ていないこと。

## PWA更新

- `sw.js` の `cacheName` を更新する。
- 新しい画像/音声/manifest対象を追加した場合は、`assets` 配列へ入れる。
- 削除したアセットが `sw.js` に残っていないか確認する。
- iPhone/Androidでは、PWAを一度閉じて開き直すか、ページを再読み込みして更新を拾わせる。
- 画像が古いまま見える場合は、Service Workerのキャッシュ更新待ちを疑う。

## 画像

- ゲーム内画像は原則WebPにする。
- favicon、ホーム画面アイコン、PWAアイコンはPNGを維持する。
- 画像参照を変更したら、`index.html`、`app.js`、`sw.js` を確認する。
- 画像が読めるか、ローカルURLで直接確認する。

## 手動スモークテスト

- タイトル画面で全モードボタンが表示される。
- `Options` がタイトル画面から開く。
- `Awards` がタイトル画面から開く。
- 色設定 `Color A/B/C/D` を切り替えると、盤面/プレビューの色が変わる。
- 音量スライダーを上げると、操作時に仮SEが鳴る。
- Pauseからゲームに戻れる。
- RetryとMain Menuが動く。

## モード確認

- `Endless`: 起動し、通常ミノが落ちる。
- `200 Lines`: Linesが増え、200ライン到達でCLEARになる。
- `Clean Up`: 灰色ブロックが出る。全掃除でLvが上がり、床がせり上がる。
- `Long Line`: Iミノが5ブロックになる。
- `Blast`: ゲージが表示され、80%以上で光り、100%で効果が発動する。

## 実績確認

- 実績画面でアイコンが表示される。
- 実績詳細で説明文、進行状況、取得日が表示される。
- ゲームオーバー/クリア時に取得バナーが出る。
- 新しい実績を追加した場合は、`achievementStorageKey` の互換性を確認する。

## スマホ確認

- iPhone Safari/PWAで起動できる。
- Android Chrome/PWAで起動できる。
- 左右スワイプが戻るジェスチャーに化けにくい。
- タップ回転、下スワイプ、上スワイプが意図通り動く。
- 画面端・Safe Area・下部バーでUIが見切れない。

## GitHub Pages反映

- 変更をコミットする。
- `git push` する。
- GitHub Pages反映後、公開URLで起動確認する。
- PWA更新が遅れる場合は、少し待ってから再読み込みする。
