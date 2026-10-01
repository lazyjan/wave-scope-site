# WaveScope 官網

聲流 WaveScope 的產品介紹與聯絡頁，用 GitHub Pages 發布。純靜態 HTML／CSS，沒有建置步驟。

```
index.html          中文首頁
privacy.html        中文隱私權政策
en/index.html       英文首頁
en/privacy.html     英文隱私權政策
assets/             樣式與 logo
```

## 公司資訊

公司資訊寫在每一頁的頁尾，以及隱私權政策的「聯絡我們」。目前只放名稱（聲流科技／Wave Scope）與信箱 `hello.wavescope@gmail.com`；統編、地址、電話之後要補的話，四個 HTML 檔都要一起改。

## 本機預覽

```sh
python3 -m http.server 8000
```

## 發布

推到 `main` 就會自動發布到 <https://lazyjan.github.io/wave-scope-site/>（Pages 來源：`main` 分支、根目錄）。
要用自訂網域時，在根目錄加上 `CNAME` 檔案。
