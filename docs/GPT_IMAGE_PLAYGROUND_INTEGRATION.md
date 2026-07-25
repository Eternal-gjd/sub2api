# GPT Image Playground 集成维护

该分支在上游 Sub2API 的基础上内置 GPT Image Playground。

## 分支策略

- `main`：保持与 `Wei-Shaw/sub2api:main` 同步，不放定制代码。
- `playground-integration`：承载 Playground 集成和 CI。
- 发布 tag：建议采用 `v<上游版本>-playground.<修订号>`，例如 `v0.1.160-playground.1`。

## 集成功能

- 用户入口：`/image-playground`（原 GPT Image Playground）
- 第二生图入口：`/imgx-studio`（ImgX Studio）
- 原内置静态应用：`/gpt-image-playground/`
- ImgX 内置静态应用：`/imgx-studio/`
- 复用当前用户的 Sub2API 登录状态
- 自动选择 active 且允许图片生成的 `gpt-image` 分组 Key
- 同源调用 `/v1/images/*`
- 默认模型：`gpt-image-2`
- 自动注入的 API Key 不持久化到 Playground 设置
- CSP 与 `X-Frame-Options` 仅对内置同源 Playground 做最小范围放行

## 本地构建

依赖：

- Node.js 20
- npm
- pnpm 9/10
- `backend/go.mod` 声明的 Go 版本

执行：

```bash
./scripts/build-playground-integration.sh
```

构建产物：

```text
bin/sub2api-playground
```

## 部署

部署前备份原二进制、配置文件和数据库。

```bash
STAMP=$(date +%Y%m%d-%H%M%S)
cp -a /opt/sub2api/sub2api \
  /opt/sub2api/sub2api.backup.${STAMP}.pre-playground

install -o sub2api -g sub2api -m 0755 \
  bin/sub2api-playground \
  /opt/sub2api/sub2api.new

mv -f /opt/sub2api/sub2api.new /opt/sub2api/sub2api
systemctl restart sub2api
curl -fsS http://127.0.0.1:18098/health
```

验证：

```bash
curl -fsS 'http://127.0.0.1:18098/gpt-image-playground/?sub2api=1' \
  | grep 'GPT Image Playground'
```

还应在浏览器验证：

1. `/keys` 页面创建、编辑和删除正常；
2. “GPT 生图工作台”菜单存在；
3. 工作台不要求手动填写 URL 和 Key；
4. 实际生成一张测试图片。

## 上游权限要求

用户 Key 必须：

- `status=active`
- 分组名为 `gpt-image`、`gpt_image` 或 `gpt image`
- 分组 `allow_image_generation=true`

上游账户必须：

- 绑定到允许图片生成的分组；
- model mapping 包含 `gpt-image-2`；
- 如果上游还是另一个 Sub2API，上游 Key 所属分组也必须开启图片生成。

以下报错通常是上游权限问题：

```text
Upstream access forbidden
Image generation is not enabled for this group
```

## 同步上游版本

不要在集成服务器上直接使用官方在线更新作为最终升级方式。官方 release 二进制不包含该分支的 Playground，会覆盖并移除集成功能。

推荐流程：

```bash
git fetch upstream --tags

# 先同步干净 main
git switch main
git reset --hard upstream/main
git push --force-with-lease origin main

# 将集成分支更新到新 main
git switch playground-integration
git rebase main
```

若 rebase 冲突，重点检查：

```text
backend/internal/server/middleware/security_headers.go
backend/internal/web/embed_on.go
frontend/src/router/index.ts
frontend/src/components/layout/AppSidebar.vue
frontend/src/i18n/locales/*/common.ts
```

处理冲突后执行：

```bash
./scripts/build-playground-integration.sh
git push --force-with-lease origin playground-integration
```

如果上游更新包含数据库迁移：

- 更新前必须备份 PostgreSQL；
- 新版启动并迁移后，旧二进制不一定兼容新数据库；
- 二进制回滚不能代替数据库回滚；
- 必须阅读对应上游 release notes。

## CI

`.github/workflows/playground-integration.yml` 在以下场景运行：

- 推送到 `playground-integration`
- 针对 `main` 或 `playground-integration` 的 PR
- 手动触发

CI 会：

1. 运行 Playground 全量测试和构建；
2. 将 Playground 复制到 Sub2API 前端；
3. 运行 Sub2API 前端集成测试和生产构建；
4. 运行安全头和嵌入式路由测试；
5. 构建 Linux amd64 单二进制；
6. 上传构建产物供下载验证。

## 回滚

```bash
systemctl stop sub2api
cp -a /opt/sub2api/sub2api.backup.TIMESTAMP.pre-playground \
  /opt/sub2api/sub2api
systemctl start sub2api
curl -fsS http://127.0.0.1:18098/health
```
