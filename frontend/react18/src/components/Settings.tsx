import {Modal, message, Segmented, Descriptions, Switch, Typography, Alert, Space, Form, Input} from "antd";
import React, { useEffect, useState } from "react";
import {$enableOpt, $generateOpt, type ProfileResponse} from "@/services/auth.ts";

interface IProps {
	trigger: React.ReactElement;
	visible?: boolean;
    userInfo: ProfileResponse
}

const Settings: React.FC<IProps> = (props) => {
	const { trigger, visible, userInfo } = props;
	const [modalVisible, setModalVisible] = useState<boolean>(visible || false);
    const [item, setItem] = useState('账号');
    const [otpEnabled, setOtpEnabled] = useState<boolean>(userInfo.isOtpEnabled);

	useEffect(() => {
		setModalVisible(visible || false);
	}, [visible]);

	const handleTrigger = () => {
		setModalVisible(true);
	};

    const handleBindOtp = async (value: string) => {
        await $enableOpt({
            code: value,
        });
        Modal.destroyAll();
        message.success("开启成功");
        setOtpEnabled(true);
    };

    const handleOptChange = async (checked: boolean) => {
        if (!checked) return;
        const { data } = await $generateOpt()
        // 弹窗绑定OPT二次认证
        Modal.confirm({
            icon: null,
            content: (
                <div>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                        绑定二次认证 (TOTP)
                    </Typography.Title>

                    <Typography.Text type="secondary" style={{ fontSize: 12}}>
                        使用验证器应用扫描二维码并输入动态验证码，完成绑定后即可用于登陆验证。
                    </Typography.Text>

                    <Alert
                        type="info"
                        showIcon
                        message="支持的验证器应用"
                        description="Google Authenticator、Microsoft Authenticator 等支持 TOTP 的应用均可使用"
                        style={{ fontSize: 12, marginTop: 12, marginBottom: 12 }}
                    />

                    <Space direction="vertical" size={10} style={{ width: "100%" }}>
                        <div style={{ fontSize: 12, color: "#888" }}>
                            <div>1. 打开验证器并扫描下方二维码</div>
                            <div>2. 获取生成的6位动态验证码</div>
                            <div>3. 在下方输入验证码完成绑定</div>
                        </div>

                        <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <img src={data.qrCodeDataUrl} alt="TOTP QR Code" />
                        </div>

                        <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 12 }}>
                            <Form>
                                <Form.Item
                                    name="authCode"
                                    rules={[{ required: true, message: "请输入二次认证码！" }]}
                                >
                                    <Input.OTP
                                        placeholder="请输入二次认证码"
                                        onChange={(e) => handleBindOtp(e)}
                                    />
                                </Form.Item>
                            </Form>
                        </div>

                        <div style={{ display: "flex", justifyContent: "center", marginTop: -24 }}>
                            <Typography.Text style={{ fontSize: 12, color: "#ff0000ff" }}>
                                请勿将验证码提供给他人，验证码每 30 秒自动更新。
                            </Typography.Text>
                        </div>
                    </Space>
                </div>
            ),
            footer: null,
        });
    }

	return (
		<>
			{trigger && React.cloneElement(trigger, { onClick: handleTrigger })}
			<Modal
				title="设置"
				destroyOnHidden
				maskClosable={false}
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
                footer={null}
			>
                <Segmented options={['账号', '安全']} value={item} onChange={setItem} style={{marginBottom: 16}}/>
                {item === '账号' && (
                    <Descriptions bordered size='small' items={[
                        {label: 'ID', children: userInfo.id},
                        {label: '账号', children: userInfo.username}
                    ]} />
                )}
                {item === '安全' && (
                    <Descriptions bordered size='small' items={[
                        {label: '开启OTP二次认证', children: <Switch checked={otpEnabled} onChange={handleOptChange} disabled={otpEnabled} />},
                    ]}/>
                )}
			</Modal>
		</>
	);
};

export default Settings;
