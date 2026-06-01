import { AudioClip, AudioSource, director, game, Node } from 'cc';
import { ResourceManager } from './ResourceManager';
import { SaveManager } from './SaveManager';

export class AudioManager {
  private static singleton: AudioManager | null = null;
  private rootNode: Node | null = null;
  private musicSource: AudioSource | null = null;
  private effectSource: AudioSource | null = null;
  private musicVolume = 0.75;
  private effectVolume = 1;

  public static get instance(): AudioManager {
    if (!AudioManager.singleton) {
      AudioManager.singleton = new AudioManager();
    }
    return AudioManager.singleton;
  }

  public applySavedSettings(): void {
    const save = SaveManager.instance.getSnapshot();
    if (!save.settings.musicEnabled) {
      this.stopMusic();
    }
  }

  public async playMusic(keyOrPath: string, loop = true): Promise<void> {
    const save = SaveManager.instance.getSnapshot();
    if (!save.settings.musicEnabled) {
      return;
    }
    const clip = await ResourceManager.instance.loadAudioClip(keyOrPath);
    if (!clip) {
      return;
    }
    const source = this.getMusicSource();
    source.stop();
    source.clip = clip;
    source.loop = loop;
    source.volume = this.musicVolume;
    source.play();
  }

  public stopMusic(): void {
    this.musicSource?.stop();
  }

  public async playEffect(keyOrPath: string): Promise<void> {
    const save = SaveManager.instance.getSnapshot();
    if (!save.settings.soundEnabled) {
      return;
    }
    const clip = await ResourceManager.instance.loadAudioClip(keyOrPath);
    if (!clip) {
      return;
    }
    const source = this.getEffectSource();
    source.volume = this.effectVolume;
    source.playOneShot(clip, this.effectVolume);
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicSource) {
      this.musicSource.volume = this.musicVolume;
    }
  }

  public setEffectVolume(volume: number): void {
    this.effectVolume = Math.max(0, Math.min(1, volume));
    if (this.effectSource) {
      this.effectSource.volume = this.effectVolume;
    }
  }

  public setMusicEnabled(enabled: boolean): void {
    SaveManager.instance.update((draft) => {
      draft.settings.musicEnabled = enabled;
    }, 'music-toggle');
    if (!enabled) {
      this.stopMusic();
    }
  }

  public setSoundEnabled(enabled: boolean): void {
    SaveManager.instance.update((draft) => {
      draft.settings.soundEnabled = enabled;
    }, 'sound-toggle');
  }

  private getMusicSource(): AudioSource {
    this.ensureRoot();
    if (!this.musicSource) {
      this.musicSource = this.rootNode!.addComponent(AudioSource);
    }
    return this.musicSource;
  }

  private getEffectSource(): AudioSource {
    this.ensureRoot();
    if (!this.effectSource) {
      this.effectSource = this.rootNode!.addComponent(AudioSource);
    }
    return this.effectSource;
  }

  private ensureRoot(): void {
    if (this.rootNode) {
      return;
    }
    this.rootNode = new Node('AudioManager');
    director.getScene()?.addChild(this.rootNode);
    game.addPersistRootNode(this.rootNode);
  }
}

export const audioManager = AudioManager.instance;

