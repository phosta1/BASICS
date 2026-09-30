import React from 'react';
import { Button, Dropdown, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { usePermissions } from '../hooks/usePermissions';

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onCreate?: () => void;
  onView?: () => void;
  editText?: string;
  deleteText?: string;
  createText?: string;
  viewText?: string;
  resourceType?: 'contacts' | 'programs' | 'enrollments' | 'notes';
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  onCreate,
  onView,
  editText = 'Edit',
  deleteText = 'Delete',
  createText = 'Create',
  viewText = 'View',
  resourceType = 'contacts',
  size = 'middle',
  disabled = false,
  loading = false,
  style,
}) => {
  const permissions = usePermissions();
  
  // Get permissions for the resource type
  const resourcePermissions = permissions[resourceType];

  const buttons = [];

  // Create button
  if (onCreate && resourcePermissions.create) {
    buttons.push(
      <Button
        key="create"
        type="primary"
        icon={<PlusOutlined />}
        onClick={onCreate}
        size={size}
        disabled={disabled}
        loading={loading}
      >
        {createText}
      </Button>
    );
  }

  // Edit button
  if (onEdit && resourcePermissions.edit) {
    buttons.push(
      <Button
        key="edit"
        icon={<EditOutlined />}
        onClick={onEdit}
        size={size}
        disabled={disabled}
        loading={loading}
      >
        {editText}
      </Button>
    );
  }

  // View button (always available if provided)
  if (onView) {
    buttons.push(
      <Button
        key="view"
        onClick={onView}
        size={size}
        disabled={disabled}
        loading={loading}
      >
        {viewText}
      </Button>
    );
  }

  // Delete button
  if (onDelete && resourcePermissions.delete) {
    buttons.push(
      <Button
        key="delete"
        danger
        icon={<DeleteOutlined />}
        onClick={onDelete}
        size={size}
        disabled={disabled}
        loading={loading}
      >
        {deleteText}
      </Button>
    );
  }

  if (buttons.length === 0) {
    return null;
  }

  return (
    <Space size="small" style={style}>
      {buttons}
    </Space>
  );
};

// Dropdown version for compact display
interface ActionDropdownProps extends Omit<ActionButtonsProps, 'style'> {
  trigger?: ('click' | 'hover')[];
  placement?: 'bottom' | 'bottomLeft' | 'bottomRight' | 'top' | 'topLeft' | 'topRight';
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({
  onEdit,
  onDelete,
  onCreate,
  onView,
  editText = 'Edit',
  deleteText = 'Delete',
  createText = 'Create',
  viewText = 'View',
  resourceType = 'contacts',
  disabled = false,
  trigger = ['click'],
  placement = 'bottomRight',
}) => {
  const permissions = usePermissions();
  const resourcePermissions = permissions[resourceType];

  const menuItems: MenuProps['items'] = [];

  if (onView) {
    menuItems.push({
      key: 'view',
      label: viewText,
      onClick: onView,
    });
  }

  if (onCreate && resourcePermissions.create) {
    menuItems.push({
      key: 'create',
      label: createText,
      icon: <PlusOutlined />,
      onClick: onCreate,
    });
  }

  if (onEdit && resourcePermissions.edit) {
    menuItems.push({
      key: 'edit',
      label: editText,
      icon: <EditOutlined />,
      onClick: onEdit,
    });
  }

  if (onDelete && resourcePermissions.delete) {
    if (menuItems.length > 0) {
      menuItems.push({ type: 'divider' });
    }
    menuItems.push({
      key: 'delete',
      label: deleteText,
      icon: <DeleteOutlined />,
      onClick: onDelete,
      danger: true,
    });
  }

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={trigger}
      placement={placement}
      disabled={disabled}
    >
      <Button icon={<MoreOutlined />} />
    </Dropdown>
  );
};

// Permission-aware tooltip wrapper
interface PermissionTooltipProps {
  children: React.ReactElement;
  requiredPermission: boolean;
  deniedMessage?: string;
}

export const PermissionTooltip: React.FC<PermissionTooltipProps> = ({
  children,
  requiredPermission,
  deniedMessage = 'You don\'t have permission to perform this action',
}) => {
  if (requiredPermission) {
    return children;
  }

  return (
    <Tooltip title={deniedMessage}>
      {React.cloneElement(children, { disabled: true })}
    </Tooltip>
  );
};