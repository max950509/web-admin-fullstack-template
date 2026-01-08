## 开始
1. 安装volta
2. 安装依赖：`pnpm i`
3. 本地运行：`pnpm dev`
4. 打包：`pnpm build`

## 技术栈
- [antd](https://ant.design/components/overview-cn)  
基础组件库
- [antd-pro-components](https://pro-components.antdigital.dev/)  
Layout、Table、Form等高级封装
- [Vite](https://vite.dev/)  
构建、打包工具

## 表单联动Demo
### 通过dependencies属性控制表单隐藏
```javascript
// 表单联动
{
    title: 'host地址',
    dataIndex: 'host',
    hideInSearch: true,
    hideInTable: true,
    dependencies: ["category"],
    // 方式1: 通过formItemProps控制表单隐藏
    formItemProps: (form) => {
      const category = form.getFieldValue('category');
      const hidden = Number(category) !== DEPLOY_CATEGORY_CODE.K8S;
      return {
        hidden,
      };
    },
    // 方式2: 通过renderFormItem控制表单隐藏
    renderFormItem: (_: any, {defaultRender}: any, form: any) => {
      console.log('renderFormItem', form.getFieldValue("category"), form.getFieldValue("category") === DEPLOY_CATEGORY_CODE.K8S)
      return Number(form.getFieldValue("category")) === DEPLOY_CATEGORY_CODE.K8S ? (
          defaultRender(_)
      ) : (
          null
      );
    },
}
```
### 动态修改表单的子依赖的options
```javascript
{
    {
        title: "产品线",
        dataIndex: "brandId",
        valueType: "select",
        request: async () => {
            const { data } = await getMyBrands();
            return data.map((item: { name: string; id: number }) => ({
                label: item.name,
                value: item.id,
            }));
        },
    },
    {
        title: "项目",
        dataIndex: "projectId",
        valueType: "select",
        hideInSearch: true,
        dependencies: ["brandId"],
        width: 180,
        request: async ({ brandId }) => {
            if (!brandId) return [];
            const { data } = await getProjectsByBrand({ brandId });
            return data.map((item) => ({
                label: item.name,
                value: item.id,
            }));
        },
    },
}
```

### 动态修改表单的子依赖的值
```javascript
{
    {
        title: "产品线",
        dataIndex: "brandId",
        valueType: "select",
        fieldProps: (form) => ({
            showSearch: true, // 支持搜索
            onChange: () => {
                console.log("brandId 改变时，清空下游字段");
                form?.setFieldsValue?.({
                    projectId: undefined,
                    serviceId: undefined,
                    envId: undefined,
                });
            },
        }),
            hideInTable: true,
    },
    {
        title: "项目",
        dataIndex: "projectId",
        valueType: "select",
        hideInSearch: true,
        dependencies: ["brandId"],
        width: 180,
        fieldProps: (form) => ({
            showSearch: true, // 支持搜索
            onChange: () => {
                console.log("projectId 改变时，清空下游字段");
                form?.setFieldsValue?.({ serviceId: undefined, envId: undefined });
            },
        }),
    },
}
```
### 使用valueType: "dependency"来实现表单联动
这样问题比较多：
1. ts类型需扩展
2. columns中返回的列hideInSearch等属性失效，只能在外部统一控制  

优势：
1. 依赖处理更合理，下游设置key为上游依赖的字段，上游依赖值更新时，下游会重新渲染值并更新。下游列需设置`formItemProps: { preserve: false }`
```javascript
{
    valueType: "dependency",
    name: ["brandId"],
    columns: ({ brandId }) => {
        return [
            {
                key: `projectId1${brandId}`,
                title: "项目111",
                dataIndex: "projectId1",
                formItemProps: { preserve: false },
                search: false,
                hideInSearch: true,
            },
            {
            	key: `projectId111${brandId}`,
            	title: "项目111222",
            	dataIndex: "projectId111",
            	formItemProps: { preserve: false },
            	search: false,
            	hideInSearch: true,
            },
        ];
    },
    hideInTable: true,
    hideInSearch: true,
},
```
