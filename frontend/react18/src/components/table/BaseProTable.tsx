import { ProTable, type ProTableProps } from "@ant-design/pro-components";

export interface MyProTableProps<T, U> extends ProTableProps<T, U> {
	requestApi?: (params: U & { current?: number; pageSize?: number }) => Promise<
		API.Response<{
			records: T[];
			total: number;
		}>
	>;
}

export default <
	T extends Record<string, any>,
	U extends Record<string, any> = Record<string, any>,
>(
	props: MyProTableProps<T, U>,
) => {
	const { requestApi, columns, ...rest } = props;

	return (
		<ProTable<T, U>
			columns={columns}
			rowKey={rest.rowKey || "id"}
			search={{ defaultCollapsed: false, labelWidth: "auto", ...rest.search }}
			pagination={{
				showSizeChanger: true,
				defaultPageSize: 10,
				...rest.pagination,
			}}
			scroll={{ x: 1200, ...rest.scroll }} // 或者动态计算总宽度
			request={
				requestApi
					? async (params) => {
							const { current, pageSize, ...restParams } = params;
							const { data, code } = await requestApi({
								...restParams,
								pageNo: current,
								pageSize,
							} as U & { current?: number; pageSize?: number });

							return {
								data: data.records,
								success: !+code,
								total: data.total,
							};
						}
					: rest.request
			}
			{...rest}
		/>
	);
};
