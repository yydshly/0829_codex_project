# 研究项目目录

每个一级子目录代表一个可独立理解的研究项目，目录名必须与项目 ID 相同。完整项目列表由 [`catalog.json`](catalog.json) 管理，根目录的 README 是面向读者的总入口。

请优先运行：

```bash
python scripts/new_project.py <project-id> "<项目标题>" --summary "<一句话研究问题>"
```

不要手工复制一个旧项目作为新项目；创建脚本会生成最新模板并同步索引。
