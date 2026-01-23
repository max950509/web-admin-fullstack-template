import request from "@/utils/request";

export type PermissionType = "menu" | "page" | "action";

export interface PermissionItem {
	id: number;
	name: string;
	type: PermissionType;
	action: string;
	resource: string;
	parentId: number | null;
	sort: number;
	createdAt?: string;
	updatedAt?: string;
	children?: PermissionItem[];
}

export interface PermissionFormParams {
	name: string;
	type: PermissionType;
	action: string;
	resource: string;
	parentId?: number | null;
	sort?: number;
}

/**
 * 排查：卫生、证照手续
 * 措施：没问题，拍摄发布，回应质疑。有问题，帮忙整改。最后推广宣传。
 * 长效机制：成立残疾人创业协会，提供援助：培训、相关税费、房租等申请减免。
 *
 * 首先，做好全面情况摸底排查，看是否存在群众反馈的卫生环境和证照是否齐全的问题。我会去选择在咖啡店人流量较少的时候，协同我们的残联、民政、市监会、卫健委等相关部分
 * 也慰问残疾人创业的形式进行相关情况排查，我会和卫健委的专家同志们检查包括但不限于熊掌手套和咖啡机、咖啡杯、吧台等主要工作区的设施卫生清洁情况，是否有进行定期的清洗消毒。
 * 同时检查例如营业执照的相关经营手续是否有缺失，查验是否在有效期内。
 *
 * 其次，摸清楚具体情况后，我会从以下思路去解决问题。如果检查不存在群众反馈的相关问题，我会将排查的过程及结果通过拍摄成短视频的方式来回应群众的质疑，以打消群众的疑虑，
 * 重点要把内部工作环境、相关手续的细节展示出来。如果检查存在问题，我会帮助店主进行一个整改，环境卫生方面的问题邀请卫健委的专家进行一个培训，针对熊掌、工作台等设施清洁
 * 形成一个具体的规范，后续可以参考该规范进行管理。如果是手续问题，缺失的部分我会联合相关部门进行一个补办，必要时可以开通绿色通道，帮助店主快速的完成手续的补全。完成以上
 * 工作后，会通过拍摄视频的方式，将结果进行展示，以方便群众的了解。同时我会建议店主将相关证照放在显眼位置，方便用户查看；
 *
 * 最后，针对该问题我会进行一个总结，是否有更多残疾人创业可能存在此类不规范的问题。我们需要进行一个长效的机制，去帮助引导这部分特殊人群，可以通过设立残疾人创业协会，定期
 * 进行卫生、证照相关的培训，为残疾人创业提供长远的支持和援助。
 */
export const $getPermissions = async () =>
	request.get<PermissionItem[]>("/permissions");

export const $createPermission = async (params: PermissionFormParams) =>
	request.post<PermissionItem>("/permissions", params);

export const $updatePermission = async (
	id: number,
	params: PermissionFormParams,
) => request.patch<PermissionItem>(`/permissions/${id}`, params);

export const $deletePermission = async (id: number) =>
	request.delete<void>(`/permissions/${id}`);
