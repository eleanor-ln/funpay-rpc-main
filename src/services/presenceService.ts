import type ElectronStore = require('electron-store');
import { ActivityType } from 'discord-api-types/v10';
import { Client as DiscordClient, SetActivity } from '@xhayper/discord-rpc';
import type { PageInfo } from '../types';

const DEFAULT_CLIENT_ID = '1410684519866044537';
const FUNPAY_ICON_URL = process.env.FUNPAY_DISCORD_IMAGE_URL || 'https://cdn.rcd.gg/PreMiD/websites/F/FunPay/assets/logo.jpg';

export class PresenceService {
  private readonly store: ElectronStore;
  private readonly rpc: DiscordClient;
  private readonly startTimestamp = Math.floor(Date.now() / 1000);
  private connected = false;

  constructor(store: ElectronStore) {
    this.store = store;
    this.rpc = new DiscordClient({
      clientId: process.env.FUNPAY_DISCORD_CLIENT_ID || DEFAULT_CLIENT_ID,
    });
    void this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.rpc.login();
      this.connected = true;
    } catch (error) {
      this.connected = false;
      console.warn('Discord RPC is unavailable:', error instanceof Error ? error.message : error);
    }
  }

  async update(page: PageInfo): Promise<void> {
    if (!this.store.get('discordRichPresence', true)) {
      await this.clear();
      return;
    }

    if (!page.isFunPayPage) {
      await this.clear();
      return;
    }

    try {
      if (!this.connected || !this.rpc.isConnected) await this.connect();
      if (!this.rpc.user) return;

      const activity: SetActivity & { name?: string } = {
        type: ActivityType.Watching,
        name: 'FunPay',
        details: this.shorten(page.activityDetails || 'Browsing FunPay'),
        state: this.shorten(page.activityState || page.section || 'FunPay'),
        largeImageKey: FUNPAY_ICON_URL,
        largeImageText: 'FunPay.com',
        startTimestamp: this.startTimestamp,
        instance: false,
      };

      if (page.buttonLabel) {
        activity.buttons = [{ label: this.shorten(page.buttonLabel, 32), url: page.url }];
      }

      if (page.artwork) {
        activity.smallImageKey = page.artwork;
        activity.smallImageText = this.shorten(page.title || 'FunPay');
      }

      await this.rpc.user.setActivity(activity);
    } catch (error) {
      console.warn('Could not update Discord RPC:', error instanceof Error ? error.message : error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.rpc.user?.clearActivity();
    } catch (error) {
      console.warn('Could not clear Discord RPC:', error instanceof Error ? error.message : error);
    }
  }

  setEnabled(enabled: boolean): void {
    this.store.set('discordRichPresence', enabled);
    if (!enabled) void this.clear();
  }

  private shorten(value: string, limit = 128): string {
    return value.length > limit ? `${value.slice(0, limit - 3)}...` : value;
  }
}
