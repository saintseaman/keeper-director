// Долгоживущая карта «плитка действия → id текущего проигрывания».
// Живёт вне React-дерева, поэтому состояние one-shot плиток Действия
// переживает размонтирование при переключении вкладок осей.
const playing = new Map(); // valueId -> soundInstanceId

export const actionPlayback = {
  get: (valueId) => playing.get(valueId) || null,
  set: (valueId, id) => { playing.set(valueId, id); },
  clear: (valueId) => { playing.delete(valueId); },
};