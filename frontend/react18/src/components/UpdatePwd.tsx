import { Form, type FormInstance, Input, Modal, message } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { PostUpdatePwd } from "@/services/user";

interface IProps {
	trigger: React.ReactElement;
	visible?: boolean;
	handleLogout: () => void;
}

const UpdatePwd: React.FC<IProps> = (props) => {
	const { trigger, visible, handleLogout } = props;
	const [modalVisible, setModalVisible] = useState<boolean>(visible || false);
	const [loading, setLoading] = useState<boolean>(false);
	const formRef = useRef<FormInstance>(null);

	useEffect(() => {
		setModalVisible(visible || false);
	}, [visible]);

	const handleTrigger = () => {
		setModalVisible(true);
	};

	const handleOk = async () => {
		await formRef.current?.validateFields();
		setLoading(true);
		try {
			await PostUpdatePwd({
				...formRef.current?.getFieldsValue(),
			});
			message.success(`密码修改成功!`);
			setModalVisible(false);
			handleLogout();
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			{trigger && React.cloneElement(trigger, { onClick: handleTrigger })}
			<Modal
				title="修改密码"
				destroyOnHidden
				maskClosable={false}
				open={modalVisible}
				confirmLoading={loading}
				onOk={handleOk}
				onCancel={() => setModalVisible(false)}
			>
				<Form layout="vertical" ref={formRef}>
					<Form.Item
						label="新密码"
						name="newPassword"
						rules={[{ required: true, message: "请输入新密码！" }]}
					>
						<Input.Password />
					</Form.Item>
					<Form.Item
						label="确认新密码"
						name="newPassword2"
						rules={[
							{ required: true, message: "请重复新密码！" },
							({ getFieldValue }) => ({
								validator(_, value) {
									if (!value || getFieldValue("newPassword") === value) {
										return Promise.resolve();
									}
									return Promise.reject(new Error("两次输入的密码不一致！"));
								},
							}),
						]}
						dependencies={["newPassword"]}
					>
						<Input.Password />
					</Form.Item>
					<Form.Item
						label="二次认证码"
						name="code"
						rules={[{ required: true, message: "请输入二次认证码！" }]}
					>
						<Input.OTP />
					</Form.Item>
				</Form>
			</Modal>
		</>
	);
};

export default UpdatePwd;
