# uc-kouling-daily

每天打开公开语雀页面，读取页面中展示的 UC 搜索口令，并生成 `latest.txt`。

## Gopeed 下载地址

仓库上传后，Gopeed 可以用这个 raw 地址：

```text
https://raw.githubusercontent.com/typora-pickure/uc-kouling-daily/refs/heads/main/latest.txt
```

如果开启 GitHub Pages，也可以用：

```text
https://typora-pickure.github.io/uc-kouling-daily/latest.txt
```

## GitHub Pages

在仓库里打开 `Settings -> Pages`：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/root`

保存后首页地址是：

```text
https://typora-pickure.github.io/uc-kouling-daily/
```

## 定时任务

GitHub Actions 使用 UTC 时间。当前配置是每天北京时间 00:20 运行：

```yaml
cron: "20 16 * * *"
```

也可以在仓库 `Actions -> Update kouling -> Run workflow` 手动运行。
