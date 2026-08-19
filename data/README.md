# 工位雷达共享数据

`radar-users.csv` 是桌面应用“工位雷达”真实数据模式的共享表格。应用通过 GitHub Raw 匿名读取，通过 GitHub Contents API 合并写入。

字段：

| 字段 | 含义 |
| --- | --- |
| `device_id` | 每个安装生成的随机匿名 ID，不是硬件 ID |
| `display_name` | 用户设置的匿名工牌 |
| `latitude` / `longitude` | 约化到 3 位小数的坐标 |
| `status` / `status_copy` / `tone` | 当前匿名工位状态及展示文案 |
| `updated_at` | UTC ISO 时间；超过 30 分钟的行不再展示 |
| `app_version` | 写入记录的应用版本 |

关闭附近发现时应用会删除自己的行；合并写入时也会清理超过 7 天的旧行。CSV 在公开仓库中，不能写入姓名、联系方式、精确地址、轨迹或 GitHub 凭证。
