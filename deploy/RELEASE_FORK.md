# 发布你自己的安装脚本 + Release

目标：让其他服务器通过你自己的仓库安装，而不是官方仓库。

## 1. 安装脚本入口

现在安装脚本默认指向：

```bash
curl -sSL https://raw.githubusercontent.com/Eternal-gjd/sub2api/main/deploy/install.sh | sudo bash
```

脚本内部默认使用：

```bash
GITHUB_REPO=Eternal-gjd/sub2api
```

也支持临时覆盖：

```bash
curl -sSL https://raw.githubusercontent.com/Eternal-gjd/sub2api/main/deploy/install.sh | sudo GITHUB_REPO=Eternal-gjd/sub2api bash
```

## 2. 发布 Release（二进制 + checksums）

该项目已经有 `.goreleaser.yaml`，release 会：
- 构建多平台二进制
- 生成 `checksums.txt`
- 发布到 GitHub Releases
- 可选发布 Docker/GHCR 镜像

### 最小要求

需要在 GitHub 仓库里准备：
- `GITHUB_TOKEN`（Actions 默认提供）
- 如果要推 Docker Hub：`DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN`
- 如果只用 GitHub Releases + GHCR，可以不配 Docker Hub，设置：
  - `DOCKERHUB_USERNAME=skip`

## 3. 推荐做法：用 GitHub Actions 自动发布

建议新增工作流：
- 触发条件：push tag，例如 `v1.0.1-dd1`
- 执行 goreleaser release

典型发布命令（本地手动）：

```bash
git tag v1.0.1-dd1
git push origin v1.0.1-dd1
```

然后 Actions 负责产出 Release。

## 4. 安装脚本的工作前提

`deploy/install.sh` 依赖 GitHub Releases 中存在：
- 对应平台压缩包，例如：
  - `sub2api_v1.0.1-dd1_linux_amd64.tar.gz`
- `checksums.txt`

只要 goreleaser 发布成功，脚本就能正常安装。

## 5. 其他服务器如何切到你的版本

### 安装最新版
```bash
curl -sSL https://raw.githubusercontent.com/Eternal-gjd/sub2api/main/deploy/install.sh | sudo bash
```

### 安装指定版本
```bash
curl -sSL https://raw.githubusercontent.com/Eternal-gjd/sub2api/main/deploy/install.sh | sudo bash -s -- install-version v1.0.1-dd1
```

## 6. 当前状态

当前仓库已经完成：
- 安装脚本默认仓库从 `Wei-Shaw/sub2api` 改为 `Eternal-gjd/sub2api`

还建议后续补充：
- GitHub Actions release 工作流
- tag 规范说明
- 是否只保留 GHCR / GitHub Releases，跳过 Docker Hub
