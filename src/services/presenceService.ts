import type ElectronStore = require('electron-store');
import { ActivityType } from 'discord-api-types/v10';
import { Client as DiscordClient, SetActivity } from '@xhayper/discord-rpc';
import type { PageInfo } from '../types';

const DEFAULT_CLIENT_ID = '1090770350251458592';
const VNDB_ICON_URL =
  process.env.VNDB_DISCORD_IMAGE_URL ||
  'https://raw.githubusercontent.com/flouz152/vndb-rpc/main/assets/newEleanorMay/vndb.jpg';

export class PresenceService {
  private readonly store: ElectronStore;
  private readonly rpc: DiscordClient;
  private connected = false;

  constructor(store: ElectronStore) {
    this.store = store;
    this.rpc = new DiscordClient({
      clientId: process.env.VNDB_DISCORD_CLIENT_ID || DEFAULT_CLIENT_ID,
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

    if (!page.isVisualNovel && !this.store.get('discordShowCatalog', false)) {
      await this.clear();
      return;
    }

    try {
      if (!this.connected || !this.rpc.isConnected) await this.connect();
      if (!this.rpc.user) return;

      const title = this.shorten(page.title || 'Visual Novel Database');
      const activity: SetActivity & { name?: string } = {
        type: ActivityType.Watching,
        name: 'VNDB',
        details: page.isVisualNovel ? title : 'Browsing visual novels',
        state: page.isVisualNovel
          ? `VNDB.org${page.vnId ? ` • ${page.vnId}` : ''}`
          : title,
        largeImageKey: VNDB_ICON_URL,
        largeImageText: 'VNDB.org',
        instance: false,
      };

      if (page.isVisualNovel && page.artwork && this.store.get('discordShowArtwork', true)) {
        activity.smallImageKey = page.artwork;
        activity.smallImageText = title;
      }

      if (page.isVisualNovel && this.store.get('discordShowButton', true) && /^https:\/\/vndb\.org\/v\d+(?:[/?#]|$)/i.test(page.url)) {
        activity.buttons = [{ label: 'Open VN on VNDB', url: page.url }];
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
    if (!enabled) this.clear();
  }

  private shorten(value: string): string {
    return value.length > 128 ? `${value.slice(0, 125)}...` : value;
  }
}
