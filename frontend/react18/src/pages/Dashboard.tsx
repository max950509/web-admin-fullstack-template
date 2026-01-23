import { useRequest } from "ahooks";
import { Card, Col, List, Row, Space, Tag, Typography } from "antd";
import { useMemo } from "react";
import { useRouteLoaderData } from "react-router-dom";
import type { ProfileResponse } from "@/services/auth";
import { $getMyOperationLogs } from "@/services/operation-log";

const STATUS_COLORS: Record<string, string> = {
	ok: "green",
	warn: "orange",
};

const methodTagColor = (method: string) => {
	switch (method) {
		case "GET":
			return "blue";
		case "POST":
			return "green";
		case "PUT":
		case "PATCH":
			return "orange";
		case "DELETE":
			return "red";
		default:
			return "default";
	}
};

function Dashboard() {
	const profile = useRouteLoaderData("root") as ProfileResponse;
	const { data, loading } = useRequest(() =>
		$getMyOperationLogs({ page: 1, pageSize: 8 }),
	);
	const logs = data?.data?.list ?? [];
	const roleNames = useMemo(
		() => profile.roles.map((role) => role.name),
		[profile.roles],
	);

	return (
		<div>
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={8}>
					<Card title="个人信息" bordered={false}>
						<Space direction="vertical" size={12}>
							<div>
								<Typography.Text type="secondary">账号</Typography.Text>
								<div>
									<Typography.Text strong>{profile.username}</Typography.Text>
								</div>
							</div>
							<div>
								<Typography.Text type="secondary">角色</Typography.Text>
								<div>
									<Space size={[8, 8]} wrap>
										{roleNames.map((name) => (
											<Tag key={name}>{name}</Tag>
										))}
									</Space>
								</div>
							</div>
							<div>
								<Typography.Text type="secondary">双因素认证</Typography.Text>
								<div>
									<Tag
										color={
											profile.isOtpEnabled
												? STATUS_COLORS.ok
												: STATUS_COLORS.warn
										}
									>
										{profile.isOtpEnabled ? "已启用" : "未启用"}
									</Tag>
								</div>
							</div>
						</Space>
					</Card>
				</Col>
				<Col xs={24} lg={16}>
					<Card title="近期操作日志" bordered={false}>
						<List
							loading={loading}
							dataSource={logs}
							locale={{ emptyText: "暂无操作记录" }}
							renderItem={(item) => {
								const code =
									item.action && item.resource
										? `${item.action}:${item.resource}`
										: item.path;
								const statusColor =
									item.statusCode >= 500
										? "red"
										: item.statusCode >= 400
											? "volcano"
											: "green";
								return (
									<List.Item>
										<Space direction="vertical" size={4}>
											<Space size={8} wrap>
												<Tag color={methodTagColor(item.method)}>
													{item.method}
												</Tag>
												<Tag color={statusColor}>{item.statusCode}</Tag>
												<Typography.Text>{code}</Typography.Text>
											</Space>
											<Typography.Text type="secondary">
												{new Date(item.createdAt).toLocaleString()}
											</Typography.Text>
										</Space>
									</List.Item>
								);
							}}
						/>
					</Card>
				</Col>
			</Row>
		</div>
	);
}

export default Dashboard;
