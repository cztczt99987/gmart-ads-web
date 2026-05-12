import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemMenu } from '#/api/system/menu';

import { $t } from '#/locales';

export function getMenuTypeOptions() {
  return [
    { color: 'processing', label: $t('system.menu.typeCatalog'), value: 1 },
    { color: 'default', label: $t('system.menu.typeMenu'), value: 2 },
    { color: 'error', label: $t('system.menu.typeButton'), value: 3 },
    { color: 'success', label: $t('system.menu.typeEmbedded'), value: 4 },
    { color: 'warning', label: $t('system.menu.typeLink'), value: 5 },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<SystemMenu>,
): VxeTableGridOptions<SystemMenu>['columns'] {
  return [
    {
      align: 'left',
      field: 'title',
      fixed: 'left',
      title: $t('system.menu.menuTitle'),
      treeNode: true,
      width: 250,
    },
    {
      align: 'center',
      cellRender: { name: 'CellTag', options: getMenuTypeOptions() },
      field: 'type',
      title: $t('system.menu.type'),
      width: 100,
    },
    {
      align: 'left',
      field: 'path',
      title: $t('system.menu.path'),
      width: 200,
    },
    {
      align: 'left',
      field: 'component',
      minWidth: 200,
      title: $t('system.menu.component'),
    },
    {
      align: 'center',
      field: 'menuOrder',
      title: $t('system.menu.menuOrder'),
      width: 80,
    },
    {
      align: 'center',
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('system.menu.isHiddenYes'), value: 1 },
          { color: 'default', label: $t('system.menu.isHiddenNo'), value: 0 },
        ],
      },
      field: 'isHidden',
      title: $t('system.menu.isHidden'),
      width: 80,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.enabled'), value: 1 },
          { color: 'error', label: $t('common.disabled'), value: 0 },
        ],
      },
      field: 'status',
      title: $t('system.menu.status'),
      width: 100,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'append',
            text: $t('system.menu.appendChild'),
          },
          'edit',
          'delete',
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.menu.operation'),
      width: 200,
    },
  ];
}
