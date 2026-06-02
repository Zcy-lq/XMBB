import { createDefaultSave } from '../data/DefaultSave';
import { GameSaveData, InventoryItemSave } from '../data/GameTypes';
import { GameConfigRepository } from './GameConfigRepository';
import { SkillConfig, WaveConfig, WeaponConfig } from './GameConfigTypes';
import { BonusMap, getPetBonus, getTalentBonus, mergeBonuses, pickWeighted } from './GameLogicUtils';

const DEFEATED_MONSTER_VISUAL_LINGER_SEC = 2.4;
const INITIAL_WEAPON_COOLDOWN_SEC = 0.75;
const INITIAL_WEAPON_COOLDOWN_STAGGER_SEC = 0.18;
const ATTACK_VISUAL_LIFE_SEC = 0.72;
const ATTACK_VISUAL_LIMIT = 24;

export type BattleStatus = 'running' | 'victory' | 'fail';
export type BattleWeaponType = WeaponConfig['weaponType'];

export interface BattleMonsterState {
  uid: string;
  monsterId: string;
  hp: number;
  hpMax: number;
  attack: number;
  x: number;
  attackCooldown: number;
  alive: boolean;
  deathAgeSec?: number;
}

export interface BattleWeaponSlotState {
  uid: string;
  itemId: string;
  displayName: string;
  iconId: string;
  weaponType: BattleWeaponType;
  level: number;
  damage: number;
  cooldownSec: number;
  cooldownLeft: number;
  targets: number;
  targetRule: WeaponConfig['targetRule'];
}

export interface BattleDamageNumberState {
  id: string;
  value: number;
  monsterUid: string;
  critical: boolean;
  ageSec: number;
}

export interface BattleAttackVisualState {
  id: string;
  weaponUid: string;
  itemId: string;
  weaponType: BattleWeaponType;
  targetRule: WeaponConfig['targetRule'];
  targetUids: string[];
  ageSec: number;
  lifeSec: number;
  critical: boolean;
  sequence: number;
}

export interface BattleTickEvent {
  type: 'spawn' | 'attack' | 'damage' | 'monsterDefeated' | 'campDamage' | 'victory' | 'fail' | 'skillReady';
  payload?: unknown;
}

export interface BattleSessionState {
  battleId: string;
  chapterId: string;
  wave: number;
  secondsLeft: number;
  elapsedSeconds: number;
  campHp: number;
  campHpMax: number;
  defeatedMonsters: number;
  spawnedMonsters: number;
  paused: boolean;
  autoMergeEnabled: boolean;
  status: BattleStatus;
  skillChoiceOffered: boolean;
  skillChoiceIds: string[];
  skillRerollsRemaining: number;
  activeSkillIds: string[];
  monsters: BattleMonsterState[];
  weaponSlots: BattleWeaponSlotState[];
  damageNumbers: BattleDamageNumberState[];
  attackVisuals: BattleAttackVisualState[];
}

export interface BattleSessionOptions {
  chapterId?: string;
  battleId?: string;
  rng?: () => number;
}

export function createBattleSession(
  wave: number,
  save: GameSaveData = createDefaultSave(),
  repo = new GameConfigRepository(),
  options: BattleSessionOptions = {},
): BattleSessionState {
  const chapterId = options.chapterId ?? save.progress.chapterId;
  const waveConfig = repo.getWave(chapterId, wave);
  const bonuses = mergeBonuses(getTalentBonus(save, repo), getPetBonus(save, repo));
  const campHpMax = Math.floor(repo.configs.levels.battle.campBaseHp * (1 + (bonuses.campHpPercent ?? 0)));
  return {
    battleId: options.battleId ?? `battle_${Date.now()}_${Math.floor((options.rng ?? Math.random)() * 100000)}`,
    chapterId,
    wave,
    secondsLeft: waveConfig?.durationSec ?? repo.configs.levels.battle.durationSec,
    elapsedSeconds: 0,
    campHp: campHpMax,
    campHpMax,
    defeatedMonsters: 0,
    spawnedMonsters: 0,
    paused: false,
    autoMergeEnabled: true,
    status: 'running',
    skillChoiceOffered: false,
    skillChoiceIds: [],
    skillRerollsRemaining: 1,
    activeSkillIds: [],
    monsters: [],
    weaponSlots: buildWeaponSlots(save.inventory, repo, bonuses),
    damageNumbers: [],
    attackVisuals: [],
  };
}

export class BattleSessionModel {
  public readonly state: BattleSessionState;
  private readonly repo: GameConfigRepository;
  private readonly rng: () => number;
  private readonly waveConfig: WaveConfig | null;
  private bonuses: BonusMap;
  private spawnTimer = 0;
  private attackVisualSequence = 0;

  public constructor(save: GameSaveData, repo = new GameConfigRepository(), options: BattleSessionOptions = {}) {
    this.repo = repo;
    this.rng = options.rng ?? Math.random;
    this.state = createBattleSession(save.progress.currentWave, save, repo, options);
    this.waveConfig = repo.getWave(this.state.chapterId, this.state.wave);
    this.bonuses = mergeBonuses(getTalentBonus(save, repo), getPetBonus(save, repo));
  }

  public pause(): void {
    this.state.paused = true;
  }

  public resume(): void {
    this.state.paused = false;
  }

  public setAutoMerge(enabled: boolean): void {
    this.state.autoMergeEnabled = enabled;
  }

  public tick(deltaSec: number): BattleTickEvent[] {
    if (this.state.paused || this.state.status !== 'running') {
      return [];
    }
    const dt = Math.max(0, deltaSec);
    const events: BattleTickEvent[] = [];
    this.state.elapsedSeconds += dt;
    this.state.secondsLeft = Math.max(0, this.state.secondsLeft - dt);

    if (!this.state.skillChoiceOffered && this.state.elapsedSeconds >= this.repo.configs.levels.battle.skillChoiceAtSecond) {
      this.state.skillChoiceOffered = true;
      this.getSkillChoices();
      this.pause();
      events.push({ type: 'skillReady' });
      return events;
    }

    this.spawnTimer -= dt;
    while (this.spawnTimer <= 0 && this.canSpawnMore()) {
      const monster = this.spawnMonster();
      if (monster) {
        this.state.monsters.push(monster);
        this.state.spawnedMonsters += 1;
        events.push({ type: 'spawn', payload: monster });
      }
      this.spawnTimer += this.waveConfig?.spawnIntervalSec ?? 3;
    }

    events.push(...this.updateMonsters(dt));
    events.push(...this.updateWeapons(dt));
    this.updateDefeatedMonsters(dt);
    this.updateDamageNumbers(dt);
    this.updateAttackVisuals(dt);

    if (this.state.campHp <= 0) {
      this.state.campHp = 0;
      this.state.status = 'fail';
      events.push({ type: 'fail' });
      return events;
    }
    if (this.state.secondsLeft <= 0) {
      this.state.status = 'victory';
      events.push({ type: 'victory' });
    }
    return events;
  }

  public applySkill(skillId: string): GameLogicResultLike<SkillConfig> {
    const skill = this.repo.getSkill(skillId);
    if (!skill) {
      return { ok: false, message: `missing skill config: ${skillId}` };
    }
    if (this.state.activeSkillIds.includes(skillId)) {
      return { ok: false, message: 'skill already selected' };
    }

    for (const effect of skill.effects) {
      if (effect.type === 'campHeal') {
        this.state.campHp = Math.min(this.state.campHpMax, this.state.campHp + effect.value);
        continue;
      }
      this.bonuses[effect.type] = (this.bonuses[effect.type] ?? 0) + effect.value;
    }
    this.state.activeSkillIds.push(skillId);
    this.rebuildWeaponStats();
    return { ok: true, data: skill, message: 'skill applied' };
  }

  public rollSkillChoices(count = 3): SkillConfig[] {
    return this.rollSkillChoicesFromPool(count);
  }

  public getSkillChoices(): SkillConfig[] {
    if (this.state.skillChoiceIds.length === 0) {
      this.state.skillChoiceIds = this.rollSkillChoicesFromPool(3).map((skill) => skill.id);
    }
    return this.state.skillChoiceIds
      .map((skillId) => this.repo.getSkill(skillId))
      .filter((skill): skill is SkillConfig => Boolean(skill));
  }

  public rerollSkillChoices(): GameLogicResultLike<SkillConfig[]> {
    if (this.state.skillRerollsRemaining <= 0) {
      return { ok: false, message: 'skill reroll already used' };
    }

    const currentIds = new Set(this.state.skillChoiceIds);
    const choices = this.rollSkillChoicesFromPool(3, currentIds);
    this.state.skillChoiceIds = choices.map((skill) => skill.id);
    this.state.skillRerollsRemaining = Math.max(0, this.state.skillRerollsRemaining - 1);
    return { ok: true, data: choices, message: 'skill choices rerolled' };
  }

  public applySkillChoice(index: number): GameLogicResultLike<SkillConfig> {
    const choices = this.getSkillChoices();
    const skill = choices[index];
    if (!skill) {
      return { ok: false, message: 'skill choice is missing' };
    }

    const result = this.applySkill(skill.id);
    if (result.ok) {
      this.state.skillChoiceIds = [];
      this.resume();
    }
    return result;
  }

  private rollSkillChoicesFromPool(count = 3, excludedIds: Set<string> = new Set()): SkillConfig[] {
    const pool = [...this.repo.configs.levels.skills];
    const filtered = pool.filter((skill) => !excludedIds.has(skill.id));
    const activePool = filtered.length >= Math.min(count, pool.length) ? filtered : pool;
    const choices: SkillConfig[] = [];
    while (choices.length < count && activePool.length > 0) {
      const picked = pickWeighted(activePool, this.rng);
      if (!picked) {
        break;
      }
      choices.push(picked);
      activePool.splice(activePool.indexOf(picked), 1);
    }
    return choices;
  }

  private canSpawnMore(): boolean {
    const maxSpawn = this.waveConfig?.maxSpawn ?? 0;
    const cap = this.repo.configs.levels.battle.monsterCap;
    return this.state.spawnedMonsters < maxSpawn && this.state.monsters.filter((monster) => monster.alive).length < cap;
  }

  private spawnMonster(): BattleMonsterState | null {
    const wave = this.waveConfig;
    if (!wave) {
      return null;
    }
    const eliteDue = wave.eliteMonsterId && this.state.spawnedMonsters === wave.maxSpawn - 1;
    const monsterId = eliteDue ? wave.eliteMonsterId! : pickWeighted(wave.monsterWeights, this.rng)?.monsterId;
    if (!monsterId) {
      return null;
    }
    const config = this.repo.getMonster(monsterId);
    if (!config) {
      return null;
    }
    const eliteScale = eliteDue ? this.repo.configs.levels.battle.eliteMonsterMultiplier : 1;
    const hpMax = Math.max(1, Math.floor(config.baseHp * wave.hpScale * eliteScale));
    return {
      uid: `${monsterId}_${this.state.spawnedMonsters}_${Math.floor(this.rng() * 100000)}`,
      monsterId,
      hp: hpMax,
      hpMax,
      attack: Math.max(1, Math.floor(config.baseAttack * wave.attackScale * eliteScale)),
      x: 1,
      attackCooldown: config.attackIntervalSec,
      alive: true,
    };
  }

  private updateWeapons(deltaSec: number): BattleTickEvent[] {
    const events: BattleTickEvent[] = [];
    for (const weapon of this.state.weaponSlots) {
      weapon.cooldownLeft -= deltaSec;
      if (weapon.cooldownLeft > 0) {
        continue;
      }
      const targets = this.pickTargets(weapon);
      if (targets.length === 0) {
        weapon.cooldownLeft = Math.min(weapon.cooldownSec, this.repo.configs.levels.battle.retryTargetDelaySec);
        continue;
      }
      let attackCritical = false;
      for (const target of targets) {
        const critical = this.rng() < this.getCritRate(weapon);
        attackCritical = attackCritical || critical;
        const value = Math.max(1, Math.floor(weapon.damage * (critical ? this.getCritDamage() : 1)));
        target.hp = Math.max(0, target.hp - value);
        this.pushDamageNumber(target.uid, value, critical);
        events.push({ type: 'damage', payload: { weapon, target, value, critical } });
        if (target.hp <= 0 && target.alive) {
          target.alive = false;
          target.deathAgeSec = 0;
          this.state.defeatedMonsters += 1;
          events.push({ type: 'monsterDefeated', payload: target });
        }
      }
      const visual = this.pushAttackVisual(weapon, targets.map((target) => target.uid), attackCritical);
      events.push({ type: 'attack', payload: visual });
      weapon.cooldownLeft += weapon.cooldownSec;
    }
    return events;
  }

  private updateMonsters(deltaSec: number): BattleTickEvent[] {
    const events: BattleTickEvent[] = [];
    for (const monster of this.state.monsters) {
      if (!monster.alive) {
        continue;
      }
      const config = this.repo.getMonster(monster.monsterId);
      if (!config) {
        continue;
      }
      if (monster.x > 0) {
        monster.x = Math.max(0, monster.x - config.moveSpeed * deltaSec);
        continue;
      }
      monster.attackCooldown -= deltaSec;
      if (monster.attackCooldown <= 0) {
        const defenseFlat = this.bonuses.defenseFlat ?? 0;
        const reduction = this.bonuses.damageReductionPercent ?? 0;
        const damage = Math.max(
          1,
          Math.floor((monster.attack - defenseFlat) * Math.max(this.repo.configs.levels.battle.minCampDamageMultiplier, 1 - reduction)),
        );
        this.state.campHp = Math.max(0, this.state.campHp - damage);
        monster.attackCooldown += config.attackIntervalSec;
        events.push({ type: 'campDamage', payload: { monster, damage } });
      }
    }
    const regen = this.bonuses.campRegen ?? 0;
    if (regen > 0 && this.state.campHp > 0) {
      this.state.campHp = Math.min(this.state.campHpMax, this.state.campHp + regen * deltaSec);
    }
    return events;
  }

  private pickTargets(weapon: BattleWeaponSlotState): BattleMonsterState[] {
    const alive = this.state.monsters.filter((monster) => monster.alive);
    if (alive.length === 0) {
      return [];
    }
    const sorted = [...alive];
    if (weapon.targetRule === 'front') {
      sorted.sort((a, b) => a.x - b.x);
    } else if (weapon.targetRule === 'lowestHp') {
      sorted.sort((a, b) => a.hp - b.hp);
    } else if (weapon.targetRule === 'highestHp') {
      sorted.sort((a, b) => b.hp - a.hp);
    } else {
      sorted.sort(() => this.rng() - 0.5);
    }
    return sorted.slice(0, weapon.targets);
  }

  private pushAttackVisual(weapon: BattleWeaponSlotState, targetUids: string[], critical: boolean): BattleAttackVisualState {
    const visual: BattleAttackVisualState = {
      id: `attack_${this.attackVisualSequence}_${Math.floor(this.rng() * 100000)}`,
      weaponUid: weapon.uid,
      itemId: weapon.itemId,
      weaponType: weapon.weaponType,
      targetRule: weapon.targetRule,
      targetUids,
      ageSec: 0,
      lifeSec: ATTACK_VISUAL_LIFE_SEC,
      critical,
      sequence: this.attackVisualSequence,
    };
    this.attackVisualSequence += 1;
    this.state.attackVisuals.push(visual);
    if (this.state.attackVisuals.length > ATTACK_VISUAL_LIMIT) {
      this.state.attackVisuals.splice(0, this.state.attackVisuals.length - ATTACK_VISUAL_LIMIT);
    }
    return visual;
  }

  private pushDamageNumber(monsterUid: string, value: number, critical: boolean): void {
    this.state.damageNumbers.push({
      id: `damage_${Date.now()}_${Math.floor(this.rng() * 100000)}`,
      value,
      monsterUid,
      critical,
      ageSec: 0,
    });
    const limit = this.repo.configs.levels.battle.damageNumberLimit;
    if (this.state.damageNumbers.length > limit) {
      this.state.damageNumbers.splice(0, this.state.damageNumbers.length - limit);
    }
  }

  private updateDamageNumbers(deltaSec: number): void {
    this.state.damageNumbers = this.state.damageNumbers
      .map((number) => ({ ...number, ageSec: number.ageSec + deltaSec }))
      .filter((number) => number.ageSec <= this.repo.configs.levels.battle.damageNumberLifeSec);
  }

  private updateAttackVisuals(deltaSec: number): void {
    this.state.attackVisuals = this.state.attackVisuals
      .map((visual) => ({ ...visual, ageSec: visual.ageSec + deltaSec }))
      .filter((visual) => visual.ageSec <= visual.lifeSec);
  }

  private updateDefeatedMonsters(deltaSec: number): void {
    this.state.monsters = this.state.monsters
      .map((monster) => (monster.alive ? monster : { ...monster, deathAgeSec: (monster.deathAgeSec ?? 0) + deltaSec }))
      .filter((monster) => monster.alive || (monster.deathAgeSec ?? 0) <= DEFEATED_MONSTER_VISUAL_LINGER_SEC);
  }

  private rebuildWeaponStats(): void {
    const updated = buildWeaponSlotsFromExisting(this.state.weaponSlots, this.repo, this.bonuses);
    this.state.weaponSlots.splice(0, this.state.weaponSlots.length, ...updated);
  }

  private getCritRate(weapon: BattleWeaponSlotState): number {
    const level = this.repo.getWeaponLevel(weapon.itemId, weapon.level);
    return Math.min(
      this.repo.configs.levels.battle.maxCritRate,
      this.repo.configs.levels.battle.baseCritRate + (level?.critRateBonus ?? 0) + (this.bonuses.critRate ?? 0),
    );
  }

  private getCritDamage(): number {
    return this.repo.configs.levels.battle.baseCritDamage + (this.bonuses.critDamage ?? 0);
  }
}

interface GameLogicResultLike<T> {
  ok: boolean;
  data?: T;
  message: string;
}

function buildWeaponSlots(inventory: InventoryItemSave[], repo: GameConfigRepository, bonuses: BonusMap): BattleWeaponSlotState[] {
  const expanded: InventoryItemSave[] = [];
  for (const item of inventory) {
    if (item.itemType !== 'weapon') {
      continue;
    }
    for (let i = 0; i < item.count; i += 1) {
      expanded.push(item);
    }
  }
  expanded.sort((a, b) => (repo.getWeaponLevel(b.itemId, b.level)?.power ?? 0) - (repo.getWeaponLevel(a.itemId, a.level)?.power ?? 0));
  return buildWeaponSlotsFromExisting(
    expanded.slice(0, repo.configs.levels.battle.weaponSlotCount).map((item, index) => ({
      uid: `${item.uid}_${index}`,
      itemId: item.itemId,
      displayName: '',
      iconId: item.itemId,
      weaponType: 'melee' as BattleWeaponType,
      level: item.level,
      damage: 0,
      cooldownSec: 0,
      cooldownLeft: INITIAL_WEAPON_COOLDOWN_SEC + index * INITIAL_WEAPON_COOLDOWN_STAGGER_SEC,
      targets: 1,
      targetRule: 'front' as const,
    })),
    repo,
    bonuses,
  );
}

function buildWeaponSlotsFromExisting(
  existing: Pick<BattleWeaponSlotState, 'uid' | 'itemId' | 'level' | 'cooldownLeft'>[],
  repo: GameConfigRepository,
  bonuses: BonusMap,
): BattleWeaponSlotState[] {
  const attackBonus = 1 + (bonuses.attackPercent ?? 0);
  const cooldownBonus = Math.max(repo.configs.levels.battle.minCooldownMultiplier, 1 - (bonuses.cooldownPercent ?? 0));
  const extraTargets = Math.floor(bonuses.extraTargets ?? 0);
  return existing
    .map((slot) => {
      const weapon = repo.getWeapon(slot.itemId);
      const level = repo.getWeaponLevel(slot.itemId, slot.level);
      if (!weapon || !level) {
        return null;
      }
      const cooldownSec = Math.max(repo.configs.levels.battle.minWeaponCooldownSec, level.cooldownSec * cooldownBonus);
      return {
        uid: slot.uid,
        itemId: slot.itemId,
        displayName: weapon.displayName,
        iconId: weapon.iconId,
        weaponType: weapon.weaponType,
        level: slot.level,
        damage: Math.max(1, Math.floor(level.damage * attackBonus)),
        cooldownSec,
        cooldownLeft: Math.min(slot.cooldownLeft, cooldownSec),
        targets: Math.max(1, level.targets + extraTargets),
        targetRule: weapon.targetRule,
      };
    })
    .filter((slot): slot is BattleWeaponSlotState => Boolean(slot));
}
