import { Scenes } from 'telegraf';
import { setupScene } from './scenes/setup.scene.js';

export const stage = new Scenes.Stage([setupScene]);

