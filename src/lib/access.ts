import type { Config, ContestDef, Profile } from './types';
export const canJudge = (me: Profile | null, key: string) => !!me && (me.role === 'admin' || me.contests.length === 0 || me.contests.includes(key));
export const myContests = (me: Profile | null, cfg: Config): ContestDef[] => cfg.contests.filter((c) => canJudge(me, c.key));
