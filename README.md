# WaveScope 官網

聲流 WaveScope 的產品介紹與聯絡頁，用 GitHub Pages 發布。純靜態 HTML／CSS，沒有建置步驟。

```
index.html          中文首頁
privacy.html        中文隱私權政策
en/index.html       英文首頁
en/privacy.html     英文隱私權政策
assets/             樣式與 logo
```

## 發布前要填的佔位字

| 佔位字 | 內容 |
|---|---|
| `{{CONTACT_EMAIL}}` | 團隊共用信箱，最好是官網網域的信箱（Meta 商業驗證可用來驗證） |
| `{{COMPANY_NAME_ZH}}` / `{{COMPANY_NAME_EN}}` | 公司法定名稱，必須和商業驗證文件上的一致 |
| `{{TAX_ID}}` | 統一編號 |
| `{{ADDRESS_ZH}}` / `{{ADDRESS_EN}}` | 登記地址 |
| `{{PHONE}}` | 公司電話 |
| `{{EFFECTIVE_DATE}}` | 隱私權政策生效日期 |

一次替換（macOS）：

```sh
grep -rl '{{' --include='*.html' . | xargs sed -i '' \
  -e 's/{{CONTACT_EMAIL}}/hello@example.com/g' \
  -e 's/{{COMPANY_NAME_ZH}}/範例股份有限公司/g'
# …其餘佔位字同理
grep -rn '{{' --include='*.html' .   # 確認沒有漏掉
```

## 本機預覽

```sh
python3 -m http.server 8000
```

## 發布

Repo 的 Settings → Pages → Source 選 `Deploy from a branch`，分支 `main`、資料夾 `/ (root)`。
要用自訂網域時，在根目錄加上 `CNAME` 檔案。
