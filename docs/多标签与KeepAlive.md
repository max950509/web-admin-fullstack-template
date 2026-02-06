# 多标签与 KeepAlive

这套模板的多标签与页面缓存是一起设计的：Tabs 负责 UI 与路由切换，KeepAlive 负责组件状态保留。

## 1. 关键依赖

- `react-activation` 提供 `<KeepAlive>` 与 `AliveScope`
- `antd` 的 `Tabs` 作为标签页 UI

## 2. KeepAlive 包装策略

入口在 `frontend/react18/src/router/index.tsx`：

- `wrapKeepAlive` 遍历路由树
- 只给“真实页面组件”包裹 `<KeepAlive>`
- `handle.noKeepAlive` 可显式关闭缓存

核心逻辑：

```tsx
if (React.isValidElement(element) && element.type !== Outlet && !route.handle?.noKeepAlive) {
  newRoute.element = <KeepAlive name={fullPath} key={fullPath}>{element}</KeepAlive>;
}
```

## 3. 多标签状态管理

`TabsContext` 负责维护标签列表与 activeKey：

- 固定标签通过 `handle.fixed` 初始化
- `addTab`：在路由变化时自动创建
- `removeTab / removeMultipleTabs`：关闭标签

## 4. 路由与 Tabs 联动

`RouteTabs` 里通过 `matchRoutes` 找到当前路由，创建 Tab：

- `tab.key` = pathname
- `tab.url` = pathname + search
- 右键菜单支持：刷新 / 关闭其他 / 关闭全部

## 5. Tabs 与缓存同步

`useAliveController` 提供：

- `drop(key)`：关闭标签时清理缓存
- `refresh(key)`：强制刷新缓存

因此：

- “关闭标签”同时删除缓存
- “刷新标签”保留路由但重建组件

## 6. 可扩展点

- `handle.fixed`：定义不可关闭标签
- `handle.noKeepAlive`：单页面禁用缓存
- Tabs 右键菜单可继续扩展

