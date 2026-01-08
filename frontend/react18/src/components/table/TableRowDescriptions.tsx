import {
	type ActionType,
	type ProColumnType,
	ProDescriptions,
	type ProFormInstance,
} from "@ant-design/pro-components";
import type { ModalProps } from "antd";
import { Modal } from "antd";
import React, { useEffect, useRef, useState } from "react";

type ParamsType = Record<string, any>;

interface EditModalProps<DataType> extends ModalProps {
	trigger?: React.ReactElement;
	triggerClick?: () => void;
	visible?: boolean;
	tableRef?: React.RefObject<ActionType | null>;
	rowKey?: string;
	columns: ProColumnType<DataType>[];
	record?: DataType;
	detail?: () => Promise<ParamsType>;
}

const FormModal = <DataType extends ParamsType>(
	props: EditModalProps<DataType>,
) => {
	const {
		trigger,
		triggerClick,
		visible = false,
		tableRef,
		rowKey = "id",
		columns,
		record = {},
		detail,
		...modalProps
	} = props;
	const [modalVisible, setModalVisible] = useState<boolean>(visible);
	const formRef = useRef<ProFormInstance | null>(null);

	useEffect(() => {
		setModalVisible(visible);
	}, [visible]);

	const getDetail = async () => {
		if (!detail) return;

		const data = await detail();

		formRef.current?.setFieldsValue(data);
	};

	const handleTrigger = () => {
		setModalVisible(true);

		getDetail();

		if (triggerClick) triggerClick();
	};

	return (
		<>
			{trigger && React.cloneElement(trigger, { onClick: handleTrigger })}
			<Modal
				destroyOnHidden
				width={580}
				maskClosable={false}
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				footer={null}
				{...modalProps}
			>
				<ProDescriptions
					style={{
						background: "#fff",
					}}
					// columns={columns}
					// dataSource={values}
				/>
			</Modal>
		</>
	);
};

export default FormModal;
