import { LockOutlined, ReloadOutlined, UserOutlined } from "@ant-design/icons";
import {
	Alert,
	Button,
	Form,
	Input,
	Modal,
	message,
	Space,
	Typography,
} from "antd";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	$getCaptcha,
	$postLogin,
	$postLoginWith2fa,
	type LoginParams,
} from "@/services/auth";
import "./index.less";
import { getToken, setToken } from "@/utils/auth";

const LoginPage: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [form] = Form.useForm();
	const [loading, setLoading] = useState<boolean>(false);
	const [captchaLoading, setCaptchaLoading] = useState<boolean>(false);
	const [captcha, setCaptcha] = useState({
		id: "",
		svg: "",
	});
	const hasFocusedRef = useRef(false);

	const getCaptcha = async () => {
		if (captchaLoading) return;
		setCaptchaLoading(true);
		try {
			const { data } = await $getCaptcha();
			setCaptcha(data);
		} finally {
			setCaptchaLoading(false);
		}
	};

	const handleLoginSuccess = () => {
		// 获取 redirect 参数
		const redirect = searchParams.get("redirect");
		console.log("即将登陆", decodeURIComponent(redirect || ""));
		// 如果有 redirect 则跳转回原地址，否则跳转到首页
		if (redirect) {
			navigate(decodeURIComponent(redirect), { replace: true });
		} else {
			navigate("/", { replace: true });
		}
	};

	// 检查是否已登录
	useEffect(() => {
		if (getToken()) {
			handleLoginSuccess();
		} else {
			getCaptcha();
		}
	}, []);

	const handleCheckOtp = async (value: string, temporaryToken: string) => {
		const {
			data: { accessToken },
		} = await $postLoginWith2fa({
			code: value,
			loginAccessToken: temporaryToken,
		});
		Modal.destroyAll();
		message.success("登录成功");
		setToken(accessToken);
		handleLoginSuccess();
	};

	const handleLogin = async (formData: LoginParams) => {
		setLoading(true);
		try {
			const {
				data: { accessToken, isTemporary },
			} = await $postLogin({ ...formData, captchaId: captcha.id });
			// 临时token，需要OPT二次认证
			if (isTemporary) {
				Modal.confirm({
					icon: null,
					content: (
						<div>
							<div style={{ marginBottom: 12 }}>
								<Typography.Title level={5} style={{ margin: 0 }}>
									二次认证
								</Typography.Title>

								<Typography.Text type="secondary" style={{ fontSize: 12 }}>
									为保障账号安全，请完成二次验证。
								</Typography.Text>
							</div>

							<Alert
								type="info"
								showIcon
								description="请打开手机上已绑定的验证器应用（如 Google Authenticator 或 Microsoft Authenticator），
								输入当前显示的6位动态验证码。"
								style={{ fontSize: 12 }}
							/>

							<Space direction="vertical" size={10} style={{ width: "100%" }}>
								<div
									style={{
										width: "100%",
										display: "flex",
										justifyContent: "center",
										marginTop: 12,
									}}
								>
									<Form>
										<Form.Item
											name="authCode"
											rules={[
												{ required: true, message: "请输入二次认证码！" },
											]}
										>
											<Input.OTP
												autoFocus
												ref={(otpRef) => {
													if (hasFocusedRef.current) return;
													hasFocusedRef.current = true;
													setTimeout(() => otpRef?.focus?.(), 0);
												}}
												placeholder="请输入二次认证码"
												onChange={(e) => handleCheckOtp(e, accessToken)}
											/>
										</Form.Item>
									</Form>
								</div>

								<div
									style={{
										display: "flex",
										justifyContent: "center",
										marginTop: -24,
									}}
								>
									<Typography.Text style={{ fontSize: 12, color: "#ff0000ff" }}>
										请勿将验证码提供给他人，验证码每 30 秒自动更新。
									</Typography.Text>
								</div>
							</Space>
						</div>
					),
					footer: null,
				});
			} else {
				setToken(accessToken);
				handleLoginSuccess();
			}
		} catch (_error) {
			await getCaptcha();
			form.setFieldsValue({ captcha: "" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="main">
			<h1 className="title">运维发布平台</h1>
			<Form onFinish={(data) => handleLogin(data)} form={form} className="form">
				<Form.Item
					name="username"
					rules={[{ required: true, message: "请输入用户名！" }]}
				>
					<Input
						size="large"
						prefix={<UserOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
						placeholder="用户名"
					/>
				</Form.Item>
				<Form.Item
					name="password"
					rules={[{ required: true, message: "请输入密码！" }]}
				>
					<Input
						size="large"
						prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
						type="password"
						placeholder="密码"
					/>
				</Form.Item>
				<Form.Item
					name="captcha"
					rules={[{ required: true, message: "请输入验证码！" }]}
				>
					<Space>
						<Input size="large" placeholder="验证码" />
						<div className="captcha-box" aria-busy={captchaLoading}>
							<div
								// biome-ignore lint/security/noDangerouslySetInnerHtml: xml injection
								dangerouslySetInnerHTML={{ __html: captcha.svg }}
								className="captcha-image"
								onClick={getCaptcha}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										getCaptcha();
									}
								}}
							/>
							<Button
								className="captcha-link"
								type="link"
								size="small"
								icon={<ReloadOutlined />}
								onClick={getCaptcha}
								loading={captchaLoading}
								aria-label="刷新验证码"
							>
								换一张
							</Button>
						</div>
					</Space>
				</Form.Item>
				<Form.Item>
					<Button
						size="large"
						type="primary"
						block
						htmlType="submit"
						loading={loading}
						className="submit"
					>
						登录
					</Button>
				</Form.Item>
			</Form>
		</div>
	);
};

export default LoginPage;
