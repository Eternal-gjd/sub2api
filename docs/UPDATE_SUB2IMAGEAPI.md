# update-sub2imageapi：Sub2API 生图集成版更新手册

本文用于维护和部署 `Eternal-gjd/sub2api` 的 GPT Image Playground 集成版。

## 1. 固定环境

```text
Fork:        https://github.com/Eternal-gjd/sub2api
Upstream:    https://github.com/Wei-Shaw/sub2api
维护目录:    /opt/sub2api-fork-maintenance
干净分支:    main
集成分支:    playground-integration
安装目录:    /opt/sub2api
服务名:      sub2api
监听端口:    18098
生产二进制:  /opt/sub2api/sub2api
构建产物:    /opt/sub2api-fork-maintenance/bin/sub2api-playground
```

分支职责：

- `main`：同步官方代码，不放 Playground 定制修改。
- `playground-integration`：承载 Playground、同源登录集成、路由、安全头、测试、CI 和文档。

## 2. 核心规则

1. **只将官方正式 release 作为服务升级基线。** 不因 `upstream/main` 出现新提交而直接更新服务器。
2. **不要在管理后台直接执行官方在线更新。** 官方二进制不含 Playground，会移除定制功能。
3. **不要用旧的 Playground 二进制覆盖更新后的新版 Sub2API。** 这会让其他页面和 API 回退。
4. **升级顺序固定为：官方 release → 重放集成提交 → 测试 → GitHub CI → 备份 → 部署 → 验证。**
5. **数据库迁移后，二进制回滚不等于数据库回滚。** 正式部署前必须检查 release notes 并备份 PostgreSQL。

## 3. 检查是否有正式更新

```bash
cd /opt/sub2api-fork-maintenance

git status --short
git fetch upstream --tags
git fetch origin

curl -fsSL \
  https://api.github.com/repos/Wei-Shaw/sub2api/releases/latest \
  -o /tmp/sub2api-latest-release.json

python3 - <<'PY'
import json
release = json.load(open('/tmp/sub2api-latest-release.json'))
print('tag:', release['tag_name'])
print('published:', release['published_at'])
print('url:', release['html_url'])
PY

/opt/sub2api/sub2api --version
```

如果官方最新 release 与当前部署基线相同，则不更新服务。

## 4. 升级前检查

工作区必须干净：

```bash
cd /opt/sub2api-fork-maintenance

test -z "$(git status --porcelain)"
systemctl is-active sub2api
curl -fsS http://127.0.0.1:18098/health
```

阅读目标 release notes，重点检查：

- 数据库 migration；
- 配置字段变化；
- Go、Node.js、pnpm 版本变化；
- 前端路由、侧栏、CSP、静态嵌入逻辑变化；
- Images API 和账户/分组模型变化；
- 不兼容变更与回滚限制。

## 5. 同步 Fork 的 main

`main` 保持与官方 `upstream/main` 同步：

```bash
cd /opt/sub2api-fork-maintenance

git switch main
git reset --hard upstream/main
git push --force-with-lease origin main
```

这一步只维护 Fork 的干净同步分支，不表示立即部署 `upstream/main`。

## 6. 将集成分支更新到正式 release

假设目标正式版本为 `v0.1.160`：

```bash
cd /opt/sub2api-fork-maintenance

git switch playground-integration
git status --short

TARGET_TAG=v0.1.160
OLD_BASE=$(git merge-base playground-integration origin/main)

git rebase --onto "$TARGET_TAG" "$OLD_BASE" playground-integration
```

如果当前 `playground-integration` 本来就是基于目标 release 或更合适的稳定基线，也可以直接：

```bash
git rebase "$TARGET_TAG"
```

出现冲突时：

```bash
git status
```

重点检查：

```text
backend/internal/server/middleware/security_headers.go
backend/internal/server/middleware/security_headers_test.go
backend/internal/web/embed_on.go
backend/internal/web/embed_test.go
frontend/src/router/index.ts
frontend/src/components/layout/AppSidebar.vue
frontend/src/i18n/locales/en/common.ts
frontend/src/i18n/locales/zh/common.ts
frontend/src/views/user/ImagePlaygroundView.vue
image-playground/
```

解决每个冲突后：

```bash
git add <已解决文件>
git rebase --continue
```

如果移植方向不正确：

```bash
git rebase --abort
```

禁止用以下命令粗暴覆盖全部冲突：

```bash
git checkout --theirs .
git checkout --ours .
```

## 7. 本地完整验证

```bash
cd /opt/sub2api-fork-maintenance
./scripts/build-playground-integration.sh
```

必须通过：

- Playground 全量测试；
- Playground TypeScript/Vite 构建；
- Sub2API 前端集成测试；
- Sub2API 前端类型检查和生产构建；
- SecurityHeaders Go 测试；
- 嵌入式 Web 路由 Go 测试；
- `git diff --check`。

检查工作区：

```bash
git status --short
git diff --check
```

## 8. 构建目标版本二进制

假设目标版本为 `0.1.160-playground`：

```bash
cd /opt/sub2api-fork-maintenance/backend

VERSION=0.1.160-playground
COMMIT=$(git -C .. rev-parse HEAD)
BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
GO_BIN=${GO_BIN:-/usr/local/go/bin/go}

mkdir -p ../bin
CGO_ENABLED=0 "$GO_BIN" build \
  -tags embed \
  -ldflags="-s -w \
    -X main.Version=${VERSION} \
    -X main.Commit=${COMMIT}-playground \
    -X main.Date=${BUILD_DATE} \
    -X main.BuildType=release" \
  -o ../bin/sub2api-playground \
  ./cmd/server

../bin/sub2api-playground --version
file ../bin/sub2api-playground
sha256sum ../bin/sub2api-playground
```

## 9. 推送 Fork 并等待 CI

```bash
cd /opt/sub2api-fork-maintenance

git push --force-with-lease origin playground-integration
```

确认远程提交一致：

```bash
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git ls-remote origin refs/heads/playground-integration | cut -f1)
test "$LOCAL" = "$REMOTE"
```

GitHub Actions：

```text
https://github.com/Eternal-gjd/sub2api/actions
```

以下工作流必须成功：

- `CI`
- `Security Scan`
- `Playground Integration`

CI 未全部成功前，不部署服务。

## 10. 部署前备份

### 10.1 二进制和配置

```bash
STAMP=$(date +%Y%m%d-%H%M%S)

cp -a /opt/sub2api/sub2api \
  /opt/sub2api/sub2api.backup.${STAMP}.pre-upgrade

cp -a /opt/sub2api/config.yaml \
  /opt/sub2api/config.yaml.backup.${STAMP}
```

### 10.2 PostgreSQL

从配置中读取数据库参数时，不要输出密码：

```bash
DB_HOST=$(python3 - <<'PY'
import yaml
c = yaml.safe_load(open('/opt/sub2api/config.yaml'))['database']
print(c['host'])
PY
)
DB_PORT=$(python3 - <<'PY'
import yaml
c = yaml.safe_load(open('/opt/sub2api/config.yaml'))['database']
print(c['port'])
PY
)
DB_USER=$(python3 - <<'PY'
import yaml
c = yaml.safe_load(open('/opt/sub2api/config.yaml'))['database']
print(c['user'])
PY
)
DB_NAME=$(python3 - <<'PY'
import yaml
c = yaml.safe_load(open('/opt/sub2api/config.yaml'))['database']
print(c['dbname'])
PY
)
export PGPASSWORD=$(python3 - <<'PY'
import yaml
c = yaml.safe_load(open('/opt/sub2api/config.yaml'))['database']
print(c['password'])
PY
)

pg_dump -Fc \
  -h "$DB_HOST" -p "$DB_PORT" \
  -U "$DB_USER" "$DB_NAME" \
  > "/opt/sub2api/sub2api-db-${STAMP}.dump"

unset PGPASSWORD
```

验证备份文件存在且非空：

```bash
test -s "/opt/sub2api/sub2api-db-${STAMP}.dump"
```

## 11. 原子部署

```bash
install \
  -o sub2api \
  -g sub2api \
  -m 0755 \
  /opt/sub2api-fork-maintenance/bin/sub2api-playground \
  /opt/sub2api/sub2api.new

/opt/sub2api/sub2api.new --version
sha256sum /opt/sub2api/sub2api.new

mv -f /opt/sub2api/sub2api.new /opt/sub2api/sub2api
systemctl restart sub2api
```

等待健康：

```bash
for _ in $(seq 1 30); do
  if curl -fsS --max-time 3 \
    http://127.0.0.1:18098/health >/tmp/sub2api-health; then
    break
  fi
  sleep 1
done

systemctl is-active sub2api
cat /tmp/sub2api-health
```

## 12. 部署后验证

### 12.1 服务与日志

```bash
systemctl status sub2api --no-pager -l
journalctl -u sub2api --since '5 minutes ago' --no-pager
/opt/sub2api/sub2api --version
```

日志中不得出现：

- panic；
- FATAL；
- migration failed；
- 数据库结构不兼容；
- 前端静态资源读取失败。

### 12.2 HTTP

```bash
curl -fsS http://127.0.0.1:18098/health

curl -fsS \
  'http://127.0.0.1:18098/gpt-image-playground/?sub2api=1' \
  | grep 'GPT Image Playground'

curl -sS -o /tmp/keys-response -w '%{http_code}\n' \
  http://127.0.0.1:18098/api/v1/keys
```

未登录的 `/api/v1/keys` 应返回 `401`。

### 12.3 浏览器

强制刷新后验证：

1. 登录正常；
2. `/keys` 创建、编辑和删除正常；
3. 用户、分组和账户页面正常；
4. “GPT 生图工作台”菜单存在；
5. 工作台无需手工填写 URL 和 Key；
6. 自动选择 `gpt-image` 分组 Key；
7. 实际生成一张图片；
8. 上游权限和计费正常。

## 13. 回滚

如果新版没有执行不兼容数据库迁移，可先回滚二进制：

```bash
systemctl stop sub2api

cp -a \
  /opt/sub2api/sub2api.backup.TIMESTAMP.pre-upgrade \
  /opt/sub2api/sub2api

chown sub2api:sub2api /opt/sub2api/sub2api
chmod 0755 /opt/sub2api/sub2api

systemctl start sub2api
curl -fsS http://127.0.0.1:18098/health
```

如果新版已经执行不兼容迁移：

- 不要只恢复旧二进制；
- 停止服务；
- 按 PostgreSQL 恢复流程恢复升级前数据库备份；
- 恢复旧配置和旧二进制；
- 再启动并验证。

数据库恢复属于破坏性操作，必须再次确认目标数据库和备份文件后执行。

## 14. Skill 调用约定

后续可直接要求：

```text
调用 update-sub2imageapi 检查更新
```

只检查官方 release 和兼容性，不修改分支、不部署。

```text
调用 update-sub2imageapi 同步 Fork
```

同步官方 release、更新集成分支、测试、推送并等待 CI，不部署服务器。

```text
调用 update-sub2imageapi 更新服务
```

执行完整流程：检查 release、同步 Fork、测试、构建、等待 CI、备份、部署和验证。
