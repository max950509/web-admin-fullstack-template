import { ProTable, type ProTableProps } from "@ant-design/pro-components";

export interface MyProTableProps<T, U> extends ProTableProps<T, U> {
	requestApi?: (
		params: U & { current?: number; pageSize?: number },
	) => Promise<{
		data: {
			list: T[];
			total: number;
		};
	}>;
}

export default <
	T extends Record<string, any>,
	U extends Record<string, any> = Record<string, any>,
>(
	props: MyProTableProps<T, U>,
) => {
	const { requestApi, columns, ...rest } = props;
	const pagination =
		rest.pagination === false
			? false
			: {
					showSizeChanger: true,
					defaultPageSize: 10,
					...rest.pagination,
				};

	return (
		<ProTable<T, U>
			columns={columns}
			rowKey={rest.rowKey || "id"}
			search={{ defaultCollapsed: false, labelWidth: "auto", ...rest.search }}
			pagination={pagination}
			scroll={{ x: 1200, ...rest.scroll }} // 或者动态计算总宽度
			request={
				requestApi
					? async (params) => {
							const { current, pageSize, ...restParams } = params;
							const { data } = await requestApi({
								...restParams,
								page: current,
								pageSize,
							} as U & { current?: number; pageSize?: number });

							return {
								data: data.list,
								total: data.total,
							};
						}
					: rest.request
			}
			{...rest}
		/>
	);
};
