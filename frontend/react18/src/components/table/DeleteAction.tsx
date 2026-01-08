import type { ActionType } from "@ant-design/pro-components";
import type { ButtonProps } from "antd";
import { Popconfirm } from "antd";
import type React from "react";

interface DeleteActionProps {
	service: () => void;
	tableRef?: React.RefObject<ActionType | null>;
	cb?: () => void;
}

const DeleteAction: React.FC<DeleteActionProps & ButtonProps> = ({
	service,
	tableRef,
	cb,
}) => {
	const handleDelete = async () => {
		await service();

		if (tableRef?.current?.reload) {
			tableRef.current.reload();
			const pageInfo: any = tableRef.current?.pageInfo; //获取当前分页数据
			if (
				pageInfo?.pageSize * pageInfo.current - pageInfo?.total ===
				pageInfo?.pageSize - 1
			) {
				//判断是否分页数量*size -total =所剩是否为分页数-1
				if (pageInfo.current === 1) {
					if (tableRef.current?.setPageInfo) {
						tableRef.current.setPageInfo({ current: 1 });
					}
				} else {
					if (tableRef.current?.setPageInfo) {
						tableRef.current.setPageInfo({ current: pageInfo.current - 1 });
					}
				}
			}
		}

		if (cb) cb();
	};

	return (
		<Popconfirm title="确认删除吗" onConfirm={handleDelete}>
			<a>删除</a>
		</Popconfirm>
	);
};

export default DeleteAction;
