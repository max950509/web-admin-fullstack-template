# 多标签页与状态保持 (KeepAlive)

多标签页是现代后台管理系统提升用户体验的关键功能。本项目的多标签页设计与页面状态保持（KeepAlive）紧密结合，旨在实现流畅、无感知的页面切换和状态记忆。

## 1. 核心依赖

*   **`react-router-dom`**: 提供基础的路由能力。
*   **`react-activation`**: 一个轻量级的 React 组件缓存库，是实现 `KeepAlive` 功能的核心。它提供了 `<AliveScope>` 和 `<KeepAlive>` 两个关键组件。
*   **`antd`**: 其 `Tabs` 组件被用作标签页的 UI 容器。

## 2. 实现原理与流程

多标签页的本质是 **UI 状态** 和 **路由状态** 的同步。`Tabs` 组件负责展示 UI，而 `react-router` 负责驱动应用状态。我们通过一个自定义的 `TabsContext` 来作为桥梁，连接这两者。

**流程图**:

```
+-------------------+      +-------------------+      +----------------------+
|  用户点击新菜单    |----->|   路由发生变化     |----->|  RouteTabs 组件监听到  |
+-------------------+      +-------------------+      +----------------------+
                                                            |
                                                            v
+-------------------------------------------------------------------------+
| 1. matchRoutes 匹配当前路由对象                                           |
| 2. 检查该 Tab 是否已存在                                                  |
| 3. 若不存在，则调用 TabsContext 的 addTab 方法，新增一个 Tab 项             |
| 4. 设置 activeKey 为当前路由的 pathname                                   |
+-------------------------------------------------------------------------+
                                                            |
                                                            v
+-------------------+      +-------------------+      +----------------------+
| TabsContext 状态更新 |----->|   Tabs UI 重新渲染   |----->|    页面内容被渲染     |
+-------------------+      +-------------------+      +----------------------+
                                                            | (被 KeepAlive 包裹)
                                                            v
                                                 +--------------------------+
                                                 |  组件状态被 react-activation |
                                                 |           缓存           |
                                                 +--------------------------+
```

## 3. 关键代码实现

### 3.1. 路由包裹 (`src/router/index.tsx`)

在生成最终的路由配置时，我们会遍历路由树，并使用 `wrapKeepAlive` 函数为所有需要缓存的页面组件包裹上 `<KeepAlive>` 组件。

```typescript
// src/router/utils.ts -> wrapKeepAlive

function wrapKeepAlive(route: RouteObject): RouteObject {
  const { element, children } = route;
  const newRoute = { ...route };

  // 只有当 element 是一个有效的 React 元素，且不是 Outlet 时，才包裹 KeepAlive
  // 这样做可以避免为布局组件或中间路由添加不必要的缓存
  if (React.isValidElement(element) && element.type !== Outlet && !route.handle?.noKeepAlive) {
    const fullPath = getRouteFullPath(route); // 获取完整的路由路径作为缓存的 key
    newRoute.element = <KeepAlive name={fullPath} key={fullPath}>{element}</KeepAlive>;
  }

  if (children) {
    newRoute.children = children.map(wrapKeepAlive);
  }

  return newRoute;
}
```
*   **`name` 属性**: `<KeepAlive>` 组件使用 `name` 属性作为缓存的唯一标识符。我们使用页面的完整 `pathname` 作为 `name`。
*   **`handle.noKeepAlive`**: 这是一个我们在路由元信息中定义的开关。如果某个页面不希望被缓存（例如，每次进入都需要刷新），只需在其路由定义中设置 `handle: { noKeepAlive: true }` 即可。

### 3.2. `TabsContext` 状态管理

`TabsContext` 是一个 React Context，它维护了标签页的核心状态：

*   `tabs`: 一个数组，存储了所有当前打开的标签页对象。每个对象包含 `key`, `label`, `url` 等信息。
*   `activeKey`: 当前激活的标签页的 `key`。
*   `addTab`, `removeTab`, `refreshTab` 等一系列操作函数。

### 3.3. `RouteTabs` 联动组件

`RouteTabs` 是实现联动的核心组件。

```tsx
// src/components/layouts/RouteTabs.tsx

const RouteTabs = () => {
  const { tabs, activeKey, addTab, setActiveKey } = useContext(TabsContext);
  const location = useLocation();
  const matchedRoutes = useMatches(); // react-router v6.4+ 的新 Hook

  useEffect(() => {
    // 当路由变化时，从匹配到的路由中找到最后一个有效页面
    const currentRoute = matchedRoutes[matchedRoutes.length - 1];
    const handle = currentRoute.handle;
    
    // 添加新的 Tab
    addTab({
      key: currentRoute.pathname,
      label: handle?.title || '新标签页',
      url: location.pathname + location.search,
      fixed: handle?.fixed,
    });
    setActiveKey(currentRoute.pathname);

  }, [location.pathname]); // 依赖 location.pathname

  // ... antd Tabs 的渲染逻辑
};
```

## 4. 缓存的控制与交互

`react-activation` 提供了 `useAliveController` Hook，它允许我们手动控制缓存。

*   **关闭标签页**: 当用户点击标签页的关闭按钮时，我们会调用 `TabsContext` 的 `removeTab` 函数。在这个函数内部，我们不仅会从 `tabs` 数组中移除该标签，还会调用 `useAliveController` 的 `drop` 方法来销毁对应的组件缓存。

    ```typescript
    // TabsContext.tsx
    const { drop } = useAliveController();

    const removeTab = (key: string) => {
      // ... 从 tabs 数组中移除
      drop(key); // 销毁缓存
    };
    ```

*   **刷新标签页**: 刷新功能通过 `refreshTab` 函数实现。它会先调用 `drop(key)` 销毁缓存，然后立刻将用户导航回相同的 URL。由于组件缓存已被清除，`KeepAlive` 会重新创建一个新的组件实例，从而达到“刷新”的效果。

通过这种设计，我们实现了 UI、路由和组件缓存三者的状态同步，为用户提供了流畅的多标签页体验。

