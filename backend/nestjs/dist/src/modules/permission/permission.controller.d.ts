import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
export declare class PermissionController {
    private readonly permissionService;
    constructor(permissionService: PermissionService);
    create(createPermissionDto: CreatePermissionDto): Promise<{
        id: number;
        action: string;
        resource: string;
    }>;
    findAll(): Promise<{
        id: number;
        action: string;
        resource: string;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        action: string;
        resource: string;
    }>;
    update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<{
        id: number;
        action: string;
        resource: string;
    }>;
    remove(id: number): Promise<void>;
}
