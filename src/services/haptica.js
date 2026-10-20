// Respuesta háptica: suave al encender/apagar, distinta en error y al terminar un temporizador.
import * as Haptics from 'expo-haptics';

const seguro = (fn) => {
  try {
    fn()?.catch?.(() => {});
  } catch {
    // Algunos teléfonos no tienen vibrador: lo ignoramos
  }
};

export const haptica = {
  suave: () => seguro(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  media: () => seguro(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  seleccion: () => seguro(() => Haptics.selectionAsync()),
  error: () => seguro(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  exito: () => seguro(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  aviso: () => seguro(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
