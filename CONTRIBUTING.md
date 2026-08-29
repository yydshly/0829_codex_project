# 协作指南

感谢参与研究。这个仓库优先追求可验证的过程，而不是表面上的完成度。

## 提交研究提案

可以使用 GitHub 的“研究提案”Issue 模板，先写清研究问题、范围、验证方式和预期产物。小型探索也可以直接创建分支和子项目。

## 创建子项目

项目 ID 使用小写英文、数字和连字符，例如 `threejs-camera-study`。

```bash
python scripts/new_project.py threejs-camera-study "Three.js 相机方案研究" \
  --summary "比较不同相机控制策略的可用性与性能" \
  --tag threejs \
  --tag camera
```

生成后，先完善 `projects/<project-id>/README.md`，再添加代码和证据。修改状态或描述时，同时更新该项目的 `project.json` 与 `projects/catalog.json`。

## 分支与提交

- 分支建议使用 `research/<project-id>`、`feature/<topic>` 或 `docs/<topic>`。
- 一次提交解决一个清晰问题，提交信息使用祈使句并说明结果。
- 不提交密钥、令牌、私人数据、大型构建产物或来源不明的素材。
- 第三方代码、数据和模型必须保留来源与许可说明。

## 合并请求

合并请求应说明研究问题、主要变更、验证证据和已知限制。提交前运行：

```bash
python scripts/validate_repository.py
python scripts/build_site.py
```

自动校验通过只代表仓库结构一致，不代表研究结论已经被证明。结论仍需在子项目 README 中提供证据。
