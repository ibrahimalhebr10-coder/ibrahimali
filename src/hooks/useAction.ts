import { usePermissions } from '../contexts/PermissionsContext';

export function useAction(actionKey: string): boolean {
  const { hasAction } = usePermissions();
  return hasAction(actionKey);
}

export function useActions(actionKeys: string[], requireAll: boolean = false): boolean {
  const { hasAnyAction, hasAllActions } = usePermissions();
  return requireAll ? hasAllActions(actionKeys) : hasAnyAction(actionKeys);
}

export function useActionGuard() {
  const { hasAction, hasAnyAction, hasAllActions, canPerformAction } = usePermissions();

  return {
    can: hasAction,
    canAny: hasAnyAction,
    canAll: hasAllActions,
    check: canPerformAction
  };
}
