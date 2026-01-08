declare namespace API {
	interface Response<T = null> {
		code: number;
		msg: string;
		data: T;
	}

	export interface Config {
		skipResponseHandler?: boolean;
		noErrorMessage?: boolean;
	}

	type addCollectionUsingPOSTParams = {
		action?: "BOSS1009";
		/** 菜单Id */
		menuId: number;
	};

	type addMenuUsingPOSTParams = {
		action?: "BOSS1402";
		/** code */
		code: string;
		/** 是否为叶子节点 0：非叶子节点  1：叶子节点 */
		leaf: any;
		/** 链接 */
		link?: string;
		/** 菜单名称 */
		menuName: string;
		/** 父节点id */
		parentId: number;
		/** 排序 */
		sort: any;
	};

	type addUserGroupUsingPOSTParams = {
		action?: "BOSS1202";
		/** 用户组名称 */
		groupName: string;
	};

	type addUserUsingPOSTParams = {
		action?: "BOSS1001";
		/** 登录名 */
		loginName: string;
		/** 姓名 */
		name: string;
		/** 手机号 */
		phone: string;
		/** 备注 */
		remark?: string;
		/** 用户状态，0：禁用 ；1：正常 */
		status: number;
		/** 用户组id列表 */
		userGroup: any;
	};

	type AlwaysMenusResModel = {
		/** 菜单编码 */
		code?: string;
		/** 菜单Id */
		id: number;
		/** 菜单链接 */
		link?: string;
		/** 菜单名称 */
		name?: string;
		/** 父菜单id */
		parentId?: number;
	};

	type alwaysMenuUsingPOSTParams = {
		action?: "BOSS1008";
	};

	type cancelMenuHotUsingPOSTParams = {
		action?: "BOSS1007";
		/** 菜单id */
		menuId: number;
	};

	type deleteUserUsingPOSTParams = {
		action?: "BOSS1003";
		/** 用户id */
		userId: number;
	};

	type delMenuUsingPOSTParams = {
		action?: "BOSS1403";
		/** 菜单id */
		menuId: number;
	};

	type delUserGroupUsingPOSTParams = {
		action?: "BOSS1203";
		/** 用户组id */
		groupId: number;
	};

	type detailUserUsingPOSTParams = {
		action?: "BOSS1002";
		/** 用户id */
		userId: number;
	};

	type getLoginUserInfoUsingPOSTParams = {
		action?: "BOSS1503";
	};

	type getMenuListContainsCountUsingPOSTParams = {
		action?: "BOSS1205";
		/** 用户组id */
		groupId: number;
	};

	type getMenuUsingPOSTParams = {
		action?: "BOSS1005";
		/** 用户id */
		userId: number;
	};

	type getUserListByUserIdContainsCountUsingPOSTParams = {
		action?: "BOSS1303";
	};

	type getUserListByUserIdContainsUsedUsingPOSTParams = {
		action?: "BOSS1302";
		/** 用户id */
		userId: number;
	};

	type getUserListByUserIdUsingPOSTParams = {
		action?: "BOSS1301";
		/** 分页 */
		limit: number;
		/** 页数 */
		page: number;
	};

	type getUserListUsingPOSTParams = {
		action?: "BOSS1000";
		/** 分页 */
		limit: number;
		/** 登录名 */
		loginName?: string;
		/** 姓名 */
		name?: string;
		/** 页数 */
		page: number;
		/** 用户组id */
		userGroup?: number;
	};

	type GroupListResModel = {
		/** 创建时间 */
		createTime?: string;
		/** 用户组id */
		groupId: number;
		/** 用户组名称 */
		groupName?: string;
	};

	type logDetailUsingPOSTParams = {
		action?: "BOSS1102";
		/** 日志Id */
		logId: number;
	};

	type loginOutUsingPOSTParams = {
		action?: "BOSS1505";
	};

	type LoginResModel = {
		/** 登录账号已有的菜单 */
		menus?: MenuResModel[];
		/** 登录账号名称 */
		name?: string;
		/** 身份凭证 */
		token?: string;
	};

	type loginUsingPOSTParams = {
		/** 接口标识 */
		action?: "BOSS1500";
		/** 账号 */
		loginName: string;
		/** 密码 */
		password: string;
	};

	type logListUsingPOSTParams = {
		action?: "BOSS1101";
		/** 开始时间 */
		beginTime?: string;
		/** 结束时间 */
		endTime?: string;
		/** ip */
		ip?: string;
		/** 条数 */
		limit: number;
		/** 菜单code */
		menuCode?: string;
		/** 请求方式 */
		method?: string;
		/** 操作员名称 */
		operatorName?: string;
		/** 页数 */
		page: number;
		/** parameter */
		parameter?: string;
		/** payload */
		payload?: string;
		/** 请求地址 */
		requestUrl?: string;
	};

	type MenuDetailResModel = {
		/** 菜单代码 */
		code?: string;
		/** 是否为叶子节点 0：非叶子节点  1：叶子节点 */
		leaf?: number;
		/** 链接地址 */
		link?: string;
		/** 菜单id */
		menuId?: number;
		/** 菜单名称 */
		name?: string;
		/** 父节点 */
		parentId?: number;
		/** 排序 */
		sort?: number;
	};

	type MenuResModel = {
		/** 选中标识：1选中，0未选中 */
		checkFlag?: number;
		/** 菜单编码 */
		code?: string;
		/** 收藏标识：1收藏，0不收藏 */
		collectFlag?: number;
		/** 菜单Id */
		id: number;
		/** 菜单名称 */
		name?: string;
		/** 中文 */
		cnName?: string;
		/** 法语 */
		frName?: string;
		/** 英语 */
		usName?: string;
		/** 菜单赋权人数/用户组总人数 */
		numFlag?: string;
		/** 父菜单编码 */
		parentCode?: string;
		/** 菜单跳转路径 */
		path?: string;
		/** 排序 */
		sort?: number;
	};

	type menusUsingPOSTParams = {
		action?: "BOSS1401";
	};

	type OperationLogsReqResultModel = {
		/** ip */
		ip?: string;
		/** 分页 */
		limit: number;
		/** 请求方式 */
		method?: string;
		/** 操作员 */
		operator?: string;
		/** 页数 */
		page: number;
		/** parameter */
		parameter?: string;
		/** payload */
		payload?: string;
		/** 菜单code */
		project?: string;
		/** 请求地址 */
		requestUrl?: string;
	};

	type OperationLogsResModel = {
		/** 创建时间 */
		createTime?: string;
		/** id */
		id: number;
		/** ip */
		ip?: string;
		/** 登录名字 */
		loginName?: string;
		/** 菜单code */
		menuCode?: string;
		/** 请求方式 */
		method?: string;
		/** 操作员名字 */
		name?: string;
		/** 操作员 */
		operator?: string;
		/** parameter */
		parameter?: string;
		/** payload */
		payload?: string;
		/** 请求地址 */
		requestUrl?: string;
	};

	type PageModelGroupListResModel_ = {
		/** 表格数据 */
		records?: GroupListResModel[];
		/** 总数 */
		total?: number;
	};

	type PageModelOperationLogsResModel_ = {
		/** 表格数据 */
		records?: OperationLogsResModel[];
		/** 总数 */
		total?: number;
	};

	type PageModelUserResModel_ = {
		/** 表格数据 */
		records?: UserResModel[];
		/** 总数 */
		total?: number;
	};

	type permissionVerifyUsingPOSTParams = {
		/** menuCode */
		menuCode: string;
		/** userId */
		userId: number;
	};

	type resetPasswordUsingPOSTParams = {
		action?: "BOSS1501";
		/** 登录账户 */
		loginName: string;
		/** 短信验证码 */
		verificationCode: number;
	};

	type ResultModel = {
		/** 返回码 */
		code: number;
		/** 返回data */
		data?: Record<string, any>;
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type ResultModelInt_ = {
		/** 返回码 */
		code: number;
		/** 返回data */
		data?: number;
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type ResultModelListAlwaysMenusResModel_ = {
		/** 返回码 */
		code: number;
		/** 返回data */
		data?: AlwaysMenusResModel[];
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type ResultModelListGroupListResModel_ = {
		/** 返回码 */
		code: number;
		/** 返回data */
		data?: GroupListResModel[];
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type ResultModelListMenuResModel_ = {
		/** 返回码 */
		code: number;
		/** 返回data */
		data?: MenuResModel[];
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type ResultModelLoginResModel_ = {
		/** 返回码 */
		code: number;
		data?: LoginResModel;
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type ResultModelMenuDetailResModel_ = {
		/** 返回码 */
		code: number;
		data?: MenuDetailResModel;
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type ResultModelMenuResModel_ = {
		/** 返回码 */
		code: number;
		data?: MenuResModel;
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type ResultModelOperationLogsResModel_ = {
		/** 返回码 */
		code: number;
		data?: OperationLogsResModel;
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type ResultModelPageModelGroupListResModel_ = {
		/** 返回码 */
		code: number;
		data?: PageModelGroupListResModel_;
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type ResultModelPageModelOperationLogsResModel_ = {
		/** 返回码 */
		code: number;
		data?: PageModelOperationLogsResModel_;
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type ResultModelPageModelUserResModel_ = {
		/** 返回码 */
		code: number;
		data?: PageModelUserResModel_;
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type ResultModelString_ = {
		/** 返回码 */
		code: number;
		/** 返回data */
		data?: string;
		/** msg */
		msg?: string;
		stamp?: number;
	};

	type saveUserGroupPermissionUsingPOSTParams = {
		action?: "BOSS1204";
		/** 用户组id */
		groupId?: number;
		/** 菜单数组 */
		menuList: string;
	};

	type saveUserPermissionUsingPOSTParams = {
		action?: "BOSS1004";
		/** menuList */
		menuList: string;
		/** userId */
		userId: number;
	};

	type smsCodeUsingPOSTParams = {
		action?: "BOSS1504";
		/** 登录账号 */
		loginName: string;
		/** 手机号 */
		phone: string;
		/** 验证码类型：1 密码重置 */
		smsType: number;
	};

	type tokenVerifyUsingPOSTParams = {
		/** platformCode */
		platformCode?: string;
		/** token */
		token: string;
		/** uuid */
		uuid: string;
	};

	type updateMenuUsingPOSTParams = {
		action?: "BOSS1404";
		/** 链接 */
		link?: string;
		/** 菜单id */
		menuId: number;
		/** 菜单名称 */
		menuName?: string;
		/** 排序 */
		sort?: any;
	};

	type updatePasswordUsingPOSTParams = {
		action?: "BOSS1502";
		/** 新密码 */
		newPassword: string;
		/** 确认新密码 */
		newPassword2: string;
	};

	type updateUserUsingPOSTParams = {
		action?: "BOSS1006";
		/** 姓名 */
		name?: number;
		/** 手机号 */
		phone?: string;
		/** 备注 */
		remark?: string;
		/** 用户状态，0：禁用 ；1：正常 */
		status?: number;
		/** 用户组id列表 */
		userGroup?: any;
		/** 用户id */
		userId: number;
	};

	type userGroupListUsingPOST1Params = {
		action?: "BOSS1207";
	};

	type userGroupListUsingPOSTParams = {
		action?: "BOSS1201";
		/** 用户组名称 */
		groupName?: string;
		/** 条数 */
		limit: number;
		/** 页数 */
		page: number;
	};

	type userGroupUsingPOSTParams = {
		action?: "BOSS1206";
		/** 用户组id */
		groupId: number;
	};

	type UserResModel = {
		/** 创建时间 */
		createTime?: string;
		/** 用户id */
		id: number;
		/** 登录账户 */
		loginName?: string;
		/** 最后登录时间 */
		loginTime?: string;
		/** 姓名 */
		name?: string;
		/** 电话号码 */
		phone?: string;
		/** 备注 */
		remark?: string;
		/** 用户状态，0：禁用 ；1：正常 */
		status?: number;
		/** 更新时间 */
		updateTime?: string;
		/** 用户组 */
		userGroup?: string;
		/** 权限 */
		menuList?: number[];
	};
}
