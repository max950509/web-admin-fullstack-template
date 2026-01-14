import {
	ProDescriptions,
	type ProDescriptionsItemProps,
} from "@ant-design/pro-components";
import { Modal } from "antd";
import React, { useState } from "react";
import { COMMON_MODAL_PROPS } from "@/utils/constants.ts";

type DescModalProps<T extends Record<string, any>> = {
	title: React.ReactNode;
	data?: T;
	columns: ProDescriptionsItemProps<T>[];
	trigger: React.ReactElement;
};

export default function DescModal<T extends Record<string, any>>(
	props: DescModalProps<T>,
) {
	const { title, data, columns, trigger } = props;
	const [open, setOpen] = useState(false);

	return (
		<>
			{React.cloneElement(trigger, {
				onClick: () => setOpen(true),
			})}
			<Modal
				title={title}
				open={open}
				footer={null}
				onCancel={() => setOpen(false)}
				{...COMMON_MODAL_PROPS}
			>
				<ProDescriptions<T> bordered columns={columns} dataSource={data} />
			</Modal>
		</>
	);
}
