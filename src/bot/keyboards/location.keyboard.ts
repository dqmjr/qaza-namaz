import { Markup } from 'telegraf';

export const RequestLocationKeyboard = Markup.keyboard([
  [Markup.button.locationRequest('📍 Определить местоположение')],
]).oneTime().resize();

