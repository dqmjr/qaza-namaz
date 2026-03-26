export type SetupState = {
  selectedYears?: number;
  strategyType?: 'preset' | 'custom';
  strategyValue?: number;
  cityId?: string;
  cityName?: string;
  lat?: number;
  lon?: number;
  cityPage?: number;
  citySearching?: boolean;
};
// Keep bot context typing minimal to avoid friction with Telegraf generics.
// Wizard state is stored in `ctx.wizard.state`.
import type { Scenes } from 'telegraf';
export type BotContext = Scenes.WizardContext;

