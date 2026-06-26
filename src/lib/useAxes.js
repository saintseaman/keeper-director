import { useState, useEffect, useCallback, useMemo } from 'react';
import { storage } from '@/lib/storage';
import { SCENE_AXES, resolveAxisIcon, setCustomRegistry } from '@/lib/sceneAxes';

const CUSTOM_EVENT = 'keeper:axes';

// Реактивный доступ к сегментам колеса: built-in (минус удалённые)
// + пользовательские. Add/remove пишут в storage и оповещают другие компоненты.
export function useAxes() {
  const [custom, setCustom] = useState(() => storage.getCustomAxisValues());
  const [removed, setRemoved] = useState(() => storage.getRemovedAxisValues());

  useEffect(() => {
    const sync = () => {
      setCustom({ ...storage.getCustomAxisValues() });
      setRemoved({ ...storage.getRemovedAxisValues() });
    };
    window.addEventListener(CUSTOM_EVENT, sync);
    const unsub = storage.subscribe(sync);
    return () => {
      window.removeEventListener(CUSTOM_EVENT, sync);
      unsub();
    };
  }, []);

  // Держим модульный реестр в синхроне (для axisValue/autoAxes вне React).
  useEffect(() => {
    setCustomRegistry(custom);
  }, [custom]);

  // Итоговые оси: значения с резолвнутыми иконками, без удалённых built-in.
  const axes = useMemo(() => {
    setCustomRegistry(custom);
    return SCENE_AXES.map((axis) => {
      const removedIds = removed[axis.id] || [];
      const builtIn = axis.values
        .filter((v) => !removedIds.includes(v.id))
        .map((v) => ({ ...v, custom: false }));
      const customVals = (custom[axis.id] || []).map((v) => ({
        ...v,
        icon: resolveAxisIcon(v.icon),
        iconName: typeof v.icon === 'string' ? v.icon : undefined,
        custom: true,
      }));
      return { ...axis, values: [...builtIn, ...customVals] };
    });
  }, [custom, removed]);

  const broadcast = () => window.dispatchEvent(new Event(CUSTOM_EVENT));

  // Добавить пользовательский сегмент. icon — имя Lucide (строка).
  const addValue = useCallback((axisId, { label, icon }) => {
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const kw = String(label || '').toLowerCase().split(/\s+/).filter(Boolean);
    const map = { ...storage.getCustomAxisValues() };
    map[axisId] = [...(map[axisId] || []), { id, label: label || 'Сегмент', icon: icon || 'Star', kw }];
    storage.setCustomAxisValues(map);
    setCustom(map);
    broadcast();
    return id;
  }, []);

  // Удалить сегмент: кастомный — из списка, built-in — в removed.
  const removeValue = useCallback((axisId, valueId) => {
    const customMap = { ...storage.getCustomAxisValues() };
    const list = customMap[axisId] || [];
    if (list.some((v) => v.id === valueId)) {
      customMap[axisId] = list.filter((v) => v.id !== valueId);
      storage.setCustomAxisValues(customMap);
      setCustom(customMap);
    } else {
      const removedMap = { ...storage.getRemovedAxisValues() };
      removedMap[axisId] = Array.from(new Set([...(removedMap[axisId] || []), valueId]));
      storage.setRemovedAxisValues(removedMap);
      setRemoved(removedMap);
    }
    broadcast();
  }, []);

  return { axes, addValue, removeValue };
}