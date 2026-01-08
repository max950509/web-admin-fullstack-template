import {
	type ActionType,
	BetaSchemaForm,
	type ProColumnType,
} from "@ant-design/pro-components";
import type { FormInstance, ModalProps } from "antd";
import { Modal } from "antd";
import React, { useEffect, useRef, useState } from "react";

type ParamsType = Record<string, any>;

interface EditModalProps<DataType> extends ModalProps {
	trigger?: React.ReactElement;
	triggerClick?: () => void;
	visible?: boolean;
	disabled?: boolean;
	tableRef?: React.RefObject<ActionType | null>;
	rowKey?: string;
	service?: (params: DataType) => Promise<void>;
	columns: ProColumnType<DataType>[];
	record?: DataType;
	detail?: () => Promise<ParamsType>;
	onSubmit?: (params: DataType) => void;
}

const FormModal = <DataType extends ParamsType>(
	props: EditModalProps<DataType>,
) => {
	const {
		trigger,
		triggerClick,
		visible = false,
		disabled = false,
		tableRef,
		service,
		columns,
		record = {},
		detail,
		onSubmit,
		...modalProps
	} = props;
	const [modalVisible, setModalVisible] = useState<boolean>(visible);
	const formRef = useRef<FormInstance>();
	// const [values, setValues] = useState<ParamsType>(record);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		setModalVisible(visible);
	}, [visible]);

	const getDetail = async () => {
		if (!detail) return;

		const data = await detail();

		// setValues(data);

		formRef.current?.setFieldsValue(data);
	};

	const handleTrigger = () => {
		setModalVisible(true);

		getDetail();

		if (triggerClick) triggerClick();
	};

	const handleSubmit = async (value: DataType) => {
		const newValues: DataType = value;

		// custom submit
		if (onSubmit) return onSubmit(newValues);

		if (!service) return;

		setLoading(true);

		try {
			await service(newValues);
			setModalVisible(false);

			if (tableRef?.current) {
				tableRef?.current.reload();
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			{trigger && React.cloneElement(trigger, { onClick: handleTrigger })}
			<Modal
				destroyOnHidden
				width={"70%"}
				maskClosable={false}
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				footer={null}
				{...modalProps}
			>
				<BetaSchemaForm
					onFinish={handleSubmit}
					layout="horizontal"
					labelCol={{ span: 5 }}
					wrapperCol={{ span: 17 }}
					initialValues={record}
					submitter={
						!disabled && {
							submitButtonProps: {
								loading,
								style: { marginLeft: 12 },
							},
							render: (_, dom) => {
								return <div style={{ textAlign: "center" }}>{dom}</div>;
							},
						}
					}
					disabled={disabled}
					formRef={formRef}
					columns={columns as any}
				/>
			</Modal>
		</>
	);
};

export default FormModal;
